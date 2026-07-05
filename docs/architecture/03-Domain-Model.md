# Domain Model

> **Author:** Chief AI Architect
> **Version:** 1.0

---

## 1. Core Domain — Appointment Booking

```
                    ┌──────────────┐
                    │   Customer   │
                    │──────────────│
                    │ name         │
                    │ phone        │
                    │ email        │
                    │ totalVisits  │
                    │ totalSpent   │
                    │ loyaltyPts   │
                    │ tags[]       │
                    │ isVip        │
                    └──────┬───────┘
                           │
                  ┌────────▼────────┐
                  │  Appointment    │
                  │─────────────────│
                  │ startTime       │
                  │ endTime         │
                  │ duration        │
                  │ status          │
                  │ source          │
                  │ notes           │
                  └──┬──────────┬───┘
                     │          │
            ┌────────▼──┐  ┌───▼────────┐
            │  Employee │  │  Service   │
            │───────────│  │────────────│
            │ name      │  │ name       │
            │ title     │  │ duration   │
            │ color     │  │ price      │
            └───────────┘  │ category   │
                           └────────────┘
```

**Bounded Context:** Appointment Management  
**Aggregate Root:** `Appointment`  
**Invariants:**
- No two appointments for the same employee at overlapping times
- Appointment must be within working hours
- Appointment must not be on a holiday
- Customer must exist (auto-created if new)

---

## 2. Supporting Domain — CRM

```
┌─────────────────────┐
│      Customer       │
│─────────────────────│
│ id                  │
│ businessId          │
│ name                │
│ phone               │
│ email               │
│ totalVisits         │ ← Computed from appointments
│ totalSpent          │ ← Computed from completed appointments
│ loyaltyPoints       │ ← Managed by loyalty service
│ preferredEmployeeId │ ← Most frequently booked
│ preferredServiceIds │ ← Most frequently booked services
│ lastVisitAt         │ ← Last appointment startTime
│ tags[]              │ ← Manual + auto-tagged
│ isVip               │ ← If totalSpent > threshold
│ source              │ ← How they were acquired
└─────────────────────┘
```

**Bounded Context:** Customer Relationship Management  
**Aggregate Root:** `Customer`  
**Invariants:**
- A customer must have at least name or phone
- Phone deduplication per business
- Tags have controlled vocabulary (auto-tags are read-only)

---

## 3. Supporting Domain — Business Configuration

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Business   │1──N│    Branch    │1──N│ WorkingHour  │
│──────────────│     │──────────────│     │──────────────│
│ name         │     │ name         │     │ dayOfWeek    │
│ slug         │     │ address      │     │ openTime     │
│ timezone     │     │ phone        │     │ closeTime    │
│ currency     │     └──────────────┘     │ isClosed     │
└──────────────┘                          └──────────────┘
                                              │
                                        1──N  │
                                        ┌────▼──────┐
                                        │  Holiday  │
                                        │───────────│
                                        │ name      │
                                        │ date      │
                                        │ recurring │
                                        └───────────┘
```

**Bounded Context:** Business Configuration  
**Aggregate Root:** `Business`  
**Invariants:**
- Business must have unique slug
- Branch must have at least one working hour per day
- Working hours cannot overlap on the same day for the same branch

---

## 4. Supporting Domain — AI Conversation

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Conversation │1──N│   Message    │     │  IntentLog   │
│──────────────│     │──────────────│     │──────────────│
│ source       │     │ role         │     │ intent       │
│ externalId   │     │ content      │     │ confidence   │
│ isActive     │     │ contentType  │     │ extractedData│
│ metadata     │     │ metadata     │     │ resolved     │
└──────────────┘     └──────────────┘     └──────────────┘
```

**Bounded Context:** AI Conversation  
**Aggregate Root:** `Conversation`  
**Invariants:**
- Conversation belongs to exactly one customer
- Messages are append-only (never edited or deleted)
- First message must be from CUSTOMER role

---

## 5. Domain Events (Future)

Events that will trigger side effects when event bus is introduced:

| Event | Trigger | Handlers |
|-------|---------|----------|
| `AppointmentCreated` | Booking confirmed | Send confirmation, Update CRM, Update calendar |
| `AppointmentCancelled` | Cancel requested | Send notification, Free employee slot, Update CRM |
| `AppointmentCompleted` | Status set to Completed | Add loyalty points, Request review, Update CRM |
| `CustomerCreated` | First conversation | Send welcome message, Add to CRM |
| `LowLoyaltyBalance` | Points below threshold | Send re-engagement offer |
| `NoShowDetected` | Appointment passed without check-in | Mark as no-show, Send follow-up |

---

## 6. Domain Vocabulary

| Term | Definition |
|------|-----------|
| **Business** | A salon, spa, or clinic that uses the platform (tenant) |
| **Branch** | Physical location of a business |
| **Customer** | End user who books appointments and receives services |
| **Employee** | Staff member who provides services |
| **Service** | A specific treatment or offering (e.g., Haircut) |
| **Appointment** | A reservation for a service at a specific time |
| **Slot** | An available time window for booking |
| **Lead** | A potential customer who hasn't booked yet |
| **Conversation** | A chat session between customer and AI |
| **Intent** | What the customer wants to do (book, cancel, ask) |
| **Tool** | A backend capability the AI can invoke |
