# Operations Documentation

Deployment guides, monitoring strategies, incident response procedures, and operational runbooks for ARCA API.

## Overview

This section provides operational documentation for:
- Infrastructure provisioning and deployment
- Monitoring and observability
- Incident response and on-call procedures
- Operational runbooks for common issues
- Disaster recovery and business continuity

## Status

> **Status**: In Progress - Task #8
>
> Operations documentation is being created in **Task #8: Create Operational Documentation**

## Deployment

**File**: [deployment-guide.md](./deployment-guide.md)

Complete deployment procedures for ARCA API in staging and production environments.

**Prerequisites**: Railway CLI, Docker, Git, Node.js/pnpm, GitHub repository access, ARCA certificate

**Key Sections:**
- **Environment Setup**: Staging (Railway homologation) and production (Railway/AWS ECS) configuration
- **Database Migrations**: CRITICAL - Always run migrations BEFORE deploying code
- **Deployment Procedures**:
  - Staging: Manual via `railway up` or automatic on main branch merge
  - Production: GitHub Actions with manual approval gate or urgent Railway deployment
- **Deployment Workflow**: Complete CI/CD pipeline diagram (tests → staging → approval → production)
- **Health Checks**: `/health`, `/health/arca`, `/health/database`, `/health/redis` with expected responses
- **Rollback Procedures**: Immediate rollback commands (`railway rollback` in 2-3 minutes)
- **Deployment Checklist**: Pre/during/post-deployment verification to prevent mistakes
- **Troubleshooting**: Common issues (health checks failing, migrations, ARCA auth, memory)

**Quick Start:**
```bash
# Deploy to staging
railway link  # Select arca-api-staging
railway run pnpm db:migrate
railway up --service arca-api

# Deploy to production
git tag v1.2.0
git push origin v1.2.0
# Approve in GitHub Actions UI
```

**Target**: Enable staging deployment in <15 minutes following the guide

## Monitoring

**File**: [monitoring.md](./monitoring.md)

Production-grade monitoring and observability strategy for ARCA API, ensuring issues are detected before users complain.

**RED Metrics** (Rate, Errors, Duration):
- Request rate: `http_requests_total`, `invoices_created_total`, `arca_api_calls_total`
- Error rate: `http_requests_failed_total`, `arca_api_errors_total`, `database_errors_total`
- Duration: `http_request_duration_seconds`, `arca_api_duration_seconds`, `database_query_duration_seconds`
- Implementation: TypeScript + prom-client (Prometheus)
- Scrape endpoint: `/metrics`

**Logging Standards**:
- Format: Structured JSON with fields (timestamp, level, service, trace_id, user_id, message, context)
- Levels: error (production issues), warn (retries/degraded), info (business events), debug (staging only)
- Aggregation: Better Stack or Datadog
- Retention: 30 days production, 7 days staging

**Distributed Tracing**:
- OpenTelemetry with automatic instrumentation
- Trace ID propagation across all services
- Custom spans: HTTP request, database query, ARCA API call, AI service call
- Sampling: 100% errors, 10% successful requests
- Trace visualization shows full invoice creation flow

**Alerting**:
- **CRITICAL** (PagerDuty): Error rate >5% (1min), P95 latency >5s (5min), ARCA API down (3 failures), Database pool exhausted
- **WARNING** (Slack): Error rate >2% (5min), P95 latency >3s (10min), ARCA slow (>3s avg), Disk >80%

**SLO/SLI Targets**:
- Availability: 99.95% uptime (21.6 min downtime/month allowed)
- Latency: P95 <200ms (excluding ARCA API calls)
- Error Rate: <0.1% (999 successes per 1000 requests)

See [monitoring.md](./monitoring.md) for full details including code examples, alert definitions, and implementation checklist.

## Incident Response (TODO - Task #8)

**File**: `incident-response.md`

Incident management procedures:

**Severity Levels:**
- **SEV1 (Critical)**: Complete outage, data loss
  - Response time: 15 minutes
  - Page on-call immediately
- **SEV2 (High)**: Partial outage, degraded performance
  - Response time: 30 minutes
  - Notify on-call
- **SEV3 (Medium)**: Minor issue, workaround available
  - Response time: 4 hours
  - Track in backlog
- **SEV4 (Low)**: Cosmetic, no impact
  - Response time: 1 week
  - Fix in next sprint

**Incident Response Process:**
1. Detection and alerting
2. Acknowledge and assess severity
3. Assemble response team
4. Investigate and diagnose
5. Implement fix or workaround
6. Verify resolution
7. Post-mortem (SEV1-SEV2)

**Communication:**
- Internal: Slack incident channel
- External: Status page updates
- Stakeholders: Executive notification

**Post-Mortem Template:**
- What happened?
- What was the impact?
- What was the root cause?
- What actions will prevent recurrence?
- Timeline of events

## Runbooks (TODO - Task #8)

**Directory**: `runbooks/`

Step-by-step procedures for common operational issues. See [Runbooks README](./runbooks/README.md).

Planned runbooks:
- ARCA API down or unresponsive
- Database connection pool exhausted
- Redis out of memory
- High API latency
- Certificate expiration
- Deployment rollback
- Database migration failure
- Service container crashes
- Rate limit exceeded
- Memory leak investigation

## Disaster Recovery (TODO - Task #8)

**File**: `disaster-recovery.md`

Business continuity and disaster recovery:

**Recovery Objectives:**
- **RTO** (Recovery Time Objective): <1 hour
- **RPO** (Recovery Point Objective): <5 minutes

**Backup Procedures:**
- Database: Automated daily snapshots
- Files: S3 versioning and cross-region replication
- Configuration: Git-based (IaC)
- Secrets: Replicated in secrets manager

**Failover Procedures:**
- Primary region failure → Secondary region
- Database failover (manual/automatic)
- DNS failover (Route53 health checks)
- Verification steps

**Recovery Testing:**
- Quarterly DR drills
- Restore from backup test
- Cross-region failover test
- Document test results

## Performance Optimization (TODO - Task #8)

**File**: `performance-optimization.md`

Performance tuning guide:

- Database query optimization
- Index analysis and creation
- Redis caching strategies
- Connection pooling tuning
- API response time optimization
- Load testing and capacity planning

## Monitoring Tools

### Planned Tooling

- **Metrics**: Prometheus or CloudWatch
- **Dashboards**: Grafana or CloudWatch Dashboards
- **Logging**: ELK Stack or CloudWatch Logs
- **Tracing**: OpenTelemetry + Jaeger/X-Ray
- **Alerting**: PagerDuty or Opsgenie
- **Status Page**: Statuspage.io or custom
- **APM**: Datadog or New Relic (optional)

### Key Dashboards

1. **System Overview**
   - Total request rate
   - Error rate
   - P95 latency
   - Active users
   - Invoice creation rate

2. **API Service**
   - Endpoint performance
   - Error breakdown
   - Rate limiting metrics
   - Authentication success rate

3. **Database**
   - Connection pool usage
   - Query latency (P50, P95, P99)
   - Slow query log
   - Replication lag

4. **Infrastructure**
   - CPU/memory utilization
   - Network I/O
   - Disk usage
   - Container health

## SLO/SLI Definitions

**Service Level Objectives:**

| Service | SLI | Target | Measurement |
|---------|-----|--------|-------------|
| API | Availability | 99.95% | Uptime monitoring |
| API | Latency (P95) | <200ms | Response time |
| API | Error Rate | <0.1% | 4xx/5xx responses |
| Database | Query Latency (P95) | <50ms | Query timing |
| ARCA Integration | Success Rate | >99% | Successful CAE |

**Error Budget:**
- 99.95% uptime = 4.38 hours downtime/year
- Monthly budget: 21.6 minutes
- Alerts when 50% consumed

## On-Call Responsibilities

**On-Call Engineer:**
- Monitor alerts and respond
- Triage incidents and escalate if needed
- Follow runbooks for resolution
- Document all incidents
- Participate in post-mortems

**On-Call Rotation:**
- 1-week rotations
- Primary + secondary on-call
- Handoff meeting at rotation change
- Escalation to tech lead if needed

**On-Call Compensation:**
- Paid on-call stipend
- Time-off-in-lieu for incident response

## Related Documentation

- [Architecture - Infrastructure](../architecture/04-infrastructure.md) - Infrastructure design
- [Runbooks](./runbooks/README.md) - Incident resolution procedures
- [Security](../security/README.md) - Security operations
- [Development](../development/README.md) - Local testing

---

**Last Updated**: 2025-10-19
**Status**: In Progress (Task #8 - Deployment & Monitoring Documentation)
**Next**: Incident Response & Runbooks
