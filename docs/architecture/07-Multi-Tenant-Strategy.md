# Multi-Tenant Data Isolation Strategy

> **Author:** Security Engineer
> **Version:** 1.0

---

## 1. Tenant Model: Discriminated (Shared Database)

Each business (salon, spa, clinic) is a tenant.

**Architecture:** Single database, shared tables, row-level tenant isolation via `businessId`.

### Why not Database-per-Tenant?

| Factor | Database-per-Tenant | Shared Database |
|--------|-------------------|-----------------|
| Isolation | Strongest | Strong (with RLS + app checks) |
| Cost | N × database | 1 database |
| Migration complexity | N migrations | 1 migration |
| Cross-tenant queries | Impossible | Possible (super admin) |
| Scaling | Independent | Connection pool shared |
| **Phase 1 choice** | ❌ | ✅ |

A shared database with RLS provides strong enough isolation at a fraction of the operational cost. Migration to database-per-tenant is possible later if a tenant exceeds resource limits.

---

## 2. Isolation Layers (Defense in Depth)

```
Layer 1: Application Middleware (TenantGuard)
├── Every request is scoped to businessId from JWT
├── Blocks cross-tenant access at the API level
└── Super admin role bypasses scope check

Layer 2: Database Queries (Prisma)
├── All WHERE clauses include businessId
├── Repository pattern enforces businessId scope
└── No raw SQL that could bypass scope

Layer 3: PostgreSQL Row-Level Security
├── RLS policies on every tenant-scoped table
├── Automatically filters rows by businessId
└── Defense against direct DB access or SQL injection

Layer 4: Connection Pool Isolation
├── Separate connection pool per tenant tier
├── Prevents noisy-neighbor problem
└── Future: read replica routing by tenant
```

---

## 3. Implementation

### 3.1 JWT Payload

```typescript
interface JwtPayload {
  sub: string;          // User ID
  email: string;        // User email
  role: UserRole;       // SUPER_ADMIN | BUSINESS_OWNER | BRANCH_MANAGER | EMPLOYEE
  businessId: string;   // Tenant ID
  branchId?: string;    // Optional branch scope
}
```

### 3.2 TenantGuard

```typescript
@Injectable()
class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Super admin can access all tenants
    if (user.role === 'SUPER_ADMIN') return true;

    // Scoped users can only access their own business
    const targetBusinessId =
      request.params.businessId ||
      request.query.businessId ||
      request.body?.businessId;

    if (targetBusinessId && targetBusinessId !== user.businessId) {
      throw new ForbiddenException('Cross-tenant access denied');
    }

    return true;
  }
}
```

### 3.3 Prisma Middleware (Auto-scoping)

```typescript
// Prisma middleware — automatically injects businessId into all queries
prisma.$use(async (params, next) => {
  // Skip for auth-related models
  if (params.model === 'User' || params.model === 'AuditLog') {
    return next(params);
  }

  // Add businessId filter to findMany, findFirst, findUnique
  if (['findMany', 'findFirst', 'count', 'aggregate'].includes(params.action)) {
    if (!params.args.where) params.args.where = {};
    params.args.where.businessId = currentBusinessId;
  }

  return next(params);
});
```

### 3.4 PostgreSQL RLS Policies

```sql
-- Enable RLS on tenant tables
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Set the tenant context on connection
CREATE POLICY tenant_isolation ON appointments
  USING (business_id = current_setting('app.tenant_id')::UUID);

CREATE POLICY tenant_isolation ON customers
  USING (business_id = current_setting('app.tenant_id')::UUID);
```

---

## 4. Onboarding Flow

```
1. Business Owner signs up
2. Business record created with unique slug
3. Owner User record created with businessId
4. Default Branch created (Main Branch)
5. Default Settings created
6. Owner can now add employees, services, etc.
```

### Registration Limits
- Free tier: 1 branch, 3 employees, 50 customers
- Pro tier: 3 branches, 10 employees, 500 customers
- Enterprise: Unlimited

---

## 5. Super Admin Access

Super admins have a `businessId: null` JWT and can:

- View all tenants
- Create/manage businesses
- Access system-wide analytics
- No access to customer PII unless audited

---

## 6. Data Migration to New Tenant Model

If a tenant outgrows the shared database:

1. Export their data (filtered by `businessId`)
2. Create dedicated database instance
3. Import data
4. Update tenant routing table
5. Switch connection at application level

No application code changes needed — the `businessId` filter works identically in both models.
