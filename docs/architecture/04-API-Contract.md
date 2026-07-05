# API Contract — OpenAPI Specification

> **Author:** Backend Engineer
> **Version:** 1.0
> **Format:** OpenAPI 3.1
> **Live docs:** `http://localhost:4000/api/docs`

---

## 1. Base URL

```
https://{host}/api/v1
```

## 2. Authentication

All endpoints except those marked `@Public()` require:

```
Authorization: Bearer {jwt_token}
```

## 3. Standard Response Envelope

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-06-28T12:00:00.000Z"
}
```

Error responses:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "path": "/api/v1/appointments",
  "timestamp": "2026-06-28T12:00:00.000Z"
}
```

## 4. Core Endpoints

### 4.1 Auth

| Method | Path | Auth | Request | Response |
|--------|------|------|---------|----------|
| POST | `/auth/register` | No | `{ email, password, role?, businessId? }` | `{ accessToken, refreshToken, user }` |
| POST | `/auth/login` | No | `{ email, password }` | `{ accessToken, refreshToken, user }` |
| POST | `/auth/refresh` | No | `{ refreshToken }` | `{ accessToken, refreshToken }` |
| GET | `/auth/me` | Yes | — | `{ id, email, role, business }` |
| POST | `/auth/logout` | Yes | — | `{ message }` |

### 4.2 Business

| Method | Path | Auth | Request | Response |
|--------|------|------|---------|----------|
| POST | `/business` | Yes | `{ name, slug?, about? }` | `Business` |
| GET | `/business/:id` | Public | — | `Business` (with _count) |

### 4.3 Branches

| Method | Path | Auth | Request | Response |
|--------|------|------|---------|----------|
| POST | `/branches` | Yes | `{ name, address?, city?, phone? }` | `Branch` |
| GET | `/branches` | Yes | — | `Branch[]` |
| GET | `/branches/:id` | Yes | — | `Branch` (with workingHours, holidays) |
| PATCH | `/branches/:id` | Yes | `{ name?, address? }` | `Branch` |
| POST | `/branches/:id/working-hours` | Yes | `{ dayOfWeek, openTime, closeTime, isClosed? }` | `WorkingHour` |
| POST | `/branches/:id/holidays` | Yes | `{ name, date, isRecurring? }` | `Holiday` |

### 4.4 Employees

| Method | Path | Auth | Request | Response |
|--------|------|------|---------|----------|
| POST | `/employees` | Yes | `{ name, title?, branchId?, email?, phone? }` | `Employee` |
| GET | `/employees` | Yes | `?branchId=` | `Employee[]` (with services) |
| GET | `/employees/:id` | Yes | — | `Employee` (with availabilities) |
| PATCH | `/employees/:id` | Yes | `{ name?, title? }` | `Employee` |
| DELETE | `/employees/:id` | Yes | — | soft delete |
| POST | `/employees/:id/services` | Yes | `{ serviceIds: [] }` | `Employee` (with services) |

### 4.5 Services

| Method | Path | Auth | Request | Response |
|--------|------|------|---------|----------|
| POST | `/services` | Yes | `{ name, duration, price, category?, branchId? }` | `Service` |
| GET | `/services` | Public | — | `Service[]` |
| GET | `/services/:id` | Public | — | `Service` |
| PATCH | `/services/:id` | Yes | `{ name?, price? }` | `Service` |
| DELETE | `/services/:id` | Yes | — | soft delete |

### 4.6 Customers

| Method | Path | Auth | Request | Response |
|--------|------|------|---------|----------|
| POST | `/customers` | Yes | `{ name, phone?, email? }` | `Customer` |
| GET | `/customers` | Yes | `?search=&page=&limit=&isVip=` | `{ customers[], total, page }` |
| GET | `/customers/:id` | Yes | — | `Customer` (with history) |
| PATCH | `/customers/:id` | Yes | `{ name?, tags?, notes? }` | `Customer` |
| GET | `/customers/:id/appointments` | Yes | — | `Appointment[]` |
| GET | `/customers/:id/conversations` | Yes | — | `Conversation[]` |
| GET | `/customers/:id/insights` | Yes | — | `{ totalVisits, totalSpent, avgSpend, favoriteService, daysSinceLastVisit }` |
| POST | `/customers/lookup` | Yes | `{ phone?, email?, name? }` | `Customer` (creates if not found) |

### 4.7 Appointments

| Method | Path | Auth | Request | Response |
|--------|------|------|---------|----------|
| POST | `/appointments` | Yes | `{ branchId, customerId, startTime, duration, employeeId?, serviceId?, notes? }` | `Appointment` |
| GET | `/appointments` | Yes | `?startDate=&endDate=&employeeId=&customerId=&status=` | `Appointment[]` |
| GET | `/appointments/:id` | Yes | — | `Appointment` (with relations) |
| PATCH | `/appointments/:id/reschedule` | Yes | `{ startTime, employeeId? }` | `Appointment` |
| PATCH | `/appointments/:id/cancel` | Yes | `{ reason? }` | `Appointment` |
| PATCH | `/appointments/:id/status` | Yes | `{ status }` | `Appointment` |

### 4.8 Appointment Slots (Engine)

| Method | Path | Auth | Request | Response |
|--------|------|------|---------|----------|
| GET | `/appointments/slots/available` | Public | `?businessId=&branchId=&date=&serviceId=&employeeId=&duration=` | `{ date, slots[], availableEmployees[] }` |
| POST | `/appointments/slots/validate` | Yes | `{ businessId, branchId, startTime, endTime, employeeId? }` | `{ available, reason? }` |
| GET | `/appointments/slots/employees` | Public | `?businessId=&branchId=&date=&startTime=&endTime=` | `{ id, name, title }[]` |

### 4.9 Conversations (AI Chat)

| Method | Path | Auth | Request | Response |
|--------|------|------|---------|----------|
| POST | `/conversations/message` | Public | `{ content, source?, customerPhone?, customerName?, businessId? }` | `{ conversationId, message, intent, action, customer }` |
| GET | `/conversations` | Yes | `?customerId=&source=` | `Conversation[]` |
| GET | `/conversations/:id` | Yes | — | `Conversation` (with messages, intents) |
| GET | `/conversations/:id/messages` | Yes | `?page=&limit=` | `{ messages[], total }` |

### 4.10 Leads

| Method | Path | Auth | Request | Response |
|--------|------|------|---------|----------|
| POST | `/leads` | Yes | `{ name, phone?, source, service?, notes? }` | `Lead` |
| GET | `/leads` | Yes | `?status=&source=&page=&limit=` | `{ leads[], total }` |
| GET | `/leads/:id` | Yes | — | `Lead` |
| PATCH | `/leads/:id` | Yes | `{ status?, notes? }` | `Lead` |

### 4.11 Dashboard

| Method | Path | Auth | Request | Response |
|--------|------|------|---------|----------|
| GET | `/dashboard/today` | Yes | — | `{ appointments, leads, customers, conversations }` |
| GET | `/dashboard/stats` | Yes | `?startDate=&endDate=` | `{ appointments, revenue, customers, leads }` |
| GET | `/dashboard/leads` | Yes | — | `{ byStatus[], bySource[] }` |
| GET | `/dashboard/upcoming` | Yes | `?limit=` | `Appointment[]` |

### 4.12 Analytics

| Method | Path | Auth | Request | Response |
|--------|------|------|---------|----------|
| GET | `/analytics/revenue` | Yes | `?startDate=&endDate=` | `{ total, count, average, dailyBreakdown }` |
| GET | `/analytics/popular-services` | Yes | `?startDate=&endDate=` | `{ serviceId, _count }[]` |
| GET | `/analytics/employee-performance` | Yes | `?startDate=&endDate=` | `{ employeeId, _count, _sum }[]` |

### 4.13 Settings

| Method | Path | Auth | Request | Response |
|--------|------|------|---------|----------|
| GET | `/settings` | Yes | — | `Setting` |
| PATCH | `/settings` | Yes | `{ businessName?, businessHours?, notificationConfig?, generalConfig? }` | `Setting` |
| GET | `/settings/ai` | Yes | — | `{ language, tone, greeting, ... }` |
| PATCH | `/settings/ai` | Yes | `{ language?, tone?, greeting? }` | `Setting` |

---

## 5. Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Successful GET, PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation error, invalid input |
| 401 | Unauthorized | Missing or invalid JWT |
| 403 | Forbidden | Insufficient role, cross-tenant access |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource, double booking |
| 422 | Unprocessable Entity | Business rule violation |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected failure |

---

## 6. Pagination

```json
// Request
GET /customers?page=2&limit=25

// Response
{
  "success": true,
  "data": {
    "customers": [...],
    "total": 142,
    "page": 2,
    "limit": 25,
    "totalPages": 6
  }
}
```

Default page: 1  
Default limit: 50  
Max limit: 200

---

## 7. Rate Limiting

| Scope | Limit | Window |
|-------|-------|--------|
| Public endpoints | 100 | 60 seconds |
| Authenticated endpoints | 200 | 60 seconds |
| AI conversation endpoint | 30 | 60 seconds (per customer) |
| Login attempts | 5 | 60 seconds (per IP) |
