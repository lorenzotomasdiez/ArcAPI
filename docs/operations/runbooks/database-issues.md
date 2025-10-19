# Runbook: Database Issues

**Severity**: SEV1-SEV2 (varies by issue)
**Last Updated**: 2025-10-19
**Owner**: On-Call Team + DBA

## Symptoms

Database issues manifest in several ways. This runbook covers the three most common issues:

### 1. Connection Pool Exhausted

**User Reports:**
- API requests timing out or very slow (>10s)
- Intermittent 500 errors
- "Service temporarily unavailable" messages

**Alerts Triggered:**
- "Database connection pool exhausted" (CRITICAL)
- "ARCA API: High P95 latency (>5s)" (CRITICAL)

**Log Patterns:**
```json
{
  "level": "error",
  "message": "Database connection pool exhausted",
  "context": {
    "active_connections": 100,
    "max_connections": 100,
    "waiting_queries": 45,
    "error": "TimeoutError: Acquiring client from pool timed out"
  }
}
```

```json
{
  "level": "error",
  "message": "Database error",
  "error": {
    "code": "53300",
    "message": "too many connections for role"
  }
}
```

**Metrics:**
- `database_errors_total{error_code="53300"}` increasing
- `http_request_duration_seconds` P95 >5s
- `database_query_duration_seconds` showing long wait times

### 2. Slow Queries

**User Reports:**
- Specific endpoints very slow (e.g., GET /invoices)
- Dashboard loading times >10s
- Reports timing out

**Alerts Triggered:**
- "ARCA API: Elevated P95 latency (>3s)" (WARNING)
- "Database query duration high" (WARNING)

**Log Patterns:**
```json
{
  "level": "warn",
  "message": "Slow database query",
  "context": {
    "query_type": "SELECT",
    "table": "invoices",
    "duration_ms": 8500,
    "threshold_ms": 1000
  }
}
```

**Metrics:**
- `database_query_duration_seconds{table="invoices"}` P95 >1s
- Specific endpoints showing high latency
- CPU usage on database instance >80%

### 3. Database Locks

**User Reports:**
- Writes failing or timing out
- Specific users unable to create invoices
- "Resource temporarily locked" errors

**Alerts Triggered:**
- "Database deadlock detected" (WARNING)
- "Database transaction timeout" (WARNING)

**Log Patterns:**
```json
{
  "level": "error",
  "message": "Database lock timeout",
  "context": {
    "query": "UPDATE invoices SET status='approved' WHERE id=?",
    "lock_wait_time_ms": 30000,
    "error": "canceling statement due to lock timeout"
  }
}
```

**Metrics:**
- `database_errors_total{error_code="40P01"}` (deadlock)
- `database_errors_total{error_code="55P03"}` (lock timeout)
- Increasing query wait times

## Impact

**Connection Pool Exhausted:**
- **Severity**: SEV1 (Critical)
- **User Impact**: All API operations affected, ~100% failure rate
- **Business Impact**: Complete service outage, revenue loss

**Slow Queries:**
- **Severity**: SEV2 (High)
- **User Impact**: Degraded performance, specific features slow
- **Business Impact**: User experience degraded, potential churn

**Database Locks:**
- **Severity**: SEV2 (High)
- **User Impact**: Specific operations failing (usually writes)
- **Business Impact**: Partial functionality loss, data inconsistency risk

## Prerequisites

**Required Access:**
- Railway production environment access
- PostgreSQL database read/write access
- Better Stack or Datadog logs access
- Grafana/Prometheus dashboards

**Required Tools:**
- `psql` (PostgreSQL CLI) installed
- Railway CLI installed and configured
- Database connection string (from Railway secrets)

**Required Knowledge:**
- PostgreSQL connection pooling concepts
- SQL query optimization basics
- Database indexing fundamentals
- PostgreSQL lock types and behavior

## Diagnosis

### Issue 1: Connection Pool Exhausted

#### Step 1: Check Current Connection Pool Status

```bash
# Connect to production database
railway run --env production psql $DATABASE_URL

# Check total connections vs max
SELECT count(*) as current_connections,
       (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections,
       count(*) * 100.0 / (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as percentage_used
FROM pg_stat_activity;

# Expected: percentage_used <70% normally
# If >90%: Pool exhausted
```

#### Step 2: Identify What's Using Connections

```sql
-- Show active connections by state
SELECT state, count(*)
FROM pg_stat_activity
WHERE state IS NOT NULL
GROUP BY state
ORDER BY count(*) DESC;

-- Show active queries with duration
SELECT pid,
       usename,
       application_name,
       client_addr,
       state,
       now() - query_start AS duration,
       query
FROM pg_stat_activity
WHERE state = 'active'
  AND query NOT LIKE '%pg_stat_activity%'
ORDER BY duration DESC
LIMIT 20;
```

**Look for:**
- Many connections in `idle in transaction` state (connection leak)
- Long-running queries (>30s) blocking connections
- Unexpected application names (rogue clients)

#### Step 3: Check Application Connection Pool Settings

```bash
# Check current pool size configuration
railway run --env production pnpm config:get DATABASE_POOL_SIZE
# Expected: 20-50 (depends on load)

# Check pool configuration in application
railway run --env production node -e "
const { Pool } = require('pg');
const pool = new Pool();
console.log('Max clients:', pool.options.max);
console.log('Idle timeout:', pool.options.idleTimeoutMillis);
console.log('Connection timeout:', pool.options.connectionTimeoutMillis);
"
```

### Issue 2: Slow Queries

#### Step 1: Identify Currently Running Slow Queries

```sql
-- Find queries running longer than 5 seconds
SELECT pid,
       usename,
       application_name,
       now() - query_start AS duration,
       state,
       query
FROM pg_stat_activity
WHERE state = 'active'
  AND now() - query_start > interval '5 seconds'
  AND query NOT LIKE '%pg_stat_activity%'
ORDER BY duration DESC;
```

#### Step 2: Check for Missing Indexes

```sql
-- Find tables with sequential scans (potential missing indexes)
SELECT schemaname,
       tablename,
       seq_scan,
       seq_tup_read,
       idx_scan,
       seq_tup_read / NULLIF(seq_scan, 0) AS avg_seq_tup_read
FROM pg_stat_user_tables
WHERE seq_scan > 100  -- Tables with many sequential scans
ORDER BY seq_tup_read DESC
LIMIT 10;

-- If seq_scan is high and idx_scan is low, indexes may be missing
```

#### Step 3: Analyze Specific Query Performance

```sql
-- Get the slow query from logs, then analyze it:
EXPLAIN ANALYZE
SELECT * FROM invoices
WHERE user_id = 'usr_123'
  AND created_at > '2025-10-01'
ORDER BY created_at DESC
LIMIT 50;

-- Look for:
-- - "Seq Scan" (should be "Index Scan" for large tables)
-- - High "rows" count (indicates inefficient filtering)
-- - High "cost" values
```

### Issue 3: Database Locks

#### Step 1: Find Blocked Queries

```sql
-- Find queries blocked by locks
SELECT blocked_locks.pid AS blocked_pid,
       blocked_activity.usename AS blocked_user,
       blocking_locks.pid AS blocking_pid,
       blocking_activity.usename AS blocking_user,
       blocked_activity.query AS blocked_query,
       blocking_activity.query AS blocking_query,
       blocked_activity.application_name AS blocked_app,
       blocking_activity.application_name AS blocking_app
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_locks.pid = blocked_activity.pid
JOIN pg_catalog.pg_locks blocking_locks
  ON blocking_locks.locktype = blocked_locks.locktype
  AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
  AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
  AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
  AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
  AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
  AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
  AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
  AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
  AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
  AND blocking_locks.pid != blocked_locks.pid
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_locks.pid = blocking_activity.pid
WHERE NOT blocked_locks.granted;
```

#### Step 2: Check for Deadlocks

```sql
-- Check PostgreSQL logs for deadlock errors
-- In Railway logs, search for: "deadlock detected"

-- Check deadlock count (if available in metrics)
SELECT datname, deadlocks
FROM pg_stat_database
WHERE datname = current_database();
```

## Resolution

### Resolution 1: Connection Pool Exhausted

#### Quick Fix: Restart API Service

**WARNING**: This will cause ~30 seconds of downtime but immediately frees connections.

```bash
# Restart the API service (releases all connections)
railway restart --service arca-api --env production

# Verify service is back up
curl -I https://api.arcaapi.com/health
# Expected: 200 OK within 30 seconds
```

**Expected Result**:
- All leaked connections closed
- Connection pool resets to 0 active connections
- API starts accepting requests again

#### Permanent Fix: Increase Pool Size

If restarts become frequent, increase pool size:

```bash
# Check current pool size
railway run --env production pnpm config:get DATABASE_POOL_SIZE

# Increase pool size (e.g., from 20 to 50)
railway variables --env production set DATABASE_POOL_SIZE=50

# Restart API to apply new pool size
railway restart --service arca-api --env production

# Verify new setting
railway run --env production pnpm config:get DATABASE_POOL_SIZE
# Expected: 50
```

**Calculate appropriate pool size:**
```
Formula: (max_connections - superuser_reserved) / number_of_api_instances

Example:
- max_connections: 100 (database limit)
- superuser_reserved: 10
- api_instances: 2
- pool_size_per_instance: (100 - 10) / 2 = 45
```

#### Long-term Fix: Find and Fix Connection Leaks

Connection leaks happen when connections aren't properly released. Investigate:

```javascript
// Check for connection leak patterns in code:

// BAD: Connection not released on error
async function badQuery() {
  const client = await pool.connect();
  const result = await client.query('SELECT * FROM users');
  // If error occurs here, client never released!
  client.release();
  return result;
}

// GOOD: Connection always released
async function goodQuery() {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM users');
    return result;
  } finally {
    client.release(); // Always releases, even on error
  }
}
```

**Check logs for unreleased connections:**
```bash
# Search for connection acquisition without release
railway logs --env production --tail 1000 | grep "pool.connect"
```

### Resolution 2: Slow Queries

#### Quick Fix: Add Missing Index

If diagnosis showed missing indexes, add them:

```sql
-- Add index (use CONCURRENTLY to avoid locking table)
CREATE INDEX CONCURRENTLY idx_invoices_user_created
ON invoices(user_id, created_at DESC);

-- Verify index created
\d invoices
-- Should show new index in index list

-- Test query performance after index
EXPLAIN ANALYZE
SELECT * FROM invoices
WHERE user_id = 'usr_123'
  AND created_at > '2025-10-01'
ORDER BY created_at DESC
LIMIT 50;

-- Should now show "Index Scan" instead of "Seq Scan"
```

**Common indexes to add:**

```sql
-- User's invoices by creation date
CREATE INDEX CONCURRENTLY idx_invoices_user_created
ON invoices(user_id, created_at DESC);

-- Invoice lookup by external ID
CREATE INDEX CONCURRENTLY idx_invoices_external_id
ON invoices(external_id);

-- Pending invoices for queue processing
CREATE INDEX CONCURRENTLY idx_invoices_status_created
ON invoices(status, created_at)
WHERE status = 'pending_arca_retry';

-- User API key lookup
CREATE INDEX CONCURRENTLY idx_api_keys_key_hash
ON api_keys(key_hash);
```

#### Permanent Fix: Optimize Query

If index doesn't help, optimize the query itself:

```sql
-- BAD: Fetching all columns unnecessarily
SELECT * FROM invoices WHERE user_id = 'usr_123' LIMIT 100;

-- GOOD: Only fetch needed columns
SELECT id, numero, fecha_comprobante, importe_total, status
FROM invoices
WHERE user_id = 'usr_123'
LIMIT 100;

-- BAD: Using LIKE with leading wildcard (can't use index)
SELECT * FROM invoices WHERE numero_string LIKE '%12345%';

-- GOOD: Use exact match or trailing wildcard
SELECT * FROM invoices WHERE numero_string LIKE '12345%';

-- BAD: OR condition prevents index usage
SELECT * FROM invoices WHERE user_id = 'usr_123' OR organization_id = 'org_456';

-- GOOD: Use UNION for OR conditions
SELECT * FROM invoices WHERE user_id = 'usr_123'
UNION
SELECT * FROM invoices WHERE organization_id = 'org_456';
```

#### Kill a Long-Running Query (Use with Caution!)

If a rogue query is blocking the system:

```sql
-- First, identify the PID from diagnosis step
SELECT pid, query FROM pg_stat_activity WHERE state = 'active';

-- Terminate the specific query (graceful)
SELECT pg_cancel_backend(12345);  -- Replace 12345 with actual PID

-- If pg_cancel_backend doesn't work, force termination
SELECT pg_terminate_backend(12345);  -- CAUTION: Abrupt termination
```

**WARNING**: Only terminate queries if:
- Query has been running >10 minutes with no progress
- Query is blocking critical operations
- You've confirmed the query is safe to terminate (not a migration or critical batch job)

### Resolution 3: Database Locks

#### Quick Fix: Terminate Blocking Query

If diagnosis identified a blocking query:

```sql
-- From diagnosis, get blocking_pid
-- Terminate the blocking query
SELECT pg_terminate_backend(blocking_pid);
-- Replace blocking_pid with actual PID from diagnosis

-- Verify locks cleared
SELECT count(*) FROM pg_locks WHERE NOT granted;
-- Expected: 0 (no blocked queries)
```

**When to terminate:**
- Blocking query is idle in transaction for >5 minutes
- Blocking query is a write that failed but didn't rollback
- Multiple queries blocked and affecting users

**When NOT to terminate:**
- Blocking query is a legitimate long-running operation (migration, batch job)
- You don't understand what the blocking query does
- Uncertainty if termination will cause data inconsistency

#### Permanent Fix: Prevent Deadlocks

Common deadlock patterns to avoid:

```javascript
// BAD: Multiple updates in unpredictable order (can deadlock)
async function updateInvoices(invoiceIds) {
  for (const id of invoiceIds) {
    await db.query('UPDATE invoices SET status=$1 WHERE id=$2', ['approved', id]);
  }
}

// GOOD: Update in consistent order (prevents deadlock)
async function updateInvoices(invoiceIds) {
  // Sort IDs to ensure consistent lock order
  const sortedIds = [...invoiceIds].sort();
  for (const id of sortedIds) {
    await db.query('UPDATE invoices SET status=$1 WHERE id=$2', ['approved', id]);
  }
}

// BAD: Long transaction holding locks
async function processWithLongTransaction() {
  const client = await pool.connect();
  await client.query('BEGIN');
  await client.query('UPDATE invoices SET status=$1 WHERE id=$2', ['processing', id]);

  // Long-running operation inside transaction (BAD!)
  await callExternalAPI(); // Takes 5 seconds, holds locks

  await client.query('COMMIT');
  client.release();
}

// GOOD: Short transaction, long operation outside
async function processWithShortTransaction() {
  // Long operation outside transaction
  const result = await callExternalAPI();

  // Short transaction only for write
  const client = await pool.connect();
  await client.query('BEGIN');
  await client.query('UPDATE invoices SET status=$1, result=$2 WHERE id=$3',
    ['completed', result, id]);
  await client.query('COMMIT');
  client.release();
}
```

#### Set Lock Timeout

Configure lock timeout to prevent indefinite waits:

```sql
-- Set statement timeout (milliseconds)
ALTER DATABASE arca_production SET statement_timeout = '30s';

-- Set lock timeout (milliseconds)
ALTER DATABASE arca_production SET lock_timeout = '10s';

-- Verify settings
SHOW statement_timeout;
SHOW lock_timeout;
```

## Verification

### Connection Pool Exhausted - Verification

- [ ] **Connection count normal**: Query shows <70% pool usage
  ```sql
  SELECT count(*) * 100.0 / (SELECT setting::int FROM pg_settings WHERE name = 'max_connections')
  FROM pg_stat_activity;
  ```
- [ ] **No idle in transaction**:
  ```sql
  SELECT count(*) FROM pg_stat_activity WHERE state = 'idle in transaction';
  -- Expected: 0 or very low
  ```
- [ ] **API latency normal**: P95 latency <200ms
- [ ] **No connection errors in logs**: No "pool exhausted" errors
- [ ] **Health check passes**: `curl https://api.arcaapi.com/health` returns 200 OK

### Slow Queries - Verification

- [ ] **Query latency improved**:
  ```sql
  -- Re-run EXPLAIN ANALYZE on the problematic query
  -- Execution time should be <100ms for typical queries
  ```
- [ ] **Index being used**:
  ```sql
  EXPLAIN SELECT * FROM invoices WHERE user_id = 'usr_123';
  -- Should show "Index Scan" not "Seq Scan"
  ```
- [ ] **Metrics improved**: `database_query_duration_seconds` P95 <100ms
- [ ] **User reports resolved**: Dashboard loads in <2s
- [ ] **CPU usage normal**: Database CPU <60%

### Database Locks - Verification

- [ ] **No blocked queries**:
  ```sql
  SELECT count(*) FROM pg_locks WHERE NOT granted;
  -- Expected: 0
  ```
- [ ] **No deadlocks in last hour**: Check logs for "deadlock detected"
- [ ] **Writes succeeding**: Test invoice creation succeeds
- [ ] **Transaction duration normal**: Average <100ms
- [ ] **No lock timeout errors in logs**

### Overall System Health

- [ ] **All alerts cleared**: No active database-related alerts
- [ ] **Error rate <1%**: Overall API error rate normal
- [ ] **Response time normal**: P95 latency <200ms (excluding ARCA calls)
- [ ] **No user complaints**: Check support channels

## Escalation

### When to Escalate to Database Administrator

**Escalate immediately if**:
- Issue persists >30 minutes after attempting fixes
- Data corruption suspected (inconsistent data, foreign key violations)
- Database CPU >95% sustained for >10 minutes
- Disk space >90% (risk of write failure)
- Replication lag >5 minutes (if using read replicas)
- Database unresponsive (can't connect via psql)

**Contact**: DBA on-call via Slack #database-alerts or dba-oncall@arcaapi.com

### When to Escalate to CTO

**Escalate immediately if**:
- Data loss suspected
- Database restore required
- Catastrophic failure (complete database outage >15 minutes)
- Security incident (SQL injection, unauthorized access)

**Contact**: CTO via Slack DM + phone call

### Escalation Information to Provide

When escalating, provide:

1. **Incident summary**:
   - What happened (connection pool exhausted, slow queries, locks)
   - When it started (timestamp)
   - Current impact (% of requests affected, users impacted)

2. **Actions already taken**:
   - Diagnosis queries run
   - Fixes attempted (restart, index creation, query termination)
   - Results of fixes

3. **Current database state**:
   - Connection count
   - Active queries count
   - Blocked queries count
   - CPU/memory/disk usage

4. **Relevant logs/queries**:
   - Error messages
   - Slow query text
   - Blocking query PID and text

## Prevention

### Monitoring Improvements

Add these alerts to detect database issues faster:

```promql
# Alert: Connection pool >80% utilized
(sum(pg_stat_database_numbackends) / pg_settings_max_connections) * 100 > 80

# Alert: Slow query detected (>5s)
increase(database_query_duration_seconds_bucket{le="5"}[1m]) > 10

# Alert: Idle in transaction >5 minutes
pg_stat_activity_idle_in_transaction_seconds > 300

# Alert: Blocked queries detected
pg_locks_blocked_queries > 0
```

### Application Improvements

1. **Connection pooling best practices**:
   ```javascript
   // Always use try/finally for connection release
   const client = await pool.connect();
   try {
     await client.query(...);
   } finally {
     client.release();  // ALWAYS release
   }
   ```

2. **Statement timeout**:
   ```javascript
   // Set statement timeout on all queries
   pool.on('connect', (client) => {
     client.query('SET statement_timeout = 30000'); // 30 seconds
   });
   ```

3. **Query optimization**:
   - Add indexes for all WHERE, JOIN, ORDER BY columns
   - Use LIMIT on large result sets
   - Paginate instead of fetching all records
   - Cache frequently accessed data (Redis)

4. **Transaction management**:
   - Keep transactions short (<1 second)
   - Don't call external APIs inside transactions
   - Use optimistic locking instead of pessimistic locks where possible

### Database Configuration

Recommended PostgreSQL settings for production:

```sql
-- Connection settings
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET shared_buffers = '256MB';

-- Timeout settings
ALTER SYSTEM SET statement_timeout = '30s';
ALTER SYSTEM SET lock_timeout = '10s';
ALTER SYSTEM SET idle_in_transaction_session_timeout = '5min';

-- Performance settings
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET work_mem = '16MB';
ALTER SYSTEM SET maintenance_work_mem = '128MB';

-- Reload configuration
SELECT pg_reload_conf();
```

### Regular Maintenance

Schedule these maintenance tasks:

1. **Daily**:
   - Monitor connection pool usage trends
   - Review slow query log (queries >1s)
   - Check for connection leaks (idle in transaction)

2. **Weekly**:
   - Analyze table statistics (`ANALYZE`)
   - Review query performance (top 10 slowest queries)
   - Check for missing indexes

3. **Monthly**:
   - Vacuum database (`VACUUM ANALYZE`)
   - Review and optimize indexes (drop unused, add missing)
   - Capacity planning (connection pool size, max_connections)

4. **Quarterly**:
   - Database performance review meeting
   - Load testing with production-like data
   - Review and update this runbook

## Related Runbooks

- [High Latency](./high-latency.md) - If database issues cause API latency
- [ARCA API Down](./arca-api-down.md) - If database issues during ARCA outage cause backlog
- [Deployment Rollback](./deployment-rollback.md) - If database migration causes issues
- [Memory Leak](./memory-leak.md) - If connection leaks are due to memory leaks

## References

- [Monitoring Strategy](../monitoring.md) - Database metrics and alerts
- [Architecture: Database Design](../../architecture/04-infrastructure.md) - Database architecture
- [PostgreSQL Connection Pooling](https://node-postgres.com/features/pooling) - pg pooling docs
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization) - Official docs
- [Finding Slow Queries](https://www.postgresql.org/docs/current/runtime-config-logging.html#RUNTIME-CONFIG-LOGGING-WHAT) - PostgreSQL logging

---

**Questions or Issues?** Contact: #oncall-team (Slack) or oncall@arcaapi.com
