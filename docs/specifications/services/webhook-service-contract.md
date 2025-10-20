# Webhook Engine Service Contract

## Overview

**Service Name**: Webhook Engine
**Technology**: Node.js + BullMQ
**Responsibility**: Reliable webhook event delivery to external endpoints with retry logic
**Communication**: Asynchronous (Redis queue consumer)

The Webhook Engine is responsible for delivering events from the ARCA API platform to customer-configured webhook endpoints. It provides guaranteed delivery with exponential backoff retry strategy, HMAC signature verification, and comprehensive delivery logging.

## Architecture Pattern

```
┌─────────────────┐         ┌───────────────┐         ┌──────────────────┐
│  REST API Core  │ ──────> │  Redis Queue  │ ──────> │ Webhook Engine   │
│  (Publisher)    │ publish │   (BullMQ)    │ consume │  (Consumer)      │
└─────────────────┘         └───────────────┘         └──────────────────┘
                                                              │
                                                              │ POST with
                                                              │ signature
                                                              ▼
                                                       ┌──────────────┐
                                                       │  Customer    │
                                                       │  Webhook URL │
                                                       └──────────────┘
                                                              │
                                                              │ response
                                                              ▼
                                                       ┌──────────────┐
                                                       │  PostgreSQL  │
                                                       │  (Logging)   │
                                                       └──────────────┘
```

## Queue Job Format

The Webhook Engine consumes jobs from the Redis queue with the following format:

### Job Schema

```json
{
  "type": "object",
  "properties": {
    "event": {
      "type": "string",
      "enum": [
        "invoice.created",
        "invoice.approved",
        "invoice.failed",
        "invoice.updated",
        "invoice.cancelled",
        "compliance.alert",
        "certificate.expiring",
        "certificate.expired"
      ],
      "description": "Event type following webhook event naming convention"
    },
    "webhook_url": {
      "type": "string",
      "format": "uri",
      "description": "Customer's webhook endpoint URL (HTTPS required)"
    },
    "payload": {
      "type": "object",
      "description": "Event-specific data to be delivered"
    },
    "signature_secret": {
      "type": "string",
      "description": "HMAC secret for signature generation (retrieved from user's webhook config)"
    },
    "retry_count": {
      "type": "integer",
      "minimum": 0,
      "default": 0,
      "description": "Current retry attempt number"
    },
    "max_retries": {
      "type": "integer",
      "minimum": 0,
      "maximum": 5,
      "default": 3,
      "description": "Maximum retry attempts before marking as failed"
    },
    "user_id": {
      "type": "string",
      "format": "uuid",
      "description": "User ID for logging and alerting"
    },
    "webhook_id": {
      "type": "string",
      "format": "uuid",
      "description": "Webhook configuration ID"
    },
    "idempotency_key": {
      "type": "string",
      "description": "Unique identifier for this delivery attempt (prevents duplicates)"
    }
  },
  "required": [
    "event",
    "webhook_url",
    "payload",
    "signature_secret",
    "user_id",
    "webhook_id",
    "idempotency_key"
  ]
}
```

### Example Job Payload: Invoice Created Event

```json
{
  "event": "invoice.created",
  "webhook_url": "https://customer.example.com/webhooks/arca",
  "payload": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "invoice.created",
    "timestamp": "2025-10-15T14:30:00.000Z",
    "data": {
      "invoice_id": "550e8400-e29b-41d4-a716-446655440000",
      "invoice_number": "00001-00000123",
      "tipo_comprobante": 1,
      "punto_venta": 1,
      "numero": 123,
      "fecha_emision": "2025-10-15",
      "cliente": {
        "tipo_documento": 80,
        "numero_documento": "20123456789",
        "razon_social": "Cliente SA"
      },
      "total": 12100.00,
      "estado": "approved",
      "cae": "72345678901234",
      "cae_vencimiento": "2025-10-25",
      "pdf_url": "https://arcaapi.com/invoices/550e8400-e29b-41d4-a716-446655440000/pdf"
    }
  },
  "signature_secret": "wh_secret_abc123xyz456",
  "retry_count": 0,
  "max_retries": 3,
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "webhook_id": "789e4567-e89b-12d3-a456-426614174999",
  "idempotency_key": "evt_550e8400-e29b-41d4-a716-446655440000_1729003800000"
}
```

### Example Job Payload: Compliance Alert Event

```json
{
  "event": "compliance.alert",
  "webhook_url": "https://customer.example.com/webhooks/arca",
  "payload": {
    "id": "660e8400-e29b-41d4-a716-446655440011",
    "type": "compliance.alert",
    "timestamp": "2025-10-15T14:35:00.000Z",
    "data": {
      "alert_type": "certificate_expiring",
      "severity": "warning",
      "message": "Su certificado AFIP vence en 7 días",
      "certificate_id": "cert_abc123",
      "expiration_date": "2025-10-22",
      "days_remaining": 7,
      "action_required": "Renovar certificado en https://arcaapi.com/settings/certificates"
    }
  },
  "signature_secret": "wh_secret_abc123xyz456",
  "retry_count": 0,
  "max_retries": 3,
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "webhook_id": "789e4567-e89b-12d3-a456-426614174999",
  "idempotency_key": "evt_660e8400-e29b-41d4-a716-446655440011_1729004100000"
}
```

## Webhook Delivery Protocol

### HTTP Request Format

The Webhook Engine delivers events via HTTP POST with the following format:

```http
POST https://customer.example.com/webhooks/arca HTTP/1.1
Host: customer.example.com
Content-Type: application/json
Content-Length: 512
User-Agent: ARCA-Webhook/1.0
X-ARCA-Signature: sha256=2b8f9c1a3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a
X-ARCA-Event: invoice.created
X-ARCA-Delivery-ID: 550e8400-e29b-41d4-a716-446655440000
X-ARCA-Timestamp: 1729003800

{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "invoice.created",
  "timestamp": "2025-10-15T14:30:00.000Z",
  "data": {
    "invoice_id": "550e8400-e29b-41d4-a716-446655440000",
    "invoice_number": "00001-00000123",
    "tipo_comprobante": 1,
    "punto_venta": 1,
    "numero": 123,
    "fecha_emision": "2025-10-15",
    "cliente": {
      "tipo_documento": 80,
      "numero_documento": "20123456789",
      "razon_social": "Cliente SA"
    },
    "total": 12100.00,
    "estado": "approved",
    "cae": "72345678901234",
    "cae_vencimiento": "2025-10-25",
    "pdf_url": "https://arcaapi.com/invoices/550e8400-e29b-41d4-a716-446655440000/pdf"
  }
}
```

### Request Headers

| Header | Description | Example |
|--------|-------------|---------|
| `Content-Type` | Always `application/json` | `application/json` |
| `User-Agent` | Identifies the webhook sender | `ARCA-Webhook/1.0` |
| `X-ARCA-Signature` | HMAC-SHA256 signature for verification | `sha256=2b8f9c1a3d4e5f6a...` |
| `X-ARCA-Event` | Event type being delivered | `invoice.created` |
| `X-ARCA-Delivery-ID` | Unique delivery attempt ID | `550e8400-e29b-41d4-a716-...` |
| `X-ARCA-Timestamp` | Unix timestamp of delivery attempt | `1729003800` |

### Signature Verification

The `X-ARCA-Signature` header contains an HMAC-SHA256 signature for webhook verification.

**Format**: `sha256=<hex_signature>`

**Signature Generation**:
```javascript
const crypto = require('crypto');

function generateSignature(payload, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  return `sha256=${hmac.digest('hex')}`;
}

// Example
const payload = { id: "550e8400-...", type: "invoice.created", ... };
const secret = "wh_secret_abc123xyz456";
const signature = generateSignature(payload, secret);
// Result: "sha256=2b8f9c1a3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a"
```

**Customer Verification (Node.js)**:
```javascript
function verifyWebhookSignature(receivedSignature, payload, secret) {
  const expectedSignature = generateSignature(payload, secret);

  // Use constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(receivedSignature),
    Buffer.from(expectedSignature)
  );
}

// Usage in webhook handler
app.post('/webhooks/arca', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-arca-signature'];
  const payload = JSON.parse(req.body.toString());
  const secret = process.env.ARCA_WEBHOOK_SECRET;

  if (!verifyWebhookSignature(signature, payload, secret)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Process webhook event
  console.log('Received event:', payload.type);
  res.status(200).json({ received: true });
});
```

**Customer Verification (Python)**:
```python
import hmac
import hashlib
import json

def verify_webhook_signature(received_signature: str, payload: dict, secret: str) -> bool:
    expected_signature = f"sha256={hmac.new(
        secret.encode(),
        json.dumps(payload).encode(),
        hashlib.sha256
    ).hexdigest()}"

    # Use constant-time comparison
    return hmac.compare_digest(received_signature, expected_signature)

# Usage in webhook handler (Flask)
@app.route('/webhooks/arca', methods=['POST'])
def webhook_handler():
    signature = request.headers.get('X-ARCA-Signature')
    payload = request.get_json()
    secret = os.environ['ARCA_WEBHOOK_SECRET']

    if not verify_webhook_signature(signature, payload, secret):
        return jsonify({'error': 'Invalid signature'}), 401

    # Process webhook event
    print(f"Received event: {payload['type']}")
    return jsonify({'received': True}), 200
```

## Response Handling

The Webhook Engine interprets HTTP responses according to the following rules:

### Success (2xx Status Codes)

**Status Codes**: 200, 201, 202, 204

**Behavior**:
- Mark delivery as **successful**
- Log to `webhook_deliveries` table with status `delivered`
- No retry attempts
- Customer webhook acknowledged the event

**Example**:
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "received": true,
  "processed_at": "2025-10-15T14:30:05.000Z"
}
```

### Client Error (4xx Status Codes)

**Status Codes**: 400, 401, 403, 404, 405, 410, 422, etc.

**Behavior**:
- Mark delivery as **failed** (permanent failure)
- **No retry attempts** (client error indicates problem with webhook configuration or payload)
- Log to `webhook_deliveries` table with status `failed`
- Alert user via dashboard notification

**Reasoning**: 4xx errors indicate client-side issues that won't be resolved by retrying:
- 400: Bad request format
- 401: Missing or invalid signature
- 403: Webhook endpoint disabled
- 404: Webhook URL not found
- 410: Webhook permanently disabled

**Example**:
```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "error": "Invalid signature",
  "detail": "X-ARCA-Signature header verification failed"
}
```

### Server Error (5xx Status Codes)

**Status Codes**: 500, 502, 503, 504, etc.

**Behavior**:
- Mark delivery as **pending retry**
- Retry with exponential backoff (see Retry Strategy section)
- Log each attempt to `webhook_deliveries` table
- After max retries exhausted, mark as `failed` and alert user

**Reasoning**: 5xx errors indicate temporary server-side issues that may resolve:
- 500: Internal server error
- 502: Bad gateway
- 503: Service unavailable (overloaded or maintenance)
- 504: Gateway timeout

**Example**:
```http
HTTP/1.1 503 Service Unavailable
Content-Type: application/json
Retry-After: 300

{
  "error": "Service temporarily unavailable",
  "detail": "Server under maintenance, retry in 5 minutes"
}
```

### Timeout

**Condition**: No response received within 30 seconds

**Behavior**:
- Treat as server error (5xx equivalent)
- Retry with exponential backoff
- Log timeout in `webhook_deliveries` table

### Network Error

**Condition**: Connection refused, DNS resolution failure, SSL/TLS error

**Behavior**:
- Treat as server error (5xx equivalent)
- Retry with exponential backoff
- Log error details in `webhook_deliveries` table

## Retry Strategy

The Webhook Engine uses exponential backoff for failed deliveries:

### Retry Schedule

| Attempt | Delay After Failure | Total Elapsed Time |
|---------|---------------------|-------------------|
| 1 (initial) | - | 0 seconds |
| 2 | 1 minute | 1 minute |
| 3 | 5 minutes | 6 minutes |
| 4 | 15 minutes | 21 minutes |

**Default**: 3 retries (4 total delivery attempts)
**Configurable**: Up to 5 retries per webhook configuration

### Retry Logic

```javascript
// BullMQ job options
const jobOptions = {
  attempts: 4, // 1 initial + 3 retries
  backoff: {
    type: 'custom',
    delay: (attemptNumber) => {
      const delays = [0, 60000, 300000, 900000]; // 0s, 1m, 5m, 15m
      return delays[attemptNumber - 1] || 900000; // fallback to 15m
    }
  },
  removeOnComplete: false, // Keep successful deliveries for audit
  removeOnFail: false // Keep failed deliveries for debugging
};

// Add job to queue
await webhookQueue.add('webhook.delivery', jobData, jobOptions);
```

### Retry Termination

After **max_retries** exhausted:
1. Mark delivery as **permanently failed**
2. Log final failure to `webhook_deliveries` table
3. Create user notification:
   ```json
   {
     "type": "webhook_delivery_failed",
     "severity": "warning",
     "message": "Webhook delivery failed after 4 attempts",
     "webhook_url": "https://customer.example.com/webhooks/arca",
     "event": "invoice.created",
     "last_error": "503 Service Unavailable",
     "action": "Check webhook endpoint health and logs"
   }
   ```

## Logging Strategy

All webhook delivery attempts are logged to the `webhook_deliveries` table in PostgreSQL:

### Database Schema

```sql
CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Event details
  event_type VARCHAR(100) NOT NULL,
  event_id VARCHAR(255) NOT NULL,
  idempotency_key VARCHAR(255) NOT NULL UNIQUE,

  -- Delivery details
  webhook_url TEXT NOT NULL,
  payload JSONB NOT NULL,

  -- Response details
  status VARCHAR(50) NOT NULL, -- 'pending', 'delivered', 'failed'
  http_status_code INTEGER,
  response_body TEXT,
  response_headers JSONB,
  error_message TEXT,

  -- Retry tracking
  attempt_number INTEGER NOT NULL DEFAULT 1,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  next_retry_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,

  -- Indexes for queries
  INDEX idx_webhook_deliveries_webhook_id (webhook_id),
  INDEX idx_webhook_deliveries_user_id (user_id),
  INDEX idx_webhook_deliveries_status (status),
  INDEX idx_webhook_deliveries_created_at (created_at DESC),
  INDEX idx_webhook_deliveries_idempotency_key (idempotency_key)
);
```

### Log Entry Example: Successful Delivery

```json
{
  "id": "990e8400-e29b-41d4-a716-446655440088",
  "webhook_id": "789e4567-e89b-12d3-a456-426614174999",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "event_type": "invoice.created",
  "event_id": "550e8400-e29b-41d4-a716-446655440000",
  "idempotency_key": "evt_550e8400-e29b-41d4-a716-446655440000_1729003800000",
  "webhook_url": "https://customer.example.com/webhooks/arca",
  "payload": { "id": "550e8400-...", "type": "invoice.created", ... },
  "status": "delivered",
  "http_status_code": 200,
  "response_body": "{\"received\": true}",
  "response_headers": {
    "content-type": "application/json",
    "x-request-id": "abc123"
  },
  "attempt_number": 1,
  "retry_count": 0,
  "max_retries": 3,
  "created_at": "2025-10-15T14:30:00.000Z",
  "delivered_at": "2025-10-15T14:30:01.234Z"
}
```

### Log Entry Example: Failed After Retries

```json
{
  "id": "880e8400-e29b-41d4-a716-446655440077",
  "webhook_id": "789e4567-e89b-12d3-a456-426614174999",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "event_type": "invoice.created",
  "event_id": "550e8400-e29b-41d4-a716-446655440000",
  "idempotency_key": "evt_550e8400-e29b-41d4-a716-446655440000_1729003800001",
  "webhook_url": "https://customer.example.com/webhooks/arca",
  "payload": { "id": "550e8400-...", "type": "invoice.created", ... },
  "status": "failed",
  "http_status_code": 503,
  "response_body": "{\"error\": \"Service temporarily unavailable\"}",
  "response_headers": {
    "content-type": "application/json",
    "retry-after": "300"
  },
  "error_message": "Max retries (3) exhausted. Last error: 503 Service Unavailable",
  "attempt_number": 4,
  "retry_count": 3,
  "max_retries": 3,
  "created_at": "2025-10-15T14:30:00.000Z",
  "failed_at": "2025-10-15T14:51:00.000Z"
}
```

## Performance Expectations

| Metric | Target | Notes |
|--------|--------|-------|
| Queue Latency | P50 <100ms, P95 <500ms | Time from job publish to consumer pickup |
| Delivery Latency | P50 <2s, P95 <5s | Time from consumer pickup to customer response |
| Throughput | 1000 events/second | Horizontally scalable with multiple consumers |
| Availability | 99.9% uptime | Redis queue provides at-least-once delivery |
| Queue Depth | <10,000 jobs | Alert if queue grows beyond capacity |

### Scaling Strategy

**Horizontal Scaling**:
- Add more Webhook Engine worker instances
- BullMQ automatically distributes jobs across consumers
- No coordination required (stateless workers)

**Monitoring**:
- Queue depth (alert if >10,000)
- Delivery success rate (alert if <95%)
- Average delivery latency (alert if P95 >10s)
- Failed deliveries per user (alert if >10 in 1 hour)

## Error Handling

### Idempotency

The Webhook Engine ensures **at-least-once delivery** but prevents duplicate processing:

- Each event has a unique `idempotency_key`
- Database constraint prevents duplicate log entries
- Customers should implement idempotency on their side using `X-ARCA-Delivery-ID` header

**Customer Best Practice**:
```javascript
// Store processed delivery IDs to prevent duplicate processing
const processedDeliveries = new Set();

app.post('/webhooks/arca', (req, res) => {
  const deliveryId = req.headers['x-arca-delivery-id'];

  if (processedDeliveries.has(deliveryId)) {
    console.log('Duplicate delivery, already processed');
    return res.status(200).json({ received: true, duplicate: true });
  }

  // Process event
  processWebhookEvent(req.body);
  processedDeliveries.add(deliveryId);

  res.status(200).json({ received: true });
});
```

### Circuit Breaker

To prevent overwhelming failing webhook endpoints:

**Configuration**:
- Failure threshold: 10 consecutive failures in 5 minutes
- Open duration: 30 minutes
- Half-open test: 1 delivery attempt

**States**:
- **Closed** (normal): Deliver webhooks normally
- **Open** (failing): Skip delivery, mark as failed immediately, notify user
- **Half-open** (testing): Attempt 1 delivery, if successful → Closed, if failed → Open

**User Notification** (circuit breaker opened):
```json
{
  "type": "webhook_circuit_breaker_opened",
  "severity": "error",
  "message": "Webhook endpoint unreachable, deliveries paused for 30 minutes",
  "webhook_url": "https://customer.example.com/webhooks/arca",
  "failure_count": 10,
  "action": "Check webhook endpoint health and update URL if needed"
}
```

## Security Considerations

### HTTPS Enforcement

- All webhook URLs **must use HTTPS**
- Reject HTTP URLs during webhook configuration
- Validate SSL/TLS certificates (no self-signed in production)

### Secret Management

- Webhook secrets stored encrypted in PostgreSQL
- Secrets generated with cryptographically secure random generator (32+ bytes)
- Rotate secrets on demand via API

### Rate Limiting

- Max 100 webhook deliveries per user per minute
- Prevents abuse and protects customer endpoints
- Returns 429 status if rate limit exceeded

### PII Protection

- Webhook payloads may contain customer PII (names, document numbers)
- Customers responsible for securing their webhook endpoints
- Recommend IP whitelisting and authentication on customer side

## Examples

### Example 1: Simple Webhook Handler (Express.js)

```javascript
const express = require('express');
const crypto = require('crypto');

const app = express();

// Use raw body parser to verify signature
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString('utf8');
  }
}));

function verifySignature(signature, body, secret) {
  const expectedSignature = `sha256=${crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')}`;

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

app.post('/webhooks/arca', (req, res) => {
  const signature = req.headers['x-arca-signature'];
  const event = req.headers['x-arca-event'];
  const deliveryId = req.headers['x-arca-delivery-id'];
  const secret = process.env.ARCA_WEBHOOK_SECRET;

  // Verify signature
  if (!verifySignature(signature, req.rawBody, secret)) {
    console.error('Invalid signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Process event
  console.log(`Received event: ${event} (delivery: ${deliveryId})`);

  switch (req.body.type) {
    case 'invoice.created':
      handleInvoiceCreated(req.body.data);
      break;
    case 'invoice.approved':
      handleInvoiceApproved(req.body.data);
      break;
    case 'compliance.alert':
      handleComplianceAlert(req.body.data);
      break;
    default:
      console.log(`Unknown event type: ${req.body.type}`);
  }

  res.status(200).json({ received: true });
});

function handleInvoiceCreated(invoice) {
  console.log(`New invoice created: ${invoice.invoice_number}`);
  // Store in your database, send notification, etc.
}

function handleInvoiceApproved(invoice) {
  console.log(`Invoice approved: ${invoice.invoice_number}, CAE: ${invoice.cae}`);
  // Update order status, send confirmation email, etc.
}

function handleComplianceAlert(alert) {
  console.log(`Compliance alert: ${alert.alert_type} - ${alert.message}`);
  // Send notification to admin, create task, etc.
}

app.listen(3000, () => {
  console.log('Webhook handler listening on port 3000');
});
```

### Example 2: Webhook Testing with ngrok

For local development, use ngrok to expose your webhook handler:

```bash
# Start your webhook handler locally
node webhook-handler.js

# In another terminal, expose it via ngrok
ngrok http 3000

# Use the ngrok URL as your webhook URL
# https://abc123.ngrok.io/webhooks/arca
```

### Example 3: Webhook Configuration via API

```bash
# Create a new webhook
curl -X POST https://api.arcaapi.com/v1/webhooks \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://customer.example.com/webhooks/arca",
    "events": ["invoice.created", "invoice.approved", "compliance.alert"],
    "description": "Production webhook for invoice notifications",
    "active": true
  }'

# Response
{
  "id": "789e4567-e89b-12d3-a456-426614174999",
  "url": "https://customer.example.com/webhooks/arca",
  "events": ["invoice.created", "invoice.approved", "compliance.alert"],
  "secret": "wh_secret_abc123xyz456...",
  "description": "Production webhook for invoice notifications",
  "active": true,
  "created_at": "2025-10-15T14:00:00.000Z"
}
```

### Example 4: Webhook Delivery Logs Query

```bash
# Get webhook delivery logs for last 24 hours
curl -X GET "https://api.arcaapi.com/v1/webhooks/789e4567-e89b-12d3-a456-426614174999/deliveries?since=2025-10-14T14:00:00Z" \
  -H "Authorization: Bearer $API_KEY"

# Response
{
  "deliveries": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440088",
      "event_type": "invoice.created",
      "status": "delivered",
      "http_status_code": 200,
      "attempt_number": 1,
      "created_at": "2025-10-15T14:30:00.000Z",
      "delivered_at": "2025-10-15T14:30:01.234Z"
    },
    {
      "id": "880e8400-e29b-41d4-a716-446655440077",
      "event_type": "invoice.created",
      "status": "failed",
      "http_status_code": 503,
      "attempt_number": 4,
      "retry_count": 3,
      "error_message": "Max retries exhausted",
      "created_at": "2025-10-15T14:30:00.000Z",
      "failed_at": "2025-10-15T14:51:00.000Z"
    }
  ],
  "pagination": {
    "total": 2,
    "page": 1,
    "per_page": 50
  }
}
```

## Testing

### Contract Tests

```javascript
describe('Webhook Engine Contract', () => {
  describe('Job Format Validation', () => {
    it('should accept valid job format', () => {
      const job = {
        event: 'invoice.created',
        webhook_url: 'https://customer.example.com/webhooks/arca',
        payload: { id: '550e8400-...', type: 'invoice.created', data: {...} },
        signature_secret: 'wh_secret_abc123',
        retry_count: 0,
        max_retries: 3,
        user_id: '123e4567-...',
        webhook_id: '789e4567-...',
        idempotency_key: 'evt_550e8400_1729003800000'
      };

      const result = validateJobSchema(job);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid event type', () => {
      const job = {
        event: 'invalid.event',
        webhook_url: 'https://customer.example.com/webhooks/arca',
        // ... other fields
      };

      const result = validateJobSchema(job);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('event must be one of the allowed values');
    });
  });

  describe('Signature Generation', () => {
    it('should generate valid HMAC-SHA256 signature', () => {
      const payload = { id: '550e8400-...', type: 'invoice.created' };
      const secret = 'test_secret';

      const signature = generateSignature(payload, secret);

      expect(signature).toMatch(/^sha256=[a-f0-9]{64}$/);
      expect(verifySignature(signature, payload, secret)).toBe(true);
    });
  });

  describe('Response Handling', () => {
    it('should mark 200 response as delivered', async () => {
      const job = createTestJob();

      nock('https://customer.example.com')
        .post('/webhooks/arca')
        .reply(200, { received: true });

      const result = await webhookEngine.deliverWebhook(job);

      expect(result.status).toBe('delivered');
      expect(result.http_status_code).toBe(200);
    });

    it('should not retry 404 response', async () => {
      const job = createTestJob();

      nock('https://customer.example.com')
        .post('/webhooks/arca')
        .reply(404, { error: 'Not found' });

      const result = await webhookEngine.deliverWebhook(job);

      expect(result.status).toBe('failed');
      expect(result.should_retry).toBe(false);
    });

    it('should retry 503 response with backoff', async () => {
      const job = createTestJob();

      nock('https://customer.example.com')
        .post('/webhooks/arca')
        .reply(503, { error: 'Service unavailable' });

      const result = await webhookEngine.deliverWebhook(job);

      expect(result.status).toBe('pending');
      expect(result.should_retry).toBe(true);
      expect(result.next_retry_delay).toBe(60000); // 1 minute
    });
  });

  describe('Retry Logic', () => {
    it('should use exponential backoff delays', () => {
      expect(getRetryDelay(1)).toBe(60000);    // 1 minute
      expect(getRetryDelay(2)).toBe(300000);   // 5 minutes
      expect(getRetryDelay(3)).toBe(900000);   // 15 minutes
    });

    it('should fail after max retries', async () => {
      const job = { ...createTestJob(), retry_count: 3, max_retries: 3 };

      nock('https://customer.example.com')
        .post('/webhooks/arca')
        .reply(503);

      const result = await webhookEngine.deliverWebhook(job);

      expect(result.status).toBe('failed');
      expect(result.should_retry).toBe(false);
    });
  });
});
```

## Related Documentation

- [Architecture - Services](../../architecture/02-services.md) - Webhook Engine in system architecture
- [API Specifications](../api/README.md) - Webhook management endpoints
- [Flows - Webhook Delivery](../../flows/05-webhook-delivery.md) - End-to-end webhook flow
- [Development - Webhook Testing](../../development/testing-webhooks.md) - Testing guidelines

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-10-15 | Initial webhook service contract specification |

---

**Last Updated**: 2025-10-15
**Status**: Complete
**Owner**: Backend Team
**Review**: Pending
