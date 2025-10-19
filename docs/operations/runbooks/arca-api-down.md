# Runbook: ARCA API Down

**Severity**: SEV1 (Critical)
**Last Updated**: 2025-10-19
**Owner**: On-Call Team

## Symptoms

When the ARCA government API is unavailable or unresponsive, you will observe:

**User Reports:**
- Invoice creation requests failing with "503 Service Unavailable"
- Users seeing error message: "ARCA service temporarily unavailable"
- All ARCA-related operations timing out

**Alerts Triggered:**
- "ARCA API down (3 consecutive failures)" (CRITICAL)
- "ARCA API: High error rate (>5%)" (CRITICAL)

**Log Patterns:**
```json
{
  "level": "error",
  "message": "ARCA API timeout",
  "context": {
    "operation": "FECAESolicitar",
    "error": "ETIMEDOUT",
    "duration_ms": 30000
  }
}
```

```json
{
  "level": "error",
  "message": "ARCA connection refused",
  "context": {
    "operation": "authenticate",
    "error": "ECONNREFUSED",
    "url": "wswhomo.afip.gov.ar"
  }
}
```

**Metrics:**
- `arca_api_errors_total{error_code="timeout"}` increasing
- `arca_api_calls_total{status="error"}` spike to >50%
- `invoices_created_total{status="failed"}` increasing

## Impact

**User Impact**:
- Users cannot create new invoices
- All ARCA-dependent operations blocked
- Approximately 100% of invoice creation operations affected

**Business Impact**:
- Revenue loss: ~$X per hour (based on average invoice volume)
- SLA violation: Availability SLO (99.95%) at risk
- Customer satisfaction impact: HIGH

**Expected Duration**:
- ARCA government maintenance: 2-4 hours
- ARCA unplanned outage: 15 minutes - 2 hours
- Network issues: 5-30 minutes

## Prerequisites

**Required Access:**
- Railway production environment access
- Better Stack or Datadog logs access
- Status page admin access
- ARCA status monitoring tools

**Required Tools:**
- `curl` or Postman for API testing
- Railway CLI installed and configured
- Access to production environment variables

**Required Knowledge:**
- Understanding of ARCA API authentication flow
- Familiarity with circuit breaker pattern
- Production deployment procedures

## Diagnosis

### Step 1: Verify ARCA API Status

First, confirm that ARCA is actually down (not our authentication issue):

```bash
# Test ARCA homologation endpoint directly
curl -v --max-time 10 https://wswhomo.afip.gov.ar/wsfev1/service.asmx

# Expected if ARCA is down: timeout or 500/502/503 error
# Expected if ARCA is up: 200 OK with WSDL XML
```

If the curl command times out or returns 5xx errors, ARCA is likely down.

### Step 2: Check Official ARCA Status

Check official channels for ARCA status updates:

1. **ARCA Status Page** (if available):
   ```bash
   # Check ARCA official status
   curl https://www.afip.gob.ar/sitio/externos/default.asp
   ```

2. **ARCA Twitter Account**:
   - Visit: https://twitter.com/AFIPcomunica
   - Look for announcements about service interruptions
   - Check within last 30 minutes

3. **ARCA Support Portal**:
   - Login to ARCA developer portal
   - Check "Service Status" section
   - Look for scheduled maintenance notices

### Step 3: Distinguish ARCA Down vs Authentication Issue

This is critical - determine if ARCA is down or if we have an authentication problem:

```bash
# Test with a known-good certificate (production environment)
railway run --env production pnpm test:arca-connection

# If test SUCCEEDS: ARCA is up, we have an authentication issue
# → Follow runbook: certificate-expired.md instead

# If test FAILS with timeout/connection refused: ARCA is down
# → Continue with this runbook
```

**Alternative test** (check specific error codes):
```bash
# Check logs for ARCA error patterns
# Authentication errors: error_code=10001, 10002, 10004
# ARCA down errors: timeout, connection_refused, 500, 502, 503
```

If you see authentication error codes (10001, 10002), ARCA is likely up but we have a certificate issue.

### Step 4: Assess Scope and Duration

Determine the expected duration to plan response:

**Indicators of scheduled maintenance:**
- ARCA typically schedules maintenance on weekends
- Twitter announcement 24-48 hours in advance
- Duration: Usually 2-4 hours
- Action: Enable circuit breaker, queue invoices

**Indicators of unplanned outage:**
- No prior announcement
- Sudden spike in errors during business hours
- Duration: Usually 15 minutes - 2 hours
- Action: Enable circuit breaker, monitor closely

**Indicators of network/infrastructure issue:**
- Intermittent failures (some succeed, some fail)
- Only affecting specific operations
- Duration: Usually 5-30 minutes
- Action: Monitor, may resolve without intervention

## Resolution

### Immediate Action: Enable Circuit Breaker

The circuit breaker prevents our API from repeatedly calling ARCA when it's down, reducing load and preventing cascading failures.

```bash
# Connect to production environment
railway link
# Select: arca-api-production

# Enable circuit breaker (stops ARCA API calls)
railway run --env production \
  pnpm config:set ARCA_CIRCUIT_BREAKER=true

# Verify circuit breaker is enabled
railway run --env production \
  pnpm config:get ARCA_CIRCUIT_BREAKER
# Expected output: true
```

**Expected Result**:
- New invoice requests return 202 Accepted (not 503)
- Invoices saved with status `pending_arca_retry`
- No new ARCA API calls attempted

### Step 2: Configure Invoice Queueing

Ensure invoices are queued (not rejected) while ARCA is down:

```bash
# Verify queueing configuration
railway run --env production \
  pnpm config:get INVOICE_QUEUE_MODE
# Expected: "queue" (not "reject")

# If not set to queue mode, enable it:
railway run --env production \
  pnpm config:set INVOICE_QUEUE_MODE=queue
```

**Expected Behavior**:
- POST /v1/invoices returns `202 Accepted`
- Response body:
  ```json
  {
    "status": "pending",
    "message": "ARCA temporarily unavailable. Invoice queued for processing.",
    "invoice_id": "inv_abc123xyz",
    "estimated_processing": "when ARCA service restores"
  }
  ```
- Invoices stored in database with `status=pending_arca_retry`

### Step 3: Update Status Page

Inform customers about the ARCA outage:

```bash
# If using Statuspage.io
curl -X POST https://api.statuspage.io/v1/pages/YOUR_PAGE_ID/incidents \
  -H "Authorization: OAuth YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "incident": {
      "name": "ARCA Government API Unavailable",
      "status": "investigating",
      "impact_override": "major",
      "body": "The ARCA government API is currently experiencing issues. Invoice submissions are being queued and will be automatically processed when the ARCA service is restored. No action required from customers.",
      "component_ids": ["arca_integration"],
      "components": {
        "arca_integration": "major_outage"
      }
    }
  }'
```

**Manual Status Page Update** (if no CLI):
1. Login to status page admin: https://manage.statuspage.io
2. Click "Create Incident"
3. Set title: "ARCA Government API Unavailable"
4. Set status: "Investigating"
5. Set impact: "Major Outage"
6. Set message: "The ARCA government API is currently experiencing issues. Invoice submissions are being queued and will be automatically processed when ARCA is restored."
7. Affect components: "ARCA Integration"
8. Post incident

### Step 4: Monitor ARCA Recovery

Set up automated monitoring for ARCA recovery:

```bash
# Run automated ARCA health check (checks every 5 minutes)
railway run --env production \
  pnpm monitor:arca-health --interval 300

# Manually check ARCA status
watch -n 60 'curl -s -o /dev/null -w "%{http_code}" https://wswhomo.afip.gov.ar/wsfev1/service.asmx'
# Watch for 200 response code indicating ARCA is back
```

**Monitor these metrics** in Grafana/Prometheus:
```promql
# ARCA error rate
sum(rate(arca_api_errors_total[1m]))

# When this drops to 0, ARCA may be recovering
```

### Step 5: When ARCA Recovers - Disable Circuit Breaker

Once ARCA is confirmed operational, restore normal operation:

```bash
# Step 1: Verify ARCA is responding
curl -v https://wswhomo.afip.gov.ar/wsfev1/service.asmx
# Expect: 200 OK with WSDL XML (not timeout or 5xx)

# Step 2: Test authentication with production certificate
railway run --env production pnpm test:arca-connection
# Expect: "ARCA connection successful"

# Step 3: Disable circuit breaker
railway run --env production \
  pnpm config:set ARCA_CIRCUIT_BREAKER=false

# Step 4: Verify circuit breaker is disabled
railway run --env production \
  pnpm config:get ARCA_CIRCUIT_BREAKER
# Expected output: false
```

### Step 6: Process Queued Invoices

After circuit breaker is disabled, process all queued invoices:

```bash
# Get count of pending invoices
railway run --env production \
  pnpm db:query "SELECT COUNT(*) FROM invoices WHERE status='pending_arca_retry'"

# Process queued invoices (batch job)
railway run --env production \
  pnpm jobs:process-pending-invoices

# Monitor processing progress
railway run --env production \
  pnpm jobs:status pending-invoices
```

**Expected Processing Time**:
- ~100 invoices/minute (rate limited by ARCA)
- For 500 queued invoices: ~5 minutes
- For 2000 queued invoices: ~20 minutes

**Monitor these metrics** during processing:
```promql
# Successful invoice submissions
rate(invoices_created_total{status="approved"}[1m])

# Failed submissions (investigate if >5%)
rate(invoices_created_total{status="failed"}[1m])
```

### Step 7: Update Status Page - Resolved

Once processing completes, update status page:

```bash
# Update incident to resolved
curl -X PATCH https://api.statuspage.io/v1/pages/YOUR_PAGE_ID/incidents/INCIDENT_ID \
  -H "Authorization: OAuth YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "incident": {
      "status": "resolved",
      "body": "ARCA government API has been restored. All queued invoices have been processed successfully. Service is operating normally."
    }
  }'
```

**Manual Status Page Update**:
1. Go to incident page
2. Click "Update Incident"
3. Status: "Resolved"
4. Message: "ARCA government API has been restored. All queued invoices have been processed successfully."
5. Post update

## Verification

Confirm that service is fully restored:

### Checklist

- [ ] **Circuit breaker disabled**: `ARCA_CIRCUIT_BREAKER=false`
- [ ] **ARCA responding**: `curl wswhomo.afip.gov.ar` returns 200 OK
- [ ] **New invoices succeeding**: POST /v1/invoices returns 201 Created (not 202 Accepted)
- [ ] **Queued invoices processed**: Query shows 0 invoices with `status=pending_arca_retry`
- [ ] **Error rate normal**: `arca_api_errors_total` rate <1%
- [ ] **Metrics healthy**:
  - `arca_api_calls_total{status="success"}` rate increasing
  - `invoices_created_total{status="approved"}` rate normal
  - P95 latency for invoice creation <5s
- [ ] **Alerts cleared**: No active alerts for "ARCA API down"
- [ ] **Status page updated**: Incident marked "Resolved"
- [ ] **User reports**: No new customer complaints

### Test Invoice Submission

Manually test invoice creation to verify end-to-end functionality:

```bash
# Test invoice creation (use test API key)
curl -X POST https://api.arcaapi.com/v1/invoices \
  -H "Authorization: Bearer YOUR_TEST_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo_comprobante": 6,
    "punto_venta": 1,
    "concepto": 1,
    "documento_tipo": 80,
    "documento_numero": 20123456789,
    "fecha_comprobante": "2025-10-19",
    "importe_total": 1000.00,
    "importe_neto": 826.45,
    "importe_iva": 173.55
  }'

# Expected response:
# Status: 201 Created
# Body: { "cae": "12345678901234", "cae_expiration": "2025-10-29", ... }
```

If the test invoice succeeds and returns a CAE, service is fully operational.

## Escalation

### When to Escalate

**Escalate to ARCA Support** if:
- ARCA down >4 hours with no official announcement
- ARCA returns consistent errors after "recovery"
- Intermittent failures continue >2 hours

**Contact**: servicios@afip.gob.ar (official ARCA support)

**Escalate to CEO/CTO** if:
- Customer complaints >50/hour
- Major customer affected (enterprise clients)
- Media inquiries about service disruption
- Potential financial penalties due to SLA breach

**Escalate to Database Administrator** if:
- Queued invoices >10,000 (database impact)
- Queue processing failing repeatedly
- Database performance degraded due to backlog

### Escalation Procedure

1. **Document the incident**:
   - ARCA down time (start/end)
   - Number of affected invoices
   - Customer impact (complaints, revenue loss)
   - Actions taken

2. **Contact appropriate party**:
   - ARCA Support: Email with incident details
   - CEO/CTO: Slack DM + phone call if urgent
   - DBA: Slack #infrastructure channel

3. **Provide context**:
   - Timeline of events
   - Current status (circuit breaker enabled, N invoices queued)
   - Expected resolution time
   - Actions needed from them

### Alternative Resolution (if ARCA down >24 hours)

If ARCA is down for extended period, consider manual processing workaround:

**WARNING**: This is a last resort and requires executive approval.

1. **Discuss with CEO/CTO**: Get approval for manual processing
2. **Notify affected customers**: Explain manual processing delay
3. **Manual CAE generation** (if legally permitted in Argentina):
   - Follow ARCA offline procedures
   - Document all manual CAE numbers
   - Sync with ARCA when service restores
4. **Consult legal team**: Ensure compliance with tax regulations

## Post-Incident

### Immediate Actions (within 1 hour of resolution)

- [ ] **Update status page**: Mark incident as "Resolved"
- [ ] **Notify stakeholders**: Email to executive team with summary
- [ ] **Document incident**: Create incident report in wiki/Notion
- [ ] **Verify SLA impact**: Calculate downtime, check if SLA credits needed
- [ ] **Customer communication**: Proactive email to affected customers (if >100 affected)

### Short-term Actions (within 24 hours)

- [ ] **Write post-mortem**: Use template (see below)
- [ ] **Review queued invoices**: Verify all processed successfully
- [ ] **Update ARCA downtime metrics**: Track ARCA reliability trends
- [ ] **Review SLA credits**: Determine if customers need compensation
- [ ] **Jira ticket**: Create ticket for any improvements identified

### Post-Mortem Template

```markdown
# Post-Mortem: ARCA API Outage - [Date]

## Incident Summary
- **Date**: YYYY-MM-DD HH:MM - HH:MM (UTC)
- **Duration**: X hours Y minutes
- **Severity**: SEV1
- **Root Cause**: ARCA government API unavailable

## Impact
- **Users Affected**: X users
- **Invoices Queued**: X invoices
- **Revenue Impact**: $X (estimated)
- **SLA Breach**: Yes/No

## Timeline
- HH:MM - ARCA API becomes unresponsive
- HH:MM - Alerts triggered
- HH:MM - On-call engineer acknowledged
- HH:MM - Circuit breaker enabled
- HH:MM - Status page updated
- HH:MM - ARCA service restored
- HH:MM - Circuit breaker disabled
- HH:MM - Queued invoices processed
- HH:MM - Incident resolved

## What Went Well
- Circuit breaker prevented cascading failures
- Invoices successfully queued (no data loss)
- Status page updated promptly
- Recovery process smooth

## What Went Wrong
- Detection delay: X minutes before circuit breaker enabled
- Customer communication: Status page update delayed
- Queue processing: Slower than expected

## Action Items
- [ ] Improve ARCA down detection (alert within 1 minute)
- [ ] Automate circuit breaker (enable on 3 consecutive failures)
- [ ] Pre-draft status page messages (faster updates)
- [ ] Optimize queue processing (parallel processing)
- [ ] Add ARCA downtime dashboard (track reliability)

## Lessons Learned
- ARCA downtime is inevitable, circuit breaker critical
- Queueing prevents data loss and maintains user trust
- Communication matters as much as technical response
```

### Long-term Actions (within 1 week)

- [ ] **Implement automation**: Auto-enable circuit breaker on ARCA failures
- [ ] **Update monitoring**: Add ARCA uptime dashboard
- [ ] **Capacity planning**: Ensure queue can handle 24h ARCA downtime
- [ ] **Customer SLAs**: Review if ARCA downtime should be excluded from SLA
- [ ] **Architecture review**: Consider fallback ARCA endpoints (if available)
- [ ] **Runbook update**: Add lessons learned to this runbook

## Prevention

### Monitoring Improvements

Add these alerts to detect ARCA issues faster:

```promql
# Alert: ARCA API down (3 consecutive failures)
sum(increase(arca_api_errors_total{error_code=~"timeout|connection_refused"}[1m])) >= 3

# Alert: ARCA slow response (average >5s)
avg(rate(arca_api_duration_seconds_sum[5m]) / rate(arca_api_duration_seconds_count[5m])) > 5
```

### Architecture Improvements

Consider these architectural changes:

1. **Automatic circuit breaker**: Enable circuit breaker automatically after 3 consecutive ARCA failures
2. **Queue capacity**: Ensure database can handle 24h worth of invoice queue (~50k invoices)
3. **Graceful degradation**: Return 202 Accepted immediately when ARCA is slow (>10s response time)
4. **ARCA status monitoring**: Proactive monitoring of ARCA Twitter/status page
5. **Alternative endpoints**: If ARCA provides failover endpoints, configure fallback

### Process Improvements

1. **ARCA maintenance calendar**: Subscribe to ARCA maintenance notifications
2. **Pre-emptive circuit breaker**: Enable circuit breaker before scheduled ARCA maintenance
3. **Customer proactive communication**: Notify customers of scheduled ARCA maintenance 24h in advance
4. **Runbook drill**: Practice this runbook quarterly (simulate ARCA outage)

## Related Runbooks

- [Database Issues](./database-issues.md) - If queue processing causes database issues
- [High Latency](./high-latency.md) - If ARCA slowness (not down) causes high latency
- [Certificate Expired](./certificate-expired.md) - If authentication fails (not ARCA down)
- [Deployment Rollback](./deployment-rollback.md) - If circuit breaker code has issues

## References

- [Monitoring Strategy](../monitoring.md) - Alert definitions and metrics
- [Architecture: ARCA Integration](../../architecture/02-services.md) - ARCA integration design
- [ARCA API Documentation](https://www.afip.gob.ar/ws/) - Official ARCA API docs
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html) - Pattern explanation

---

**Questions or Issues?** Contact: #oncall-team (Slack) or oncall@arcaapi.com
