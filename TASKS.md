# AI SalonOS — Master Task Board

> **Owner:** Chief AI Architect
> **Last updated:** 2026-06-28
> **Current Phase:** Wave 1 — Core Foundation

---

## Legend

| Priority | Meaning |
|----------|---------|
| Critical | Blocks other tasks |
| High | Required for current wave |
| Medium | Important but not blocking |
| Low | Future, nice to have |

| Status | Meaning |
|--------|---------|
| 🔵 Todo | Not started |
| 🟣 In Progress | Being worked on |
| 🟡 Review | Awaiting Chief Architect review |
| 🟢 Done | Approved and merged |

---

## Wave 1 — Core Foundation

**Parallel execution.** These four tasks have minimal coupling and establish the foundation.

| ID | Task | Agent | Priority | Status | Dependencies |
|----|------|-------|----------|--------|--------------|
| DBA-001 | Finalize Prisma schema — all core models, relationships, indexes, composite constraints, RLS policies, migrations, seed data | Database Architect | Critical | 🟢 Done | None |
| CORE-101 | Business module — entity, DTOs, validation, service, controller, Swagger, unit tests | Backend Engineer | Critical | 🟢 Done | DBA-001 |
| CORE-401 | AI Provider Abstraction — `AiProvider` interface, provider factory, `Tool` interface, tool registry, conversation contracts. **No LLM integration** | AI Engineer | Critical | 🔵 Todo | None |
| SEC-101 | Auth foundation — JWT strategy, refresh token rotation, bcrypt hashing, RBAC guards, TenantGuard, audit hooks middleware | Security Engineer | Critical | 🔵 Todo | None |

**Wave 1 gate:** All four tasks must pass Architecture Compliance Review + Security Review + Chief AI Architect approval before Wave 2 begins.

---

## Wave 2 — Business Domain

| ID | Task | Agent | Priority | Status | Dependencies |
|----|------|-------|----------|--------|--------------|
| CORE-102 | Branches module — CRUD, working hours, holidays, branch isolation | Backend Engineer | Critical | 🔵 Todo | CORE-101 |
| CORE-103 | Employees module — CRUD, service assignments, availability schedules | Backend Engineer | Critical | 🔵 Todo | CORE-101, CORE-102 |
| CORE-104 | Services module — catalog, categories, pricing, duration, discounts | Backend Engineer | Critical | 🔵 Todo | DBA-001 |
| CORE-105 | Customers module — CRUD, search, lookup, profile enrichment | Backend Engineer | Critical | 🔵 Todo | CORE-101, CORE-102 |

---

## Wave 3 — Appointment Engine

| ID | Task | Agent | Priority | Status | Dependencies |
|----|------|-------|----------|--------|--------------|
| CORE-201 | Design appointment engine interface (SlotRequest, SlotResult, AvailabilityQuery) | Appointment Engine Team | Critical | 🔵 Todo | DBA-001 |
| CORE-202 | Implement working hours resolver (branch + day-of-week lookup) | Appointment Engine Team | Critical | 🔵 Todo | CORE-102 |
| CORE-203 | Implement holiday checker (single-date + recurring) | Appointment Engine Team | Critical | 🔵 Todo | CORE-102 |
| CORE-204 | Implement staff availability resolver (employee schedules + service assignment) | Appointment Engine Team | Critical | 🔵 Todo | CORE-103 |
| CORE-205 | Implement conflict detection + double-booking prevention | Appointment Engine Team | Critical | 🔵 Todo | CORE-201–204 |
| CORE-206 | Implement time slot generation (interval-based, respecting buffer times) | Appointment Engine Team | Critical | 🔵 Todo | CORE-201–205 |
| CORE-207 | Implement appointment lifecycle state machine (Pending → Confirmed → CheckedIn → InProgress → Completed / Cancelled / NoShow) | Appointment Engine Team | Critical | 🔵 Todo | CORE-106 |
| CORE-208 | Extract engine into standalone injectable service (no direct Prisma calls in controllers) | Appointment Engine Team | High | 🔵 Todo | CORE-201–207 |
| CORE-209 | Unit tests for all engine methods (mocked Prisma) | Appointment Engine Team | High | 🔵 Todo | CORE-201–208 |
| CORE-106 | Appointments module — create, list, get, update, reschedule, cancel, status | Backend Engineer | Critical | 🔵 Todo | CORE-201–209 |
| CORE-301 | Auto-create customer profile on first appointment | CRM Team | Critical | 🔵 Todo | CORE-105, CORE-106 |
| CORE-302 | Visit history tracking (appointment → customer profile) | CRM Team | High | 🔵 Todo | CORE-106 |
| CORE-303 | Preferred staff + service detection (auto-computed from history) | CRM Team | Medium | 🔵 Todo | CORE-302 |
| CORE-304 | Customer tags system (manual + auto tags) | CRM Team | Medium | 🔵 Todo | CORE-301 |
| CORE-305 | Lifetime value placeholder (totalSpent + totalVisits) | CRM Team | Medium | 🔵 Todo | CORE-302 |
| CORE-306 | Loyalty points placeholder (earn/spend stub) | CRM Team | Medium | 🔵 Todo | CORE-301 |
| CORE-307 | Customer insights endpoint (summary stats, trends, flags) | CRM Team | High | 🔵 Todo | CORE-301–306 |

---

## Wave 4 — AI Domain

| ID | Task | Agent | Priority | Status | Dependencies |
|----|------|-------|----------|--------|--------------|
| CORE-108 | Conversations module — create, messages, history, customer linking | Backend Engineer | Critical | 🔵 Todo | CORE-105 |
| CORE-107 | Leads module — CRUD, status workflow, source tracking | Backend Engineer | High | 🔵 Todo | CORE-101, CORE-105 |
| CORE-402 | Implement `Intent` interface + intent registry (detect, classify, route) | AI Engineer | Critical | 🔵 Todo | CORE-401 |
| CORE-403 | Implement `Tool` interface + tool registry (define, validate, execute tools) | AI Engineer | Critical | 🔵 Todo | CORE-401 |
| CORE-404 | Implement `ConversationMemory` interface (context management, slot filling) | AI Engineer | Critical | 🔵 Todo | CORE-401 |
| CORE-405 | Implement conversation state machine (Greeting → CollectingInfo → Confirming → Booked / Cancelled / Escalated) | AI Engineer | Critical | 🔵 Todo | CORE-402–404 |
| CORE-406 | Implement `AiService` abstraction (provider-agnostic, strategy pattern) | AI Engineer | Critical | 🔵 Todo | CORE-401–405 |
| CORE-407 | Create mock AI provider for testing (returns canned structured responses) | AI Engineer | High | 🔵 Todo | CORE-406 |
| CORE-408 | Create OpenAI provider adapter (implements AiProvider, no auto-call) | AI Engineer | Medium | 🔵 Todo | CORE-406 |
| CORE-409 | Create Gemini provider adapter (implements AiProvider, no auto-call) | AI Engineer | Medium | 🔵 Todo | CORE-406 |
| CORE-410 | Ensure AI has zero business logic — only intent + tool calling + response | AI Engineer | Critical | 🔵 Todo | CORE-401–409 |
| CORE-801 | Prompt template engine (Handlebars-based, hydrated with business context) | Prompt Engineer | High | 🔵 Todo | CORE-406, CORE-402–405, CORE-201 |
| CORE-802 | Intent-specific prompt fragments (booking, cancel, question, greet, farewell) | Prompt Engineer | High | 🔵 Todo | CORE-801 |
| CORE-803 | Tone variants (friendly, professional, concise) as swappable modules | Prompt Engineer | Medium | 🔵 Todo | CORE-801 |
| CORE-804 | Prompt versioning strategy (store templates in DB with version ID) | Prompt Engineer | Medium | 🔵 Todo | CORE-801 |
| CORE-805 | A/B test framework for prompt variants | Prompt Engineer | Low | 🔵 Todo | CORE-804 |
| CORE-901 | Conversation flow diagrams for each primary intent | Conversation Engineer | Critical | 🔵 Todo | CORE-404, CORE-405 |
| CORE-902 | Multi-turn state machine for booking flow | Conversation Engineer | Critical | 🔵 Todo | CORE-405 |
| CORE-903 | Escalation criteria and handoff protocol | Conversation Engineer | High | 🔵 Todo | CORE-901 |
| CORE-904 | Conversation timeout handling | Conversation Engineer | Medium | 🔵 Todo | CORE-108 |
| CORE-905 | Slot-filling conversation UX | Conversation Engineer | High | 🔵 Todo | CORE-901 |
| CORE-906 | Suggested-reply generator (3 quick-reply chips) | Conversation Engineer | Medium | 🔵 Todo | CORE-406 |

---

## Wave 5 — External Integrations & Frontend

*Not yet broken into individual tasks. Will be refined when Wave 4 is complete.*

| Area | Description |
|------|-------------|
| Website Chat | Embeddable chat widget |
| WhatsApp | WhatsApp Business API integration |
| Instagram | Instagram Messaging API |
| Facebook | Facebook Messenger Platform |
| Notifications | Multi-channel notification engine |
| Marketing Campaigns | Campaign manager, scheduling |
| Dashboard UI | Next.js, shadcn/ui, Recharts |
| Authentication UI | Login, register, settings |
| Appointment Calendar | Interactive view |
| Voice AI | STT/TTS, call handling |

---

## Future Waves (Post-V1)

| Wave | Focus | Status |
|------|-------|--------|
| 6 | Intelligence & Analytics | 🟡 Planned |
| 7 | Advanced AI (RAG, upselling, sentiment) | 🟡 Planned |
| 8 | Voice AI (telephony) | 🔵 Future |
| 9 | Multi-Branch & Scale | 🔵 Future |
| 10 | Platform Ecosystem | 🔵 Future |

---

## Expanded AI Team — Specialist Roles

### PE — Prompt Engineer

| ID | Task | Priority | Status | Dependencies |
|----|------|----------|--------|--------------|
| CORE-801 | Prompt template engine | High | 🔵 Todo | CORE-406, CORE-402–405, CORE-201 |
| CORE-802 | Intent-specific prompt fragments | High | 🔵 Todo | CORE-801 |
| CORE-803 | Tone variants (friendly, professional, concise) | Medium | 🔵 Todo | CORE-801 |
| CORE-804 | Prompt versioning strategy | Medium | 🔵 Todo | CORE-801 |
| CORE-805 | A/B test framework | Low | 🔵 Todo | CORE-804 |

### CE — Conversation Engineer

| ID | Task | Priority | Status | Dependencies |
|----|------|----------|--------|--------------|
| CORE-901 | Conversation flow diagrams | Critical | 🔵 Todo | CORE-404, CORE-405 |
| CORE-902 | Multi-turn state machine | Critical | 🔵 Todo | CORE-405 |
| CORE-903 | Escalation criteria + handoff | High | 🔵 Todo | CORE-901 |
| CORE-904 | Conversation timeout handling | Medium | 🔵 Todo | CORE-108 |
| CORE-905 | Slot-filling conversation UX | High | 🔵 Todo | CORE-901 |
| CORE-906 | Suggested-reply generator | Medium | 🔵 Todo | CORE-406 |

### RAGE — RAG Engineer

| ID | Task | Priority | Status | Dependencies |
|----|------|----------|--------|--------------|
| CORE-1001 | Qdrant connection + collection schema | Medium | 🔵 Todo | None |
| CORE-1002 | Embedding pipeline design | High | 🔵 Todo | CORE-1001 |
| CORE-1003 | Knowledge ingestion service | High | 🔵 Todo | CORE-1002 |
| CORE-1004 | Hybrid search (vector + keyword) | High | 🔵 Todo | CORE-1001 |
| CORE-1005 | KB maintenance scripts | Medium | 🔵 Todo | CORE-1003 |
| CORE-1006 | Retrieval quality evaluation | Medium | 🔵 Todo | CORE-1004 |

### AWE — AI Workflow Engineer

| ID | Task | Priority | Status | Dependencies |
|----|------|----------|--------|--------------|
| CORE-1101 | LangGraph workflow for complex booking | High | 🔵 Todo | CORE-401–410 |
| CORE-1102 | Conditional branching in AI workflow | High | 🔵 Todo | CORE-1101 |
| CORE-1103 | Parallel tool execution graph | Medium | 🔵 Todo | CORE-1101 |
| CORE-1104 | Workflow timeout + fallback orchestration | Medium | 🔵 Todo | CORE-1102 |
| CORE-1105 | Multi-agent orchestration | Low | 🔵 Todo | CORE-1101 |

### AEE — AI Evaluation Engineer

| ID | Task | Priority | Status | Dependencies |
|----|------|----------|--------|--------------|
| CORE-1201 | Labeled test dataset (100+ messages) | High | 🔵 Todo | CORE-402 |
| CORE-1202 | Intent detection accuracy pipeline | High | 🔵 Todo | CORE-1201 |
| CORE-1203 | Accuracy thresholds definition | High | 🔵 Todo | CORE-1202 |
| CORE-1204 | Regression test suite | Medium | 🔵 Todo | CORE-1202 |
| CORE-1205 | Confidence calibration system | Medium | 🔵 Todo | CORE-1203 |
| CORE-1206 | Human-in-the-loop evaluation | Low | 🔵 Todo | CORE-1205 |

### PERF — Performance Engineer

| ID | Task | Priority | Status | Dependencies |
|----|------|----------|--------|--------------|
| CORE-1301 | Audit DB queries for N+1 + missing indexes | High | 🔵 Todo | DBA-001–008 |
| CORE-1302 | Prisma query optimization | High | 🔵 Todo | CORE-1301 |
| CORE-1303 | Redis cache for frequently-read data | High | 🔵 Todo | CORE-101–108 |
| CORE-1304 | Load testing script (k6/artillery) | Medium | 🔵 Todo | None |
| CORE-1305 | Baseline performance tests + targets | Medium | 🔵 Todo | CORE-1304 |
| CORE-1306 | Database connection pooling (PgBouncer) | Low | 🔵 Todo | DBA-007 |

### INT — Integration Engineer

| ID | Task | Priority | Status | Dependencies |
|----|------|----------|--------|--------------|
| CORE-1401 | Webhook receiver service | High | 🔵 Todo | CORE-108 |
| CORE-1402 | Channel adapter interface | High | 🔵 Todo | CORE-1401 |
| CORE-1403 | Webhook signature verification | High | 🔵 Todo | CORE-1401 |
| CORE-1404 | Retry + idempotency layer | Medium | 🔵 Todo | CORE-1401 |
| CORE-1405 | Channel health monitoring | Medium | 🔵 Todo | CORE-1402 |
| CORE-1406 | Sandbox for testing integrations | Medium | 🔵 Todo | CORE-1401 |

---

## Review Gate Checklist

Every implementation must pass **all** of the following before merge:

### 1. Architecture Compliance Review
- [ ] Follows the System Design Document (SDD)
- [ ] Follows the Domain Model
- [ ] Follows the API Contract
- [ ] Follows the Multi-Tenant strategy
- [ ] Does not violate any ADR
- [ ] Does not introduce technical debt
- [ ] Generic enough to support non-salon businesses

### 2. Security Review
- [ ] Authentication verified (JWT, refresh)
- [ ] Authorization verified (RBAC, guards)
- [ ] Tenant isolation verified (TenantGuard + Prisma scoping)
- [ ] Input validation present (class-validator)
- [ ] No secrets exposed in code or logs

### 3. Multi-Tenant Review
- [ ] All queries scoped by `businessId`
- [ ] No cross-tenant data leak possible
- [ ] Super admin bypass works correctly

### 4. Performance Review
- [ ] No N+1 queries (verified)
- [ ] Appropriate database indexes exist
- [ ] Cache strategy applied (where applicable)
- [ ] No blocking operations in request path

### 5. QA Review
- [ ] Unit tests pass (80%+ coverage on new code)
- [ ] Integration tests pass (where applicable)
- [ ] Lint passes (no warnings)
- [ ] Manual smoke test passes

### 6. Documentation Review
- [ ] Swagger/OpenAPI updated
- [ ] Architecture docs updated if affected
- [ ] ADR updated if architectural decision changed

### 7. Chief AI Architect Approval
- [ ] Final sign-off

---

## Definition of Done

A task is **complete** only when **all** of the following are satisfied:

| # | Requirement | Description |
|---|-------------|-------------|
| 1 | Compiles | `nest build` succeeds with zero errors |
| 2 | Lint | `npm run lint` passes with zero warnings |
| 3 | Unit tests | Jest tests pass, 80%+ coverage on new code |
| 4 | Integration tests | Pass where applicable |
| 5 | Validation | `class-validator` on all DTOs, `whitelist: true`, `forbidNonWhitelisted: true` |
| 6 | Error handling | Domain-specific exceptions, global filter catches everything |
| 7 | Logging | Structured JSON logs at info/error levels |
| 8 | Swagger | `@ApiTags`, `@ApiOperation`, `@ApiBearerAuth` on every endpoint |
| 9 | Documentation | Architecture docs updated if affected |
| 10 | Multi-tenant | `businessId` scoped, TenantGuard applied |
| 11 | No duplication | No duplicate code, no copy-paste |
| 12 | Reviewed | Approved by Chief AI Architect |

---

## Workflow Rules

1. **Before coding:** Review existing modules, identify dependencies, produce implementation plan, submit to Chief AI Architect for approval.
2. **During coding:** Follow coding standards, write tests alongside code, no shortcuts.
3. **After coding:** Run tests, perform self-review, submit for full review gate.
4. **Review pass:** Architecture → Security → Multi-Tenant → Performance → QA → Docs → Chief Architect.
5. **If rejected:** Address all issues, re-submit. No partial approvals.
6. **No agent may merge their own work.** All merges through Chief AI Architect.

---

## Assignment Summary

| Agent | Total Tasks | Wave 1 | Wave 2 | Wave 3 | Wave 4 |
|-------|-------------|--------|--------|--------|--------|
| Database Architect | 8 | 1 | 0 | 0 | 0 |
| Backend Engineer | 8 | 1 | 4 | 1 | 1 |
| Appointment Engine Team | 9 | 0 | 0 | 9 | 0 |
| CRM Team | 7 | 0 | 0 | 7 | 0 |
| AI Engineer | 10 | 1 | 0 | 0 | 9 |
| Security Engineer | 7 | 1 | 0 | 0 | 0 |
| Prompt Engineer | 5 | 0 | 0 | 0 | 5 |
| Conversation Engineer | 6 | 0 | 0 | 0 | 6 |
| RAG Engineer | 6 | 0 | 0 | 0 | 0 |
| AI Workflow Engineer | 5 | 0 | 0 | 0 | 0 |
| AI Evaluation Engineer | 6 | 0 | 0 | 0 | 0 |
| Performance Engineer | 6 | 0 | 0 | 0 | 0 |
| Integration Engineer | 6 | 0 | 0 | 0 | 0 |
| QA Engineer | 5 | 0 | 0 | 0 | 0 |
| Documentation Agent | 4 | 0 | 0 | 0 | 0 |
| **Total** | **92** | **4** | **4** | **17** | **21** |

---

## Blockers Log

| Date | Task ID | Blocker | Status |
|------|---------|---------|--------|
| — | — | — | — |
