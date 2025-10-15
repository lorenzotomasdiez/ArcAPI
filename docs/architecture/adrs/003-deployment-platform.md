# ADR-003: Deployment Platform for ARCA API

**Status**: Accepted
**Date**: 2025-10-15
**Author**: Tech Lead
**Reviewers**: Engineering Team, DevOps, Google Engineering Advisor

## Context

ARCA API platform consists of **8+ microservices** (REST API, Dashboard, AI services, MCP server, webhooks, analytics, PDF generator, email service) that require:

**Requirements:**
- **Multi-service orchestration**: Deploy and manage 8+ services with different tech stacks (Node.js, Python, Next.js)
- **Scalability**: Auto-scale based on load (100 invoices/day → 100K invoices/day)
- **High availability**: 99.95% uptime target (multi-AZ deployment)
- **Cost-effectiveness**: Minimize infrastructure costs during MVP phase
- **Developer velocity**: Fast iteration cycles (multiple deploys per day)
- **Observability**: Centralized logging, metrics, tracing
- **Security**: VPC isolation, secrets management, TLS encryption

**Constraints:**
- Small team (2-5 engineers) - minimal DevOps overhead
- Limited budget - optimize for startup costs ($100-500/month in Year 1)
- Rapid development cycle - deploy changes within minutes
- Need production-ready infrastructure by Month 3

## Decision

We will adopt a **two-stage deployment strategy**:

### Stage 1: MVP Phase (Months 1-6) - Railway

Deploy all services on **Railway** for rapid development and iteration.

**Why Railway:**
- Zero-config deployments (connect GitHub, auto-deploy on push)
- Built-in CI/CD, logging, metrics
- Support for multiple services and databases
- Affordable: $5-20/month per service
- No Kubernetes complexity

### Stage 2: Scale Phase (Month 6+) - AWS ECS Fargate

Migrate to **AWS ECS Fargate** when scale demands it.

**Why ECS Fargate:**
- Serverless containers (no EC2 management)
- Auto-scaling per service
- Multi-AZ high availability
- VPC networking and security groups
- Integration with AWS ecosystem (RDS, ElastiCache, Secrets Manager)

**Migration trigger**: When Railway costs >$500/month OR latency P95 >300ms OR invoice volume >50K/month

### Design Principle: Docker-First

**All services containerized from day one** to ensure portability:
- Dockerfile for each service
- Docker Compose for local development
- Same container images run on Railway and ECS (seamless migration)

## Rationale

### Why Railway for MVP?

**Advantages:**
- ✅ **Speed to market**: Deploy in <10 minutes (vs days for ECS setup)
- ✅ **Developer experience**: Git push = auto-deploy (no manual steps)
- ✅ **Cost-effective**: $5-20/month per service (vs $50-100/month on AWS)
- ✅ **Built-in features**: Logging, metrics, environment variables, secrets
- ✅ **Multiple services**: Deploy all 8 services on one account
- ✅ **No DevOps overhead**: Managed platform (no Kubernetes, no EC2)

**Cost estimate (Railway):**
- 8 services × $10/month = $80/month
- PostgreSQL database (via Railway): $10/month
- Redis cache: $10/month
- **Total**: ~$100/month

**When Railway becomes limiting:**
- ⚠️ Limited auto-scaling (vertical only, manual)
- ⚠️ No multi-AZ high availability
- ⚠️ Limited VPC networking options
- ⚠️ Cost increases linearly with usage ($20-30/service at scale)
- ⚠️ Less control over infrastructure

### Why ECS Fargate for Scale?

**Advantages:**
- ✅ **Auto-scaling**: Scale each service independently based on CPU/memory/requests
- ✅ **High availability**: Multi-AZ deployment (99.99% uptime)
- ✅ **VPC networking**: Full control over network isolation, security groups
- ✅ **AWS ecosystem integration**: RDS, ElastiCache, S3, Secrets Manager, CloudWatch
- ✅ **Cost optimization**: Reserved capacity, Savings Plans, Spot instances
- ✅ **Observability**: CloudWatch Logs, X-Ray tracing, CloudWatch Metrics

**Cost estimate (ECS Fargate, Year 2):**
- 8 services × 2 tasks × $0.04/hour = $230/month (compute)
- Application Load Balancer: $20/month
- NAT Gateway: $30/month
- Data transfer: $20/month
- **Total**: ~$300/month (3x Railway, but with HA and auto-scaling)

**Why Fargate over EC2:**
- No server management (serverless containers)
- Auto-scaling without provisioning
- Pay-per-use (no idle server costs)

### Alternatives Considered

#### Alternative 1: Heroku

**Pros:**
- Similar to Railway (Platform-as-a-Service)
- Mature platform with extensive add-ons
- Great developer experience

**Cons:**
- ❌ Expensive at scale: $25-50/dyno/month (vs Railway $10-20/service)
- ❌ Limited control (opaque infrastructure)
- ❌ Salesforce acquisition uncertainty (platform direction unclear)
- ❌ Less cost-effective than Railway for MVP

**Verdict**: Railway offers similar experience at lower cost.

#### Alternative 2: Google Cloud Run

**Pros:**
- Serverless containers (like Fargate)
- Auto-scaling from zero
- Pay-per-request pricing
- Good developer experience

**Cons:**
- ❌ Vendor lock-in (harder to migrate than Docker on ECS)
- ❌ Learning curve (GCP ecosystem less familiar)
- ❌ Cold start latency (vs always-on containers)
- ❌ Limited integration with non-GCP services

**Verdict**: ECS Fargate provides better control and AWS ecosystem integration.

#### Alternative 3: Kubernetes (EKS, GKE, or self-managed)

**Pros:**
- Ultimate flexibility and control
- Industry standard (portable across clouds)
- Rich ecosystem (Helm, operators, service mesh)

**Cons:**
- ❌ **Massive complexity**: Requires dedicated DevOps engineer
- ❌ **High operational overhead**: Cluster management, upgrades, security patches
- ❌ **Expensive**: $73/month for EKS control plane + worker nodes ($200+/month)
- ❌ **Overkill for MVP**: 8 services don't need Kubernetes orchestration

**Verdict**: Premature optimization. ECS Fargate provides 80% of benefits with 20% of complexity.

#### Alternative 4: Bare VPS (DigitalOcean, Linode)

**Pros:**
- Low cost ($10-20/month per server)
- Full control

**Cons:**
- ❌ **Manual everything**: Deploy scripts, load balancing, monitoring, scaling
- ❌ **No high availability**: Single point of failure
- ❌ **DevOps burden**: Server maintenance, security patches, backups
- ❌ **Limited scalability**: Manual server provisioning

**Verdict**: Too much operational overhead for small team.

### Why Docker-First Design?

**Benefits:**
- ✅ **Portability**: Same container runs locally, Railway, ECS (no platform lock-in)
- ✅ **Consistency**: Dev/staging/production environments identical
- ✅ **Migration path**: Seamless move from Railway to ECS (just change deployment target)
- ✅ **Local development**: Docker Compose replicates production environment

**Example Dockerfile (Node.js service):**
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

## Implementation Plan

### Phase 1: Railway Deployment (Month 1)

**Services to deploy:**
1. REST API (Node.js + TypeScript)
2. Dashboard (Next.js)
3. AI Service (Python + FastAPI)
4. Webhook Engine (Node.js)
5. MCP Server (Node.js)
6. PostgreSQL (Railway managed)
7. Redis (Railway managed)

**Steps:**
1. Create Dockerfile for each service
2. Connect GitHub repositories to Railway
3. Configure environment variables and secrets
4. Set up custom domains (api.arcaapi.com, app.arcaapi.com)
5. Enable HTTPS (automatic via Railway)
6. Configure health checks

**Timeline**: Week 1-2

### Phase 2: Monitoring & Observability (Month 2)

**Tools:**
- Railway built-in logging (search, filter, tail)
- Railway metrics (CPU, memory, requests/s)
- Sentry for error tracking
- Axiom or Datadog for advanced logging (optional)

**Alerts:**
- CPU >80% for 5 minutes
- Memory >80% for 5 minutes
- HTTP error rate >5% for 1 minute
- Service down (health check failing)

**Timeline**: Week 3-4

### Phase 3: Migration to ECS Fargate (Month 6-7)

**Triggers:**
- Railway cost >$500/month (predictable)
- Latency P95 >300ms (performance degradation)
- Invoice volume >50K/month (traffic threshold)
- Need multi-AZ HA (uptime <99.9%)

**Migration steps:**
1. **Infrastructure as Code**: Define ECS services with Terraform or AWS CDK
2. **VPC setup**: Create VPC, subnets (public/private), NAT gateway
3. **RDS migration**: Migrate PostgreSQL from Railway to AWS RDS (pg_dump/restore)
4. **ElastiCache setup**: Migrate Redis to AWS ElastiCache
5. **Container registry**: Push Docker images to AWS ECR
6. **ECS task definitions**: Define each service (CPU, memory, env vars)
7. **Application Load Balancer**: Configure ALB with target groups per service
8. **Auto-scaling**: Define scaling policies (target tracking on CPU/requests)
9. **Secrets management**: Migrate secrets to AWS Secrets Manager
10. **Logging**: CloudWatch Logs with log groups per service
11. **Monitoring**: CloudWatch Dashboards + alerts
12. **DNS cutover**: Update Route 53 DNS to point to ALB
13. **Validation**: Run smoke tests, monitor for issues
14. **Decommission Railway**: After 1 week stability

**Timeline**: 2-3 weeks (spread over Month 6-7)

**Downtime**: <5 minutes (DNS cutover only)

## Consequences

### Positive

- ✅ **Fast MVP launch**: Railway enables deployment in days (vs weeks with ECS)
- ✅ **Cost optimization**: $100/month in Year 1 (Railway) vs $300+ with ECS
- ✅ **Developer velocity**: Git push = auto-deploy (no manual DevOps)
- ✅ **Future-proof**: Docker containers enable seamless migration to ECS
- ✅ **High availability at scale**: ECS Fargate provides multi-AZ HA when needed
- ✅ **Flexibility**: Can defer infrastructure complexity until product-market fit

### Negative

- ⚠️ **Migration effort**: Moving from Railway to ECS requires 2-3 weeks work
- ⚠️ **Limited HA in MVP**: Railway doesn't provide multi-AZ (acceptable for MVP)
- ⚠️ **Platform learning curve**: Team must learn both Railway and AWS
- ⚠️ **Vendor risk**: Railway stability/pricing changes could force early migration

### Mitigation Strategies

**Migration risk:**
- Design services as stateless 12-factor apps (easy to move)
- Use Docker from day one (portable containers)
- Document Railway → ECS migration guide early (Month 3)
- Budget 2-3 weeks for migration in roadmap

**High availability in MVP:**
- Monitor Railway uptime closely
- Set up status page to communicate downtime
- Design for graceful degradation (webhooks retry, queue persistence)
- Accept 99.5% uptime in MVP (vs 99.95% in production)

**Vendor risk:**
- Maintain Docker-first approach (platform-agnostic)
- Monitor Railway pricing/terms quarterly
- Keep ECS migration plan up-to-date
- If Railway shuts down: can migrate to ECS within 1 week

## Cost Projections

### Year 1 (Railway)

**Monthly costs:**
- REST API: $15/month (0.5 GB RAM, always-on)
- Dashboard: $10/month (SSR, 0.5 GB RAM)
- AI Service: $20/month (1 GB RAM, GPU occasionally)
- Webhook Engine: $10/month
- MCP Server: $10/month
- PostgreSQL (managed): $10/month
- Redis (managed): $10/month
- Other services: $15/month

**Total: ~$100-120/month**

### Year 2 (ECS Fargate)

**Monthly costs:**
- 8 services × 2 tasks × 0.25 vCPU × 0.5 GB RAM × $0.04/hour = $230/month
- Application Load Balancer: $20/month
- RDS PostgreSQL (db.t4g.medium): $120/month
- ElastiCache Redis (cache.t4g.small): $50/month
- NAT Gateway: $30/month
- Data transfer: $20/month

**Total: ~$470/month**

**Savings from Scale:**
- Reserved capacity (1-year commit): -20% = $375/month
- Spot instances for non-critical tasks: -30% = $330/month

### Year 3 (ECS Fargate, scaled)

**Monthly costs:**
- 8 services × 5 tasks (auto-scaled) = $575/month
- RDS PostgreSQL (db.r6g.large): $400/month
- ElastiCache Redis (cache.r6g.large): $150/month
- Load balancing + networking: $100/month

**Total: ~$1,225/month**

**Cost per invoice:**
- Year 1 (300K invoices): $0.0004/invoice
- Year 2 (1M invoices): $0.0004/invoice
- Year 3 (5M invoices): $0.00025/invoice

## Monitoring & Alerts

**Railway metrics:**
- CPU usage (per service)
- Memory usage (per service)
- Request rate (per service)
- HTTP error rate
- Deployment status

**ECS Fargate metrics:**
- Task count (running/desired)
- CPU utilization (target: 70%)
- Memory utilization (target: 70%)
- Application Load Balancer metrics (requests, latency, errors)
- Auto-scaling events

**Alerts:**
- Service down >1 minute → page on-call
- CPU >80% for >5 minutes → investigate
- Memory >80% for >5 minutes → investigate
- HTTP error rate >5% for >1 minute → page on-call
- Deployment failed → notify team

## Review & Revisit

**Review triggers:**
- Railway cost exceeds $500/month
- Latency P95 >300ms consistently
- Invoice volume >50K/month
- Uptime <99.5% (recurring downtime)
- Team size >10 engineers (may need Kubernetes)

**Scheduled review**: End of Month 6 (April 2026) - decide on ECS migration

## References

- [Railway Documentation](https://docs.railway.app/)
- [AWS ECS Fargate](https://aws.amazon.com/fargate/)
- [AWS ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/intro.html)
- [12-Factor App Methodology](https://12factor.net/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- Internal: Infrastructure Architecture (`docs/architecture/04-infrastructure.md`)
- Internal: Service Architecture (`docs/architecture/02-services.md`)

---

**Approved by**: [Pending]
**Next review**: 2026-04-15 (Month 6 - Migration decision point)
