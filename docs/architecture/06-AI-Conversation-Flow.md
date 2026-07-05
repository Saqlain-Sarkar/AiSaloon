# AI Conversation & Tool-Calling Flow

> **Author:** AI Engineer
> **Version:** 1.0

---

## 1. Architecture Principle

**The AI layer contains zero business logic.**

The AI is an orchestrator. It understands what the user wants, calls backend tools, and formats the response. It never implements business rules, validates constraints, or manages state.

```
                     ┌──────────────────┐
                     │  Customer Message │
                     └────────┬─────────┘
                              │
                     ┌────────▼─────────┐
                     │ Conversation      │
                     │ Service           │
                     │ (stores message)  │
                     └────────┬─────────┘
                              │
                     ┌────────▼─────────┐
                     │   AiService      │ ← Abstract, provider-agnostic
                     │   (Port/Adapter) │
                     └────────┬─────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
     ┌────────▼─────┐ ┌──────▼──────┐ ┌──────▼──────┐
     │  Intent       │ │   Tool      │ │  Memory     │
     │  Detector     │ │   Executor  │ │  Manager    │
     └───────────────┘ └──────┬──────┘ └─────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
     ┌────────▼─────┐ ┌──────▼──────┐ ┌──────▼──────┐
     │ Appointment  │ │  Customer   │ │  Business   │
     │ Tool         │ │  Tool       │ │  Tool       │
     └──────────────┘ └─────────────┘ └─────────────┘
```

---

## 2. Provider-Agnostic AI Service

```typescript
// Port — defined in domain layer
interface AiProvider {
  detectIntent(context: ConversationContext): Promise<IntentResult>;
  generateResponse(context: ConversationContext, toolResults: ToolResult[]): Promise<string>;
  streamResponse?(context: ConversationContext): AsyncIterable<string>;
}

// Adapters — implementation details
class OpenAIProvider implements AiProvider { ... }
class GeminiProvider implements AiProvider { ... }
class MockProvider implements AiProvider { ... }

// AiService — injects the active provider via config
class AiService {
  constructor(private provider: AiProvider) {}

  async processMessage(input: ProcessInput): Promise<ProcessOutput> {
    // 1. Detect intent
    const intent = await this.provider.detectIntent(input);

    // 2. Execute tools based on intent
    const toolResults = await this.toolRegistry.execute(intent, input);

    // 3. Generate response
    const response = await this.provider.generateResponse(input, toolResults);

    return { intent, toolResults, response };
  }
}
```

---

## 3. Intent Detection

```typescript
interface IntentResult {
  intent: IntentType;
  confidence: number;
  entities: ExtractedEntity[];
  slotFilling: Record<string, any>;
}

type IntentType =
  | 'GREETING'
  | 'BOOK_APPOINTMENT'
  | 'CHECK_AVAILABILITY'
  | 'RESCHEDULE'
  | 'CANCEL'
  | 'PRICE_INQUIRY'
  | 'SERVICE_INFO'
  | 'BUSINESS_HOURS'
  | 'LOCATION'
  | 'STAFF_INFO'
  | 'OFFER_INQUIRY'
  | 'MEMBERSHIP_INQUIRY'
  | 'COMPLAINT'
  | 'FAREWELL'
  | 'UNKNOWN';

interface ExtractedEntity {
  type: 'SERVICE' | 'DATE' | 'TIME' | 'EMPLOYEE' | 'PRICE' | 'PHONE' | 'NAME';
  value: string;
  normalized?: any; // e.g., Date object for dates
}
```

### Intent Resolution Strategy

1. LLM detects intent from message + conversation history
2. If confidence < 0.6, use slot-filling from conversation context
3. If still ambiguous, ask clarifying question
4. If no match after 3 attempts, escalate to human

---

## 4. Tool Registry & Execution

```typescript
interface Tool {
  id: string;
  name: string;
  description: string; // For LLM to select
  requires: IntentType[];
  parameters: ToolParameter[];
  execute(params: Record<string, any>): Promise<ToolResult>;
}

interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array';
  required: boolean;
  description: string;
}

interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

// Built-in tools
const tools: Tool[] = [
  {
    id: 'check-availability',
    name: 'Check Available Slots',
    description: 'Check what time slots are available for a service on a given date',
    requires: ['CHECK_AVAILABILITY', 'BOOK_APPOINTMENT'],
    parameters: [
      { name: 'businessId', type: 'string', required: true, description: 'Business ID' },
      { name: 'branchId', type: 'string', required: true, description: 'Branch ID' },
      { name: 'date', type: 'date', required: true, description: 'Date to check' },
      { name: 'serviceId', type: 'string', required: false, description: 'Specific service' },
      { name: 'employeeId', type: 'string', required: false, description: 'Preferred staff' },
    ],
    execute: (params) => appointmentEngine.getAvailableSlots(params),
  },
  {
    id: 'book-appointment',
    name: 'Book Appointment',
    description: 'Create a new appointment booking',
    requires: ['BOOK_APPOINTMENT'],
    parameters: [
      { name: 'customerId', type: 'string', required: true, description: 'Customer' },
      { name: 'branchId', type: 'string', required: true, description: 'Branch' },
      { name: 'startTime', type: 'date', required: true, description: 'Appointment start' },
      { name: 'duration', type: 'number', required: true, description: 'Duration in minutes' },
      { name: 'serviceId', type: 'string', required: false },
      { name: 'employeeId', type: 'string', required: false },
    ],
    execute: (params) => appointmentService.create(params),
  },
  {
    id: 'lookup-customer',
    name: 'Find or Create Customer',
    description: 'Find customer by phone or create a new profile',
    requires: ['*'], // Available for all intents
    parameters: [
      { name: 'phone', type: 'string', required: false },
      { name: 'name', type: 'string', required: false },
      { name: 'businessId', type: 'string', required: true },
    ],
    execute: (params) => crmService.findOrCreate(params),
  },
  {
    id: 'get-business-info',
    name: 'Get Business Information',
    description: 'Get services, prices, hours, or location',
    requires: ['PRICE_INQUIRY', 'SERVICE_INFO', 'BUSINESS_HOURS', 'LOCATION'],
    parameters: [
      { name: 'businessId', type: 'string', required: true },
      { name: 'query', type: 'string', required: true, description: 'What info to retrieve' },
    ],
    execute: (params) => knowledgeBaseService.search(params),
  },
];
```

---

## 5. Conversation State Machine

```
                    ┌──────────┐
                    │  NEW     │
                    └────┬─────┘
                         │
                    ┌────▼─────┐
               ┌───▶│ ACTIVE   │◀───────────────────────────────┐
               │    └────┬─────┘                                │
               │         │                                      │
               │    ┌────▼──────────┐                           │
               │    │  INTENT       │                           │
               │    │  DETECTED     │── (low confidence) ───► ASK_CLARIFY ──┐
               │    └────┬──────────┘                           │            │
               │         │                                      │            │
               │    ┌────▼──────────┐                           │            │
               │    │  COLLECTING   │── (missing params) ──────► ASK_INFO   │
               │    │  INFORMATION  │◀──────────────────────────┘            │
               │    └────┬──────────┘                                        │
               │         │                                      ┌───────────┘
               │    ┌────▼──────────┐                           │
               │    │  CONFIRMING   │── (user confirms) ────────┤
               │    └────┬──────────┘                           │
               │         │                                      │
               │    ┌────▼──────────┐                           │
               │    │  EXECUTING    │── (tool call) ────────────┤
               │    └────┬──────────┘                           │
               │         │                                      │
               │    ┌────▼──────────┐                           │
               │    │  RESPONDING   │── (success) ──────────────┘
               │    └────┬──────────┘
               │         │
               │    ┌────▼─────┐
               └────│  ACTIVE  │  (continue conversation)
                    └────┬─────┘
                         │
                    ┌────▼─────┐
                    │  CLOSED  │  (conversation ended)
                    └──────────┘
```

### State Transitions

| From | To | Condition |
|------|----|-----------|
| NEW | ACTIVE | Customer sends first message |
| ACTIVE | INTENT_DETECTED | AI classifies intent with > 0.6 confidence |
| INTENT_DETECTED | COLLECTING_INFO | Intent requires parameters not yet extracted |
| COLLECTING_INFO | CONFIRMING | All required parameters collected |
| CONFIRMING | EXECUTING | Customer confirms (e.g., "Yes, book it") |
| EXECUTING | RESPONDING | Tool call completes (success or failure) |
| RESPONDING | ACTIVE | Customer sends follow-up message |
| RESPONDING | CLOSED | Customer says goodbye or 5 min timeout |
| Any | ESCALATED | AI cannot handle, hands off to human staff |

---

## 6. Prompt Template Architecture

```
ai/prompts/
├── system/
│   ├── receptionist.md         # Main system prompt
│   ├── appointment-booking.md  # Booking-specific instructions
│   └── escalation.md          # Handoff instructions
├── intents/
│   ├── greet.md
│   ├── book.md
│   ├── cancel.md
│   ├── reschedule.md
│   └── question.md
├── tools/
│   ├── availability.md
│   ├── booking.md
│   └── customer-lookup.md
└── tone/
    ├── friendly.md
    ├── professional.md
    └── concise.md
```

Each prompt is a Handlebars template that is hydrated with business context before sending to the AI:

```handlebars
You are an AI receptionist for "{{businessName}}".
Today is {{currentDate}}.
The salon is open {{workingHours}}.
Available services: {{servicesList}}.
Customer {{customerName}} has visited {{totalVisits}} times before.
```

---

## 7. Structured Response Contract

The AI MUST return responses in a structured format that the frontend can parse:

```typescript
interface AiResponse {
  message: string;            // Human-friendly response to customer
  intent: IntentType;         // Detected intent
  confidence: number;         // 0.0 – 1.0
  entities: ExtractedEntity[];
  action?: {                  // Action for frontend to execute
    type: 'BOOK' | 'CHECK' | 'CANCEL' | 'RESCHEDULE' | 'NONE';
    payload?: Record<string, any>;
  };
  requiresConfirmation: boolean; // Whether to wait for user confirmation
  suggestedReplies?: string[];   // Quick reply chips for the UI
}
```

Example response:

```json
{
  "message": "I found an available slot for a Haircut tomorrow at 5pm with Ahmed. Would you like me to book it?",
  "intent": "BOOK_APPOINTMENT",
  "confidence": 0.94,
  "entities": [
    { "type": "SERVICE", "value": "Haircut" },
    { "type": "DATE", "value": "tomorrow", "normalized": "2026-07-01" },
    { "type": "TIME", "value": "5pm", "normalized": "17:00" },
    { "type": "EMPLOYEE", "value": "Ahmed" }
  ],
  "action": {
    "type": "BOOK",
    "payload": {
      "serviceId": "svc_haircut",
      "employeeId": "emp_ahmed",
      "startTime": "2026-07-01T17:00:00Z"
    }
  },
  "requiresConfirmation": true,
  "suggestedReplies": ["Yes, book it!", "What about 4pm?", "Show me other stylists"]
}
```
