# Caching Strategy (Redis)

> **Author:** Performance Engineer
> **Version:** 1.0

---

## 1. Cache Architecture

```
┌────────────┐
│  Client    │
└─────┬──────┘
      │
┌─────▼──────┐     ┌─────────────┐
│  API Server│────▶│  Redis       │
│  (NestJS)  │     │  (Cache)     │
└─────┬──────┘     └─────────────┘
      │
┌─────▼──────┐
│  PostgreSQL│
└────────────┘
```

**Pattern:** Cache-aside (lazy loading)

```
1. Read: Check cache → hit? return → miss? read DB → store in cache → return
2. Write: Write to DB → invalidate cache → return
3. TTL: Every cached entry has a time-to-live
```

---

## 2. Cache Layers

| Layer | Technology | Purpose | TTL |
|-------|-----------|---------|-----|
| L1 — Application | In-memory Map | Hot data, current request | Request-scoped |
| L2 — Distributed | Redis | Shared across instances | Variable |
| L3 — HTTP (CDN) | Cloudflare | Static assets, API responses | 5 min |

---

## 3. What to Cache

### 3.1 Cache (High Benefit, Low Volatility)

| Data | Key Pattern | TTL | Reason |
|------|-------------|-----|--------|
| Business settings | `biz:{id}:settings` | 1 hour | Rarely changes |
| Service catalog | `biz:{id}:services` | 1 hour | Changed manually |
| Employee list | `biz:{id}:employees` | 30 min | Changes infrequently |
| Working hours | `branch:{id}:hours` | 1 day | Static schedule |
| Branch info | `branch:{id}:info` | 1 hour | Rarely changes |

### 3.2 Don't Cache (High Volatility or per-Request)

| Data | Reason |
|------|--------|
| Available time slots | Changes with every booking |
| Customer profiles | High churn, PII concerns |
| Appointment detail | Per-request, real-time status |
| AI conversation responses | Context-dependent, non-reusable |
| Dashboard aggregates | Cached at query level via materialized views |

---

## 4. Implementation

```typescript
// Cache Service Abstraction
@Injectable()
class CacheService {
  constructor(@Inject('REDIS') private redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.redis.get(key);
    return raw ? JSON.parse(raw) : null;
  }

  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
  }

  async invalidate(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  async invalidateMany(keys: string[]): Promise<void> {
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

// Usage in Service
async getServices(businessId: string) {
  const cacheKey = `biz:${businessId}:services`;
  const cached = await this.cache.get(cacheKey);
  if (cached) return cached;

  const services = await this.prisma.service.findMany({ where: { businessId } });
  await this.cache.set(cacheKey, services, 3600);
  return services;
}

// Invalidation on mutation
async updateService(id: string, dto: any) {
  const service = await this.prisma.service.update({ where: { id }, data: dto });
  await this.cache.invalidate(`biz:${service.businessId}:services`);
  return service;
}
```

---

## 5. Cache Invalidation Strategy

| Event | Invalidation Pattern |
|-------|---------------------|
| Service created/updated/deleted | `biz:{businessId}:services` |
| Employee created/updated/deleted | `biz:{businessId}:employees` |
| Settings updated | `biz:{businessId}:settings` |
| Branch updated | `branch:{branchId}:info`, `branch:{branchId}:hours` |
| Any appointment change | No cache invalidation (slots not cached) |

---

## 6. Redis Memory Budget

| Environment | Memory | Max Keys | Eviction Policy |
|-------------|--------|----------|----------------|
| Development | 256 MB | 10,000 | `allkeys-lru` |
| Staging | 512 MB | 50,000 | `allkeys-lru` |
| Production | 2 GB | 500,000 | `allkeys-lru` |

---

## 7. Cache Monitoring

```typescript
// Track cache hit/miss rates
const cacheStats = {
  hits: 0,
  misses: 0,
  get hitRate() { return this.hits / (this.hits + this.misses); },
};
```

Alert when cache hit rate drops below 80% (indicates incorrect caching strategy).

---

## 8. What NOT to Cache

- **Authentication tokens** — JWT validation is already fast (no DB call)
- **Available slots** — Changes every time someone books; caching would show stale data
- **Customer PII** — Phone, email, address — sensitive data lives in DB only
- **AI responses** — Context-dependent, each customer gets personalized response
- **Real-time dashboard** — Should query DB or use materialized views
