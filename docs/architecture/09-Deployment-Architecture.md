# Deployment Architecture

> **Author:** DevOps Engineer
> **Version:** 1.0

---

## 1. Environment Overview

```
┌─────────────────────────────────────────────────────────┐
│                      Production                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Vercel   │  │ Railway  │  │ Neon     │  │ Upstash  │ │
│  │ Frontend │  │ Backend  │  │ Postgres │  │ Redis    │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │ Cloudflare│  │ Qdrant  │  │ MinIO   │               │
│  │ (CDN/DNS) │  │(Vector) │  │ (S3)    │               │
│  └──────────┘  └──────────┘  └──────────┘               │
├─────────────────────────────────────────────────────────┤
│                      Staging                             │
│  Same stack as production, separate instances            │
├─────────────────────────────────────────────────────────┤
│                      Development                         │
│  Local: Docker Compose (all services)                    │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Local Development

```yaml
# docker/docker-compose.yml
services:
  postgres:  # PostgreSQL 16 — primary database
  redis:     # Redis 7 — cache + queue
  qdrant:    # Vector database — RAG embeddings
  minio:     # S3-compatible storage — file uploads

  api:       # Optional: run API in Docker
```

Start:
```bash
docker compose -f docker/docker-compose.yml up -d
npm run dev             # API starts on :4000
cd apps/web && npm run dev  # Frontend on :3000
```

---

## 3. CI/CD Pipeline

```
                    ┌──────────────┐
                    │  Push to     │
                    │  develop/PR  │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  CI Pipeline │
                    │  (GitHub Actions)│
                    │              │
                    │  ├ lint      │
                    │  ├ typecheck │
                    │  ├ test      │
                    │  └ build     │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────▼─────┐ ┌───▼────┐ ┌───▼──────┐
        │ Push to   │ │ Deploy │ │ Deploy   │
        │ main      │ │ Staging│ │ Preview  │
        └─────┬─────┘ └────────┘ │ (PR)     │
              │                  └──────────┘
        ┌─────▼─────┐
        │ Deploy    │
        │ Production│
        │ (tagged)  │
        └───────────┘
```

### Workflow: `.github/workflows/ci.yml`

```yaml
name: CI
on:
  push: { branches: [main, develop] }
  pull_request: { branches: [main] }

jobs:
  quality:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env: { POSTGRES_PASSWORD: postgres, POSTGRES_DB: ai_saloon_os_test }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4 with: { node-version: '22' }
      - run: npm ci
      - run: npx prisma generate
      - run: npm run lint
      - run: npm test

  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    needs: [quality]
    runs-on: ubuntu-latest
    steps:
      - run: # Deploy to Railway

  deploy-production:
    if: startsWith(github.ref, 'refs/tags/v')
    needs: [quality]
    runs-on: ubuntu-latest
    steps:
      - run: # Deploy to Railway
```

---

## 4. Production Infrastructure

### 4.1 Frontend (Vercel)

```text
Domain: app.salondomain.com
Framework: Next.js 15
Environment variables managed via Vercel dashboard
Automatic HTTPS, CDN, and edge caching
Preview deployments for every PR
```

### 4.2 Backend (Railway)

```text
Service: NestJS API (Dockerized)
Instances: 2 (minimum)
Scaling: Auto-scale based on CPU/memory
Health check: /api/v1/health
Port: 4000
```

### 4.3 Database (Neon — Serverless PostgreSQL)

```text
Compute: Auto-scaling (0.25 – 4 vCPU)
Storage: 10GB base, auto-scales
Backups: Point-in-time recovery (7 days)
Connection pooling: Built-in PgBouncer
```

### 4.4 Redis (Upstash)

```text
Tier: Serverless
Max connections: 1000
Data persistence: Periodic snapshots
Use cases: Caching, BullMQ queues, rate limiting
```

### 4.5 Vector DB (Qdrant Cloud)

```text
Cluster: 1 node (development), 3 nodes (production)
Storage: SSD-backed
Indexing: HNSW for approximate nearest neighbor
```

---

## 5. Docker Images

```dockerfile
# docker/Dockerfile.api — Multi-stage build
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build --workspace=apps/api
RUN npx prisma generate

FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
EXPOSE 4000
CMD ["node", "apps/api/dist/main"]
```

---

## 6. Monitoring

### 6.1 Health Check Endpoint

```typescript
@Public()
@Get('health')
async health() {
  const dbHealthy = await this.prisma.$queryRaw`SELECT 1`;
  const redisHealthy = await this.redis.ping();
  return {
    status: dbHealthy && redisHealthy ? 'healthy' : 'degraded',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    checks: {
      database: dbHealthy ? 'ok' : 'fail',
      redis: redisHealthy === 'PONG' ? 'ok' : 'fail',
    },
  };
}
```

### 6.2 Alerting

| Alert | Threshold | Channel |
|-------|-----------|---------|
| API 5xx errors | > 1% of requests | Slack + Email |
| P95 latency | > 3 seconds | Slack |
| Queue backlog | > 1000 jobs | Slack |
| Database CPU | > 80% for 5 min | PagerDuty |
| Disk space | < 20% remaining | PagerDuty |
| AI provider failure | > 10 failures/min | Slack + Email |

---

## 7. Backup Strategy

| Data | Frequency | Retention | Storage |
|------|-----------|-----------|---------|
| PostgreSQL | Daily | 30 days | S3 |
| PostgreSQL WAL | Continuous | 7 days | S3 |
| Redis snapshots | Every 6 hours | 7 days | S3 |
| File uploads | Real-time | 90 days | S3 |
| Audit logs | Real-time | 1 year | S3 (immutable) |

---

## 8. Rollback Procedure

```bash
# Frontend rollback — Vercel instant rollback
vercel rollback --confirm

# Backend rollback — Railway redeploy previous version
railway up --detach --image=ai-saloon-api:vPrevious

# Database rollback — Point-in-time recovery
neon branches restore --source-branch main --timestamp "2026-06-28T12:00:00Z"
```

---

## 9. Secrets Management

- Environment variables stored in Railway/Vercel dashboard
- No secrets in `.env` files committed to repo (`.env.example` only)
- Production secrets rotated quarterly
- Database credentials rotated on employee offboarding
