# Monitoring & Observability Strategy

> Last Updated: 2025-10-19
> Status: Active
> Version: 1.0

## Overview

This document defines the comprehensive monitoring and observability strategy for ARCA API production environment. The goal is to detect and respond to issues **before users complain** through proactive metrics collection, structured logging, distributed tracing, and intelligent alerting.

**Key Principles:**
- **Proactive Detection**: Alerts fire before customer impact
- **Production-Grade**: All examples are production-ready TypeScript code
- **SLO-Driven**: Alert thresholds aligned with Service Level Objectives
- **Actionable**: Every alert includes clear resolution steps (see runbooks)

## RED Metrics (Rate, Errors, Duration)

The RED method provides comprehensive observability for request-driven services. We collect three categories of metrics across all critical paths.

### Rate Metrics (Throughput)

**Purpose**: Measure traffic volume and identify traffic spikes or drops.

#### HTTP Request Rate

```typescript
import { Counter, register } from 'prom-client';

const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status']
});

// Usage in Express middleware
app.use((req, res, next) => {
  res.on('finish', () => {
    httpRequestsTotal.inc({
      method: req.method,
      path: req.route?.path || req.path,
      status: res.statusCode
    });
  });
  next();
});
```

**Metric**: `http_requests_total`
**Labels**: `method`, `path`, `status`
**Type**: Counter

**Key Queries**:
```promql
# Requests per minute by endpoint
rate(http_requests_total[1m])

# Request rate by status code
sum(rate(http_requests_total[5m])) by (status)
```

#### Invoice Creation Rate

```typescript
const invoicesCreatedTotal = new Counter({
  name: 'invoices_created_total',
  help: 'Total invoices created',
  labelNames: ['status', 'tipo_comprobante']
});

// Usage in invoice service
async function createInvoice(data: InvoiceData) {
  try {
    const invoice = await saveInvoice(data);
    invoicesCreatedTotal.inc({
      status: 'approved',
      tipo_comprobante: data.tipoComprobante
    });
    return invoice;
  } catch (error) {
    invoicesCreatedTotal.inc({
      status: 'failed',
      tipo_comprobante: data.tipoComprobante
    });
    throw error;
  }
}
```

**Metric**: `invoices_created_total`
**Labels**: `status` (approved, failed, pending), `tipo_comprobante` (1=A, 6=B, 11=C)
**Type**: Counter

**Key Queries**:
```promql
# Invoices created per hour
sum(rate(invoices_created_total[1h])) * 3600

# Failed invoice rate
rate(invoices_created_total{status="failed"}[5m])
```

#### ARCA API Call Rate

```typescript
const arcaApiCallsTotal = new Counter({
  name: 'arca_api_calls_total',
  help: 'Total ARCA API calls',
  labelNames: ['operation', 'status']
});

// Usage in ARCA client
async function callARCA(operation: string, params: any) {
  try {
    const result = await soapClient[operation](params);
    arcaApiCallsTotal.inc({
      operation,
      status: 'success'
    });
    return result;
  } catch (error) {
    arcaApiCallsTotal.inc({
      operation,
      status: 'error'
    });
    throw error;
  }
}
```

**Metric**: `arca_api_calls_total`
**Labels**: `operation` (authenticate, create_invoice, query_status), `status` (success, error)
**Type**: Counter

**Key Queries**:
```promql
# ARCA call rate per operation
rate(arca_api_calls_total[1m]) by (operation)

# ARCA error rate
rate(arca_api_calls_total{status="error"}[5m])
```

### Error Metrics

**Purpose**: Track error rates to detect degraded service quality.

#### HTTP Request Failures

```typescript
const httpRequestsFailedTotal = new Counter({
  name: 'http_requests_failed_total',
  help: 'Total failed HTTP requests',
  labelNames: ['method', 'path', 'error_type']
});

// Usage in error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  const errorType = err.name || 'UnknownError';

  httpRequestsFailedTotal.inc({
    method: req.method,
    path: req.route?.path || req.path,
    error_type: errorType
  });

  // Send error response
  res.status(500).json({ error: err.message });
});
```

**Metric**: `http_requests_failed_total`
**Labels**: `method`, `path`, `error_type`
**Type**: Counter

**Key Queries**:
```promql
# Error rate percentage
(rate(http_requests_failed_total[5m]) / rate(http_requests_total[5m])) * 100

# Errors by type
sum(rate(http_requests_failed_total[5m])) by (error_type)
```

#### ARCA API Errors

```typescript
const arcaApiErrorsTotal = new Counter({
  name: 'arca_api_errors_total',
  help: 'Total ARCA API errors',
  labelNames: ['error_code', 'operation']
});

// Usage in ARCA error handler
function handleARCAError(error: ARCAError, operation: string) {
  arcaApiErrorsTotal.inc({
    error_code: error.code || 'unknown',
    operation
  });

  logger.error('ARCA API error', {
    error_code: error.code,
    operation,
    message: error.message
  });
}
```

**Metric**: `arca_api_errors_total`
**Labels**: `error_code` (10001, 10002, 1000, 602, etc.), `operation`
**Type**: Counter

**Key Queries**:
```promql
# ARCA errors by code
sum(rate(arca_api_errors_total[5m])) by (error_code)

# Critical ARCA errors (authentication failures)
rate(arca_api_errors_total{error_code=~"10001|10002"}[1m])
```

#### Database Errors

```typescript
const databaseErrorsTotal = new Counter({
  name: 'database_errors_total',
  help: 'Total database errors',
  labelNames: ['query_type', 'error_code']
});

// Usage in database client
async function executeQuery(sql: string, params: any[], queryType: string) {
  try {
    return await pool.query(sql, params);
  } catch (error: any) {
    databaseErrorsTotal.inc({
      query_type: queryType,
      error_code: error.code || 'unknown'
    });
    throw error;
  }
}
```

**Metric**: `database_errors_total`
**Labels**: `query_type` (SELECT, INSERT, UPDATE), `error_code`
**Type**: Counter

**Key Queries**:
```promql
# Database error rate
rate(database_errors_total[5m])

# Connection pool exhaustion
rate(database_errors_total{error_code="53300"}[1m])
```

### Duration Metrics (Latency)

**Purpose**: Measure response times and identify performance degradation.

#### HTTP Request Duration

```typescript
import { Histogram } from 'prom-client';

const httpRequestDurationSeconds = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10]
});

// Usage in Express middleware
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDurationSeconds.observe({
      method: req.method,
      path: req.route?.path || req.path,
      status: res.statusCode
    }, duration);
  });

  next();
});
```

**Metric**: `http_request_duration_seconds`
**Labels**: `method`, `path`, `status`
**Type**: Histogram
**Buckets**: 10ms, 50ms, 100ms, 200ms, 500ms, 1s, 2s, 5s, 10s

**Key Queries**:
```promql
# P95 latency by endpoint
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, path))

# P99 latency
histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))

# Average latency
rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])
```

#### ARCA API Duration

```typescript
const arcaApiDurationSeconds = new Histogram({
  name: 'arca_api_duration_seconds',
  help: 'ARCA API call duration in seconds',
  labelNames: ['operation'],
  buckets: [0.1, 0.5, 1, 2, 3, 5, 10, 30]
});

// Usage in ARCA client
async function callARCAWithTiming(operation: string, params: any) {
  const start = Date.now();
  try {
    const result = await soapClient[operation](params);
    const duration = (Date.now() - start) / 1000;
    arcaApiDurationSeconds.observe({ operation }, duration);
    return result;
  } catch (error) {
    const duration = (Date.now() - start) / 1000;
    arcaApiDurationSeconds.observe({ operation }, duration);
    throw error;
  }
}
```

**Metric**: `arca_api_duration_seconds`
**Labels**: `operation`
**Type**: Histogram
**Buckets**: 100ms, 500ms, 1s, 2s, 3s, 5s, 10s, 30s

**Key Queries**:
```promql
# P95 ARCA latency
histogram_quantile(0.95, sum(rate(arca_api_duration_seconds_bucket[5m])) by (le, operation))

# Slow ARCA calls (>5s)
sum(rate(arca_api_duration_seconds_bucket{le="5"}[5m])) by (operation)
```

#### Database Query Duration

```typescript
const databaseQueryDurationSeconds = new Histogram({
  name: 'database_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['query_type', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.5, 1]
});

// Usage in database client
async function timedQuery(sql: string, params: any[], queryType: string, table: string) {
  const start = Date.now();
  try {
    const result = await pool.query(sql, params);
    const duration = (Date.now() - start) / 1000;
    databaseQueryDurationSeconds.observe({ query_type: queryType, table }, duration);
    return result;
  } catch (error) {
    const duration = (Date.now() - start) / 1000;
    databaseQueryDurationSeconds.observe({ query_type: queryType, table }, duration);
    throw error;
  }
}
```

**Metric**: `database_query_duration_seconds`
**Labels**: `query_type`, `table`
**Type**: Histogram
**Buckets**: 1ms, 5ms, 10ms, 25ms, 50ms, 100ms, 500ms, 1s

**Key Queries**:
```promql
# P95 query latency by table
histogram_quantile(0.95, sum(rate(database_query_duration_seconds_bucket[5m])) by (le, table))

# Slow queries (>100ms)
sum(rate(database_query_duration_seconds_bucket{le="0.1"}[5m])) by (table)
```

### Prometheus Scrape Endpoint

```typescript
import express from 'express';
import { register } from 'prom-client';

const app = express();

// Metrics endpoint for Prometheus scraping
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error);
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(3000, () => {
  console.log('Metrics server listening on :3000');
});
```

**Prometheus Scrape Configuration**:
```yaml
scrape_configs:
  - job_name: 'arca-api'
    scrape_interval: 15s
    scrape_timeout: 10s
    metrics_path: '/metrics'
    static_configs:
      - targets:
          - 'api-1.arca.internal:3000'
          - 'api-2.arca.internal:3000'
          - 'api-3.arca.internal:3000'
```

## Logging Standards

### Structured JSON Format

All logs must be output in JSON format for easy parsing and aggregation.

**Log Format Specification**:
```typescript
interface LogEntry {
  timestamp: string;      // ISO 8601 format
  level: 'debug' | 'info' | 'warn' | 'error';
  service: string;        // Service name (e.g., "rest-api-core")
  trace_id: string;       // Distributed trace ID
  user_id?: string;       // User ID if authenticated
  message: string;        // Human-readable message
  context?: object;       // Additional structured data
  error?: {               // Error details (if level=error)
    name: string;
    message: string;
    stack?: string;
  };
}
```

**Example Log Entry**:
```json
{
  "timestamp": "2025-10-19T15:30:45.123Z",
  "level": "info",
  "service": "rest-api-core",
  "trace_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "user_id": "usr_9876543210",
  "message": "Invoice created successfully",
  "context": {
    "invoice_id": "inv_abc123xyz",
    "tipo_comprobante": 6,
    "punto_venta": 1,
    "numero": 12345,
    "cae": "12345678901234",
    "cae_expiration": "2025-10-29",
    "duration_ms": 1234,
    "arca_duration_ms": 890
  }
}
```

**Error Log Example**:
```json
{
  "timestamp": "2025-10-19T15:31:22.456Z",
  "level": "error",
  "service": "rest-api-core",
  "trace_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "user_id": "usr_1234567890",
  "message": "ARCA API authentication failed",
  "context": {
    "operation": "authenticate",
    "cuit": "20123456789",
    "error_code": "10001"
  },
  "error": {
    "name": "ARCAAuthenticationError",
    "message": "Invalid certificate or token expired",
    "stack": "Error: Invalid certificate...\n    at ARCAClient.authenticate (/app/src/arca/client.ts:45:11)"
  }
}
```

### Log Levels

**Level Definitions**:

| Level | Usage | Retention | Production |
|-------|-------|-----------|------------|
| `error` | Production issues requiring immediate attention | 30 days | Yes |
| `warn` | Potential issues, retries, degraded performance | 30 days | Yes |
| `info` | Business events, significant state changes | 30 days | Yes |
| `debug` | Detailed traces, variable inspection | 7 days | No (staging/dev only) |

**Level Examples**:

```typescript
// ERROR: Production issues
logger.error('Database connection pool exhausted', {
  active_connections: 100,
  max_connections: 100,
  waiting_queries: 45
});

// WARN: Degraded performance
logger.warn('ARCA API slow response', {
  operation: 'create_invoice',
  duration_ms: 4500,
  threshold_ms: 3000
});

// INFO: Business events
logger.info('Invoice submitted to ARCA', {
  invoice_id: 'inv_abc123',
  tipo_comprobante: 6,
  total: 15000.00
});

// DEBUG: Detailed debugging (staging/dev only)
logger.debug('ARCA SOAP request payload', {
  operation: 'FECAESolicitar',
  payload: { /* full SOAP XML */ }
});
```

### Log Implementation

**Logger Setup with Winston**:
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'rest-api-core',
    environment: process.env.NODE_ENV
  },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: 'error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'combined.log'
    })
  ]
});

// Add trace_id to all logs within a request
export function withTraceId(traceId: string, fn: () => void) {
  const child = logger.child({ trace_id: traceId });
  // Pass child logger through request context
  fn();
}
```

### Log Aggregation

**Tools**: Better Stack (formerly Logtail) or Datadog

**Configuration**:
```typescript
// Better Stack integration
import { Logtail } from '@logtail/node';
import { LogtailTransport } from '@logtail/winston';

const logtail = new Logtail(process.env.LOGTAIL_SOURCE_TOKEN);

logger.add(new LogtailTransport(logtail));

// All logs now sent to Better Stack for aggregation
```

**Retention Policy**:
- **Production**: 30 days retention
- **Staging**: 7 days retention
- **Development**: No cloud aggregation (local only)

**Search & Analysis**:
- Full-text search on all fields
- Filtering by `trace_id` for request correlation
- Filtering by `user_id` for user-specific issues
- Custom dashboards for error rates by service
- Alerting on error spike patterns

## Distributed Tracing

### OpenTelemetry Setup

Distributed tracing allows us to track requests across multiple services and identify performance bottlenecks.

**OpenTelemetry Configuration**:
```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'rest-api-core',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV
  }),
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces'
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': { enabled: true },
      '@opentelemetry/instrumentation-express': { enabled: true },
      '@opentelemetry/instrumentation-pg': { enabled: true }
    })
  ]
});

sdk.start();

process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.error('Error shutting down tracing', error));
});
```

### Trace ID Propagation

**W3C Trace Context Headers**:
```typescript
// Automatic trace context propagation via OpenTelemetry
// Incoming request headers:
// traceparent: 00-a1b2c3d4e5f6789012345678901234-b2c3d4e5f6a7890-01

import { trace, context } from '@opentelemetry/api';

// Extract trace ID for logging
function getCurrentTraceId(): string {
  const span = trace.getActiveSpan();
  return span?.spanContext().traceId || 'no-trace-id';
}

// Use in logger
logger.info('Processing request', {
  trace_id: getCurrentTraceId(),
  // ... other fields
});
```

### Custom Spans

**Creating Custom Spans**:
```typescript
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('rest-api-core', '1.0.0');

async function createInvoice(data: InvoiceData) {
  return tracer.startActiveSpan('invoice.create', async (span) => {
    try {
      // Add custom attributes
      span.setAttribute('invoice.type', data.tipoComprobante);
      span.setAttribute('invoice.total', data.total);

      // Database operation
      const invoice = await tracer.startActiveSpan('database.insert', async (dbSpan) => {
        const result = await db.invoices.create(data);
        dbSpan.setAttribute('db.table', 'invoices');
        dbSpan.end();
        return result;
      });

      // ARCA API call
      const cae = await tracer.startActiveSpan('arca.submit', async (arcaSpan) => {
        arcaSpan.setAttribute('arca.operation', 'FECAESolicitar');
        const result = await arcaClient.submitInvoice(invoice);
        arcaSpan.setAttribute('arca.cae', result.cae);
        arcaSpan.end();
        return result;
      });

      span.setStatus({ code: 1 }); // OK
      span.end();
      return { invoice, cae };
    } catch (error) {
      span.setStatus({ code: 2, message: error.message }); // ERROR
      span.recordException(error);
      span.end();
      throw error;
    }
  });
}
```

### Span Definitions

**Standard Spans**:

| Span Name | Description | Attributes |
|-----------|-------------|------------|
| `http.request` | HTTP request handling | `http.method`, `http.route`, `http.status_code` |
| `database.query` | Database query execution | `db.operation`, `db.table`, `db.duration_ms` |
| `arca.api_call` | ARCA API SOAP call | `arca.operation`, `arca.cuit`, `arca.status` |
| `ai.generate` | AI service invoice generation | `ai.model`, `ai.tokens`, `ai.confidence` |
| `webhook.deliver` | Webhook delivery attempt | `webhook.url`, `webhook.event`, `webhook.status` |

### Sampling Strategy

**Sampling Configuration**:
```typescript
import { TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-base';
import { ParentBasedSampler } from '@opentelemetry/sdk-trace-base';

// Sample 100% of errors, 10% of successful requests
class ErrorAwareSampler extends TraceIdRatioBasedSampler {
  shouldSample(context, traceId, spanName, spanKind, attributes, links) {
    // Always sample if error
    if (attributes['http.status_code'] >= 400) {
      return { decision: 1 }; // RECORD_AND_SAMPLED
    }

    // Otherwise sample at 10% rate
    return super.shouldSample(context, traceId, spanName, spanKind, attributes, links);
  }
}

const sampler = new ParentBasedSampler({
  root: new ErrorAwareSampler(0.1) // 10% base sampling rate
});
```

**Sampling Rationale**:
- **100% errors**: Critical for debugging production issues
- **10% success**: Reduces volume while maintaining visibility
- **Expected volume**: ~120 traces/minute (from 1,200 req/min)

### Example Trace Tree

**Invoice Creation Flow**:
```
Trace ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
Duration: 2.4s

├─ http.request POST /v1/invoices (2.4s)
   │
   ├─ auth.validate_api_key (50ms)
   │  └─ database.query SELECT users WHERE api_key=? (45ms)
   │
   ├─ ai.generate (1.2s)
   │  ├─ database.query SELECT user_preferences (20ms)
   │  ├─ http.request POST /internal/ai/generate-invoice (1.15s)
   │  │  └─ openai.api_call gpt-4 (1.1s)
   │  └─ validation.verify_invoice_data (10ms)
   │
   ├─ database.insert invoices (40ms)
   │
   ├─ arca.authenticate (100ms)
   │  ├─ redis.get token:arca:{cuit} (5ms) [cache miss]
   │  └─ arca.wsaa.login (90ms)
   │     └─ http.request POST wswhomo.afip.gov.ar/wsaa (85ms)
   │
   └─ arca.submit_invoice (1.0s)
      ├─ arca.prepare_soap_request (20ms)
      └─ http.request POST wswhomo.afip.gov.ar/wsfev1 (950ms)
```

**Trace Analysis**:
- Total duration: 2.4s
- ARCA submission: 1.0s (42% of total time)
- AI generation: 1.2s (50% of total time)
- Database operations: ~100ms combined (4% of total time)
- **Optimization opportunity**: Cache AI results for repeated descriptions

## Alerting Rules

Alerts are categorized by severity: **CRITICAL** (page on-call immediately) and **WARNING** (notify team via Slack).

### CRITICAL Alerts (PagerDuty)

These alerts indicate customer-impacting issues requiring immediate response.

#### 1. High Error Rate

**Alert Name**: `ARCA API: High error rate (>5%)`

**Condition**:
```promql
(
  sum(rate(http_requests_failed_total[1m]))
  /
  sum(rate(http_requests_total[1m]))
) * 100 > 5
```

**Window**: 1 minute
**Action**: Page on-call engineer
**Severity**: CRITICAL

**Runbook**: See [High Error Rate Runbook](./runbooks/high-error-rate.md)

#### 2. High P95 Latency

**Alert Name**: `ARCA API: High P95 latency (>5s)`

**Condition**:
```promql
histogram_quantile(0.95,
  sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
) > 5
```

**Window**: 5 minutes
**Action**: Page on-call engineer
**Severity**: CRITICAL

**Runbook**: See [High Latency Runbook](./runbooks/high-latency.md)

#### 3. ARCA API Down

**Alert Name**: `ARCA API down (3 consecutive failures)`

**Condition**:
```promql
sum(increase(arca_api_errors_total{error_code=~"timeout|connection_refused"}[1m])) >= 3
```

**Window**: 1 minute
**Action**: Page on-call engineer
**Severity**: CRITICAL

**Runbook**: See [ARCA API Down Runbook](./runbooks/arca-api-down.md)

#### 4. Database Connection Pool Exhausted

**Alert Name**: `Database connection pool exhausted`

**Condition**:
```promql
sum(increase(database_errors_total{error_code="53300"}[1m])) > 0
```

**Window**: 1 minute
**Action**: Page on-call engineer
**Severity**: CRITICAL

**Runbook**: See [Database Issues Runbook](./runbooks/database-issues.md)

### WARNING Alerts (Slack)

These alerts indicate potential issues that should be investigated but are not yet customer-impacting.

#### 1. Elevated Error Rate

**Alert Name**: `ARCA API: Elevated error rate (>2%)`

**Condition**:
```promql
(
  sum(rate(http_requests_failed_total[5m]))
  /
  sum(rate(http_requests_total[5m]))
) * 100 > 2
```

**Window**: 5 minutes
**Action**: Post to Slack #alerts
**Severity**: WARNING

#### 2. Elevated P95 Latency

**Alert Name**: `ARCA API: Elevated P95 latency (>3s)`

**Condition**:
```promql
histogram_quantile(0.95,
  sum(rate(http_request_duration_seconds_bucket[10m])) by (le)
) > 3
```

**Window**: 10 minutes
**Action**: Post to Slack #alerts
**Severity**: WARNING

#### 3. ARCA API Slow

**Alert Name**: `ARCA API slow (>3s average)`

**Condition**:
```promql
avg(rate(arca_api_duration_seconds_sum[5m]) / rate(arca_api_duration_seconds_count[5m])) > 3
```

**Window**: 5 minutes
**Action**: Post to Slack #alerts
**Severity**: WARNING

#### 4. High Disk Usage

**Alert Name**: `High disk usage (>80%)`

**Condition**:
```promql
(
  node_filesystem_size_bytes{mountpoint="/"} - node_filesystem_free_bytes{mountpoint="/"}
) / node_filesystem_size_bytes{mountpoint="/"} * 100 > 80
```

**Window**: 5 minutes
**Action**: Post to Slack #alerts
**Severity**: WARNING

### Alert Configuration Example

**PagerDuty Integration**:
```yaml
# Alertmanager configuration
receivers:
  - name: 'pagerduty-critical'
    pagerduty_configs:
      - service_key: '<pagerduty-integration-key>'
        severity: 'critical'
        description: '{{ .CommonAnnotations.summary }}'

  - name: 'slack-warnings'
    slack_configs:
      - api_url: '<slack-webhook-url>'
        channel: '#alerts'
        title: 'ARCA API Alert'
        text: '{{ .CommonAnnotations.description }}'

route:
  group_by: ['alertname', 'severity']
  group_wait: 10s
  group_interval: 5m
  repeat_interval: 4h
  receiver: 'slack-warnings'

  routes:
    - match:
        severity: 'critical'
      receiver: 'pagerduty-critical'
      repeat_interval: 5m
```

## SLO/SLI Definitions

Service Level Objectives (SLOs) define target reliability levels. Service Level Indicators (SLIs) are the metrics we measure.

### Availability SLO

**Target**: 99.95% uptime

**Calculation**:
```promql
(
  sum(rate(http_requests_total{status!~"5.."}[30d]))
  /
  sum(rate(http_requests_total[30d]))
) * 100
```

**Error Budget**:
- 99.95% uptime = 4.38 hours downtime per year
- Monthly budget: 21.6 minutes downtime
- Alert when 50% consumed (10.8 minutes)

**Measurement Period**: 30-day rolling window

**Exclusions**:
- Scheduled maintenance (with 7-day notice)
- ARCA government API downtime (external dependency)

### Latency SLO

**Target**: P95 latency <200ms (excluding ARCA API calls)

**Calculation**:
```promql
histogram_quantile(0.95,
  sum(rate(http_request_duration_seconds_bucket{path!~".*/arca/.*"}[30d])) by (le)
) < 0.2
```

**Error Budget**:
- 5% of requests allowed to exceed 200ms
- For 1,000 requests: 50 can be slow
- Alert when 50% consumed (2.5% slow requests)

**Measurement Period**: 30-day rolling window

**Exclusions**:
- ARCA API submission endpoints (inherently slow, >3s)
- AI generation endpoints (separate SLO: <3s)

### Error Rate SLO

**Target**: <0.1% error rate (999 successes per 1,000 requests)

**Calculation**:
```promql
(
  sum(rate(http_requests_total{status=~"5.."}[30d]))
  /
  sum(rate(http_requests_total[30d]))
) * 100 < 0.1
```

**Error Budget**:
- 0.1% = 1 error per 1,000 requests
- For 1M requests/month: 1,000 errors allowed
- Alert when 50% consumed (0.05% error rate)

**Measurement Period**: 30-day rolling window

**Exclusions**:
- Client errors (4xx responses) - not counted
- Errors during scheduled maintenance

### SLO Dashboard

**Grafana Dashboard Panels**:

```json
{
  "panels": [
    {
      "title": "Availability SLO (99.95%)",
      "targets": [
        {
          "expr": "sum(rate(http_requests_total{status!~\"5..\"}[30d])) / sum(rate(http_requests_total[30d])) * 100"
        }
      ],
      "thresholds": [
        { "value": 99.95, "color": "green" },
        { "value": 99.90, "color": "yellow" },
        { "value": 0, "color": "red" }
      ]
    },
    {
      "title": "P95 Latency SLO (<200ms)",
      "targets": [
        {
          "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[30d])) by (le)) * 1000"
        }
      ],
      "thresholds": [
        { "value": 200, "color": "green" },
        { "value": 300, "color": "yellow" },
        { "value": 500, "color": "red" }
      ]
    },
    {
      "title": "Error Rate SLO (<0.1%)",
      "targets": [
        {
          "expr": "sum(rate(http_requests_total{status=~\"5..\"}[30d])) / sum(rate(http_requests_total[30d])) * 100"
        }
      ],
      "thresholds": [
        { "value": 0.1, "color": "green" },
        { "value": 0.2, "color": "yellow" },
        { "value": 0.5, "color": "red" }
      ]
    },
    {
      "title": "Error Budget Remaining",
      "targets": [
        {
          "expr": "(1 - (sum(rate(http_requests_total{status=~\"5..\"}[30d])) / sum(rate(http_requests_total[30d]))) / 0.001) * 100"
        }
      ]
    }
  ]
}
```

## Monitoring Tools

### Recommended Stack

**Metrics Collection**: Prometheus
**Metrics Visualization**: Grafana
**Log Aggregation**: Better Stack or Datadog
**Distributed Tracing**: Jaeger or Datadog APM
**Alerting**: Prometheus Alertmanager + PagerDuty
**Status Page**: Statuspage.io

### Alternative Stack

**All-in-One**: Datadog
- Metrics, logs, traces in single platform
- Higher cost but simpler management
- Better for smaller teams

## Implementation Checklist

- [ ] Install `prom-client` package
- [ ] Add metrics collection to all critical paths
- [ ] Expose `/metrics` endpoint for Prometheus scraping
- [ ] Configure structured JSON logging with Winston
- [ ] Set up Better Stack or Datadog log aggregation
- [ ] Install OpenTelemetry SDK and instrumentations
- [ ] Configure trace exporter (OTLP)
- [ ] Create custom spans for ARCA and AI operations
- [ ] Set up Prometheus server and configure scraping
- [ ] Create Grafana dashboards for RED metrics
- [ ] Configure Alertmanager with PagerDuty integration
- [ ] Set up Slack webhook for warning alerts
- [ ] Create alert rules for all critical conditions
- [ ] Test alerts in staging environment
- [ ] Document runbooks for all critical alerts
- [ ] Schedule SLO review meetings (monthly)

## Related Documentation

- [ARCA API Down Runbook](./runbooks/arca-api-down.md) - What to do when ARCA is unavailable
- [Database Issues Runbook](./runbooks/database-issues.md) - Connection pool and slow query troubleshooting
- [Deployment Guide](./deployment-guide.md) - Production deployment procedures
- [Infrastructure](../architecture/04-infrastructure.md) - Cloud architecture and scaling
- [Service Architecture](../architecture/02-services.md) - Service endpoints and performance targets

---

**Last Updated**: 2025-10-19
**Maintained By**: SRE Team
**Next Review**: 2025-11-19
