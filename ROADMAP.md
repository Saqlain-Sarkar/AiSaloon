# AI SalonOS — Development Roadmap

> **Owner:** Chief AI Architect
> **Last updated:** 2026-06-28
> **Status:** Wave 1 — Core Foundation (In Progress)

---

## Execution Model

Strictly sequential waves with mandatory review gates between each. No wave starts until the previous wave is fully reviewed and approved.

```
Wave 1 ──► Wave 2 ──► Wave 3 ──► Wave 4 ──► Wave 5
  │          │          │          │          │
  ▼          ▼          ▼          ▼          ▼
Review    Review     Review     Review     Review
 Gate      Gate       Gate       Gate       Gate
```

---

## Wave 1 — Core Foundation (In Progress)

**Parallel tasks with minimal coupling.**

| ID | Task | Agent | Dependencies |
|----|------|-------|-------------|
| DBA-001 | Finalize Prisma schema, migrations, indexes, constraints, tenant isolation, seed data | Database Architect | None |
| CORE-101 | Business module — entity, DTOs, service, controller, validation, Swagger, tests | Backend Engineer | DBA-001 |
| CORE-401 | AI Provider Abstraction — interfaces, factory, tool registry, conversation contracts (no LLM integration) | AI Engineer | None |
| SEC-101 | Auth foundation — JWT, refresh tokens, RBAC, TenantGuard, guards, audit hooks | Security Engineer | None |

**Goal:** Establish the core foundation that all future modules build upon.

---

## Wave 2 — Business Domain (After Wave 1 Review)

| ID | Task | Agent | Dependencies |
|----|------|-------|-------------|
| CORE-102 | Branches module | Backend Engineer | CORE-101 |
| CORE-103 | Employees module | Backend Engineer | CORE-101, CORE-102 |
| CORE-104 | Services module | Backend Engineer | DBA-001 |
| CORE-105 | Customers module (CRM core) | Backend Engineer + CRM Team | CORE-101, CORE-102 |

**Goal:** Complete the core business domain entities before adding appointment logic.

---

## Wave 3 — Appointment Engine (After Wave 2 Review)

| ID | Task | Agent | Dependencies |
|----|------|-------|-------------|
| CORE-201 | Appointment Engine — availability, slots, staff allocation, holidays, working hours, buffer times, conflict detection, double-booking prevention, reschedule, cancel, state transitions | Appointment Engine Team | CORE-102–105 |
| CORE-106 | Appointments module — create, list, get, update, status management | Backend Engineer | CORE-201 |
| CORE-301 | CRM auto-profile creation, visit history, preferred staff/service detection | CRM Team | CORE-105, CORE-106 |

**Goal:** The Appointment Engine is the heart of the platform. It is built as an independent, reusable domain service.

---

## Wave 4 — AI Domain (After Wave 3 Review)

| ID | Task | Agent | Dependencies |
|----|------|-------|-------------|
| CORE-108 | Conversations module — create, messages, history, customer linking | Backend Engineer | CORE-105 |
| CORE-107 | Leads module — CRUD, status workflow, source tracking | Backend Engineer | CORE-101, CORE-105 |
| CORE-402–405 | Intent detection, tool calling, memory, conversation state machine | AI Engineer | CORE-401, CORE-108 |
| CORE-801–806 | Prompt Template Engine — templates, versioning, tone variants | Prompt Engineer | CORE-402–405, CORE-201 |
| CORE-901–906 | Conversation UX — multi-turn flows, slot-filling, escalation, suggested replies | Conversation Engineer | CORE-402–405, CORE-801 |

**Goal:** Now the AI has meaningful business logic to interact with.

---

## Wave 5 — External Integrations & Frontend (After Wave 4 Review)

| ID | Task | Agent | Dependencies |
|----|------|-------|-------------|
| — | Website Chat Widget | Integration Engineer | Wave 4 |
| — | WhatsApp Business API | Integration Engineer | Wave 4 |
| — | Instagram DM | Integration Engineer | Wave 4 |
| — | Facebook Messenger | Integration Engineer | Wave 4 |
| — | Owner Dashboard UI | Frontend Engineer | Wave 3+4 |
| — | Notification Engine | Backend Engineer | Wave 3 |
| — | Marketing Automation | Backend Engineer | Wave 5 |
| — | Voice AI | AI Engineer | Wave 4 |

**Goal:** Connect customers through their preferred channels.

---

## Future Waves (Post-V1)

| Wave | Focus | Key Deliverables |
|------|-------|-----------------|
| 6 | Intelligence & Analytics | Revenue analytics, churn prediction, AI business coach |
| 7 | Advanced AI | RAG knowledge base, smart upselling, sentiment, multi-agent |
| 8 | Voice AI | STT/TTS, telephony integration, call handling |
| 9 | Multi-Branch & Scale | White-label, billing, public API |
| 10 | Platform Ecosystem | POS integration, mobile app, marketplace |

---

## Review Gate Checklist

Before any merge into main:

- [ ] **Architecture Compliance** — Follows SDD, Domain Model, API Contract, ADRs
- [ ] **Security Review** — Auth, RBAC, tenant isolation, input validation
- [ ] **Multi-Tenant Review** — businessId scoping, no cross-tenant leaks
- [ ] **Performance Review** — No N+1 queries, appropriate indexes, cache strategy
- [ ] **QA Review** — Unit tests pass, integration tests pass, lint passes
- [ ] **Documentation Review** — Swagger updated, docs updated if affected
- [ ] **Chief AI Architect Approval** — Final sign-off

---

## Definition of Done

A task is complete only when **all** of the following are satisfied:

1. Code compiles without errors
2. Lint passes (no warnings)
3. Unit tests pass (80%+ coverage target)
4. Integration tests pass (where applicable)
5. Validation implemented on all inputs
6. Error handling implemented (no uncaught exceptions)
7. Logging implemented (structured JSON, appropriate level)
8. Swagger documentation updated
9. Architecture documentation updated if affected
10. Multi-tenant isolation verified (TenantGuard + Prisma scoping)
11. No duplicate code introduced
12. Reviewed and approved by Chief AI Architect
