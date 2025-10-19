# Runbooks

Step-by-step operational procedures for diagnosing and resolving common issues in ARCA API.

## What is a Runbook?

A runbook is a detailed procedure document that provides:
- **Symptoms**: What the problem looks like
- **Diagnosis**: How to identify the root cause
- **Resolution**: Step-by-step fix procedure
- **Verification**: How to confirm the fix worked
- **Prevention**: How to prevent recurrence

Runbooks are used by on-call engineers during incidents.

## Status

> **Status**: Active - Core runbooks completed in Task #8
>
> Additional runbooks will be added as needed based on production incidents.

## Available Runbooks

### Critical Issues (SEV1)

1. **[ARCA API Down](./arca-api-down.md)** ✅
   - **Severity**: SEV1 (Critical)
   - **Symptoms**: All invoice creation requests failing, 503 errors, ARCA timeouts
   - **Alert**: "ARCA API down (3 consecutive failures)"
   - **Common Causes**: ARCA scheduled maintenance, network issues, ARCA infrastructure problems
   - **Resolution**: Enable circuit breaker, queue invoices, monitor ARCA recovery, process queue when restored
   - **Key Actions**:
     - Enable circuit breaker: `railway run --env production pnpm config:set ARCA_CIRCUIT_BREAKER=true`
     - Update status page
     - Monitor ARCA status: Twitter @AFIPcomunica, ARCA status page
     - Process queued invoices when ARCA recovers
   - **Typical Duration**: 2-4 hours (scheduled maintenance), 15min-2h (unplanned outage)

2. **[Database Issues](./database-issues.md)** ✅
   - **Severity**: SEV1-SEV2 (varies)
   - **Symptoms**: Timeouts, "too many connections" errors, slow queries, database locks
   - **Alerts**: "Database connection pool exhausted", elevated P95 latency
   - **Common Causes**: Connection leaks, traffic spike, slow queries, missing indexes, deadlocks
   - **Resolution**: Restart service, increase pool size, add indexes, terminate blocking queries
   - **Key Actions**:
     - Check pool usage: SQL query for connection count
     - Identify slow queries: `pg_stat_activity` analysis
     - Add missing indexes: `CREATE INDEX CONCURRENTLY`
     - Terminate blocking queries: `pg_terminate_backend(pid)`
   - **Covers**: Connection pool exhaustion, slow queries, database locks

## Planned Runbooks

### Critical Issues (SEV1)

3. **Complete Service Outage** (TODO)
   - File: `service-outage.md`
   - Symptoms: 503 errors, health check failures
   - Common causes: Container crashes, out of memory, deployment issue
   - Resolution: Rollback deployment, scale up resources, investigate logs

### High Priority Issues (SEV2)

4. **High API Latency** (TODO)
   - File: `high-api-latency.md`
   - Symptoms: P95 latency >500ms
   - Common causes: Database slow queries, ARCA latency, memory pressure
   - Resolution: Identify slow endpoints, optimize queries, scale resources

5. **Redis Out of Memory** (TODO)
   - File: `redis-out-of-memory.md`
   - Symptoms: Cache misses, eviction warnings, connection errors
   - Common causes: Memory leak, insufficient provisioning, no eviction policy
   - Resolution: Clear cache, adjust eviction policy, scale Redis

6. **Certificate Expiration** (TODO)
   - File: `certificate-expired.md`
   - Symptoms: Authentication failures for specific users
   - Common causes: ARCA certificates expire annually
   - Resolution: Notify user, guide through renewal, update stored cert

7. **Deployment Rollback** (TODO)
   - File: `deployment-rollback.md`
   - Symptoms: Errors after deployment, feature broken
   - Common causes: Bad deployment, database migration issue
   - Resolution: Rollback to previous version, verify health, investigate cause

### Medium Priority Issues (SEV3)

8. **Rate Limit Exceeded** (TODO)
   - File: `rate-limit-exceeded.md`
   - Symptoms: 429 errors for specific users/IPs
   - Common causes: Legitimate traffic spike, abuse, misconfigured client
   - Resolution: Increase limit temporarily, investigate traffic pattern

9. **Webhook Delivery Failures** (TODO)
   - File: `webhook-delivery-failures.md`
   - Symptoms: Webhooks stuck in retry queue
   - Common causes: Customer endpoint down, timeout, authentication issue
   - Resolution: Retry manually, contact customer, disable if persistent

10. **Memory Leak Investigation** (TODO)
    - File: `memory-leak.md`
    - Symptoms: Gradual memory increase, eventual OOM
    - Common causes: Unclosed connections, circular references, caching without limits
    - Resolution: Heap dump analysis, identify leak source, deploy fix

### Maintenance Procedures

11. **Database Migration** (TODO)
    - File: `database-migration.md`
    - Process: Pre-migration checks, execution, rollback if needed
    - Verification: Schema validation, data integrity checks

12. **Scaling Operations** (TODO)
    - File: `scaling-operations.md`
    - Vertical scaling: Increase instance size
    - Horizontal scaling: Add more instances
    - Database read replicas: Add replicas for read-heavy loads

## Runbook Template

Each runbook follows this structure:

```markdown
# Runbook: [Issue Name]

**Severity**: SEV1 / SEV2 / SEV3
**Last Updated**: YYYY-MM-DD
**Owner**: [Team/Person]

## Symptoms

[What the problem looks like - user-facing and system metrics]

- User symptoms: [e.g., "Cannot create invoices"]
- Alerts: [e.g., "API latency >500ms"]
- Metrics: [e.g., "Error rate >5%"]

## Impact

**User Impact**: [How users are affected]
**Business Impact**: [Revenue, SLA, reputation]

## Prerequisites

[Tools, access, knowledge needed]

- Access to: [AWS console, database, logs]
- Tools: [kubectl, psql, redis-cli]
- Permissions: [Admin, read-only]

## Diagnosis

### Step 1: Verify the Issue

```bash
# Commands to confirm the issue
curl -I https://api.arcaapi.com/health
```

Expected output: [...]

### Step 2: Identify Root Cause

[How to narrow down the cause]

Check:
1. Recent deployments
2. Traffic patterns
3. Error logs
4. External dependencies

### Step 3: Assess Severity

[How to determine if SEV1 vs SEV2]

## Resolution

### Quick Fix (Temporary)

[Immediate action to restore service]

```bash
# Commands for quick fix
kubectl scale deployment api --replicas=10
```

### Permanent Fix

[Steps to fully resolve]

1. [Step 1]
2. [Step 2]
3. [Step 3]

### Rollback Procedure

[If fix makes things worse]

```bash
# Commands to rollback
git revert [commit]
./scripts/deploy.sh rollback
```

## Verification

[How to confirm the fix worked]

- [ ] Service health check passes
- [ ] Error rate returned to normal
- [ ] User reports resolved
- [ ] Alerts cleared

## Follow-Up

**Immediate:**
- Update status page
- Notify stakeholders
- Document in incident log

**Short-term (24 hours):**
- Write post-mortem (if SEV1-SEV2)
- Create Jira ticket for permanent fix
- Update monitoring/alerting

**Long-term (1 week):**
- Implement prevention measures
- Update runbook with lessons learned
- Training for team

## Prevention

[How to prevent recurrence]

- Monitoring: [New alerts to add]
- Architecture: [Changes to prevent]
- Process: [Improved procedures]

## Related Runbooks

- [Link to related runbooks]

## References

- [Architecture docs](../../architecture/)
- [Monitoring dashboard](https://grafana...)
- [External docs](https://...)

---

**Questions?** Contact: [on-call team/Slack channel]
```

## Using Runbooks

### During Incidents

1. **Identify** which runbook applies (symptoms)
2. **Follow** steps in order (don't skip verification)
3. **Document** what you did (for post-mortem)
4. **Update** runbook if steps didn't work

### After Incidents

1. Review runbook accuracy
2. Update with new information learned
3. Add additional runbooks if needed
4. Share learnings with team

### Best Practices

- **Keep Updated**: Review quarterly, update after incidents
- **Test Procedures**: Practice runbooks during drills
- **Clear Commands**: Copy-paste ready, no ambiguity
- **Version Control**: Track changes in Git
- **Feedback**: Team reviews and improves runbooks

## Runbook Maintenance

### Review Schedule

- **After Incidents**: Update within 24 hours
- **Quarterly**: Review all runbooks for accuracy
- **After Architecture Changes**: Update affected runbooks
- **New Services**: Create runbooks before production

### Ownership

Each runbook has an owner responsible for:
- Keeping content current
- Testing procedures
- Incorporating feedback
- Training team members

## Related Documentation

- [Operations Overview](../README.md) - Operations documentation
- [Incident Response](../incident-response.md) - Incident management process
- [Monitoring](../monitoring.md) - Observability and alerting
- [Architecture](../../architecture/) - System design

## Quick Reference

Use this quick reference to find the right runbook fast during incidents:

| Symptom | Runbook | Severity | First Action |
|---------|---------|----------|--------------|
| All invoices failing, 503 errors | [ARCA API Down](./arca-api-down.md) | SEV1 | Enable circuit breaker |
| "Too many connections" errors | [Database Issues](./database-issues.md) | SEV1 | Restart API service |
| API very slow, timeouts | [Database Issues](./database-issues.md) | SEV2 | Check for slow queries |
| Writes failing, lock timeouts | [Database Issues](./database-issues.md) | SEV2 | Find blocking queries |
| ARCA slow but not down | [ARCA API Down](./arca-api-down.md) | SEV2 | Monitor, may need circuit breaker |

## Contributing to Runbooks

After every incident:

1. **Review the runbook** used during the incident
2. **Note what worked** and what didn't
3. **Update the runbook** with:
   - Commands that didn't work as expected
   - Additional diagnosis steps needed
   - New resolution approaches discovered
   - Time estimates (if they were off)
4. **Create new runbooks** for issues not covered
5. **Submit PR** with runbook updates

**Runbook Quality Standards:**
- All commands must be copy-paste executable (no placeholders like `<YOUR_ID>`)
- Include expected output for verification steps
- Provide escalation criteria (when to page DBA vs CTO)
- Add links to relevant monitoring dashboards
- Update "Last Updated" date after changes

---

**Last Updated**: 2025-10-19
**Status**: Active (2 core runbooks completed in Task #8)
**Next**: Additional runbooks added based on production incidents
