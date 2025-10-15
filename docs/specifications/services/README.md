# Service Contracts

This directory contains internal service-to-service communication contracts for the ARCA API platform.

## Overview

Service contracts define the interfaces for internal services to communicate, including:
- Input/output schemas (JSON Schema)
- Error handling and retry policies
- Performance expectations
- Authentication requirements
- Examples and test cases

## Status

> **Status**: TODO - Pending completion in Task #4
>
> Service contracts will be created in **Task #4: Create API Specifications** (Week 3)

## Planned Service Contracts

### 1. AI Invoice Generator Service

**File**: `ai-service-contract.md` (TODO)

**Purpose**: Natural language to structured invoice conversion

**Contract**:
- Input: `{ description: string, user_context?: object }`
- Output: `{ invoice_data: object, confidence: number, warnings: string[] }`
- Error handling: Fallback to manual mode if AI fails
- Performance: P95 <2 seconds
- Authentication: Service-to-service JWT

### 2. Webhook Engine Service

**File**: `webhook-service-contract.md` (TODO)

**Purpose**: Reliable event delivery to external endpoints

**Contract**:
- Input: `{ event_type: string, payload: object, webhook_id: string }`
- Output: `{ delivery_id: string, status: 'queued' | 'delivered' | 'failed' }`
- Error handling: Exponential backoff retry (5 attempts)
- Performance: Queue within 100ms, deliver within 30s
- Event format: CloudEvents 1.0 standard

### 3. Analytics Service

**File**: `analytics-service-contract.md` (TODO)

**Purpose**: Data aggregation and reporting

**Contract**:
- Input: Raw invoice events
- Output: Aggregated metrics (daily/weekly/monthly)
- Performance: Real-time streaming + batch aggregation
- Authentication: Read-only database replica

### 4. MCP Server

**File**: `mcp-server-contract.md` (TODO)

**Purpose**: LLM tool integration (Model Context Protocol)

**Contract**:
- Protocol: MCP (https://modelcontextprotocol.io/)
- Tools exposed: invoice_create, invoice_get, invoice_list
- Authentication: OAuth2 + MCP session
- Performance: <500ms per tool call

### 5. ARCA SOAP Client

**File**: `arca-client-contract.md` (TODO)

**Purpose**: Adapter for ARCA/AFIP SOAP API

**Contract**:
- Input: Structured invoice data
- Output: CAE (authorization code) or error
- Error handling: Retry on transient errors, fail-fast on validation
- Performance: P95 <3 seconds (ARCA latency dominant)
- Token caching: 10-hour TTL

## Contract Format

Each service contract follows this structure:

```markdown
# Service Name

## Overview
[Purpose and responsibility]

## API Contract

### Endpoint/Method
[REST endpoint or function name]

### Input Schema
```json
{
  "type": "object",
  "properties": { ... },
  "required": [ ... ]
}
```

### Output Schema
```json
{
  "type": "object",
  "properties": { ... }
}
```

### Error Responses
[Possible errors and handling]

## Authentication
[How services authenticate]

## Performance Expectations
- Latency: P50 <Xms, P95 <Yms
- Throughput: Z requests/second
- Availability: 99.X% uptime

## Error Handling
- Transient errors: Retry policy
- Permanent errors: Fail-fast
- Circuit breaker: After N failures

## Examples
[Request/response examples]

## Testing
[Contract test examples]
```

## Service Communication Patterns

### Synchronous (REST)

- Direct service-to-service HTTP calls
- Used for: Request-response operations
- Authentication: JWT with service identity
- Timeout: 10 seconds max
- Retry: 3 attempts with exponential backoff

### Asynchronous (Message Queue)

- Redis-based queue (BullMQ)
- Used for: Background jobs, event processing
- Delivery: At-least-once guarantee
- Dead letter queue: After 5 failed attempts
- Visibility timeout: 30 seconds

### Event-Driven (Webhooks)

- CloudEvents 1.0 format
- Delivery: Best-effort with retries
- Retry policy: Exponential backoff (1m, 5m, 15m, 1h, 6h)
- Signature: HMAC-SHA256 for verification

## Authentication Between Services

### Service-to-Service JWT

- Issued by auth service
- Short TTL (5 minutes)
- Contains service identity and permissions
- Verified by receiving service

### API Gateway Pattern

- External requests → API Gateway
- Internal services bypass gateway
- Gateway handles: Auth, rate limiting, routing

## Circuit Breaker Pattern

To prevent cascade failures:

```
States:
- Closed: Normal operation
- Open: Reject requests immediately (after N failures)
- Half-Open: Test if service recovered

Configuration:
- Failure threshold: 5 failures in 30s window
- Open duration: 60s
- Success threshold to close: 2 consecutive successes
```

## Contract Testing

All service contracts have automated contract tests:

```javascript
// Example contract test
describe('AI Service Contract', () => {
  it('should accept valid invoice description', async () => {
    const input = { description: 'Invoice to John Doe for $100' };
    const response = await aiService.generateInvoice(input);

    expect(response).toMatchSchema(outputSchema);
    expect(response.invoice_data).toBeDefined();
    expect(response.confidence).toBeGreaterThan(0.7);
  });

  it('should handle invalid input gracefully', async () => {
    const input = { description: '' };

    await expect(aiService.generateInvoice(input))
      .rejects
      .toMatchObject({ code: 'INVALID_INPUT' });
  });
});
```

## Related Documentation

- [Architecture - Services](../../architecture/02-services.md) - Service design
- [API Specifications](../api/README.md) - External API
- [Flows](../../flows/README.md) - Service interaction flows
- [Development](../../development/README.md) - Testing guidelines

---

**Last Updated**: 2025-10-15
**Status**: Placeholder (Contracts Pending Task #4)
**Next Task**: Task #4 - Create service contracts (Week 3)
