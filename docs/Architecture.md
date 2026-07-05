# Architecture

## System Overview

```
                    ┌─────────────────────┐
                    │    Customers         │
                    │ (WhatsApp/IG/FB/Web) │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   AI Conversation    │
                    │       Engine         │
                    │  (OpenAI / Gemini)   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Business Logic      │
                    │     Layer (NestJS)   │
                    │                      │
                    │  ┌───┐ ┌──┐ ┌───┐   │
                    │  │CRM│ │Apt│ │Lead│   │
                    │  └───┘ └──┘ └───┘   │
                    │  ┌───┐ ┌──┐ ┌───┐   │
                    │  │Biz│ │Svc│ │Emp │   │
                    │  └───┘ └──┘ └───┘   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │     PostgreSQL       │
                    │     (via Prisma)     │
                    └─────────────────────┘
```

## Key Design Decisions

### Monorepo with npm workspaces
- Shared types, configs, and utilities across api/web/admin
- Single `npm install` for all packages

### Multi-tenant from day 1
- Every entity has `businessId`
- `TenantGuard` enforces isolation
- Super admin can cross tenants

### AI isolation
- AI engine is a standalone module with its own directory at root level
- AI agents, prompts, workflows, memory, RAG, and tools are separated from business logic
- The API layer only calls the AI engine through a clean interface

### Modular architecture
- Each domain (auth, business, appointments, crm) is a self-contained NestJS module
- Modules communicate through services, never directly

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS 11, TypeScript, Node 22 |
| Frontend | Next.js 15, React 19, Tailwind, shadcn/ui |
| Database | PostgreSQL 16, Prisma ORM |
| Cache | Redis 7 |
| Vector DB | Qdrant |
| AI | OpenAI GPT-4o, Google Gemini 2.0 Flash |
| Auth | JWT + Refresh Tokens + RBAC |
| Storage | S3-compatible (MinIO) |
| Queue | BullMQ (future) |
| Deployment | Docker, GitHub Actions |
