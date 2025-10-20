# Coding Standards

Coding standards and style guidelines for ARCA API development. These standards ensure consistency, maintainability, and code quality across the team.

## Table of Contents

- [Overview](#overview)
- [TypeScript Standards](#typescript-standards)
  - [Naming Conventions](#naming-conventions)
  - [File Structure](#file-structure)
  - [Code Style](#code-style)
  - [Type Annotations](#type-annotations)
  - [Error Handling](#error-handling)
- [Python Standards](#python-standards)
- [Code Examples](#code-examples)
- [Linting and Formatting](#linting-and-formatting)
- [Code Review Checklist](#code-review-checklist)

## Overview

### Core Principles

1. **Clarity over Cleverness**: Write code that is self-documenting and easy to understand
2. **Consistency**: Follow established patterns throughout the codebase
3. **TypeScript First**: Leverage TypeScript's type system for safety and developer experience
4. **Functional Where Possible**: Prefer pure functions and immutability
5. **Test-Driven**: Write tests alongside code, not after

### Enforcement

Standards are enforced through:
- **ESLint**: Catches code quality issues and enforces style rules
- **Prettier**: Automatically formats code consistently
- **TypeScript Compiler**: Strict mode enabled for maximum type safety
- **Pre-commit Hooks**: Husky + lint-staged run checks before commits
- **CI Pipeline**: All checks run on pull requests

---

## TypeScript Standards

### Naming Conventions

#### Files and Directories

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

**Test Files**

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

#### Variables and Functions

```typescript
// ✅ Good: camelCase for variables and functions
const userId = '123';
const invoiceTotal = 1000;

function calculateTax(amount: number): number {
  return amount * 0.21;
}

const handleSubmit = async (data: InvoiceData): Promise<void> => {
  // Arrow functions are preferred
};

// ❌ Bad: Inconsistent naming
const UserID = '123';           // Should be camelCase
const invoice_total = 1000;     // No snake_case in TypeScript
function CalculateTax() {}      // Should be camelCase
```

#### Classes and Interfaces

```typescript
// ✅ Good: PascalCase for classes and interfaces
class InvoiceService {
  async create(data: CreateInvoiceDto): Promise<Invoice> {
    // Implementation
  }
}

interface Invoice {
  id: string;
  type: InvoiceType;
  total: number;
}

// Use 'I' prefix only for abstract interfaces (dependency injection)
interface IInvoiceRepository {
  findById(id: string): Promise<Invoice | null>;
}

// DTOs (Data Transfer Objects) use 'Dto' suffix
interface CreateInvoiceDto {
  type: 'A' | 'B' | 'C';
  items: InvoiceItemDto[];
}

// ❌ Bad: Inconsistent naming
class invoiceService {}         // Should be PascalCase
interface Iinvoice {}           // Don't use I prefix for data interfaces
interface InvoiceDTO {}         // Use Dto, not DTO
```

#### Types and Enums

```typescript
// ✅ Good: PascalCase for types and enums
type InvoiceStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

enum InvoiceType {
  A = 'A',
  B = 'B',
  C = 'C',
  M = 'M',
}

// Use 'Type' suffix for complex types
type InvoiceFilterType = {
  status?: InvoiceStatus;
  dateFrom?: Date;
  dateTo?: Date;
};

// ❌ Bad: Inconsistent naming
type invoiceStatus = 'pending';  // Should be PascalCase
enum InvoiceTypes {}             // Singular form preferred
type InvoiceFilter = {};         // Add Type suffix for clarity
```

#### Constants

```typescript
// ✅ Good: UPPER_SNAKE_CASE for true constants
const MAX_INVOICES_PER_PAGE = 50;
const API_BASE_URL = 'https://api.arca.com';
const AFIP_TIMEOUT_MS = 5000;

// camelCase for config objects (not true constants)
const afipConfig = {
  environment: 'production',
  timeout: 5000,
  retries: 3,
};

// ❌ Bad: Inconsistent constant naming
const maxInvoicesPerPage = 50;   // Should be UPPER_SNAKE_CASE
const API_BASE_Url = 'https://'; // Inconsistent casing
```

#### Boolean Variables

```typescript
// ✅ Good: Prefix with 'is', 'has', 'can', 'should'
const isAuthenticated = true;
const hasPermission = false;
const canEdit = user.role === 'admin';
const shouldRetry = errorCount < MAX_RETRIES;

// ❌ Bad: Not descriptive or unclear
const authenticated = true;      // Use 'is' prefix
const permission = false;        // Use 'has' prefix
const edit = user.role;          // Unclear boolean intent
```

### File Structure

#### Directory Organization

Organize code by feature or domain, not by technical type:

```
src/
├── invoices/                  # Feature-based organization
│   ├── InvoiceController.ts
│   ├── InvoiceService.ts
│   ├── InvoiceRepository.ts
│   ├── invoice.types.ts
│   └── __tests__/
│       ├── InvoiceService.test.ts
│       └── InvoiceController.test.ts
├── auth/
│   ├── AuthController.ts
│   ├── AuthService.ts
│   ├── auth.types.ts
│   └── __tests__/
├── shared/                    # Shared utilities
│   ├── middleware/
│   ├── utils/
│   └── types/
└── config/
```

#### Import Order

```typescript
// 1. External dependencies (Node.js built-ins, npm packages)
import express from 'express';
import { z } from 'zod';

// 2. Internal modules (absolute imports with @/ alias)
import { InvoiceService } from '@/invoices/InvoiceService';
import { authenticateMiddleware } from '@/shared/middleware/authenticate';

// 3. Types (use 'type' keyword for type-only imports)
import type { Invoice, InvoiceDto } from '@/invoices/invoice.types';

// 4. Relative imports (avoid if possible, use absolute imports)
import { helper } from './utils';
```

#### Export Style

```typescript
// ✅ Good: Prefer named exports
export class InvoiceService {}
export function calculateTax() {}

// Default export only for React components and Next.js pages
export default function InvoicePage() {
  return <div>Invoice Page</div>;
}

// ❌ Bad: Default exports for services/utilities
export default class InvoiceService {}  // Use named export
export default function calculateTax() {}  // Use named export
```

### Code Style

#### General Formatting

- **Indentation**: 2 spaces (no tabs)
- **Line Length**: 100 characters maximum
- **Quotes**: Single quotes for strings (except JSON)
- **Semicolons**: Required (enforced by ESLint)
- **Trailing Commas**: Always (aids git diffs)

```typescript
// ✅ Good: Follows formatting rules
const user = {
  id: '123',
  name: 'John Doe',
  email: 'john@example.com',
};

const items = [
  { id: 1, name: 'Item 1' },
  { id: 2, name: 'Item 2' },
];

// ❌ Bad: Inconsistent formatting
const user = {id:"123",name:"John Doe",email:"john@example.com"}
const items = [{id: 1, name: 'Item 1'}, {id: 2, name: 'Item 2'}]
```

#### Function Structure

**Keep functions small and focused:**
- Aim for < 20 lines per function
- Extract complex logic into helper functions
- Use early returns to reduce nesting

```typescript
// ✅ Good: Early returns, minimal nesting
async function createInvoice(data: CreateInvoiceDto): Promise<Invoice> {
  if (!data.items.length) {
    throw new ValidationError('Invoice must have at least one item');
  }

  const user = await userRepo.findById(data.userId);
  if (!user) {
    throw new NotFoundError('User');
  }

  const invoice = await invoiceRepo.create(data);
  await afipService.submit(invoice);

  return invoice;
}

// ❌ Bad: Deep nesting, hard to follow
async function createInvoice(data: CreateInvoiceDto): Promise<Invoice> {
  if (data.items.length) {
    const user = await userRepo.findById(data.userId);
    if (user) {
      const invoice = await invoiceRepo.create(data);
      const result = await afipService.submit(invoice);
      if (result.success) {
        return invoice;
      }
    }
  }
  throw new Error('Failed');
}
```

#### Async/Await vs Promises

```typescript
// ✅ Good: Use async/await for clarity
async function fetchInvoice(id: string): Promise<Invoice> {
  const invoice = await invoiceRepo.findById(id);
  if (!invoice) {
    throw new NotFoundError('Invoice');
  }
  return invoice;
}

// ❌ Bad: Promise chains are harder to read
function fetchInvoice(id: string): Promise<Invoice> {
  return invoiceRepo.findById(id)
    .then(invoice => {
      if (!invoice) {
        throw new NotFoundError('Invoice');
      }
      return invoice;
    });
}
```

#### Arrow Functions vs Function Keyword

```typescript
// ✅ Good: Use arrow functions for callbacks and short functions
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);

const handleClick = (event: MouseEvent): void => {
  console.log('Clicked', event.target);
};

// Use function keyword for methods and when 'this' context matters
class InvoiceService {
  async create(data: CreateInvoiceDto): Promise<Invoice> {
    // Method uses function keyword implicitly
  }
}

// ❌ Bad: Mixing styles inconsistently
const handleClick = function(event) { /* ... */ };  // Use arrow function
```

### Type Annotations

#### When to Annotate

**Always annotate:**
- Function parameters
- Function return types
- Public class properties
- Exported constants

```typescript
// ✅ Good: Explicit annotations
function calculateTotal(items: InvoiceItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

export class InvoiceService {
  constructor(private repo: IInvoiceRepository) {}

  async findById(id: string): Promise<Invoice | null> {
    return this.repo.findById(id);
  }
}
```

**Can omit:**
- Variable declarations (if type is obvious from initialization)
- Private class properties (if initialized)

```typescript
// ✅ Good: Type inference works here
const total = calculateTotal(items);  // Type is obvious: number
const isValid = total > 0;            // Type is obvious: boolean
```

#### Avoid `any`

```typescript
// ❌ Bad: Loses all type safety
function processData(data: any): any {
  return data.value;
}

// ✅ Good: Use generics or unknown
function processData<T extends { value: unknown }>(data: T): T['value'] {
  return data.value;
}

// Or use 'unknown' and narrow the type
function processData(data: unknown): string {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return String(data.value);
  }
  throw new Error('Invalid data');
}
```

#### Use Discriminated Unions

```typescript
// ✅ Good: Type-safe state handling
type InvoiceState =
  | { status: 'pending' }
  | { status: 'approved'; cae: string; approvedAt: Date }
  | { status: 'rejected'; reason: string };

function handleInvoice(invoice: InvoiceState): string {
  switch (invoice.status) {
    case 'pending':
      return 'Processing...';
    case 'approved':
      return `CAE: ${invoice.cae}`;  // TypeScript knows 'cae' exists
    case 'rejected':
      return `Rejected: ${invoice.reason}`;  // TypeScript knows 'reason' exists
  }
}

// ❌ Bad: Optional properties are error-prone
interface InvoiceState {
  status: 'pending' | 'approved' | 'rejected';
  cae?: string;        // Could be missing when approved
  reason?: string;     // Could be missing when rejected
}
```

### Error Handling

#### Custom Error Classes

```typescript
// Base error class
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public errorCode: string,
    public details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

// Specific error types
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, message, 'VALIDATION_ERROR', details);
  }
}

export class AFIPError extends AppError {
  constructor(message: string, afipCode: string) {
    super(502, message, `AFIP_${afipCode}`);
  }
}
```

#### Error Handling Pattern

```typescript
// Service layer: Throw specific errors
async create(data: CreateInvoiceDto): Promise<Invoice> {
  const validation = createInvoiceSchema.safeParse(data);
  if (!validation.success) {
    throw new ValidationError('Invalid invoice data', validation.error);
  }

  const invoice = await this.repo.create(data);

  try {
    await this.afipService.submit(invoice);
  } catch (error) {
    throw new AFIPError('Failed to submit invoice', error.code);
  }

  return invoice;
}

// Controller layer: Let error middleware handle it
try {
  const invoice = await invoiceService.create(data);
  return res.json(invoice);
} catch (error) {
  // Global error handler will catch and format
  throw error;
}
```

---

## Python Standards

For AI service and Python components, follow PEP 8 with Black formatter.

### Naming Conventions

```python
# ✅ Good: Python naming conventions
class InvoiceProcessor:
    """Process invoices using AI."""
    
    MAX_RETRIES = 3  # UPPER_SNAKE_CASE for constants
    
    def __init__(self, api_key: str) -> None:
        self.api_key = api_key  # snake_case for variables
    
    async def process_invoice(
        self,
        invoice_text: str
    ) -> dict[str, Any]:
        """Process invoice text with AI.
        
        Args:
            invoice_text: Raw invoice text to process
            
        Returns:
            Structured invoice data
            
        Raises:
            ValidationError: If invoice text is invalid
        """
        # snake_case for functions/methods
        return await self._extract_invoice_data(invoice_text)
    
    async def _extract_invoice_data(
        self,
        text: str
    ) -> dict[str, Any]:
        # Private methods start with underscore
        pass

# ❌ Bad: Wrong naming style
class invoiceProcessor:  # Should be PascalCase
    maxRetries = 3       # Should be UPPER_SNAKE_CASE
    
    def ProcessInvoice(self, InvoiceText):  # Should be snake_case
        pass
```

### Type Hints

Type hints are required for all function signatures:

```python
from typing import Optional, List, Dict, Any

# ✅ Good: Full type hints
def calculate_tax(
    amount: float,
    tax_rate: float = 0.21
) -> float:
    """Calculate tax amount."""
    return amount * tax_rate

async def fetch_invoice(
    invoice_id: str
) -> Optional[Dict[str, Any]]:
    """Fetch invoice by ID, return None if not found."""
    # Implementation
    pass

# ❌ Bad: Missing type hints
def calculate_tax(amount, tax_rate=0.21):  # No type hints
    return amount * tax_rate
```

### Code Style

```python
# ✅ Good: Black-formatted Python
def process_items(
    items: List[Dict[str, Any]],
    apply_discount: bool = False,
) -> float:
    """Process items and calculate total."""
    total = 0.0
    
    for item in items:
        price = item["price"]
        quantity = item["quantity"]
        
        if apply_discount:
            price *= 0.9
        
        total += price * quantity
    
    return total

# Configuration
MAX_ITEMS = 100
DEFAULT_TAX_RATE = 0.21
```

### Linting Tools

- **Black**: Code formatting (line length: 100)
- **ruff**: Fast linter replacing flake8, isort, etc.
- **mypy**: Static type checking

```bash
# Format code
black .

# Lint code
ruff check .

# Type check
mypy .
```

---

## Code Examples

### Good vs Bad Examples

#### Example 1: Service Layer

```typescript
// ❌ Bad: Poor structure, no types, mixed concerns
class InvoiceService {
  constructor(db) {
    this.db = db;
  }
  
  async create(data) {
    try {
      if (!data.items || data.items.length === 0) {
        return { error: 'No items' };
      }
      
      const invoice = await this.db.query(
        'INSERT INTO invoices VALUES ($1, $2)',
        [data.type, data.total]
      );
      
      // Submitting to AFIP inline (should be separate)
      const afipResult = await fetch('https://afip.gov.ar/...', {
        method: 'POST',
        body: JSON.stringify(invoice)
      });
      
      console.log('Created invoice', invoice);
      return invoice;
    } catch (e) {
      console.error(e);
      return null;
    }
  }
}

// ✅ Good: Proper structure, types, separation of concerns
export class InvoiceService {
  constructor(
    private repo: IInvoiceRepository,
    private afipService: AFIPService
  ) {}
  
  async create(data: CreateInvoiceDto): Promise<Invoice> {
    // Validation
    if (!data.items.length) {
      throw new ValidationError('Invoice must have at least one item');
    }
    
    // Business logic
    const invoice = await this.repo.create(data);
    
    // External service interaction
    const cae = await this.afipService.submit(invoice);
    
    // Update and return
    return this.repo.update(invoice.id, { cae });
  }
}
```

#### Example 2: Type Definitions

```typescript
// ❌ Bad: Weak types, optional everywhere, unclear
interface Invoice {
  id?: string;
  type?: string;
  total?: number;
  items?: any[];
  customer?: any;
  status?: string;
  cae?: string;
}

// ✅ Good: Strong types, clear states, discriminated unions
interface Invoice {
  id: string;
  type: InvoiceType;
  total: number;
  items: InvoiceItem[];
  customer: Customer;
  state: InvoiceState;
}

enum InvoiceType {
  A = 'A',
  B = 'B',
  C = 'C',
  M = 'M',
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

interface Customer {
  id: string;
  name: string;
  taxId: string;
  email: string;
}

type InvoiceState =
  | { status: 'draft' }
  | { status: 'submitted'; submittedAt: Date }
  | { status: 'approved'; cae: string; approvedAt: Date }
  | { status: 'rejected'; reason: string; rejectedAt: Date };
```

#### Example 3: Error Handling

```typescript
// ❌ Bad: Generic errors, no context, swallowed errors
async function getInvoice(id) {
  try {
    const invoice = await db.query('SELECT * FROM invoices WHERE id = $1', [id]);
    return invoice;
  } catch (error) {
    console.error('Error:', error);
    return null;  // Swallows error, caller doesn't know what happened
  }
}

// ✅ Good: Specific errors, proper propagation, clear intent
async function getInvoice(id: string): Promise<Invoice> {
  try {
    const invoice = await this.repo.findById(id);
    
    if (!invoice) {
      throw new NotFoundError('Invoice');
    }
    
    return invoice;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;  // Re-throw domain errors
    }
    
    // Wrap infrastructure errors
    throw new DatabaseError('Failed to fetch invoice', error);
  }
}
```

---

## Linting and Formatting

### ESLint Configuration

Create `.eslintrc.json` in project root:

```json
{
  "extends": [
    "airbnb-typescript/base",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "project": "./tsconfig.json"
  },
  "rules": {
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["error", { 
      "argsIgnorePattern": "^_" 
    }],
    "no-console": "warn",
    "max-lines-per-function": ["warn", 50],
    "max-depth": ["error", 3],
    "complexity": ["warn", 10]
  }
}
```

### Prettier Configuration

Create `.prettierrc.json` in project root:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

### Pre-commit Hooks

Install and configure Husky + lint-staged:

```bash
# Install dependencies
npm install --save-dev husky lint-staged

# Initialize Husky
npx husky install
```

Add to `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{js,json,md}": [
      "prettier --write"
    ]
  }
}
```

Create `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
```

### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.preferences.importModuleSpecifier": "non-relative"
}
```

### Running Linting

```bash
# Lint TypeScript files
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# Format all files
npm run format

# Type check
npm run typecheck
```

Add to `package.json`:

```json
{
  "scripts": {
    "lint": "eslint 'src/**/*.{ts,tsx}'",
    "lint:fix": "eslint 'src/**/*.{ts,tsx}' --fix",
    "format": "prettier --write 'src/**/*.{ts,tsx,json,md}'",
    "format:check": "prettier --check 'src/**/*.{ts,tsx,json,md}'",
    "typecheck": "tsc --noEmit"
  }
}
```

---

## Code Review Checklist

### Before Submitting PR

- [ ] Code follows naming conventions
- [ ] All functions have type annotations
- [ ] No `any` types used (unless absolutely necessary)
- [ ] Error handling is appropriate
- [ ] Functions are small and focused (<20 lines)
- [ ] No deep nesting (max depth: 3)
- [ ] Comments explain "why", not "what"
- [ ] All tests pass locally
- [ ] New code has unit tests
- [ ] ESLint passes with no warnings
- [ ] Prettier has formatted all files
- [ ] No `console.log` or `debugger` statements
- [ ] TypeScript strict mode passes

### During Review

**Functionality:**
- [ ] Does it work as intended?
- [ ] Are edge cases handled?
- [ ] Is error handling robust?

**Code Quality:**
- [ ] Follows coding standards?
- [ ] Clear and maintainable?
- [ ] Proper abstractions and separation of concerns?
- [ ] No code duplication?

**Performance:**
- [ ] Any performance concerns?
- [ ] Database queries optimized?
- [ ] Appropriate use of caching?

**Security:**
- [ ] Input validation present?
- [ ] SQL injection prevention?
- [ ] Secrets not hardcoded?
- [ ] Authentication/authorization correct?

**Testing:**
- [ ] Tests are comprehensive?
- [ ] Tests are clear and maintainable?
- [ ] Test coverage meets 80% minimum?

**Documentation:**
- [ ] Public APIs have JSDoc comments?
- [ ] Complex logic is explained?
- [ ] README updated if needed?

---

## Related Documentation

- [Local Development Setup](./setup.md) - Set up your dev environment
- [Testing Strategy](./testing-strategy.md) - How to write tests
- [Architecture](../architecture/README.md) - System design
- [API Specifications](../specifications/api/README.md) - API contracts

---

**Last Updated**: 2025-10-15  
**Enforced By**: ESLint, Prettier, TypeScript, Pre-commit hooks  
**References**: [Airbnb Style Guide](https://github.com/airbnb/javascript), [PEP 8](https://peps.python.org/pep-0008/)
