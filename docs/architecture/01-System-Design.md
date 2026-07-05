# System Design Document (SDD)

> **Author:** Chief AI Architect
> **Version:** 1.0
> **Status:** Draft

---

## 1. System Overview

AI SalonOS is a multi-tenant SaaS platform that replaces human receptionists, appointment managers, and customer support agents for salons and appointment-based businesses.

The system receives customer messages from multiple channels (WhatsApp, Instagram, website chat), processes them through an AI engine, executes business logic (booking, CRM, billing), and returns human-friendly responses.

---

## 2. Architecture Style

**Hexagonal Architecture (Ports & Adapters)**

```
                    ┌──────────────────────────┐
                    │      AI Providers        │
                    │  (OpenAI / Gemini / Mock) │
                    └───────────┬──────────────┘
                                │ (port)
                    ┌───────────▼──────────────┐
                    │     AI Orchestration      │
                    │   (Intent → Tool → Response) │
                    └───────────┬──────────────┘
                                │ (port)
┌──────────┐  ┌─────────────────▼──────────────────┐  ┌──────────┐
│ WhatsApp │  │        Business Logic Layer         │  │  Queue   │
│ Instagram│──┤  (Domain Services / Use Cases)     ├──│ (BullMQ) │
│ Web Chat │  │  Appointment / CRM / Lead / Biz    │  │          │
└──────────┘  └─────────────────┬──────────────────┘  └──────────┘
                                │ (port)
                    ┌───────────▼──────────────┐
                    │     Data Layer (Prisma)   │
                    │     PostgreSQL            │
                    │     Redis (Cache/Queue)   │
                    └──────────────────────────┘
```

### Why Hexagonal?
- AI providers are external adapters (swap OpenAI for Gemini by changing one config)
- Business logic is framework-agnostic (NestJS is an implementation detail)
- Channels (WhatsApp, Instagram) are input adapters — adding a channel doesn't change core logic
- Database is a persistence adapter — Prisma can be replaced without touching domain services

---

## 3. Module Dependency Rules

```
                    ┌──────────┐
                    │  Auth    │  ← No internal dependencies
                    └────┬─────┘
                         │
              ┌──────────▼──────────┐
              │      Business       │  ← Depends on: Auth
              └──────────┬──────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼────┐    ┌─────▼─────┐   ┌────▼────┐
    │ Branches│    │ Employees │   │Services │
    └────┬────┘    └─────┬─────┘   └────┬────┘
         │               │              │
         └───────────────┼──────────────┘
                         │
                    ┌────▼────┐
                    │  CRM /  │
                    │Customers│
                    └────┬────┘
                         │
              ┌──────────▼──────────┐
              │    Appointments      │  ← Depends on: Customers, Services, Employees, Branches
              └──────────┬──────────┘
                         │
              ┌──────────▼──────────┐
              │   Conversations     │  ← Depends on: Customers, Appointments
              └──────────┬──────────┘
                         │
              ┌──────────▼──────────┐
              │  AI Orchestration   │  ← Depends on: Conversations (through ports)
              └─────────────────────┘
```

### Strict Rule
Modules may only depend on modules **above** them in the dependency graph. Circular dependencies are forbidden. If a circular dependency is detected, extract the shared logic into a new lower-level module.

---

## 4. Layer Architecture

### 4.1 Controller Layer
- Handles HTTP requests
- No business logic
- Calls service layer
- Returns DTOs

### 4.2 Service Layer
- Contains all business logic
- Orchestrates domain operations
- Calls repository/data layer
- Throws domain exceptions

### 4.3 Repository/Data Layer
- Prisma service wrappers
- Domain-specific query methods
- Transaction management

### 4.4 AI Orchestration Layer
- Receives messages from Conversation module
- Detects intent via AI provider
- Calls appropriate business service via tool interface
- Returns structured response
- Contains zero business logic

---

## 5. Data Flow — Appointment Booking

```
Customer: "I want a haircut tomorrow at 5pm"
   │
   ▼
[Conversation Controller] POST /conversations/message
   │
   ▼
[Conversation Service] stores message, calls AI
   │
   ▼
[AI Orchestration Layer]
   ├── Intent detection: BOOK_APPOINTMENT
   ├── Extract: { service: "Haircut", date: "tomorrow", time: "5pm" }
   │
   ▼
[Tool Registry] → select AppointmentTool
   │
   ▼
[Appointment Tool] → calls Appointment Service
   ├── validateSlot(businessId, branchId, date, time)
   │   ├── WorkingHoursResolver → check hours
   │   ├── HolidayChecker → check holidays
   │   ├── ConflictDetector → check existing appointments
   │   └── Return: available or conflict
   │
   ▼
[Appointment Service] → create appointment
   │
   ▼
[Response] → AI formats: "Your haircut is booked for tomorrow at 5pm with Rahul. See you at Glamour Salon!"
   │
   ▼
[Customer] receives response
```

---

## 6. Technology Stack

| Component | Technology | Justification |
|-----------|-----------|---------------|
| Runtime | Node.js 22 | High I/O, async-native, large ecosystem |
| Framework | NestJS 11 | Modular, DI, guard/interceptor system, Swagger integration |
| Language | TypeScript 5.7 | Type safety, IDE support, strict mode |
| API Protocol | REST (JSON) | Universal compatibility, simple to document and test |
| Real-time | WebSocket (Socket.io) | Live dashboard updates, chat (future) |
| Database | PostgreSQL 16 | Mature, JSON support, excellent indexing, row-level security |
| ORM | Prisma 6 | Type-safe queries, migrations, studio |
| Cache | Redis 7 | Sub-millisecond reads, pub/sub, rate limiting |
| Queue | BullMQ | Redis-backed, delayed jobs, retries, scheduling |
| Vector DB | Qdrant | Purpose-built for embeddings, fast ANN search |
| Object Storage | S3 (MinIO) | File uploads, backups, immutable audit logs |
| AI Provider | OpenAI GPT-4o (primary) / Gemini 2.0 Flash (fallback) | Best-in-class reasoning + free tier fallback |
| Container | Docker + Compose | Local parity with production |
| CI/CD | GitHub Actions | Integrated with GitHub, matrix builds |
| Frontend Hosting | Vercel | Edge-optimized, zero-config Next.js |
| Backend Hosting | Railway / DigitalOcean | Simple deployment, Docker-native |

---

## 7. Scalability Strategy

### Horizontal Scaling
- API servers are stateless (JWT carries session)
- Multiple instances behind load balancer
- WebSocket connections use Redis adapter for sticky sessions

### Database Scaling
- Read replicas for dashboard queries
- Connection pooling via PgBouncer
- Partition large tables (appointments, messages) by `businessId`

### Cache Scaling
- Redis cluster for high availability
- Cache-aside pattern for frequent reads
- TTL-based invalidation

### AI Scaling
- Rate-limited by tenant tier
- Queue-based processing for non-urgent AI requests
- Provider fallback chain (OpenAI → Gemini → cached response)

---

## 8. Availability Targets

| Component | Target | Strategy |
|-----------|--------|----------|
| API | 99.9% | Stateless, multi-instance, health checks |
| Database | 99.95% | Managed PostgreSQL, automated backups |
| AI | 99.5% | Provider fallback, queue retry |
| Frontend | 99.9% | CDN-cached static assets, Vercel SLA |

---

## 9. Observability

- **Metrics:** Prometheus + Grafana (request rate, latency, error rate, queue depth)
- **Logs:** Structured JSON logging → stdout → log aggregator
- **Traces:** OpenTelemetry for distributed tracing
- **Alerts:** PagerDuty/ Slack for P1 incidents (API down, queue backlog)

---

## 10. Key Design Decisions (ADRs)

### ADR-001: Why not microservices?
**Decision:** Monolithic first, extract when needed.
**Rationale:** Team size is small, bounded contexts are clear, and deploying a monolith is simpler. When specific modules (AI, appointments) need independent scaling, extract them into services.

### ADR-002: Why REST over GraphQL?
**Decision:** REST with Swagger documentation.
**Rationale:** The API is primarily consumed by our own frontend + AI tools. REST is simpler to version, cache, and debug. GraphQL would add complexity without proportional benefit.

### ADR-003: Why provider-agnostic AI?
**Decision:** AI abstraction layer with strategy pattern.
**Rationale:** Avoid vendor lock-in. OpenAI may change pricing/terms. Gemini offers free tier. New providers emerge regularly. The abstraction costs little to implement.

### ADR-004: Why no event sourcing?
**Decision:** Current-data model with audit logs.
**Rationale:** Event sourcing adds significant complexity (event versioning, rebuilding state). Audit logs provide enough traceability for Phase 1. Event sourcing can be added later if needed.
