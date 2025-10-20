---
created: 2025-10-15T02:35:31Z
last_updated: 2025-10-15T02:35:31Z
version: 1.0
author: Claude Code PM System
---

# System Patterns & Architecture

## Architectural Style

### Core Architecture: Layered API-First Architecture

```
┌─────────────────────────────────────────────┐
│          Client Applications                │
│  (SDKs, Dashboard, Mobile Apps)             │
└─────────────────────────────────────────────┘
                    ↓ HTTPS/REST
┌─────────────────────────────────────────────┐
│           API Gateway / Load Balancer        │
│          (Rate Limiting, Auth)               │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         Application Layer (Express)          │
│  ┌─────────────────────────────────────┐    │
│  │     Routes & Controllers            │    │
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │       Business Logic Services       │    │
│  │  • InvoiceService                   │    │
│  │  • AFIPIntegrationService           │    │
│  │  • AIService (future)               │    │
│  │  • ComplianceService (future)       │    │
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │       Data Access Layer             │    │
│  │  • Repositories                     │    │
│  │  • ORM (Prisma/TypeORM)             │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
         ↓                        ↓
┌──────────────────┐    ┌─────────────────────┐
│   PostgreSQL     │    │   Redis Cache       │
│   (Primary DB)   │    │   (Sessions, Rate)  │
└──────────────────┘    └─────────────────────┘
         ↓
┌─────────────────────────────────────────────┐
│       Background Job Queue (Bull)            │
│  • PDF Generation                            │
│  • Email Notifications                       │
│  • Webhook Delivery                          │
│  • AFIP Sync                                 │
└─────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────┐
│        External Services                     │
│  • AFIP/ARCA SOAP API                        │
│  • OpenAI (AI features)                      │
│  • SendGrid (Email)                          │
│  • S3 (File Storage)                         │
└─────────────────────────────────────────────┘
```

## Design Patterns

### 1. Repository Pattern
**Purpose**: Abstract data access logic from business logic

```typescript
// Example structure
interface IInvoiceRepository {
  findById(id: string): Promise<Invoice | null>
  create(data: CreateInvoiceDto): Promise<Invoice>
  update(id: string, data: UpdateInvoiceDto): Promise<Invoice>
  delete(id: string): Promise<void>
  findByUser(userId: string): Promise<Invoice[]>
}

class InvoiceRepository implements IInvoiceRepository {
  // Implementation with ORM
}
```

**Benefits**:
- Testable (easy to mock)
- Swappable data sources
- Consistent data access patterns

### 2. Service Layer Pattern
**Purpose**: Encapsulate business logic

```typescript
class InvoiceService {
  constructor(
    private invoiceRepo: IInvoiceRepository,
    private afipService: AFIPService,
    private notificationService: NotificationService
  ) {}

  async createInvoice(data: CreateInvoiceDto): Promise<Invoice> {
    // 1. Validate data
    // 2. Create invoice record
    // 3. Submit to AFIP
    // 4. Update status
    // 5. Send notifications
    // 6. Return result
  }
}
```

**Benefits**:
- Business logic centralized
- Reusable across controllers
- Easier to test

### 3. Factory Pattern
**Purpose**: Create complex objects (e.g., different invoice types)

```typescript
class InvoiceFactory {
  static create(type: 'A' | 'B' | 'C', data: any): Invoice {
    switch(type) {
      case 'A': return new InvoiceTypeA(data)
      case 'B': return new InvoiceTypeB(data)
      case 'C': return new InvoiceTypeC(data)
    }
  }
}
```

### 4. Strategy Pattern
**Purpose**: Different AFIP integration strategies

```typescript
interface AFIPStrategy {
  authenticate(): Promise<AuthToken>
  submitInvoice(invoice: Invoice): Promise<AFIPResponse>
}

class TestingAFIPStrategy implements AFIPStrategy {
  // Testing environment logic
}

class ProductionAFIPStrategy implements AFIPStrategy {
  // Production environment logic
}
```

### 5. Observer Pattern (Event-Driven)
**Purpose**: Decouple invoice processing from side effects

```typescript
// Event emitter for invoice events
eventEmitter.on('invoice.created', async (invoice) => {
  await pdfService.generate(invoice)
  await emailService.sendConfirmation(invoice)
  await webhookService.notify(invoice)
})

eventEmitter.on('invoice.approved', async (invoice) => {
  await analyticsService.track(invoice)
})
```

**Benefits**:
- Loose coupling
- Easy to add new behaviors
- Async processing

### 6. Adapter Pattern
**Purpose**: Adapt SOAP AFIP API to modern REST interface

```typescript
class AFIPAdapter {
  private soapClient: SOAPClient

  async submitInvoice(invoice: Invoice): Promise<InvoiceResult> {
    // Convert REST data to SOAP XML
    const soapRequest = this.toSOAPRequest(invoice)

    // Call SOAP service
    const soapResponse = await this.soapClient.call(soapRequest)

    // Convert SOAP response back to JSON
    return this.fromSOAPResponse(soapResponse)
  }
}
```

### 7. Builder Pattern
**Purpose**: Complex invoice construction

```typescript
class InvoiceBuilder {
  private invoice: Partial<Invoice> = {}

  setType(type: string) {
    this.invoice.type = type
    return this
  }

  addItem(item: InvoiceItem) {
    this.invoice.items = [...(this.invoice.items || []), item]
    return this
  }

  build(): Invoice {
    // Validation and return
    return this.invoice as Invoice
  }
}

// Usage
const invoice = new InvoiceBuilder()
  .setType('B')
  .addItem({...})
  .addItem({...})
  .build()
```

### 8. Middleware Pattern (Express)
**Purpose**: Request processing pipeline

```typescript
// Authentication middleware
const authenticate = async (req, res, next) => {
  // Verify JWT/API key
}

// Rate limiting middleware
const rateLimit = async (req, res, next) => {
  // Check Redis for rate limit
}

// Validation middleware
const validate = (schema) => async (req, res, next) => {
  // Validate with Zod
}

// Usage
app.post('/invoices',
  authenticate,
  rateLimit,
  validate(createInvoiceSchema),
  createInvoice
)
```

## Data Flow Patterns

### 1. Request-Response Flow
```
Client Request
  ↓
API Gateway (rate limit, auth)
  ↓
Route Handler
  ↓
Validation Middleware
  ↓
Controller
  ↓
Service Layer (business logic)
  ↓
Repository (data access)
  ↓
Database
  ↓
Response back through layers
```

### 2. Async Job Flow (Invoice Processing)
```
API receives invoice creation
  ↓
Save to DB (status: pending)
  ↓
Queue background job
  ↓
Return 202 Accepted to client
  ↓
Background worker picks up job
  ↓
Submit to AFIP
  ↓
Update invoice status
  ↓
Trigger webhooks
  ↓
Send notifications
```

### 3. Event-Driven Flow
```
Action occurs (e.g., invoice created)
  ↓
Emit event to event bus
  ↓
Multiple listeners react:
  - PDF Generator
  - Email Service
  - Webhook Service
  - Analytics Service
  ↓
Each runs independently
```

## Caching Strategy

### Multi-Layer Caching
```
1. Application Cache (in-memory)
   - User sessions (5min TTL)
   - Configuration (10min TTL)

2. Redis Cache
   - User data (1hr TTL)
   - Invoice lists (5min TTL)
   - AFIP tokens (12hr TTL)

3. CDN Cache (CloudFlare)
   - Static assets (1 week)
   - Public documentation
```

### Cache Invalidation
- **Time-based**: TTL expiration
- **Event-based**: On updates/deletes
- **Manual**: Admin tools

## Error Handling Strategy

### Layered Error Handling
```typescript
// Custom error classes
class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public errorCode: string
  ) {}
}

class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`, 'NOT_FOUND')
  }
}

class AFIPError extends AppError {
  constructor(message: string, afipCode: string) {
    super(502, message, `AFIP_${afipCode}`)
  }
}

// Global error handler
app.use((err, req, res, next) => {
  logger.error(err)

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.errorCode,
      message: err.message
    })
  }

  // Unknown errors
  res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: 'Something went wrong'
  })
})
```

## Authentication & Authorization Pattern

### JWT-based Auth
```
1. User logs in → Verify credentials
2. Generate JWT token (7d expiry)
3. Return token to client
4. Client includes token in Authorization header
5. Middleware verifies token on each request
6. Extract user from token
7. Check permissions (RBAC)
8. Proceed if authorized
```

### API Key Auth (for SDKs)
```
1. User generates API key in dashboard
2. Store hashed key in DB
3. Client sends key in X-API-Key header
4. Middleware looks up key
5. Attach user context to request
6. Check rate limits
7. Proceed if valid
```

## Database Patterns

### Soft Delete
```typescript
// All models have deletedAt field
interface BaseModel {
  id: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

// Query excludes soft-deleted by default
repository.find({ where: { deletedAt: null } })
```

### Audit Trail
```typescript
interface AuditLog {
  id: string
  userId: string
  action: string
  resource: string
  resourceId: string
  changes: Record<string, any>
  createdAt: Date
}

// Automatically log changes
afterUpdate((entity) => {
  auditLog.create({
    action: 'UPDATE',
    resource: entity.constructor.name,
    changes: entity.getChanges()
  })
})
```

### Migrations
- Version-controlled schema changes
- Rollback capability
- Seed data for development

## API Versioning Strategy

### URL-based versioning
```
/v1/invoices      # Version 1
/v2/invoices      # Version 2 (breaking changes)
```

### Backward compatibility
- Deprecation warnings
- Support N-1 versions
- Migration guides

## Testing Patterns

### Test Pyramid
```
         /\
        /E2E\      (Few, critical paths)
       /------\
      /  API  \    (More, all endpoints)
     /--------\
    /   Unit   \   (Most, all business logic)
   /------------\
```

### Test Doubles
- **Mocks**: For external services (AFIP, email)
- **Stubs**: For repositories in service tests
- **Fakes**: In-memory DB for integration tests

## Security Patterns

### Input Validation
- Validate at API boundary (middleware)
- Schema-based validation (Zod)
- Sanitize all user input

### Rate Limiting
- Per IP: 100 req/min
- Per user: 1000 req/hour
- Per endpoint: Custom limits

### CORS Configuration
```typescript
cors({
  origin: process.env.ALLOWED_ORIGINS.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
})
```

## Monitoring & Observability

### Structured Logging
```typescript
logger.info('Invoice created', {
  invoiceId: invoice.id,
  userId: user.id,
  type: invoice.type,
  amount: invoice.total
})
```

### Metrics
- Request latency (histogram)
- Error rates (counter)
- Invoice creation rate (gauge)
- Queue depth (gauge)

### Tracing
- Request ID propagation
- Distributed tracing (OpenTelemetry)

## Deployment Patterns

### Blue-Green Deployment
- Two identical environments
- Switch traffic after validation
- Easy rollback

### Feature Flags
```typescript
if (featureFlags.isEnabled('ai-invoicing', user)) {
  return aiInvoiceService.create(data)
} else {
  return invoiceService.create(data)
}
```

### Rolling Updates
- Update instances gradually
- Health checks before routing traffic
- Automatic rollback on failures

## Notes

- Patterns chosen for **maintainability** and **scalability**
- Emphasis on **testability** at every layer
- **SOLID principles** followed throughout
- Prefer **composition** over inheritance
- **DRY** (Don't Repeat Yourself) but not at expense of clarity
- All patterns designed for **TypeScript** strengths
