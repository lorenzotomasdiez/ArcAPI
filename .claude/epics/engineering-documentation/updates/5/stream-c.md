---
issue: 5
stream: Webhook Service Contract
agent: general-purpose
started: 2025-10-15T13:49:55Z
completed: 2025-10-15T14:15:00Z
status: completed
---

# Stream C: Webhook Service Contract

## Scope
Document the Webhook Engine internal contract for event delivery

## Files Created/Modified
- `docs/specifications/services/webhook-service-contract.md` ✓ (created)
- `docs/specifications/services/README.md` ✓ (updated)

## Work Completed

### 1. Created webhook-service-contract.md
Comprehensive webhook service contract specification with:

**Queue Job Format**:
- Complete JSON schema for Redis queue jobs
- Example payloads for invoice.created and compliance.alert events
- Required fields: event, webhook_url, payload, signature_secret, retry_count, max_retries, user_id, webhook_id, idempotency_key

**HTTP Delivery Protocol**:
- POST request format with headers (X-ARCA-Signature, X-ARCA-Event, X-ARCA-Delivery-ID, X-ARCA-Timestamp)
- HMAC-SHA256 signature generation and verification
- Code examples in Node.js and Python for customers to verify signatures

**Response Handling**:
- 2xx: Success, mark delivered, no retry
- 4xx: Client error, mark failed, no retry (permanent failure)
- 5xx: Server error, retry with exponential backoff
- Timeout/network errors: Retry with exponential backoff

**Retry Strategy**:
- Exponential backoff delays: 1min, 5min, 15min
- Default 3 retries (4 total attempts)
- Configurable up to 5 retries
- After max retries: permanent failure + user notification

**Logging Strategy**:
- PostgreSQL webhook_deliveries table schema
- Tracks all delivery attempts with status, HTTP response, retry count
- Example log entries for successful and failed deliveries

**Additional Features**:
- Circuit breaker pattern for failing endpoints (10 failures → 30min pause)
- Idempotency using unique delivery IDs
- Security: HTTPS enforcement, encrypted secret storage, rate limiting
- Performance targets: P50 <2s, P95 <5s, 1000 events/sec throughput
- Complete webhook handler examples in Express.js
- Contract tests for validation

### 2. Updated services README.md
- Marked Webhook Engine Service contract as complete ✓
- Added comprehensive contract overview with all key details
- Updated status footer to show 2/5 service contracts complete

## Commits
- a75ec36: Issue #5 Stream C: Add comprehensive Webhook Service contract documentation

## Deliverables
All files created and documented according to task specification. Webhook service contract is production-ready for backend team implementation.

## Notes
- Contract follows established patterns from AI service contract
- Includes extensive examples for customer implementation
- Database schema provided for webhook_deliveries logging
- Signature verification code examples in multiple languages
- Ready for backend team review and implementation
