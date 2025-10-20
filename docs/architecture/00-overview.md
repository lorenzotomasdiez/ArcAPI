# Architecture Overview

> **Status**: Active
> **Last Updated**: 2025-10-15
> **Author**: ARCA API Engineering Team
> **Next Review**: 2026-01-15

## Executive Summary

ARCA API is a **developer-first electronic invoicing platform** for Argentina that transforms the complexity of ARCA/AFIP's SOAP-based government API into a simple, modern REST API with AI-powered intelligence. The platform abstracts away the technical complexity of certificate management, XML/SOAP protocols, and regulatory compliance, enabling developers to integrate electronic invoicing into their applications in minutes instead of weeks.

**Value Proposition**: "From SOAP complexity to REST simplicity in 5 minutes, with AI that thinks for you"

**Target Users**:
- **Primary**: Developers building e-commerce, SaaS, and business applications
- **Secondary**: Tech-savvy business owners seeking automated invoicing
- **Tertiary**: Agencies and consultancies serving multiple clients

The platform serves Argentina's electronic invoicing requirements with a freemium SaaS model, offering 500 free invoices per month to drive adoption, with paid tiers starting at $15/month.

## System Goals

### Business Objectives

1. **Market Leadership**: Become the most popular electronic invoicing API in Argentina
   - Target: 2,000 users in Year 1, 10,000 users in Year 3
   - Revenue: $120K ARR in Year 1, growing to $1M+ by Year 3

2. **Developer Experience (DX) Excellence**: Fastest time-to-first-invoice in the market
   - Target: Developers can integrate and issue first test invoice in <5 minutes
   - Comprehensive SDKs in 6+ languages (JavaScript, Python, PHP, Ruby, Go, .NET)

3. **Cost Efficiency**: Most generous free tier in the market
   - 500 invoices/month free (vs competitors: 10-50)
   - Target operational cost: <$0.02 per invoice processed

### Technical Objectives

1. **API-First Platform**: All functionality exposed via REST APIs with OpenAPI specifications
2. **AI-Powered Intelligence**: Natural language invoice generation using GPT-4
3. **High Availability**: 99.95% uptime SLA (21.6 minutes downtime per month maximum)
4. **Scalability**: Support 100,000 invoices per day (Year 1 target: 300,000/month)
5. **Security & Compliance**: ISO 27001 and GDPR compliant by design

### Success Criteria

**Year 1 Targets**:
- 2,000 registered developers
- 600 paying customers
- $20K Monthly Recurring Revenue (MRR)
- 300,000 invoices processed per month
- Net Promoter Score (NPS) > 70

**Technical Metrics**:
- P95 API latency < 200ms (excluding ARCA calls)
- Zero critical security incidents
- 99.95% measured uptime
- <2 days onboarding time for new engineers

## Quality Attributes

### Performance

**Latency Targets** (excluding external ARCA API latency):
- **P50**: < 100ms
- **P95**: < 200ms
- **P99**: < 500ms

**Throughput**:
- **Day 1**: 10,000 invoices/day
- **Year 1**: 100,000 invoices/day
- **Year 3**: 1,000,000 invoices/day

**Database Performance**:
- Query latency P95 < 50ms
- Connection pool: 20-100 connections
- Read replica lag < 1 second

### Availability

**Uptime SLA**: 99.95%
- **Maximum downtime**: 21.6 minutes per month
- **Maximum downtime**: 4.38 hours per year

**High Availability Strategy**:
- Multi-AZ deployment (active-active)
- Auto-healing containers
- Database failover < 60 seconds
- Zero-downtime deployments

**Disaster Recovery**:
- **RTO (Recovery Time Objective)**: < 1 hour
- **RPO (Recovery Point Objective)**: < 5 minutes
- Daily automated backups with 30-day retention
- Cross-region replication for critical data

### Scalability

**Horizontal Scaling**:
- All stateless services scale horizontally
- Auto-scaling triggers: CPU > 70%, Memory > 80%
- Scale from 2 to 20 instances automatically

**Database Scaling**:
- PostgreSQL vertical scaling (Year 1: t4g.small → t4g.large)
- Read replicas for analytics and reporting queries
- Partitioning strategy for >10M invoice records

**Caching Strategy**:
- **L1**: Application-level cache (in-memory)
- **L2**: Redis distributed cache
- **L3**: CDN for static assets
- Cache hit rate target: >90% for ARCA tokens

### Security

**Encryption**:
- **At rest**: AES-256 encryption for all data
- **In transit**: TLS 1.3 only (no TLS 1.2)
- **Certificate storage**: Encrypted with customer-specific keys

**Authentication & Authorization**:
- API key-based authentication (Bearer tokens)
- API keys hashed with bcrypt (cost factor: 12)
- Rate limiting per tier: 100 req/min (free), 1000 req/min (pro)

**Compliance**:
- **ISO 27001**: Annual audit and certification
- **GDPR**: Data residency in Argentina/EU, right to deletion, data export
- **Audit Logging**: All API calls, data access, and admin actions logged
- **Secrets Management**: AWS Secrets Manager or HashiCorp Vault

### Cost

**Target Cost per Invoice**: < $0.02

**Infrastructure Cost Breakdown (Year 1)**:
- Compute (API services): $200-400/month
- Database (PostgreSQL): $50-200/month
- Cache (Redis): $30-100/month
- Storage (S3): $20-50/month
- CDN (Cloudflare): $0-50/month
- Monitoring: $50-100/month
- **Total**: $350-900/month

**Cost Optimization Strategies**:
- Reserved instances for baseline capacity
- Spot instances for batch jobs
- Serverless functions for low-frequency tasks
- CDN caching to reduce origin requests
- Database connection pooling (PgBouncer)

## Architectural Approach

### Microservices Architecture

The platform is built as a collection of loosely-coupled microservices, each with a single responsibility:

**Core Services**:
1. **REST API Core** (Node.js/TypeScript): Client-facing API, request orchestration
2. **AI Invoice Generator** (Python/FastAPI): Natural language to structured invoice
3. **ARCA SOAP Client** (Node.js): Adapter for government SOAP API
4. **Webhook Engine** (Node.js): Event delivery with retry logic
5. **MCP Server** (Node.js): LLM integration for AI agents (Claude, ChatGPT)
6. **Dashboard** (Next.js): Web-based user interface
7. **Analytics Service** (Node.js): Data aggregation and reporting
8. **Integration Connectors** (Node.js): Third-party integrations (Stripe, email)

**Rationale**:
- **Independent scaling**: Each service scales based on its load profile
- **Technology flexibility**: Use best tool for each job (Node.js for I/O, Python for AI)
- **Team autonomy**: Different teams can own different services
- **Fault isolation**: Failure in one service doesn't cascade to others

### API-First Design

**Spec-Driven Development**:
1. Write OpenAPI specification before implementation
2. Generate client SDKs from specification
3. Contract tests validate implementation against spec
4. Frontend and backend teams work in parallel

**Benefits**:
- Zero ambiguity in API contracts
- Automated client SDK generation
- Parallel development (frontend/backend/SDKs)
- API documentation always up-to-date

### Event-Driven Patterns

**Asynchronous Processing**:
- PDF generation queued after invoice approval
- Email sending via background jobs
- Webhook delivery with exponential backoff retry
- Analytics aggregation via event streams

**Message Queue**: Redis + BullMQ
- Reliable job processing with retries
- Dead letter queue for failed jobs
- Priority queues for urgent tasks
- Job scheduling for delayed execution

### Cloud-Native Design

**Containerization**: All services packaged as Docker containers
**Orchestration**: Kubernetes or AWS ECS Fargate
**Infrastructure as Code**: Terraform for all resources
**CI/CD**: GitHub Actions for automated testing and deployment

**12-Factor App Principles**:
- Configuration via environment variables
- Stateless processes
- Explicit dependencies
- Port binding for services
- Concurrency via process model
- Disposability (fast startup/shutdown)
- Dev/prod parity

## Technology Philosophy

### Managed Services First

**Rationale**: Small team (2-5 engineers) cannot afford operational overhead

**Preferred**:
- Managed PostgreSQL (AWS RDS or Supabase)
- Managed Redis (AWS ElastiCache or Upstash)
- Serverless functions (AWS Lambda) for low-frequency tasks
- Managed Kubernetes (AWS EKS) or fully-managed containers (ECS Fargate)

**Avoided**:
- Self-hosted databases (operational burden)
- Custom infrastructure management
- Complex orchestration without managed support

### Technology-Agnostic Core

**Architecture-First Thinking**: Decisions based on patterns, not technologies

**Example**: Database selection
- **Pattern**: ACID-compliant relational database with JSONB support
- **Implementation**: PostgreSQL (could swap to CockroachDB if distributed needed)

This approach enables:
- Future technology migrations without architecture redesign
- Evaluation of multiple implementation options
- Prevention of vendor lock-in

### Open Source Preference

**Default**: Use open-source tools with active communities
- PostgreSQL over proprietary databases
- Redis over proprietary caching
- Node.js/Python over closed-source runtimes

**Commercial**: Only when clear value justifies cost
- OpenAI API for AI (no open-source equivalent matches quality)
- Stripe for payments (PCI compliance handled)
- Managed cloud services (operational efficiency)

## Non-Functional Requirements

### Observability

**Metrics** (Prometheus):
- Request rate, error rate, duration (RED metrics)
- Business metrics (invoices/min, revenue/hour)
- Infrastructure metrics (CPU, memory, disk)

**Logging** (JSON structured logs):
- Centralized logging (ELK stack or CloudWatch)
- Request tracing with correlation IDs
- Error logs with stack traces
- Audit logs for compliance

**Tracing** (OpenTelemetry):
- Distributed tracing across services
- Database query performance
- External API call latency

**Alerts**:
- Error rate >5% (1min window) → page on-call
- P95 latency >500ms (5min window) → investigate
- Database CPU >80% (5min window) → scale
- ARCA API down (3 consecutive failures) → status page update

### Testing Strategy

**Unit Tests**: 80%+ code coverage
- Business logic fully tested
- All edge cases covered
- Fast execution (<5min entire suite)

**Integration Tests**: Critical paths
- Database interactions
- External API mocking
- Service-to-service communication

**Contract Tests**: API specifications
- OpenAPI spec validation
- Request/response schema validation
- Breaking change detection

**End-to-End Tests**: User journeys
- Complete invoice creation flow
- Authentication and authorization
- Error handling scenarios

**Load Tests**: Performance validation
- Target: 1,200 requests/min sustained
- Latency validation under load
- Database query performance

### Deployment Strategy

**Environments**:
1. **Development**: Local Docker Compose
2. **Staging**: Production-like with test data
3. **Production**: Multi-AZ, auto-scaling

**Deployment Process**:
1. Automated tests pass (unit + integration + contract)
2. Deploy to staging
3. Run smoke tests
4. Manual approval (for production)
5. Blue-green deployment to production
6. Monitor for 15 minutes
7. Automated rollback on error spike

**Zero-Downtime Deployments**:
- Rolling updates (20% of instances at a time)
- Health checks before routing traffic
- Database migrations run before deployment
- Backward-compatible API changes only

## Risk Mitigation

### External Dependency Risks

**ARCA/AFIP API Downtime**:
- Risk: Government API frequently unstable
- Mitigation: Queue invoices for retry, async processing, status polling
- SLA: Best-effort (ARCA has no SLA)

**OpenAI API Cost/Availability**:
- Risk: High token costs, rate limits
- Mitigation: Caching, prompt optimization, fallback to manual mode
- Cost cap: $500/month limit

**Third-Party API Changes**:
- Risk: Stripe, Resend, etc. breaking changes
- Mitigation: Version pinning, SDK updates, monitoring

### Technical Risks

**Database Scaling Limits**:
- Risk: PostgreSQL vertical scaling ceiling
- Mitigation: Read replicas, partitioning, eventual move to distributed DB

**Certificate Security**:
- Risk: Customer certificates stolen or leaked
- Mitigation: AES-256 encryption, audit logs, never log certificates

**Regulatory Changes**:
- Risk: ARCA changes invoice requirements
- Mitigation: Flexible schema (JSONB), quick deployment cycle, monitoring ARCA docs

## Related Documentation

- **[System Context](./01-system-context.md)**: External actors and system boundaries
- **[Service Architecture](./02-services.md)**: Detailed service design (C4 Level 2)
- **[Data Architecture](./03-data-architecture.md)**: Database design and data flows
- **[Infrastructure](./04-infrastructure.md)**: Deployment and scaling
- **[ADRs](./adrs/README.md)**: Architectural decision records

---

**Review Schedule**: Quarterly
**Approval**: Tech Lead + Google Engineering Advisor
**Status**: Active
