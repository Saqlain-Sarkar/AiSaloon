# Security Architecture

> **Author:** Security Engineer
> **Version:** 1.0

---

## 1. Authentication

### 1.1 Password Policy

| Requirement | Rule |
|-------------|------|
| Minimum length | 8 characters |
| Complexity | At least 1 uppercase, 1 lowercase, 1 number |
| Maximum length | 128 characters |
| Hash algorithm | bcrypt with cost factor 12 |
| Storage | Never stored in plain text |

### 1.2 JWT Configuration

```typescript
const jwtConfig = {
  accessToken: {
    secret: process.env.JWT_SECRET,
    expiresIn: '15m',        // Short-lived
    algorithm: 'HS256',
  },
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: '7d',          // Longer-lived
    algorithm: 'HS256',
  },
};
```

### 1.3 Token Rotation

```
Login → Issue { accessToken, refreshToken }
Access token expires → Use refresh token → Issue new pair
Refresh token used → Old refresh token is invalidated
Refresh token expires → User must re-login
```

- Refresh tokens are hashed (bcrypt) before storage
- On refresh, the old token is invalidated (rotation prevents replay)
- Logout deletes the refresh token from database

### 1.4 Rate Limiting (Login)

```
5 attempts per IP per 60 seconds
After 5 failures → 5 minute lockout
After 10 failures → 30 minute lockout
```

---

## 2. Authorization (RBAC)

### 2.1 Roles

| Role | Level | Permissions |
|------|-------|-------------|
| `SUPER_ADMIN` | System | Full access, all tenants, user management, billing |
| `BUSINESS_OWNER` | Tenant | Full access within own business, settings, staff management, analytics |
| `BRANCH_MANAGER` | Branch | Manage branch, view branch appointments, limited settings |
| `EMPLOYEE` | Self | View own schedule, mark appointments, view assigned customers |
| `CUSTOMER` | Self | Book/cancel own appointments, view own history |

### 2.2 Permission Matrix

| Resource | SUPER_ADMIN | BUSINESS_OWNER | BRANCH_MANAGER | EMPLOYEE | CUSTOMER |
|----------|-------------|----------------|----------------|----------|----------|
| Business CRUD | ✅ | ✅ | ❌ | ❌ | ❌ |
| Branch CRUD | ✅ | ✅ | ❌ | ❌ | ❌ |
| Employee CRUD | ✅ | ✅ | ❌ | ❌ | ❌ |
| Service CRUD | ✅ | ✅ | ✅ | ❌ | ❌ |
| Appointment — All | ✅ | ✅ | ✅ (branch) | ❌ | ❌ |
| Appointment — Own | ✅ | ✅ | ✅ | ✅ (self) | ✅ (self) |
| Customer — View | ✅ | ✅ | ✅ (branch) | ✅ (assigned) | ✅ (self) |
| Customer — Edit | ✅ | ✅ | ❌ | ❌ | ❌ |
| Dashboard | ✅ | ✅ | ✅ (branch) | ❌ | ❌ |
| Settings | ✅ | ✅ | ❌ | ❌ | ❌ |
| Analytics | ✅ | ✅ | ✅ (branch) | ❌ | ❌ |

### 2.3 Guard Implementation

```typescript
// JWT Guard — validates token
@UseGuards(JwtAuthGuard)

// Roles Guard — checks role
@UseGuards(RolesGuard)
@Roles(UserRole.BUSINESS_OWNER, UserRole.BRANCH_MANAGER)

// Tenant Guard — checks businessId scope
@UseGuards(TenantGuard)

// Combined
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
```

---

## 3. Input Validation

### 3.1 API Layer

- All DTOs use `class-validator` decorators (`@IsString`, `@IsEmail`, `@MinLength`, etc.)
- Global `ValidationPipe` with `whitelist: true` (strips unknown properties)
- `forbidNonWhitelisted: true` (rejects requests with extra fields)

### 3.2 Database Layer

- Prisma parameterized queries (no SQL injection possible)
- Zod schemas for additional runtime validation
- String length limits match database column sizes

### 3.3 File Upload (Future)

- File type whitelist (jpg, png, pdf only)
- File size limit (5MB)
- Scan with ClamAV before storage

---

## 4. API Security

### 4.1 Headers

```typescript
app.use(helmet());  // Sets:
// Content-Security-Policy
// X-Content-Type-Options: nosniff
// X-Frame-Options: DENY
// Strict-Transport-Security
// X-XSS-Protection
```

### 4.2 CORS

```typescript
app.enableCors({
  origin: process.env.CORS_ORIGIN,  // Explicit origin, not wildcard in production
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Authorization', 'Content-Type'],
});
```

### 4.3 Rate Limiting

```typescript
// NestJS ThrottlerModule
ThrottlerModule.forRoot({
  throttlers: [
    { name: 'global', limit: 200, ttl: 60000 },
    { name: 'ai', limit: 30, ttl: 60000 },     // AI endpoint
    { name: 'auth', limit: 5, ttl: 60000 },     // Login
  ],
});
```

---

## 5. Data Protection

### 5.1 PII Handling

| Data Type | Classification | Handling |
|-----------|---------------|----------|
| Name | PII | Encrypted at rest, masked in logs |
| Phone | PII | Encrypted at rest, masked in logs |
| Email | PII | Encrypted at rest, masked in logs |
| Password | Secret | bcrypt hashed, never logged |
| JWT Secret | Secret | Environment variable, never in code |
| Payment info | PCI | Not stored (delegated to Stripe/Razorpay) |

### 5.2 Encryption

```typescript
// At-rest encryption for PII fields
// Using Prisma field-level encryption (future)
model Customer {
  phone  String?  @encrypted  // Prisma extension
  email  String?  @encrypted
}
```

### 5.3 Audit Logging

All mutations are logged to `AuditLog`:

```typescript
interface AuditLogEntry {
  businessId: string;
  userId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT';
  entity: string;      // Appointment, Customer, etc.
  entityId: string;
  metadata: {          // Before/after values (PII excluded from logs)
    changedFields: string[];
  };
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}
```

---

## 6. API Key Authentication (Future)

For webhook integrations (WhatsApp, Instagram), API keys will be used:

| Type | Usage | Expiry |
|------|-------|--------|
| Publishable Key | Web widget, client-side | Never expires |
| Secret Key | Server-to-server, webhooks | Can be rotated |
| Temporary Token | OAuth flows | 24 hours |

---

## 7. Security Checklist

- [ ] JWT with short expiry (15m) + refresh rotation
- [ ] bcrypt password hashing (cost 12)
- [ ] Role-based access control on every route
- [ ] Tenant isolation on every query
- [ ] Input validation + whitelisting on all endpoints
- [ ] CORS configured to explicit origin
- [ ] Helmet security headers enabled
- [ ] Rate limiting on public + auth endpoints
- [ ] Audit logging on all data mutations
- [ ] No secrets in code or logs
- [ ] SQL injection prevention via Prisma
- [ ] XSS prevention via Content-Security-Policy
