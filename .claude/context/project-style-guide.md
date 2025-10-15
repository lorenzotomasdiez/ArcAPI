---
created: 2025-10-15T02:35:31Z
last_updated: 2025-10-15T02:35:31Z
version: 1.0
author: Claude Code PM System
---

# Project Style Guide

## Code Style & Conventions

### General Principles

1. **Clarity over Cleverness**: Code should be self-documenting and easy to understand
2. **Consistency**: Follow established patterns throughout the codebase
3. **TypeScript First**: Leverage TypeScript's type system for safety and DX
4. **Functional Where Possible**: Prefer pure functions and immutability
5. **Test-Driven**: Write tests alongside code, not after

### Language Standards

**TypeScript/JavaScript**
- **Standard**: ES2022+
- **Module System**: ESM (import/export)
- **TypeScript**: Strict mode enabled
- **Target**: ES2020 (Node.js 18+)

**Style**
- **Line Length**: 100 characters max
- **Indentation**: 2 spaces (no tabs)
- **Quotes**: Single quotes for strings (except JSON)
- **Semicolons**: Required (enforced by ESLint)
- **Trailing Commas**: Always (aids git diffs)

## Naming Conventions

### Files & Directories

**Backend (Node.js/TypeScript)**
```
src/
├── api/
│   ├── routes/
│   │   ├── invoice-routes.ts       # Kebab-case for routes
│   │   ├── auth-routes.ts
│   │   └── webhook-routes.ts
│   ├── controllers/
│   │   ├── InvoiceController.ts    # PascalCase for classes
│   │   ├── AuthController.ts
│   │   └── WebhookController.ts
│   └── middleware/
│       ├── authenticate.ts         # camelCase for functions
│       ├── validateRequest.ts
│       └── rateLimit.ts
├── services/
│   ├── InvoiceService.ts           # PascalCase for classes
│   ├── AFIPService.ts
│   └── AIService.ts
├── models/
│   ├── Invoice.ts                  # PascalCase for models
│   ├── User.ts
│   └── PointOfSale.ts
├── utils/
│   ├── formatCurrency.ts           # camelCase for utilities
│   ├── parseAFIPResponse.ts
│   └── generateCAE.ts
├── types/
│   ├── invoice.types.ts            # Kebab-case for type files
│   ├── afip.types.ts
│   └── api.types.ts
└── config/
    ├── database.ts                 # Kebab-case for config
    ├── redis.ts
    └── afip.ts
```

**Frontend (React/Next.js)**
```
src/
├── components/
│   ├── Dashboard/                  # PascalCase for components
│   │   ├── index.tsx
│   │   ├── Dashboard.tsx
│   │   └── Dashboard.module.css
│   ├── InvoiceList/
│   │   ├── index.tsx
│   │   ├── InvoiceList.tsx
│   │   └── InvoiceRow.tsx
│   └── shared/
│       ├── Button/
│       └── Input/
├── pages/                          # Next.js routing
│   ├── index.tsx                   # Lowercase for routes
│   ├── invoices/
│   │   ├── index.tsx
│   │   └── [id].tsx
│   └── api/
│       └── auth/
│           └── [...nextauth].ts
├── hooks/
│   ├── useInvoices.ts              # camelCase with 'use' prefix
│   ├── useAuth.ts
│   └── useWebhooks.ts
├── services/
│   ├── apiClient.ts                # camelCase for services
│   └── analyticsService.ts
└── utils/
    ├── formatDate.ts               # camelCase for utilities
    └── validation.ts
```

**Tests**
```
tests/
├── unit/
│   ├── InvoiceService.test.ts      # Match source filename + .test.ts
│   ├── AFIPService.test.ts
│   └── formatCurrency.test.ts
├── integration/
│   ├── invoice-api.test.ts         # Kebab-case for integration tests
│   └── auth-flow.test.ts
└── e2e/
    ├── create-invoice.spec.ts      # Kebab-case + .spec.ts for E2E
    └── user-registration.spec.ts
```

### Code Naming

**Variables & Functions**
```typescript
// camelCase for variables and functions
const userId = '123'
const invoiceTotal = 1000

function calculateTax(amount: number): number {
  return amount * 0.21
}

const handleSubmit = async (data: InvoiceData) => {
  // ...
}
```

**Classes & Interfaces**
```typescript
// PascalCase for classes and interfaces
class InvoiceService {
  async create(data: CreateInvoiceDto): Promise<Invoice> {
    // ...
  }
}

interface Invoice {
  id: string
  type: InvoiceType
  total: number
}

// Prefix interfaces with 'I' only for abstract interfaces
interface IInvoiceRepository {
  findById(id: string): Promise<Invoice | null>
}

// DTOs (Data Transfer Objects) use 'Dto' suffix
interface CreateInvoiceDto {
  type: 'A' | 'B' | 'C'
  items: InvoiceItemDto[]
}
```

**Types & Enums**
```typescript
// PascalCase for types and enums
type InvoiceStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

enum InvoiceType {
  A = 'A',
  B = 'B',
  C = 'C',
  M = 'M'
}

// Use 'Type' suffix for complex types
type InvoiceFilterType = {
  status?: InvoiceStatus
  dateFrom?: Date
  dateTo?: Date
}
```

**Constants**
```typescript
// UPPER_SNAKE_CASE for true constants
const MAX_INVOICES_PER_PAGE = 50
const API_BASE_URL = 'https://api.arca.com'
const AFIP_TIMEOUT_MS = 5000

// camelCase for config objects
const afipConfig = {
  environment: 'production',
  timeout: 5000,
  retries: 3
}
```

**Boolean Variables**
```typescript
// Prefix with 'is', 'has', 'can', 'should'
const isAuthenticated = true
const hasPermission = false
const canEdit = user.role === 'admin'
const shouldRetry = errorCount < MAX_RETRIES
```

## Code Organization

### File Structure

**Single Responsibility**
- One class/interface per file (exceptions: closely related types)
- File name matches primary export
- Keep files under 300 lines (guideline, not strict rule)

**Import Order**
```typescript
// 1. External dependencies
import express from 'express'
import { z } from 'zod'

// 2. Internal modules (absolute imports)
import { InvoiceService } from '@/services/InvoiceService'
import { authenticateMiddleware } from '@/middleware/authenticate'

// 3. Types
import type { Invoice, InvoiceDto } from '@/types/invoice.types'

// 4. Relative imports (avoid if possible)
import { helper } from './utils'
```

**Export Style**
```typescript
// Prefer named exports
export class InvoiceService { }
export function calculateTax() { }

// Default export only for React components and Next.js pages
export default function InvoicePage() {
  return <div>Invoice Page</div>
}
```

### Function Structure

**Function Length**
- Aim for < 20 lines per function
- Extract complex logic into helper functions
- Use early returns to reduce nesting

**Example**
```typescript
// Good: Early returns, minimal nesting
async function createInvoice(data: CreateInvoiceDto): Promise<Invoice> {
  if (!data.items.length) {
    throw new ValidationError('Invoice must have at least one item')
  }

  const user = await userRepo.findById(data.userId)
  if (!user) {
    throw new NotFoundError('User')
  }

  const invoice = await invoiceRepo.create(data)
  await afipService.submit(invoice)

  return invoice
}

// Bad: Deep nesting
async function createInvoice(data: CreateInvoiceDto): Promise<Invoice> {
  if (data.items.length) {
    const user = await userRepo.findById(data.userId)
    if (user) {
      const invoice = await invoiceRepo.create(data)
      const result = await afipService.submit(invoice)
      if (result.success) {
        return invoice
      }
    }
  }
  throw new Error('Failed')
}
```

## TypeScript Patterns

### Type Annotations

**Always Annotate**
- Function parameters
- Function return types
- Public class properties
- Exported constants

**Can Omit**
- Variable declarations (if type is obvious)
- Private class properties (if initialized)
- Arrow functions (if context is clear)

```typescript
// Good
function calculateTotal(items: InvoiceItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0)
}

// Type is obvious, no annotation needed
const total = calculateTotal(items)

// Good
interface User {
  id: string
  email: string
  createdAt: Date
}

class UserService {
  // Return type annotated
  async findById(id: string): Promise<User | null> {
    return this.repo.findById(id)
  }
}
```

### Avoid `any`

```typescript
// Bad
function processData(data: any): any {
  return data.value
}

// Good
function processData<T extends { value: unknown }>(data: T): T['value'] {
  return data.value
}

// Or use 'unknown' and narrow
function processData(data: unknown): string {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return String(data.value)
  }
  throw new Error('Invalid data')
}
```

### Use Discriminated Unions

```typescript
// Good: Type-safe state handling
type InvoiceState =
  | { status: 'pending' }
  | { status: 'approved'; cae: string; approvedAt: Date }
  | { status: 'rejected'; reason: string }

function handleInvoice(invoice: InvoiceState) {
  switch (invoice.status) {
    case 'pending':
      return 'Processing...'
    case 'approved':
      return `CAE: ${invoice.cae}` // TypeScript knows 'cae' exists
    case 'rejected':
      return `Rejected: ${invoice.reason}` // TypeScript knows 'reason' exists
  }
}
```

## Documentation

### Code Comments

**When to Comment**
- Complex algorithms or business logic
- Workarounds for bugs or limitations
- Important edge cases
- Non-obvious decisions
- Regulatory requirements

**When NOT to Comment**
- Obvious code (don't repeat what code says)
- Outdated comments (delete or update)
- Commented-out code (use git history)

```typescript
// Bad: Obvious comment
// Get user by ID
const user = await userRepo.findById(id)

// Good: Explains WHY
// AFIP requires retries with exponential backoff due to rate limiting
const result = await retryWithBackoff(() => afipService.submit(invoice))

// Good: Regulatory context
// RG 4291: Invoice number must be sequential per point of sale
const nextNumber = await getNextInvoiceNumber(pointOfSaleId)
```

### JSDoc for Public APIs

```typescript
/**
 * Creates a new invoice and submits it to AFIP for authorization.
 *
 * @param data - Invoice data including type, items, and customer info
 * @returns Promise resolving to created invoice with CAE
 * @throws {ValidationError} If invoice data is invalid
 * @throws {AFIPError} If AFIP submission fails
 *
 * @example
 * ```typescript
 * const invoice = await createInvoice({
 *   type: 'B',
 *   customerId: '123',
 *   items: [{ description: 'Consulting', price: 5000 }]
 * })
 * console.log(invoice.cae) // Authorization code
 * ```
 */
async function createInvoice(data: CreateInvoiceDto): Promise<Invoice> {
  // ...
}
```

## Error Handling

### Custom Error Classes

```typescript
// Base error class
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public errorCode: string,
    public details?: unknown
  ) {
    super(message)
    this.name = this.constructor.name
  }
}

// Specific errors
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`, 'NOT_FOUND')
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, message, 'VALIDATION_ERROR', details)
  }
}

export class AFIPError extends AppError {
  constructor(message: string, afipCode: string) {
    super(502, message, `AFIP_${afipCode}`)
  }
}
```

### Error Handling Pattern

```typescript
// Controller
try {
  const invoice = await invoiceService.create(data)
  return res.json(invoice)
} catch (error) {
  // Let global error handler deal with it
  throw error
}

// Service
async create(data: CreateInvoiceDto): Promise<Invoice> {
  // Validate
  const validation = createInvoiceSchema.safeParse(data)
  if (!validation.success) {
    throw new ValidationError('Invalid invoice data', validation.error)
  }

  // Business logic
  const invoice = await this.repo.create(data)

  // External service
  try {
    await this.afipService.submit(invoice)
  } catch (error) {
    throw new AFIPError('Failed to submit invoice', error.code)
  }

  return invoice
}
```

## Testing Conventions

### Test File Structure

```typescript
describe('InvoiceService', () => {
  // Setup
  let service: InvoiceService
  let mockRepo: jest.Mocked<IInvoiceRepository>

  beforeEach(() => {
    mockRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      // ...
    }
    service = new InvoiceService(mockRepo)
  })

  // Group related tests
  describe('create', () => {
    it('should create invoice and return result', async () => {
      // Arrange
      const data = { type: 'B', items: [{ price: 100 }] }
      mockRepo.create.mockResolvedValue(mockInvoice)

      // Act
      const result = await service.create(data)

      // Assert
      expect(result).toEqual(mockInvoice)
      expect(mockRepo.create).toHaveBeenCalledWith(data)
    })

    it('should throw ValidationError for invalid data', async () => {
      // Arrange
      const invalidData = { type: 'INVALID' }

      // Act & Assert
      await expect(service.create(invalidData)).rejects.toThrow(ValidationError)
    })
  })
})
```

### Test Naming

```typescript
// Pattern: "should [expected behavior] when [condition]"
it('should return invoice when ID exists', async () => {})
it('should throw NotFoundError when invoice does not exist', async () => {})
it('should calculate tax correctly for invoice type A', async () => {})
```

## Git Conventions

### Commit Messages

**Format**: `<type>: <description>`

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code change that neither fixes bug nor adds feature
- `perf`: Performance improvement
- `test`: Adding or updating tests
- `chore`: Maintenance tasks, dependencies, etc.

**Examples**:
```
feat: add invoice cancellation endpoint
fix: handle AFIP timeout errors correctly
docs: update API authentication guide
refactor: extract AFIP response parser
test: add integration tests for invoice creation
chore: update dependencies to latest versions
```

### Branch Naming

```
feature/invoice-cancellation
fix/afip-timeout-handling
refactor/extract-afip-parser
docs/update-auth-guide
chore/update-dependencies
```

## Code Review Checklist

**Before Submitting PR**:
- [ ] Code follows style guide
- [ ] All tests pass
- [ ] New code has tests
- [ ] Documentation updated
- [ ] No console.logs or debugger statements
- [ ] TypeScript strict mode passes
- [ ] ESLint passes with no warnings
- [ ] Commit messages follow convention

**During Review**:
- [ ] Code is readable and maintainable
- [ ] Logic is sound and handles edge cases
- [ ] Errors are handled appropriately
- [ ] Performance implications considered
- [ ] Security implications considered
- [ ] Backwards compatibility maintained (if applicable)

## Notes

- Style guide is **enforced by tools** (ESLint, Prettier) where possible
- Automated formatting on commit via Husky + lint-staged
- TypeScript strict mode is **non-negotiable**
- When in doubt, **consistency** with existing code wins
- Style guide **evolves** - propose changes via PR to this document
