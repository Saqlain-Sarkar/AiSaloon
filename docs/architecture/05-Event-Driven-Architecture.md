# Event-Driven Architecture & Queue Flow

> **Author:** Chief AI Architect
> **Version:** 1.0

---

## 1. Overview

The system uses a hybrid approach: **synchronous REST for immediate operations** + **async messaging via BullMQ for background processing**.

Operations that must complete before the response is sent (booking, validation) are synchronous. Operations that can happen after the response (notifications, analytics, follow-ups) are queued.

---

## 2. Queue Architecture

```
┌──────────┐    ┌──────────┐    ┌──────────┐
│ Producer │───▶│  Redis   │───▶│ Consumer │
│ (Service)│    │ (BullMQ) │    │ (Worker) │
└──────────┘    └──────────┘    └──────────┘
```

### Queue Definitions

| Queue Name | Jobs | Priority | Retries | Delay |
|-----------|-------|----------|---------|-------|
| `notifications` | Send WhatsApp/SMS/Email | High | 3 | 0 |
| `appointment-reminders` | 24h and 2h reminders | Medium | 3 | Scheduled |
| `follow-ups` | "We miss you" messages | Low | 2 | 7 days |
| `analytics` | Revenue/usage aggregation | Low | 1 | End of day |
| `campaigns` | Marketing campaign dispatch | Low | 2 | Scheduled |
| `ai-background` | Non-urgent AI processing | Low | 2 | 0 |

### Job Structure

```typescript
interface QueueJob<T> {
  id: string;
  type: string;
  data: T;
  metadata: {
    businessId: string;
    correlationId: string;
    timestamp: Date;
  };
}
```

---

## 3. Event Flow Examples

### 3.1 Appointment Booking (Sync + Async)

```
Request: POST /appointments
   │
   ▼ (Sync — immediate)
Appointment Service
├── validateSlot() → synchronous
├── create() → synchronous
├── Return: Appointment
   │
   ▼ (Async — after response)
BullMQ: appointments queue
├── Job: sendConfirmation (WhatsApp/SMS)
├── Job: scheduleReminder (24h before)
├── Job: updateCrmMetrics (totalVisits++)
└── Job: createAuditLog
```

### 3.2 Customer Message (Sync + Async)

```
Request: POST /conversations/message
   │
   ▼ (Sync)
Conversation Service
├── storeMessage() → synchronous
├── AI Engine → process (may call tools sync)
├── storeResponse() → synchronous
├── Return: { response, intent, action }
   │
   ▼ (Async)
BullMQ
├── If intent=BOOK → queue: createAppointment
├── If intent=QUESTION → queue: logFAQ
└── Always → queue: updateCrmProfile
```

### 3.3 Follow-up Sequence

```
Cron Trigger (daily at 10am)
   │
   ▼
BullMQ: follow-ups queue
├── Query: customers with no visit in 30 days
├── For each customer:
│   ├── Generate personalized message
│   ├── Queue: notification (WhatsApp)
│   └── Log: campaignActivity
```

---

## 4. BullMQ Configuration

```typescript
// Queue connection
const connection = new RedisConnection({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
  maxRetriesPerRequest: null,
});

// Queue definition
const appointmentQueue = new Queue('appointments', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

// Worker
const worker = new Worker(
  'appointments',
  async (job) => {
    switch (job.name) {
      case 'send-confirmation':
        await notificationService.send(job.data);
        break;
      case 'schedule-reminder':
        await reminderService.schedule(job.data);
        break;
    }
  },
  { connection, concurrency: 10 },
);
```

---

## 5. Event Payloads

```typescript
// Appointment Confirmation
{
  "event": "appointment.created",
  "businessId": "biz_123",
  "appointmentId": "apt_456",
  "customerId": "cus_789",
  "customerPhone": "+919876543210",
  "serviceName": "Haircut",
  "employeeName": "Ahmed",
  "startTime": "2026-07-01T11:00:00Z",
  "channel": "whatsapp"
}

// Appointment Reminder
{
  "event": "appointment.reminder",
  "businessId": "biz_123",
  "appointmentId": "apt_456",
  "customerName": "Rahul",
  "startTime": "2026-07-01T11:00:00Z",
  "minutesUntil": 120
}
```

---

## 6. Failure Handling

| Failure | Strategy |
|---------|----------|
| Transient (network, timeout) | Retry with exponential backoff (max 3) |
| Permanent (invalid data) | Move to dead-letter queue, alert admin |
| Downstream service down | Circuit breaker, store event for replay |
| Queue backlog | Scale workers, prioritize by queue priority |

---

## 7. Implementation Order

1. Configure BullMQ + Redis connection
2. Create `QueueService` abstraction (enqueue/dequeue/retry)
3. Implement `NotificationQueue` (highest priority)
4. Implement `ReminderQueue` (scheduled jobs)
5. Add queue calls to Appointment service (async side effects)
6. Add queue calls to Conversation service (CRM updates)

---

## 8. When NOT to use a Queue

- **Availability checks** — customer needs immediate answer
- **Appointment booking** — must confirm before responding
- **User authentication** — must be instant
- **Dashboard queries** — synchronous read from database

Only defer work that does not affect the immediate response to the user.
