# Database Design

## Schema Overview

16 models in the database, all tied to `Business` for multi-tenancy.

## Entity Relationships

```
Business
├── Branch (1:N)
│   ├── WorkingHour (1:N)
│   ├── Holiday (1:N)
│   └── Employee (1:N)
├── Service (1:N)
├── Customer (1:N)
│   ├── Appointment (1:N)
│   ├── Conversation (1:N)
│   ├── Lead (1:N)
│   └── Notification (1:N)
├── Employee (1:N)
│   └── Appointment (1:N)
├── Appointment (1:N)
│   └── Conversation (1:1)
├── Conversation (1:N)
│   ├── Message (1:N)
│   └── IntentLog (1:N)
├── User (1:N)
└── Setting (1:1)
```

## Key Design Decisions

### Multi-tenant via businessId
- Every data model has a `businessId` foreign key
- Queries always filter by `businessId`
- TenantGuard middleware prevents cross-tenant access

### Soft deletes
- `deletedAt: DateTime?` on all major entities
- Queries filter `WHERE deletedAt IS NULL`
- Enables recovery and audit

### PostgreSQL-specific features
- `Json` fields for flexible metadata (conversation metadata, AI config)
- `Decimal` for monetary values (avoids floating point issues)
- `String[]` arrays for customer tags

### Audit trail
- `AuditLog` model records all mutations
- Tracks who, what, when, and IP address

## Indexes

- `Appointment`: (businessId, startTime), (employeeId, startTime), (customerId, startTime)
- `Customer`: (businessId, phone), (businessId, email)
- `Conversation`: (businessId, customerId), (externalId, source)
- `Message`: (conversationId, createdAt)
- `Lead`: (businessId, status), (businessId, source)
- `Notification`: (businessId, status), (customerId)
- `AuditLog`: (businessId, createdAt), (entity, entityId)
