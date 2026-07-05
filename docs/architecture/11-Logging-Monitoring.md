# Logging & Monitoring Strategy

> **Author:** DevOps Engineer
> **Version:** 1.0

---

## 1. Logging Architecture

```
┌──────────────────┐     ┌──────────────┐     ┌──────────────┐
│  Application     │────▶│  stdout      │────▶│  Log          │
│  (structured     │     │  (JSON)      │     │  Aggregator   │
│   JSON logs)    │     └──────────────┘     │  (CloudWatch/  │
└──────────────────┘                         │   Loki)       │
                                             └──────┬───────┘
                                                    │
                                             ┌──────▼───────┐
                                             │  Query +      │
                                             │  Alert        │
                                             │  (Grafana)    │
                                             └──────────────┘
```

---

## 2. Log Format

All logs are structured JSON written to stdout:

```json
{
  "timestamp": "2026-06-28T12:00:00.000Z",
  "level": "info",
  "context": "AppointmentService",
  "message": "Appointment created",
  "data": {
    "appointmentId": "apt_123",
    "businessId": "biz_456",
    "customerId": "cus_789",
    "employeeId": "emp_001",
    "serviceId": "svc_haircut",
    "startTime": "2026-07-01T11:00:00Z"
  },
  "requestId": "req_abc123",
  "userId": "usr_456",
  "duration": 45,
  "error": null
}
```

---

## 3. Log Levels

| Level | When | Example |
|-------|------|---------|
| `error` | Application failures, unhandled exceptions | DB connection lost, AI provider timeout |
| `warn` | Unexpected but handled | Rate limit approaching, slow query (>500ms) |
| `info` | Normal operations | Appointment created, user logged in |
| `debug` | Detailed troubleshooting | SQL queries, AI prompt/response pairs |
| `verbose` | Everything (never in production) | Raw request/response bodies |

---

## 4. What to Log

### 4.1 Always Log

- All API requests (method, path, status, duration, userId)
- All database mutations (create, update, delete)
- All AI interactions (message, intent detected, response, latency)
- Authentication events (login, logout, refresh, failure)
- Business-critical events (appointment booked, cancelled, rescheduled)
- Errors and exceptions with stack traces

### 4.2 Never Log

- Passwords or password hashes
- JWT tokens or refresh tokens
- API keys or secrets
- Full credit card numbers
- Complete PII (partial masking: "Raj...@gmail.com")

---

## 5. Logging Implementation

```typescript
// Logger Service — wraps NestJS Logger with structured output
@Injectable()
class StructuredLogger {
  private logger = new Logger();

  log(level: string, message: string, context?: string, data?: any) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: context || 'Application',
      data: this.sanitize(data),
      requestId: this.getRequestId(),
      userId: this.getUserId(),
    };
    console.log(JSON.stringify(entry));
  }

  private sanitize(data: any): any {
    if (!data) return data;
    const sanitized = { ...data };
    delete sanitized.password;
    delete sanitized.passwordHash;
    delete sanitized.refreshToken;
    delete sanitized.secret;
    // Mask PII
    if (sanitized.phone) sanitized.phone = sanitized.phone.slice(0, 5) + '******';
    if (sanitized.email) sanitized.email = sanitized.email.replace(/(?<=.{3}).*(?=@)/, '***');
    return sanitized;
  }
}
```

---

## 6. Request Tracing

Every request gets a unique `requestId` (UUID) that propagates through all logs:

```typescript
// Middleware: assign requestId to every request
app.use((req, res, next) => {
  req.requestId = uuidv4();
  res.setHeader('X-Request-Id', req.requestId);
  next();
});

// Interceptor: log request + response with timing
@Injectable()
class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        this.logger.log('info', 'Request completed', 'HTTP', {
          method: request.method,
          path: request.path,
          statusCode: context.switchToHttp().getResponse().statusCode,
          duration,
          requestId: request.requestId,
        });
      }),
    );
  }
}
```

---

## 7. Monitoring Metrics

### 7.1 API Metrics (Prometheus)

| Metric | Type | Labels |
|--------|------|--------|
| `http_requests_total` | Counter | method, path, status |
| `http_request_duration_ms` | Histogram | method, path |
| `appointments_created_total` | Counter | business_id, source |
| `ai_response_duration_ms` | Histogram | provider, intent |
| `queue_jobs_total` | Counter | queue_name, status |
| `active_users` | Gauge | business_id |

### 7.2 Business Metrics

| Metric | Source | Frequency |
|--------|--------|-----------|
| Daily appointments | Appointment table | Hourly |
| Revenue (daily) | Appointment (completed) | Hourly |
| New customers | Customer table | Daily |
| Lead conversion rate | Lead table | Daily |
| AI booking rate | Conversation → IntentLog | Daily |
| Customer retention | Appointment table | Weekly |

---

## 8. Dashboards (Grafana)

### 8.1 Operations Dashboard
- Request rate, latency P50/P95/P99, error rate
- Queue depth, processing rate, failure rate
- Database connections, query duration, cache hit rate
- AI provider latency, error rate

### 8.2 Business Dashboard
- Appointments by status (today, this week, this month)
- Revenue trend (daily, weekly, monthly)
- New customers vs returning customers
- Top 5 services by bookings
- Lead pipeline (new → contacted → qualified → converted)

---

## 9. Alerting Rules

| Condition | Severity | Action |
|-----------|----------|--------|
| Error rate > 5% for 5 minutes | Critical | Slack + PagerDuty |
| P95 latency > 3s for 5 minutes | Critical | Slack + PagerDuty |
| AI failure rate > 10% | Warning | Slack |
| Queue backlog > 1000 | Warning | Slack |
| Database CPU > 80% | Warning | Slack |
| Cache hit rate < 70% | Info | Slack |
| Disk < 20% | Critical | Slack + PagerDuty |
| Certificate expiry < 7 days | Warning | Slack + Email |

---

## 10. Audit Logging

Separation of concerns:
- **Application logs** (stdout) — operational, live debugging
- **Audit logs** (AuditLog table) — compliance, forensics, immutable

Audit logs record who did what, when, and from where. They are never deleted and stored in an append-only manner.
