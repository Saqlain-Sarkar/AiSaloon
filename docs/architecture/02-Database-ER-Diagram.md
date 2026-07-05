# Database ER Diagram

> **Author:** Database Architect
> **Version:** 1.0
> **Status:** Draft

---

## 1. Entity-Relationship Diagram (Text)

```
┌──────────────────┐       ┌──────────────────┐
│     Business     │1──N──│      User        │
│──────────────────│       │──────────────────│
│ id (PK)          │       │ id (PK)          │
│ name             │       │ businessId (FK)  │
│ slug (UQ)        │       │ email (UQ)       │
│ email            │       │ passwordHash     │
│ phone            │       │ role (enum)      │
│ timezone         │       │ isActive         │
│ currency         │       │ refreshToken     │
│ createdAt        │       │ lastLoginAt      │
│ updatedAt        │       └──────────────────┘
│ deletedAt        │
└──────┬───────────┘
       │
       │1
       │
       ▼
┌──────────────────┐       ┌──────────────────┐
│     Branch       │1──N──│   WorkingHour    │
│──────────────────│       │──────────────────│
│ id (PK)          │       │ id (PK)          │
│ businessId (FK)  │       │ branchId (FK)    │
│ name             │       │ dayOfWeek (UQ)   │
│ address          │       │ openTime         │
│ city             │       │ closeTime        │
│ state            │       │ isClosed         │
│ phone            │       └──────────────────┘
│ email            │
│ latitude         │       ┌──────────────────┐
│ longitude        │1──N──│    Holiday       │
│ isActive         │       │──────────────────│
└──────┬───────────┘       │ id (PK)          │
       │                   │ branchId (FK)    │
       │1                 │ name             │
       ▼                   │ date (UQ)        │
┌──────────────────┐       │ isRecurring      │
│    Employee      │       └──────────────────┘
│──────────────────│
│ id (PK)          │       ┌──────────────────────┐
│ businessId (FK)  │1──N──│ EmployeeService      │
│ branchId (FK)    │       │──────────────────────│
│ userId (UQ)      │       │ employeeId (PK,FK)   │
│ name             │       │ serviceId (PK,FK)     │
│ email            │       │ isPrimary            │
│ phone            │       └──────────────────────┘
│ title            │                  │
│ gender           │                  │N
│ isActive         │                  ▼
│ color            │       ┌──────────────────┐
└──────┬───────────┘       │    Service       │
       │                   │──────────────────│
       │1                 │ id (PK)          │
       ▼                   │ businessId (FK)  │
┌──────────────────┐       │ branchId (FK)    │
│ ServiceAvailab.  │       │ categoryId (FK)  │
│──────────────────│       │ name             │
│ id (PK)          │       │ description      │
│ employeeId (FK)  │       │ duration         │
│ dayOfWeek        │       │ price            │
│ startTime        │       │ discountedPrice  │
│ endTime          │       │ isActive         │
│ isAvailable      │       └────────┬─────────┘
└──────────────────┘                │
                                    │N
                           ┌────────▼─────────┐
                           │ ServiceCategory  │
                           │──────────────────│
                           │ id (PK)          │
                           │ businessId (FK)  │
                           │ name             │
                           │ description      │
                           │ sortOrder        │
                           └──────────────────┘

┌──────────────────┐       ┌──────────────────┐
│    Customer      │1──N──│  Appointment     │
│──────────────────│       │──────────────────│
│ id (PK)          │       │ id (PK)          │
│ businessId (FK)  │       │ businessId (FK)  │
│ branchId (FK)    │       │ branchId (FK)    │
│ name             │       │ customerId (FK)  │
│ email            │       │ employeeId (FK)  │
│ phone            │       │ serviceId (FK)   │
│ gender           │       │ startTime        │
│ dateOfBirth      │       │ endTime          │
│ notes            │       │ duration         │
│ tags (string[])  │       │ status (enum)    │
│ totalVisits      │       │ source (enum)    │
│ totalSpent       │       │ notes            │
│ loyaltyPoints    │       │ cancelReason     │
│ preferredEmpId   │       │ rescheduleCount  │
│ lastVisitAt      │       │ isWalkIn         │
│ source (enum)    │       └────────┬─────────┘
│ isVip            │                │
└──────────────────┘                │
                                    │1 (optional)
                                    ▼
┌──────────────────┐       ┌──────────────────┐
│  Conversation    │1──N──│    Message       │
│──────────────────│       │──────────────────│
│ id (PK)          │       │ id (PK)          │
│ businessId (FK)  │       │ conversationId   │
│ customerId (FK)  │       │ role (enum)      │
│ appointmentId(FK)│       │ content          │
│ source (enum)    │       │ contentType      │
│ externalId       │       │ metadata (JSON)  │
│ isActive         │       └──────────────────┘
│ metadata (JSON)  │
└────────┬─────────┘
         │
         │1
         ▼
┌──────────────────┐
│   IntentLog      │
│──────────────────│
│ id (PK)          │
│ conversationId   │
│ intent           │
│ confidence       │
│ rawInput         │
│ extractedData(J) │
│ resolved         │
└──────────────────┘

┌──────────────────┐       ┌──────────────────┐
│      Lead        │       │  Notification    │
│──────────────────│       │──────────────────│
│ id (PK)          │       │ id (PK)          │
│ businessId (FK)  │       │ businessId (FK)  │
│ customerId (FK)  │       │ customerId (FK)  │
│ name             │       │ channel (enum)   │
│ phone            │       │ type (enum)      │
│ email            │       │ title            │
│ service          │       │ body             │
│ source (enum)    │       │ metadata (JSON)  │
│ status (enum)    │       │ scheduledAt      │
│ assignedTo       │       │ sentAt           │
│ score            │       │ status           │
└──────────────────┘       └──────────────────┘

┌──────────────────┐       ┌──────────────────┐
│    Setting       │       │   AuditLog       │
│──────────────────│       │──────────────────│
│ businessId(PK,FK)│       │ id (PK)          │
│ businessName     │       │ businessId (FK)  │
│ businessHours(J) │       │ userId           │
│ aiConfig (JSON)  │       │ action           │
│ notifConfig (J)  │       │ entity           │
│ generalConfig(J) │       │ entityId         │
│ createdAt        │       │ metadata (JSON)  │
└──────────────────┘       │ ipAddress        │
                            │ createdAt        │
                            └──────────────────┘
```

---

## 2. Relationship Summary

| From | To | Type | Via |
|------|----|------|-----|
| Business | User | 1:N | businessId |
| Business | Branch | 1:N | businessId |
| Business | Service | 1:N | businessId |
| Business | Customer | 1:N | businessId |
| Business | Employee | 1:N | businessId |
| Business | Conversation | 1:N | businessId |
| Business | Lead | 1:N | businessId |
| Business | Notification | 1:N | businessId |
| Business | Setting | 1:1 | businessId |
| Business | ServiceCategory | 1:N | businessId |
| Branch | WorkingHour | 1:N | branchId |
| Branch | Holiday | 1:N | branchId |
| Branch | Employee | 1:N | branchId |
| Branch | Appointment | 1:N | branchId |
| Employee | Appointment | 1:N | employeeId |
| Employee | EmployeeService | 1:N | employeeId |
| Employee | ServiceAvailability | 1:N | employeeId |
| Service | EmployeeService | 1:N | serviceId |
| Service | ServiceCategory | N:1 | categoryId |
| Customer | Appointment | 1:N | customerId |
| Customer | Conversation | 1:N | customerId |
| Customer | Lead | 1:N | customerId |
| Customer | Notification | 1:N | customerId |
| Appointment | Conversation | 1:1 | appointmentId |
| Conversation | Message | 1:N | conversationId |
| Conversation | IntentLog | 1:N | conversationId |

---

## 3. Key Indexes

```sql
-- Appointments: most frequent queries
CREATE INDEX idx_appointments_business_start ON appointments(business_id, start_time);
CREATE INDEX idx_appointments_employee_start ON appointments(employee_id, start_time);
CREATE INDEX idx_appointments_customer_start ON appointments(customer_id, start_time);
CREATE INDEX idx_appointments_status ON appointments(status);

-- Customers: search + deduplication
CREATE INDEX idx_customers_business_phone ON customers(business_id, phone);
CREATE INDEX idx_customers_business_email ON customers(business_id, email);
CREATE INDEX idx_customers_name_trgm ON customers USING gin (name gin_trgm_ops);

-- Conversations: chat history
CREATE INDEX idx_conversations_business_customer ON conversations(business_id, customer_id);
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at);

-- Leads: pipeline view
CREATE INDEX idx_leads_business_status ON leads(business_id, status);

-- Audit: forensics
CREATE INDEX idx_audit_business_created ON audit_logs(business_id, created_at);
CREATE INDEX idx_audit_entity ON audit_logs(entity, entity_id);
```

---

## 4. Partitioning Strategy (Future)

When `appointments` and `messages` exceed 10M rows:

```
appointments (PARTITION BY RANGE (start_time))
├── appointments_2026_q1
├── appointments_2026_q2
└── appointments_2026_q3

messages (PARTITION BY RANGE (created_at))
├── messages_2026_01
├── messages_2026_02
└── messages_2026_03
```

---

## 5. Row-Level Security (RLS) — Tenant Isolation

PostgreSQL RLS policies ensure data isolation at the database level:

```sql
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON appointments
  USING (business_id = current_setting('app.current_business_id')::UUID);
```

RLS is a defense-in-depth layer. Application-level tenant isolation (TenantGuard) remains the primary mechanism.
