# ADR-001: Database Selection for ARCA API

**Status**: Accepted
**Date**: 2025-10-15
**Author**: Tech Lead
**Reviewers**: Engineering Team, Google Engineering Advisor

## Context

ARCA API requires a primary database for storing invoice data, user accounts, API keys, ARCA certificates, and operational metadata. The database must support:

- **Transactional integrity**: Invoice creation is multi-step (save → ARCA call → update status)
- **Full-text search**: Users search invoices by customer name, description, invoice number
- **JSON storage**: Flexible metadata storage for ARCA responses and custom fields
- **High availability**: 99.95% uptime target to support business-critical invoicing
- **Scalability**: Support 300K invoices/month in Year 1, 1M+/month in Year 2, 10M+ in Year 3
- **Cost-effectiveness**: Optimize for startup budget while maintaining performance
- **Security & Compliance**: GDPR compliant, support for encryption at rest, audit trails

## Decision

We will use **PostgreSQL 15** as the primary database.

**Deployment**: Managed service (AWS RDS or Supabase) with automated backups, read replicas, and point-in-time recovery.

## Rationale

### Why PostgreSQL?

**Strengths:**

1. **ACID compliance**: Guarantees data integrity for financial transactions (invoices, payments)
2. **Rich feature set**:
   - JSONB for flexible ARCA response storage and metadata
   - Full-text search (tsvector) with Spanish language support
   - Array types for storing multiple tax categories
   - Common Table Expressions (CTEs) for complex invoice queries
3. **Proven scalability**: Handles billions of rows with proper indexing and partitioning
4. **Strong ecosystem**:
   - Node.js: Excellent support via `pg` driver, Prisma ORM with TypeScript type safety
   - Python: Strong support via `psycopg3`, SQLAlchemy, asyncpg for AI services
5. **Cost-effective**:
   - Open source (no licensing fees)
   - Managed options from $20/month (Supabase) to $50/month (AWS RDS)
6. **Built-in full-text search**: Avoids need for separate search service (Elasticsearch) initially
7. **Row-level security**: Native support for multi-tenant data isolation (required for GDPR)

**Alignment with ARCA API requirements:**

- ✅ ACID for invoice integrity (prevent duplicate submissions to ARCA)
- ✅ Full-text search with tsvector and Spanish language support
- ✅ JSONB for flexible ARCA response storage (varies by invoice type)
- ✅ 99.95% uptime with RDS Multi-AZ or Supabase high-availability
- ✅ Horizontal read scaling with read replicas (analytics, reporting)
- ✅ Cost: $50-200/month for Year 1 scale (300K invoices/month)
- ✅ GDPR compliance with row-level security and encryption at rest

### Alternatives Considered

#### Alternative 1: MongoDB

**Pros:**
- Flexible schema (good for evolving ARCA response formats)
- Horizontal sharding built-in
- Good for rapid prototyping
- Native JSON storage

**Cons:**
- ❌ No multi-document ACID transactions in sharded clusters (critical for invoices)
- ❌ Full-text search less mature than PostgreSQL (especially for Spanish)
- ❌ Higher cost at scale (MongoDB Atlas pricing)
- ❌ Financial/compliance use cases strongly favor relational databases
- ❌ Complex queries require aggregation pipelines (harder to maintain)

**Verdict**: Schema flexibility not worth losing ACID guarantees for financial data. PostgreSQL's JSONB provides flexibility where needed.

#### Alternative 2: MySQL

**Pros:**
- ACID compliant
- Wide adoption and familiarity
- Cost-effective
- Good tooling and community

**Cons:**
- ❌ Weaker JSON support than PostgreSQL (JSON vs JSONB - no indexing on JSON fields)
- ❌ Full-text search less powerful (no advanced language support for Spanish)
- ❌ Less rich feature set (CTEs added late, no array types)
- ❌ Replication more complex than PostgreSQL

**Verdict**: PostgreSQL's superior JSON indexing and full-text search capabilities are critical for ARCA API's search and flexibility requirements.

#### Alternative 3: DynamoDB

**Pros:**
- Fully managed, serverless
- Infinite scalability
- Low latency for key-value lookups
- No server management

**Cons:**
- ❌ No joins: complex invoice queries require application-level logic
- ❌ No full-text search: requires separate OpenSearch cluster (cost++)
- ❌ More expensive at low scale (read/write capacity units vs fixed instance)
- ❌ ACID only within single partition: multi-table transactions harder
- ❌ Limited querying: requires careful index design upfront

**Verdict**: Premature optimization for scale we don't need yet. SQL flexibility and ACID across tables critical for early development velocity.

### Technology Stack Alignment

- **Core API (Node.js + TypeScript)**:
  - Excellent PostgreSQL support via `pg` driver
  - Prisma ORM provides best-in-class type safety and migrations
  - Auto-generated TypeScript types from schema
- **AI Service (Python + FastAPI)**:
  - Strong async support via `asyncpg`
  - SQLAlchemy ORM for complex queries
  - `psycopg3` for direct SQL access
- **Dashboard (Next.js)**:
  - Prisma integration for server-side data fetching
  - Type-safe database queries in API routes

## Consequences

### Positive

- ✅ Single database for all relational data (invoices, users, API keys, certificates)
- ✅ Built-in full-text search avoids Elasticsearch cost/complexity (save ~$100/month)
- ✅ JSONB allows schema evolution without migrations for ARCA metadata
- ✅ Strong consistency guarantees for financial data (no eventual consistency issues)
- ✅ Mature backup/recovery with point-in-time recovery (PITR)
- ✅ Read replicas for scaling read-heavy workloads (analytics, reporting dashboards)
- ✅ Row-level security for multi-tenant isolation (GDPR compliance)
- ✅ Trigger support for audit logging (track all invoice changes)

### Negative

- ⚠️ Vertical scaling limits (though ~1M invoices/day achievable on single db.r6g.large)
- ⚠️ Full-text search not as powerful as Elasticsearch at massive scale (may need migration Year 2-3)
- ⚠️ Requires careful index management for performance (esp. on JSONB fields)
- ⚠️ Connection pooling required at scale (PgBouncer or Prisma connection pool)

### Mitigation Strategies

**Scaling concerns:**
- Start with connection pooling (PgBouncer or Prisma) to maximize single-instance efficiency
- Partition invoices table by created_date after 10M records (yearly partitions)
- Add read replicas for analytics/reporting queries (separate from transactional load)
- Evaluate sharding or move to Citus/YugabyteDB if single-node limits reached (Year 3+)

**Full-text search limitations:**
- Monitor search query performance with pg_stat_statements
- If search P95 latency >500ms, migrate to Elasticsearch/Typesense
- Design search schema to be Elasticsearch-compatible from day one (easy migration path)
- Use materialized views for complex search queries

**Index management:**
- Create indexes on frequently queried JSONB fields (e.g., `invoice_metadata->>'cae'`)
- Use partial indexes for common filters (e.g., `WHERE status = 'approved'`)
- Monitor index usage with pg_stat_user_indexes
- Automated VACUUM and ANALYZE scheduling

**Operational complexity:**
- Use managed service (RDS/Supabase) to avoid operational burden
- Automate backups, monitoring, alerting from day one
- Set up automated failover with Multi-AZ deployment
- Budget for DBA consultation if performance issues arise (Year 2+)

## Compliance & Security

- **GDPR**:
  - PostgreSQL supports row-level security (RLS) for data isolation per user
  - Encryption at rest (AES-256) via RDS encryption or Supabase
  - Encryption in transit (TLS 1.3)
  - Audit logging via triggers and pgAudit extension
- **Data Retention**:
  - Automated backups with 30-day retention (RDS) meets compliance requirements
  - Point-in-time recovery for data restoration
- **Certificate Storage**:
  - ARCA certificates stored encrypted in BYTEA column (encrypted at application layer with AES-256)
  - Separate from invoice data for security isolation
- **Audit Logs**:
  - Triggers for change data capture (who changed what, when)
  - Immutable audit log table for compliance

## Cost Estimation

**Year 1 (0-2K users, 300K invoices/month):**
- **Supabase Pro**: $25/month + $0.10/GB storage = ~$50-60/month
- **AWS RDS db.t4g.small**: ~$30/month instance + $20/month storage (50GB) + backups = ~$60/month
- **Recommendation**: Start with Supabase for faster development (built-in auth, realtime, storage)

**Year 2 (5K users, 1M invoices/month):**
- **AWS RDS db.t4g.medium**: ~$120/month instance + $40/month storage (100GB)
- **Read replica** (analytics): +$120/month
- **Total**: ~$280/month

**Year 3 (20K users, 5M invoices/month):**
- **AWS RDS db.r6g.large**: ~$400/month instance + $100/month storage (500GB)
- **2 Read replicas**: +$800/month
- **Total**: ~$1,300/month

**Cost per invoice**: $0.02/invoice in Year 1, $0.01/invoice in Year 2-3 (economies of scale)

## Performance Targets

**Latency:**
- P50: <20ms for single invoice query
- P95: <50ms for single invoice query
- P99: <100ms for single invoice query
- Full-text search P95: <200ms

**Throughput:**
- 100 writes/second (invoice creation)
- 1,000 reads/second (invoice queries)

**Monitoring:**
- pg_stat_statements for slow query identification
- CloudWatch/Datadog for metrics (connections, latency, IOPS)
- Alerts on connection pool exhaustion, high CPU, replication lag

## Review & Revisit

**Review triggers:**
- Query latency P95 exceeds 500ms consistently (3-day window)
- Database cost exceeds 20% of total infrastructure budget
- Full-text search inadequate for user needs (>500ms P95)
- Data volume exceeds 500GB (consider partitioning/sharding)
- Connection pool frequently exhausted (>80% utilization)
- Read replica lag >10 seconds

**Scheduled review**: End of Year 1 (Month 12, October 2026)

## References

- [PostgreSQL Documentation](https://www.postgresql.org/docs/15/)
- [AWS RDS PostgreSQL Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)
- [Supabase Database Guide](https://supabase.com/docs/guides/database)
- [Prisma PostgreSQL Guide](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- Internal: Invoice schema design (`docs/architecture/03-data-architecture.md`)
- Internal: System context (`docs/architecture/01-system-context.md`)

---

**Approved by**: [Pending]
**Next review**: 2026-10-15
