---
issue: 5
stream: C4 Level 2 Diagram & Services Overview
agent: general-purpose
started: 2025-10-15T13:49:55Z
completed: 2025-10-15T14:15:00Z
status: completed
---

# Stream A: C4 Level 2 Diagram & Services Overview

## Scope
Create the C4 Container diagram and main service architecture document with overview of all 8 services

## Files Created/Modified
- `docs/architecture/02-services.md` - Created comprehensive service architecture document
- `docs/architecture/README.md` - Updated to link to services document

## Work Completed

### 1. C4 Level 2 Container Diagram
- Created Mermaid C4Container diagram showing:
  - All 8 services (REST API Core, Dashboard, AI Service, Webhook Engine, MCP Server, Analytics, Integration Connectors, ARCA SOAP Client)
  - 3 data stores (PostgreSQL, Redis, S3/R2)
  - 3 external actors (API Consumer, End User, AI Assistant)
  - 5 external systems (ARCA API, OpenAI, Stripe, Email Service, E-commerce Platforms)
  - All service-to-service relationships with protocols
  - Clear system boundary showing ARCA API Platform

### 2. Service Documentation
Documented all 8 services with complete details:

**REST API Core**:
- Responsibility: Central orchestration, business logic, API gateway
- Tech: Node.js 20 + Express + TypeScript
- Scaling: Horizontal (3-10 instances, auto-scale on CPU >70%)
- Data: PostgreSQL (read/write), Redis (cache, queue), S3 (PDFs)
- Performance: P95 <200ms, 1,200 req/min throughput

**Dashboard**:
- Responsibility: Web UI for invoice management
- Tech: Next.js 14 + React + Tailwind
- Scaling: Static site (CDN)
- Data: No direct DB access (API only)

**AI Service**:
- Responsibility: NLP invoice generation via GPT-4
- Tech: Python 3.11 + FastAPI
- Scaling: Horizontal (2-5 instances, queue-based)
- Data: PostgreSQL (read-only), OpenAI API, Redis cache

**Webhook Engine**:
- Responsibility: Reliable event delivery with retries
- Tech: Node.js + BullMQ
- Scaling: Horizontal (2-8 workers)
- Data: Redis queue, PostgreSQL logs
- Retry strategy: Exponential backoff (1min, 5min, 15min)

**MCP Server**:
- Responsibility: LLM assistant integration
- Tech: Node.js + Anthropic MCP
- Scaling: Vertical (1-2 instances, low volume)
- Data: Read-only docs, no DB

**Analytics Service**:
- Responsibility: Metrics aggregation, predictions
- Tech: Node.js (+ Python for ML)
- Scaling: Vertical (1-2 instances)
- Data: PostgreSQL read replica, Redis cache

**Integration Connectors**:
- Responsibility: Third-party platform sync
- Tech: Node.js + platform SDKs
- Scaling: Horizontal (2-4 workers)
- Platforms: Mercado Libre, Shopify, Tienda Nube

**ARCA SOAP Client**:
- Responsibility: SOAP/XML communication with government API
- Implementation: Embedded library in REST API Core
- Tech: node-soap + crypto
- Data: Redis (token cache), PostgreSQL (certificates)

### 3. Data Stores Documentation

**PostgreSQL**:
- Primary transactional database
- 12 key tables documented
- Scaling: Primary + 1-2 read replicas
- Performance: P95 <50ms

**Redis**:
- Caching, sessions, rate limiting, job queue
- 5 use cases documented with TTLs
- BullMQ for async jobs
- Performance: P95 <2ms

**S3/Cloudflare R2**:
- Object storage for PDFs and files
- Storage structure defined
- Pre-signed URLs for temporary access
- CDN for fast delivery

### 4. Communication Patterns
- Synchronous (REST): Dashboard→API, API→AI Service
- Asynchronous (Queue): Webhooks, PDF generation, emails
- Internal auth: Service tokens with JWT
- Circuit breakers and retry logic

### 5. Additional Sections
- Deployment architecture (resource allocation per service)
- Observability & monitoring (metrics, logging, tracing)
- Security considerations (network, data, access control)
- Disaster recovery (RTO: 1h, RPO: 5min)
- Performance benchmarks (latency, throughput, resources)
- Future enhancements (Phase 2, Phase 3, Enterprise)

## Deliverables
- Complete 02-services.md document (985 lines)
- Mermaid C4 Container diagram verified
- Architecture README updated with links
- All 8 services fully documented
- Communication patterns explained
- Data stores comprehensive

## Verification
- Mermaid syntax validated
- All service details match task specification
- Document structure follows C4 model
- Links to related documents included
- Performance targets defined
- Scaling strategies documented

## Status
✅ COMPLETE - All Stream A requirements fulfilled
