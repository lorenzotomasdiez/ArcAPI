---
issue: 8
stream: Runbooks - Incident Response
agent: general-purpose
started: 2025-10-19T17:32:10Z
completed: 2025-10-19T19:15:00Z
status: completed
dependencies: Stream B completion (✅ completed)
---

# Stream C: Runbooks - Incident Response

## Scope
Critical runbooks for common production incidents (ARCA API down, database issues).

## Files
- ✅ `docs/operations/runbooks/arca-api-down.md` (created)
- ✅ `docs/operations/runbooks/database-issues.md` (created)
- ✅ `docs/operations/runbooks/README.md` (updated - added completed runbooks section)
- ✅ `docs/operations/README.md` (updated - added comprehensive runbooks section)

## Deliverables

### 1. ✅ Runbook: ARCA API Down (`arca-api-down.md`)

**Completed**: 2025-10-19

Comprehensive incident response guide for ARCA government API outages.

**Sections Included:**
- **Symptoms**: Alert names, user reports, log patterns, metrics
  - Referenced alert: "ARCA API down (3 consecutive failures)" (from monitoring.md)
  - JSON log examples for ARCA timeout and connection refused errors
  - Prometheus metrics: `arca_api_errors_total`, `arca_api_calls_total`, `invoices_created_total`

- **Diagnosis**:
  - Step 1: Verify ARCA API status with curl command
  - Step 2: Check official ARCA status (Twitter @AFIPcomunica, status page)
  - Step 3: Distinguish ARCA down vs authentication issue (critical!)
  - Step 4: Assess scope and expected duration

- **Resolution**:
  - Enable circuit breaker: `railway run --env production pnpm config:set ARCA_CIRCUIT_BREAKER=true`
  - Configure invoice queueing (202 Accepted response, not 503)
  - Update status page (Statuspage.io API + manual instructions)
  - Monitor ARCA recovery with automated checks
  - Disable circuit breaker when ARCA recovers
  - Process queued invoices: `pnpm jobs:process-pending-invoices`

- **Verification**:
  - 7-point checklist: circuit breaker state, ARCA responding, new invoices succeeding, queue processed, error rate normal, alerts cleared, status page updated
  - Test invoice submission with example curl command

- **Escalation**:
  - ARCA Support: servicios@afip.gob.ar (if down >4 hours)
  - CEO/CTO: If customer complaints >50/hour or major customer affected
  - DBA: If queued invoices >10,000 (database impact)
  - Alternative resolution for >24 hour outages (manual processing)

- **Post-Incident**:
  - Immediate actions (within 1 hour): status page, stakeholder notification, incident report
  - Short-term actions (within 24 hours): post-mortem, review queued invoices, SLA credits
  - Long-term actions (within 1 week): automation improvements, monitoring dashboards, architecture review
  - Complete post-mortem template provided

- **Prevention**:
  - Monitoring improvements: Auto-enable circuit breaker, ARCA uptime dashboard
  - Architecture improvements: Automatic circuit breaker, queue capacity planning, graceful degradation
  - Process improvements: ARCA maintenance calendar, pre-emptive circuit breaker, quarterly drills

**Key Features:**
- All commands are copy-paste executable (Railway CLI, curl, pnpm)
- References alert names exactly as defined in monitoring.md
- Clear escalation paths with specific criteria
- Comprehensive post-mortem template
- Links to related runbooks and references

### 2. ✅ Runbook: Database Issues (`database-issues.md`)

**Completed**: 2025-10-19

Comprehensive guide covering three common database issues: connection pool exhaustion, slow queries, and database locks.

**Sections Included:**
- **Symptoms** (for all 3 issue types):
  - Connection pool exhausted: Referenced alert "Database connection pool exhausted", error code 53300, timeouts
  - Slow queries: P95 latency alerts, slow query log patterns
  - Database locks: Deadlock and lock timeout errors
  - JSON log examples for each issue type
  - Prometheus metrics for diagnosis

- **Impact**:
  - Severity levels: SEV1 for pool exhaustion, SEV2 for slow queries and locks
  - User and business impact for each issue type

- **Diagnosis**:
  - **Connection pool**: SQL queries to check current connections vs max, identify connection leaks
  - **Slow queries**: Find long-running queries, check for missing indexes with `pg_stat_user_tables`, use EXPLAIN ANALYZE
  - **Database locks**: Find blocked queries with comprehensive lock query, check for deadlocks

- **Resolution**:
  - **Pool exhausted**: Quick fix (restart service), permanent fix (increase pool size), long-term fix (find connection leaks with code examples)
  - **Slow queries**: Add indexes with `CREATE INDEX CONCURRENTLY`, optimize queries (good vs bad patterns), kill long-running queries with caution
  - **Database locks**: Terminate blocking queries, prevent deadlocks (code examples), set lock timeouts

- **Verification**:
  - Separate verification checklists for each issue type
  - SQL queries to verify fixes
  - Metrics to monitor
  - Overall system health checks

- **Escalation**:
  - DBA: If issue persists >30min, data corruption suspected, database unresponsive
  - CTO: If data loss, catastrophic failure, security incident
  - Information to provide when escalating

- **Prevention**:
  - Monitoring improvements: Connection pool usage, slow queries, idle transactions, blocked queries
  - Application improvements: Connection pooling best practices, statement timeout, query optimization, transaction management
  - Database configuration: Recommended PostgreSQL settings for production
  - Regular maintenance schedule: Daily, weekly, monthly, quarterly tasks

**Key Features:**
- Covers 3 distinct database issues in one comprehensive runbook
- All SQL queries are valid PostgreSQL
- Code examples show good vs bad patterns (JavaScript/TypeScript)
- Clear when to terminate queries (with warnings)
- Complete PostgreSQL configuration recommendations
- Links to pg documentation and best practices

### 3. ✅ Updated Runbooks README

**Completed**: 2025-10-19

**Changes Made:**
- Updated status from "TODO" to "Active - Core runbooks completed in Task #8"
- Added "Available Runbooks" section with detailed descriptions of both runbooks
- Each runbook entry includes: severity, symptoms, alerts, common causes, resolution, key actions, typical duration
- Added "Quick Reference" table for fast incident lookup during emergencies
- Added "Contributing to Runbooks" section with quality standards
- Updated "Last Updated" date to 2025-10-19
- Maintained all planned runbooks for future development

**Quick Reference Table:**
| Symptom | Runbook | Severity | First Action |
|---------|---------|----------|--------------|
| All invoices failing, 503 errors | ARCA API Down | SEV1 | Enable circuit breaker |
| "Too many connections" errors | Database Issues | SEV1 | Restart API service |
| API very slow, timeouts | Database Issues | SEV2 | Check for slow queries |
| Writes failing, lock timeouts | Database Issues | SEV2 | Find blocking queries |
| ARCA slow but not down | ARCA API Down | SEV2 | Monitor, may need circuit breaker |

### 4. ✅ Updated Operations README

**Completed**: 2025-10-19

**Changes Made:**
- Added comprehensive "## Runbooks" section after Monitoring section
- Included detailed summaries of both available runbooks with:
  - When to use each runbook
  - Alert names triggered
  - Symptoms to look for
  - Quick actions to take
  - Key commands (copy-paste ready)
  - Expected durations or coverage
- Added Quick Reference table (same as in runbooks README)
- Added "Using Runbooks" guide with 6-step process
- Updated status footer to show all three streams completed

**Runbooks Section Highlights:**
- Two detailed runbook descriptions with all essential information
- Code blocks with copy-paste executable commands
- Quick reference table for emergency lookup
- Step-by-step usage guide
- Link to runbooks README for complete list and template

## Summary

All deliverables completed successfully. Stream C has created two production-ready runbooks that on-call engineers can execute at 3AM under pressure:

1. **ARCA API Down Runbook**: Comprehensive guide covering symptoms, diagnosis, resolution (circuit breaker, queueing), verification, escalation, post-incident, and prevention. All commands are Railway CLI-based and copy-paste executable.

2. **Database Issues Runbook**: Covers three critical database issues (connection pool exhaustion, slow queries, locks) with detailed diagnosis SQL queries, resolution steps, and prevention measures. All PostgreSQL queries are production-ready.

Both runbooks:
- Reference alert names exactly as defined in monitoring.md (Stream B dependency satisfied)
- Include copy-paste executable commands (Railway CLI, bash, SQL)
- Provide clear escalation criteria and contact information
- Include comprehensive verification checklists
- Link to related runbooks and documentation
- Follow the established runbook template structure

Documentation has been updated:
- Runbooks README now lists completed runbooks with quick reference
- Operations README includes comprehensive runbooks section
- All cross-links are functional

**Ready for**: Production use, on-call rotation, incident response testing

## Notes

**Quality Highlights:**
- All commands tested for Railway CLI compatibility
- SQL queries are valid PostgreSQL syntax
- Alert names match exactly with monitoring.md definitions
- Code examples show TypeScript/JavaScript patterns
- Clear escalation paths with specific criteria
- Comprehensive post-mortem template in ARCA runbook
- Prevention sections suggest proactive improvements

**Coordination with Other Streams:**
- Stream A (Deployment): Referenced deployment procedures and health checks
- Stream B (Monitoring): Referenced all alert names, metrics, and SLO definitions
- No conflicts with other streams (separate files)

**Production Readiness:**
- Runbooks are immediately usable for incident response
- All commands are executable in Railway production environment
- Clear verification steps ensure proper resolution
- Escalation criteria prevent unnecessary pages
- Prevention sections reduce future incidents
