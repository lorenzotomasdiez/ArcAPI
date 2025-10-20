# Testing Strategy

Comprehensive testing approach for ARCA API to ensure code quality, prevent regressions, and maintain confidence in deployments.

## Overview

Our testing strategy follows the **Testing Pyramid** principle, balancing fast, isolated unit tests with integration and end-to-end tests for comprehensive coverage. We prioritize **automated testing** over manual QA, with all tests running in CI/CD pipelines before deployment.

**Core Principles:**
- **Test early, test often** - Write tests alongside code
- **Fast feedback loops** - Unit tests run in seconds
- **High coverage** - 80% minimum, 90% preferred
- **Reliable tests** - No flaky tests tolerated
- **Maintainable tests** - Clear, readable test code

## Testing Pyramid

Our test distribution follows the industry-standard pyramid:

```
           /\
          /  \
         / E2E \        5% - Critical user journeys
        /------\        ~10 tests, ~5-10 mins
       /        \
      /  Integ.  \      25% - Service interactions
     /------------\     ~50 tests, ~2-3 mins
    /              \
   /      Unit      \   70% - Functions, classes
  /------------------\  ~500 tests, <30 seconds
```

**Why this distribution?**
- **Unit tests** are fast, isolated, and catch most bugs
- **Integration tests** verify components work together correctly
- **E2E tests** validate critical user flows end-to-end
- **Inverted pyramid** (too many E2E) leads to slow, brittle test suites

## Coverage Targets

### Minimum Coverage: 80%

All code must maintain at least 80% coverage across:
- **Lines**: 80%
- **Branches**: 80%
- **Functions**: 80%
- **Statements**: 80%

Coverage is enforced in CI - PRs failing coverage checks cannot merge.

### Preferred Coverage: 90%

Aim for 90% coverage in critical modules:
- Business logic services (InvoiceService, AFIPService)
- Data transformations
- Validation functions
- Security and authentication

### What to Measure

**Include in coverage:**
- All source code in `src/`
- Business logic and services
- Controllers and routes
- Utilities and helpers

**Exclude from coverage:**
- Test files (`*.test.ts`, `*.spec.ts`)
- Type definitions (`*.d.ts`)
- Configuration files
- Generated code
- Migration files

## Unit Testing

### Framework

**TypeScript/JavaScript:** [Jest](https://jestjs.io/)
- Fast, zero-config test framework
- Built-in mocking and assertions
- TypeScript support via ts-jest
- Snapshot testing capabilities
- Code coverage reporting

**Python:** [pytest](https://pytest.org/) (if AI service in scope)
- Pythonic test syntax
- Powerful fixtures
- Parametrized testing
- Plugin ecosystem

### What to Test

Unit tests should cover:

1. **Business Logic**
   - Service methods
   - Domain logic
   - Calculations and algorithms

2. **Data Transformations**
   - Parsers and serializers
   - Format conversions
   - Data mapping functions

3. **Validation Functions**
   - Input validation
   - Schema validation
   - Business rule validation

4. **Error Handling**
   - Exception throwing
   - Error recovery
   - Edge cases

### Unit Test Examples

#### Example 1: Invoice Calculations

```typescript
// src/services/invoice-service.test.ts
import { InvoiceService } from './invoice-service';

describe('InvoiceService', () => {
  describe('calculateTotal', () => {
    it('should sum item prices with IVA correctly', () => {
      const items = [
        { cantidad: 2, precio_unitario: 100, iva_porcentaje: 21 },
        { cantidad: 1, precio_unitario: 50, iva_porcentaje: 21 }
      ];

      const total = InvoiceService.calculateTotal(items);

      // (2*100 + 1*50) * 1.21 = 250 * 1.21 = 302.50
      expect(total).toBe(302.5);
    });

    it('should handle items with different IVA rates', () => {
      const items = [
        { cantidad: 1, precio_unitario: 100, iva_porcentaje: 21 },
        { cantidad: 1, precio_unitario: 100, iva_porcentaje: 10.5 }
      ];

      const total = InvoiceService.calculateTotal(items);

      // Item 1: 100 * 1.21 = 121
      // Item 2: 100 * 1.105 = 110.5
      // Total: 231.5
      expect(total).toBe(231.5);
    });

    it('should throw error for negative prices', () => {
      const items = [
        { cantidad: 1, precio_unitario: -100, iva_porcentaje: 21 }
      ];

      expect(() => InvoiceService.calculateTotal(items))
        .toThrow('Price cannot be negative');
    });

    it('should handle zero quantity items', () => {
      const items = [
        { cantidad: 0, precio_unitario: 100, iva_porcentaje: 21 }
      ];

      const total = InvoiceService.calculateTotal(items);
      expect(total).toBe(0);
    });
  });
});
```

#### Example 2: Data Validation

```typescript
// src/validators/invoice-validator.test.ts
import { validateInvoiceData } from './invoice-validator';

describe('validateInvoiceData', () => {
  it('should accept valid invoice data', () => {
    const validData = {
      tipo_comprobante: 1,
      punto_venta: 1,
      cliente: {
        tipo_documento: 80,
        numero_documento: '20123456789',
        razon_social: 'Test Client SA'
      },
      items: [
        {
          descripcion: 'Product A',
          cantidad: 1,
          precio_unitario: 100,
          iva_porcentaje: 21
        }
      ]
    };

    const result = validateInvoiceData(validData);
    expect(result.isValid).toBe(true);
  });

  it('should reject invalid CUIT format', () => {
    const invalidData = {
      tipo_comprobante: 1,
      punto_venta: 1,
      cliente: {
        tipo_documento: 80,
        numero_documento: '123', // Invalid CUIT
        razon_social: 'Test Client SA'
      },
      items: []
    };

    const result = validateInvoiceData(invalidData);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Invalid CUIT format');
  });

  it('should reject empty items array', () => {
    const invalidData = {
      tipo_comprobante: 1,
      punto_venta: 1,
      cliente: {
        tipo_documento: 80,
        numero_documento: '20123456789',
        razon_social: 'Test Client SA'
      },
      items: [] // Empty items
    };

    const result = validateInvoiceData(invalidData);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('At least one item required');
  });
});
```

#### Example 3: Error Handling

```typescript
// src/services/afip-service.test.ts
import { AFIPService } from './afip-service';
import { AFIPError } from '../errors/afip-error';

describe('AFIPService', () => {
  describe('authenticate', () => {
    it('should return valid token on success', async () => {
      const afipService = new AFIPService();
      const token = await afipService.authenticate();

      expect(token).toBeDefined();
      expect(token.expiresAt).toBeInstanceOf(Date);
      expect(token.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('should throw AFIPError on authentication failure', async () => {
      const afipService = new AFIPService();
      // Mock certificate as invalid
      jest.spyOn(afipService, 'loadCertificate').mockImplementation(() => {
        throw new Error('Invalid certificate');
      });

      await expect(afipService.authenticate())
        .rejects
        .toThrow(AFIPError);
    });

    it('should retry on network timeout', async () => {
      const afipService = new AFIPService({ maxRetries: 3 });
      let attempts = 0;

      jest.spyOn(afipService, 'callSOAPService').mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Network timeout');
        }
        return Promise.resolve({ token: 'valid-token' });
      });

      const token = await afipService.authenticate();
      expect(attempts).toBe(3);
      expect(token).toBeDefined();
    });
  });
});
```

### Running Unit Tests

```bash
# Run all unit tests
pnpm test:unit

# Run with coverage
pnpm test:unit --coverage

# Run specific file
pnpm test:unit src/services/invoice-service.test.ts

# Run in watch mode (auto-rerun on changes)
pnpm test:unit --watch

# Run tests matching pattern
pnpm test:unit --testNamePattern="calculateTotal"

# Update snapshots
pnpm test:unit --updateSnapshot
```

### Unit Testing Best Practices

**DO:**
- Test one thing per test
- Use descriptive test names (it should...)
- Follow AAA pattern: Arrange, Act, Assert
- Mock external dependencies
- Test edge cases and error conditions
- Keep tests fast (<100ms each)

**DON'T:**
- Test implementation details
- Share state between tests
- Use real databases or external services
- Write tests that depend on execution order
- Skip error case testing

## Integration Testing

### Framework

**Supertest** for API endpoint testing
- HTTP assertion library
- Works seamlessly with Express
- Supports async/await
- Chainable assertions

**Test Database** for data persistence
- Separate test database instance
- Automatic cleanup between tests
- Database migrations applied
- Seed data available

### What to Test

Integration tests verify:

1. **API Endpoints**
   - Request/response cycles
   - HTTP status codes
   - Response payloads
   - Authentication/authorization

2. **Database Interactions**
   - CRUD operations
   - Transaction handling
   - Foreign key constraints
   - Complex queries

3. **External Service Mocks**
   - AFIP API responses
   - Email service calls
   - File storage operations
   - OpenAI API (if AI features)

### Integration Test Examples

#### Example 1: POST /invoices Endpoint

```typescript
// src/routes/invoices.integration.test.ts
import request from 'supertest';
import { app } from '../app';
import { setupTestDatabase, cleanupTestDatabase } from '../test-utils/database';

describe('POST /v1/invoices', () => {
  let testApiKey: string;

  beforeAll(async () => {
    await setupTestDatabase();
    testApiKey = await createTestApiKey();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  afterEach(async () => {
    await clearInvoices();
  });

  it('should create invoice with valid data', async () => {
    const invoiceData = {
      mode: 'advanced',
      tipo_comprobante: 1,
      punto_venta: 1,
      cliente: {
        tipo_documento: 80,
        numero_documento: '20123456789',
        razon_social: 'Test Client SA',
        domicilio: 'Av. Test 123',
        email: 'test@example.com'
      },
      items: [
        {
          descripcion: 'Product A',
          cantidad: 2,
          precio_unitario: 100,
          iva_porcentaje: 21
        }
      ]
    };

    const response = await request(app)
      .post('/v1/invoices')
      .set('Authorization', `Bearer ${testApiKey}`)
      .set('Content-Type', 'application/json')
      .send(invoiceData);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: expect.any(String),
      numero: expect.any(Number),
      cae: expect.any(String),
      cae_vencimiento: expect.any(String),
      total: 242, // (2 * 100) * 1.21
      estado: 'approved'
    });
  });

  it('should return 401 without API key', async () => {
    const response = await request(app)
      .post('/v1/invoices')
      .send({});

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('UNAUTHORIZED');
  });

  it('should return 400 with invalid data', async () => {
    const invalidData = {
      mode: 'advanced',
      tipo_comprobante: 999, // Invalid type
      items: []
    };

    const response = await request(app)
      .post('/v1/invoices')
      .set('Authorization', `Bearer ${testApiKey}`)
      .send(invalidData);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('VALIDATION_ERROR');
    expect(response.body.details).toContain('Invalid tipo_comprobante');
  });

  it('should handle AFIP service errors gracefully', async () => {
    // Mock AFIP service to return error
    jest.spyOn(AFIPService.prototype, 'submitInvoice')
      .mockRejectedValue(new AFIPError('Service unavailable', '10001'));

    const invoiceData = { /* valid data */ };

    const response = await request(app)
      .post('/v1/invoices')
      .set('Authorization', `Bearer ${testApiKey}`)
      .send(invoiceData);

    expect(response.status).toBe(502);
    expect(response.body.error).toBe('AFIP_ERROR');
  });

  it('should persist invoice to database', async () => {
    const invoiceData = { /* valid data */ };

    const response = await request(app)
      .post('/v1/invoices')
      .set('Authorization', `Bearer ${testApiKey}`)
      .send(invoiceData);

    const invoiceId = response.body.id;

    // Verify invoice exists in database
    const dbInvoice = await db.invoices.findById(invoiceId);
    expect(dbInvoice).toBeDefined();
    expect(dbInvoice.numero).toBe(response.body.numero);
  });
});
```

#### Example 2: Database Transaction Test

```typescript
// src/repositories/invoice-repository.integration.test.ts
import { InvoiceRepository } from './invoice-repository';
import { setupTestDatabase, cleanupTestDatabase } from '../test-utils/database';

describe('InvoiceRepository', () => {
  let repository: InvoiceRepository;

  beforeAll(async () => {
    await setupTestDatabase();
    repository = new InvoiceRepository();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  it('should rollback transaction on error', async () => {
    const invoiceData = {
      tipo_comprobante: 1,
      numero: 12345,
      items: [{ descripcion: 'Item 1', cantidad: 1, precio: 100 }]
    };

    // Mock item creation to fail
    jest.spyOn(repository, 'createItems').mockRejectedValue(
      new Error('Database constraint violation')
    );

    await expect(repository.createWithItems(invoiceData))
      .rejects
      .toThrow();

    // Verify invoice was not created (transaction rolled back)
    const invoices = await repository.findByNumero(12345);
    expect(invoices).toHaveLength(0);
  });

  it('should respect foreign key constraints', async () => {
    await expect(
      repository.create({
        userId: 'nonexistent-user-id',
        tipo_comprobante: 1
      })
    ).rejects.toThrow('Foreign key constraint');
  });
});
```

### Test Database Setup

```typescript
// src/test-utils/database.ts
import { Pool } from 'pg';
import { runMigrations } from '../database/migrations';

let testPool: Pool;

export async function setupTestDatabase(): Promise<void> {
  // Create test database connection
  testPool = new Pool({
    connectionString: process.env.TEST_DATABASE_URL,
  });

  // Run migrations
  await runMigrations(testPool);

  // Seed initial data
  await seedTestData(testPool);
}

export async function cleanupTestDatabase(): Promise<void> {
  // Drop all tables
  await testPool.query('DROP SCHEMA public CASCADE');
  await testPool.query('CREATE SCHEMA public');

  // Close connection
  await testPool.end();
}

export async function clearInvoices(): Promise<void> {
  await testPool.query('DELETE FROM invoices');
  await testPool.query('DELETE FROM invoice_items');
}

async function seedTestData(pool: Pool): Promise<void> {
  // Insert test users, configurations, etc.
  await pool.query(`
    INSERT INTO users (id, email, name)
    VALUES ('test-user-1', 'test@example.com', 'Test User')
  `);
}
```

### Running Integration Tests

```bash
# Run all integration tests
pnpm test:integration

# Run with test database logs
DEBUG=db:* pnpm test:integration

# Run specific test suite
pnpm test:integration src/routes/invoices.integration.test.ts

# Run against local test database
TEST_DATABASE_URL=postgresql://localhost:5432/arca_test pnpm test:integration
```

### Integration Testing Best Practices

**DO:**
- Use separate test database
- Clean up data after each test
- Mock external services (AFIP, email)
- Test authentication/authorization
- Verify database state changes

**DON'T:**
- Use production database
- Share state between tests
- Call real external APIs
- Skip error scenarios
- Ignore transaction boundaries

## End-to-End (E2E) Testing

### Framework

**Playwright** (recommended) or **Cypress**
- Cross-browser testing (Chrome, Firefox, Safari)
- Mobile device emulation
- Network interception
- Screenshot/video recording on failure
- Parallel test execution

### What to Test

E2E tests cover **critical user journeys** (5-10 flows):

1. **Invoice Creation Flow**
   - Simple mode: Natural language → Invoice
   - Advanced mode: Structured data → Invoice
   - Verify CAE returned

2. **Certificate Upload Flow**
   - Upload .pfx file
   - Configure certificate
   - Test AFIP connection

3. **Webhook Configuration**
   - Add webhook URL
   - Test webhook delivery
   - Verify retry logic

4. **Dashboard Authentication**
   - User login
   - JWT token generation
   - Protected route access

5. **Invoice List & Search**
   - Load invoice list
   - Filter by date range
   - Search by client name

### E2E Test Examples

#### Example: Invoice Creation E2E

```typescript
// tests/e2e/invoice-creation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Invoice Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:3001/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard');
  });

  test('should create invoice in simple mode', async ({ page }) => {
    // Navigate to invoice creation
    await page.goto('http://localhost:3001/invoices/new');

    // Select simple mode
    await page.click('[data-testid="mode-simple"]');

    // Enter natural language description
    await page.fill('[data-testid="invoice-description"]',
      'Factura para Juan Pérez por 2 laptops a $1000 cada una'
    );

    // Click generate
    await page.click('[data-testid="generate-invoice"]');

    // Wait for AI processing
    await page.waitForSelector('[data-testid="invoice-preview"]');

    // Verify parsed data
    await expect(page.locator('[data-testid="client-name"]'))
      .toHaveText('Juan Pérez');
    await expect(page.locator('[data-testid="item-count"]'))
      .toHaveText('2');
    await expect(page.locator('[data-testid="total-amount"]'))
      .toContain('2420'); // 2000 * 1.21 IVA

    // Submit to AFIP
    await page.click('[data-testid="submit-afip"]');

    // Wait for success message
    await page.waitForSelector('[data-testid="success-message"]');
    await expect(page.locator('[data-testid="cae"]'))
      .not.toBeEmpty();
  });

  test('should create invoice in advanced mode', async ({ page }) => {
    await page.goto('http://localhost:3001/invoices/new');

    // Select advanced mode
    await page.click('[data-testid="mode-advanced"]');

    // Fill invoice form
    await page.selectOption('[data-testid="tipo-comprobante"]', '1');
    await page.fill('[data-testid="punto-venta"]', '1');

    // Fill client data
    await page.fill('[data-testid="client-cuit"]', '20123456789');
    await page.fill('[data-testid="client-name"]', 'Test Client SA');

    // Add item
    await page.click('[data-testid="add-item"]');
    await page.fill('[data-testid="item-description"]', 'Product A');
    await page.fill('[data-testid="item-quantity"]', '1');
    await page.fill('[data-testid="item-price"]', '100');
    await page.selectOption('[data-testid="item-iva"]', '21');

    // Submit
    await page.click('[data-testid="submit-invoice"]');

    // Verify success
    await page.waitForSelector('[data-testid="invoice-created"]');
    await expect(page.locator('[data-testid="invoice-number"]'))
      .not.toBeEmpty();
  });

  test('should handle AFIP errors gracefully', async ({ page, context }) => {
    // Mock AFIP API to return error
    await context.route('**/api/afip/**', (route) => {
      route.fulfill({
        status: 502,
        body: JSON.stringify({
          error: 'AFIP_ERROR',
          message: 'AFIP service unavailable'
        })
      });
    });

    await page.goto('http://localhost:3001/invoices/new');

    // Fill and submit invoice
    // ... (fill form data)
    await page.click('[data-testid="submit-invoice"]');

    // Verify error message shown
    await page.waitForSelector('[data-testid="error-message"]');
    await expect(page.locator('[data-testid="error-message"]'))
      .toContain('AFIP service unavailable');
  });
});
```

### Mock Strategy for AFIP

Since AFIP homologación environment may be unreliable, use **recorded responses**:

```typescript
// tests/e2e/mocks/afip-responses.ts
export const mockAFIPResponses = {
  authenticate: {
    token: 'PD94bWwgdmVyc2lvbj0iMS4...',
    expiresAt: '2025-10-16T12:00:00Z'
  },
  submitInvoice: {
    cae: '12345678901234',
    cae_vencimiento: '2025-10-25',
    resultado: 'A',
    observaciones: []
  }
};

// Use in tests
await page.route('**/wsaa/auth', (route) => {
  route.fulfill({
    status: 200,
    body: JSON.stringify(mockAFIPResponses.authenticate)
  });
});
```

### Running E2E Tests

```bash
# Run all E2E tests
pnpm test:e2e

# Run in headed mode (see browser)
pnpm test:e2e --headed

# Run specific browser
pnpm test:e2e --project=chromium
pnpm test:e2e --project=firefox

# Run in debug mode
pnpm test:e2e --debug

# Generate test report
pnpm test:e2e --reporter=html

# Run against staging environment
BASE_URL=https://staging.arca-api.com pnpm test:e2e
```

### E2E Testing Best Practices

**DO:**
- Test critical user flows only
- Use data-testid attributes for selectors
- Mock unreliable external services
- Record videos on failures
- Run in CI before production deploys

**DON'T:**
- Test every edge case (use unit tests)
- Use brittle CSS selectors
- Call real AFIP production API
- Skip authentication flows
- Run E2E tests on every commit (too slow)

## Test Organization

### File Structure

**Option 1: Mirror source structure (recommended)**
```
src/
├── services/
│   ├── invoice-service.ts
│   ├── invoice-service.test.ts
│   ├── afip-service.ts
│   └── afip-service.test.ts
├── routes/
│   ├── invoices.ts
│   └── invoices.integration.test.ts
```

**Option 2: Separate __tests__ directory**
```
src/
├── services/
│   ├── invoice-service.ts
│   └── afip-service.ts
└── __tests__/
    ├── unit/
    │   ├── invoice-service.test.ts
    │   └── afip-service.test.ts
    └── integration/
        └── invoices.integration.test.ts
```

### Naming Conventions

- **Unit tests**: `*.test.ts` or `*.spec.ts`
- **Integration tests**: `*.integration.test.ts`
- **E2E tests**: `*.e2e.spec.ts` (in separate `/tests` directory)

### Setup/Teardown Patterns

```typescript
// Global setup (runs once before all tests)
beforeAll(async () => {
  await setupTestDatabase();
  await startTestServer();
});

// Global teardown (runs once after all tests)
afterAll(async () => {
  await cleanupTestDatabase();
  await stopTestServer();
});

// Test-level setup (runs before each test)
beforeEach(async () => {
  await clearTestData();
  await resetMocks();
});

// Test-level teardown (runs after each test)
afterEach(async () => {
  await restoreOriginalState();
});
```

## Running Tests

### All Tests

```bash
# Run entire test suite
pnpm test

# Run with coverage
pnpm test:coverage

# Run in watch mode
pnpm test:watch
```

### By Test Type

```bash
# Unit tests only
pnpm test:unit

# Integration tests only
pnpm test:integration

# E2E tests only
pnpm test:e2e
```

### Specific Tests

```bash
# Run specific file
pnpm test src/services/invoice-service.test.ts

# Run tests matching pattern
pnpm test --testNamePattern="calculateTotal"

# Run changed tests only (Git)
pnpm test --onlyChanged
```

### Coverage Reports

```bash
# Generate coverage report
pnpm test:coverage

# View HTML report
open coverage/index.html

# Coverage for specific directory
pnpm test:coverage --collectCoverageFrom="src/services/**"
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: test_db
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: pnpm install

      - name: Run linting
        run: pnpm lint

      - name: Run unit tests
        run: pnpm test:unit --coverage

      - name: Run integration tests
        run: pnpm test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

      - name: Check coverage thresholds
        run: pnpm test:coverage --coverageThreshold='{"global":{"lines":80}}'
```

### Pre-commit Hooks

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run tests on staged files
pnpm lint-staged

# Run unit tests
pnpm test:unit --bail --findRelatedTests
```

### Required Checks for PR Merge

- All tests pass
- Coverage ≥ 80%
- Linting passes
- No TypeScript errors
- No security vulnerabilities

## Test Data Management

### Factories

```typescript
// test-utils/factories/invoice-factory.ts
export const createTestInvoice = (overrides = {}) => {
  return {
    id: faker.string.uuid(),
    tipo_comprobante: 1,
    punto_venta: 1,
    numero: faker.number.int({ min: 1, max: 99999 }),
    fecha: new Date(),
    cliente: createTestClient(),
    items: [createTestItem()],
    total: 121,
    estado: 'approved',
    ...overrides
  };
};

export const createTestClient = (overrides = {}) => {
  return {
    tipo_documento: 80,
    numero_documento: '20123456789',
    razon_social: faker.company.name(),
    domicilio: faker.location.streetAddress(),
    email: faker.internet.email(),
    ...overrides
  };
};
```

### Fixtures

```typescript
// test-utils/fixtures/invoices.json
{
  "validInvoice": {
    "tipo_comprobante": 1,
    "cliente": { "numero_documento": "20123456789" },
    "items": [{ "descripcion": "Test", "cantidad": 1 }]
  },
  "invalidInvoice": {
    "tipo_comprobante": 999
  }
}
```

## Mocking Strategies

### External Services

```typescript
// Mock AFIP service
jest.mock('../services/afip-service', () => ({
  AFIPService: jest.fn().mockImplementation(() => ({
    authenticate: jest.fn().mockResolvedValue({ token: 'test-token' }),
    submitInvoice: jest.fn().mockResolvedValue({ cae: '12345678901234' })
  }))
}));

// Mock email service
jest.mock('../services/email-service', () => ({
  sendEmail: jest.fn().mockResolvedValue({ messageId: 'test-123' })
}));
```

### Database Queries

```typescript
// Mock repository
const mockInvoiceRepo = {
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn()
};

// Use in tests
mockInvoiceRepo.findById.mockResolvedValue(testInvoice);
```

## Performance Testing

### Load Testing with k6

```javascript
// tests/load/invoice-creation.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 100, // 100 virtual users
  duration: '30s',
};

export default function () {
  const payload = JSON.stringify({
    tipo_comprobante: 1,
    cliente: { /* ... */ },
    items: [{ /* ... */ }]
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-api-key',
    },
  };

  const res = http.post('http://localhost:3000/v1/invoices', payload, params);

  check(res, {
    'status is 201': (r) => r.status === 201,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

Run load tests:
```bash
k6 run tests/load/invoice-creation.js
```

## Troubleshooting

### Common Issues

**Tests failing in CI but passing locally:**
- Check environment variables
- Verify test database is available
- Ensure timezone consistency
- Check for race conditions

**Flaky tests:**
- Add explicit waits for async operations
- Avoid hardcoded timeouts
- Don't rely on execution order
- Clean up state properly

**Slow test suite:**
- Run tests in parallel
- Use test.concurrent for independent tests
- Mock expensive operations
- Optimize database queries in tests

**Coverage not updating:**
- Clear coverage cache: `rm -rf coverage`
- Check collectCoverageFrom patterns
- Verify source files are included

## Resources

### Documentation
- [Jest Documentation](https://jestjs.io/)
- [Supertest Guide](https://github.com/visionmedia/supertest)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://testingjavascript.com/)

### Tools
- [Jest Coverage Viewer](https://github.com/jest-community/jest-coverage-viewer)
- [Codecov](https://codecov.io/) - Coverage tracking
- [k6](https://k6.io/) - Load testing
- [Faker](https://fakerjs.dev/) - Test data generation

---

**Last Updated**: 2025-10-15
**Maintained By**: Engineering Team
**Review Cycle**: Quarterly
