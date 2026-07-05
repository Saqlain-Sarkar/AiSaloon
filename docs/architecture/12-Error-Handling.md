# Error Handling & Exception Strategy

> **Author:** Chief AI Architect
> **Version:** 1.0

---

## 1. Philosophy

Every error in the system falls into one of these categories:

1. **Validation errors** — client sent bad data (4xx)
2. **Authorization errors** — client lacks permission (401/403)
3. **Business rule violations** — operation violates domain rules (409/422)
4. **System errors** — something broke (500)
5. **External dependency failures** — AI provider, database, queue (502/503)

Each category has a distinct handling strategy.

---

## 2. Exception Hierarchy

```
HttpException (NestJS built-in)
├── BadRequestException          (400) — Validation errors
├── UnauthorizedException        (401) — Missing/invalid JWT
├── ForbiddenException           (403) — Insufficient role, cross-tenant
├── NotFoundException            (404) — Resource not found
├── ConflictException            (409) — Duplicate, double booking
├── UnprocessableEntityException (422) — Business rule violation
├── TooManyRequestsException     (429) — Rate limit
└── GatewayTimeoutException      (504) — AI provider timeout

Domain Exceptions (custom)
├── SlotNotAvailableException    (409) — Requested time is booked
├── OutsideWorkingHoursException (422) — Outside business hours
├── HolidayException             (422) — Business is closed
├── EmployeeUnavailableException (409) — Staff not available
├── CustomerNotFoundException    (404) — Customer not found
├── AppointmentConflictException (409) — Overlapping appointment
└── AiProviderException          (502) — AI service failed
```

---

## 3. Global Exception Filter

```typescript
@Catch()
class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as any).message || exception.message;
      code = this.getErrorCode(status, message);
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      status = HttpStatus.CONFLICT;
      message = this.handlePrismaError(exception);
      code = 'DATABASE_ERROR';
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled: ${exception.message}`, exception.stack);
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      code,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private handlePrismaError(error: Prisma.PrismaClientKnownRequestError): string {
    switch (error.code) {
      case 'P2002': return 'A record with this value already exists';
      case 'P2025': return 'Record not found';
      case 'P2003': return 'Referenced record does not exist';
      default: return 'Database operation failed';
    }
  }

  private getErrorCode(status: number, message: string): string {
    const codes: Record<number, string> = {
      400: 'VALIDATION_ERROR',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'RATE_LIMIT_EXCEEDED',
      502: 'EXTERNAL_SERVICE_ERROR',
      504: 'GATEWAY_TIMEOUT',
    };
    return codes[status] || 'INTERNAL_ERROR';
  }
}
```

---

## 4. Domain Exception Examples

```typescript
// Business rule: slot not available
class SlotNotAvailableException extends ConflictException {
  constructor(slotTime: string) {
    super({
      message: `The requested time slot ${slotTime} is not available`,
      code: 'SLOT_NOT_AVAILABLE',
      suggestedSlots: [], // Populated by caller
    });
  }
}

// Business rule: outside working hours
class OutsideWorkingHoursException extends UnprocessableEntityException {
  constructor(requestedTime: string, workingHours: string) {
    super({
      message: `Requested time ${requestedTime} is outside working hours (${workingHours})`,
      code: 'OUTSIDE_WORKING_HOURS',
      workingHours,
    });
  }
}

// External: AI provider failure
class AiProviderException extends HttpException {
  constructor(provider: string, error: string) {
    super({
      message: `AI service (${provider}) is temporarily unavailable`,
      code: 'AI_PROVIDER_ERROR',
      provider,
      error,
      fallback: 'Using cached response', // Info for the caller
    }, HttpStatus.BAD_GATEWAY);
  }
}
```

---

## 5. Service Layer Error Handling

```typescript
@Injectable()
class AppointmentService {
  async create(dto: CreateAppointmentDto): Promise<Appointment> {
    // 1. Validate input (handled by ValidationPipe)

    // 2. Check business rules
    const slotValid = await this.appointmentEngine.validateSlot(/* ... */);
    if (!slotValid.available) {
      throw new SlotNotAvailableException(dto.startTime);
    }

    // 3. Execute operation
    try {
      return await this.prisma.appointment.create({ data: /* ... */ });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppointmentConflictException(dto.startTime);
      }
      throw error;
    }

    // 4. Queue side effects (fire and forget)
    this.queueService.add('send-confirmation', { appointmentId: appointment.id })
      .catch((err) => this.logger.error('Failed to queue confirmation', err));
  }
}
```

---

## 6. Controller Error Handling

Controllers should not have try/catch blocks. Let the global filter handle exceptions:

```typescript
// ✅ Clean — no error handling in controller
@Post()
@ApiOperation({ summary: 'Create appointment' })
async create(@Body() dto: CreateAppointmentDto, @CurrentUser() user: JwtPayload) {
  return this.appointmentService.create(user.businessId, dto);
}

// ❌ Wrong — don't catch in controller
@Post()
async create(@Body() dto: CreateAppointmentDto) {
  try {
    return await this.service.create(dto);
  } catch (error) {
    // Don't do this — let the global filter handle it
  }
}
```

---

## 7. AI Provider Error Handling

```typescript
async callAiProvider(messages: any[]): Promise<string> {
  try {
    return await this.openai.chat(messages);
  } catch (error) {
    // Log the failure
    this.logger.error('OpenAI failed', error);

    // Attempt fallback
    if (this.config.get('GEMINI_API_KEY')) {
      try {
        return await this.gemini.chat(messages);
      } catch (fallbackError) {
        throw new AiProviderException('OpenAI+Gemini', fallbackError.message);
      }
    }

    // No fallback available
    throw new AiProviderException('OpenAI', error.message);
  }
}
```

---

## 8. Error Response Examples

```json
// 400 — Validation
{
  "success": false,
  "statusCode": 400,
  "message": ["name must be a string", "duration must be a number"],
  "code": "VALIDATION_ERROR",
  "path": "/api/v1/services",
  "timestamp": "2026-06-28T12:00:00.000Z"
}

// 409 — Business Rule
{
  "success": false,
  "statusCode": 409,
  "message": "The requested time slot 2026-07-01T17:00:00Z is not available",
  "code": "SLOT_NOT_AVAILABLE",
  "path": "/api/v1/appointments",
  "timestamp": "2026-06-28T12:00:00.000Z"
}

// 502 — External Service
{
  "success": false,
  "statusCode": 502,
  "message": "AI service (OpenAI) is temporarily unavailable",
  "code": "AI_PROVIDER_ERROR",
  "path": "/api/v1/conversations/message",
  "timestamp": "2026-06-28T12:00:00.000Z"
}

// 500 — Unhandled
{
  "success": false,
  "statusCode": 500,
  "message": "Internal server error",
  "code": "INTERNAL_ERROR",
  "path": "/api/v1/customers",
  "timestamp": "2026-06-28T12:00:00.000Z"
}
```
