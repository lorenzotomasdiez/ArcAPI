# Work Analysis: Issue #3 - Write Core Architecture Documents

## Summary
Create foundational architecture documentation including system overview, C4 context diagram, and first 3 ADRs (database, authentication, deployment). This establishes architectural vision and key technical decisions.

## Complexity: MEDIUM
- Template-driven approach (PRD has examples)
- 5 distinct documents to create
- Mermaid diagram creation and testing required
- ADRs require research on alternatives
- Cross-referencing between documents

## Parallel Execution Strategy

### Two-Stream Approach (Recommended)

This task can be split into **2 parallel streams** for efficiency:

**Why 2 streams:**
1. ADR-001 (database) is independent - uses existing PRD template
2. Overview + Context + ADR-002/003 have logical flow and interdependencies
3. Total time: 8-10 hours can compress to 5-6 hours with parallelization
4. Minimal coordination needed (just final cross-linking)

---

### Stream A: Core Architecture Documents (Overview + Context)
**Agent Type:** general-purpose
**Estimated Time:** 3.5 hours
**Priority:** HIGH (blocks Stream B)

**Scope:**
- Create `docs/architecture/00-overview.md`
- Create `docs/architecture/01-system-context.md` with C4 Mermaid diagram
- Update `docs/architecture/README.md` to link new docs

**Work Breakdown:**

1. **Architecture Overview (1.5 hours)**
   - Executive summary of ARCA API platform
   - System goals: Developer-first invoicing API, AI-powered, SOAP-to-REST
   - Quality attributes:
     - Availability: 99.95% uptime
     - Performance: P95 latency <200ms
     - Scalability: 100K invoices/day
     - Security: ISO 27001, GDPR compliant
     - Cost: <$0.02 per invoice
   - Technology philosophy: Spec-driven, API-first, cloud-native
   - Reference PRD lines 925-963

2. **System Context Diagram (2 hours)**
   - Create C4 Level 1 Mermaid diagram showing:
     - Actors: API consumers, end users
     - ARCA API Platform (main system)
     - External systems: ARCA/AFIP, OpenAI, Stripe, Resend
     - Relationships and protocols
   - Write narrative explaining:
     - Each external actor's role
     - Interaction patterns
     - External dependency SLAs
     - Data flow at system boundary
   - Test Mermaid rendering at https://mermaid.live/
   - Reference PRD lines 934-952

**Files:**
- `docs/architecture/00-overview.md` (create)
- `docs/architecture/01-system-context.md` (create)
- `docs/architecture/README.md` (update)

**Coordination:**
- Must complete before Stream B can cross-reference
- Provides context for ADR-002 and ADR-003

---

### Stream B: Architecture Decision Records
**Agent Type:** general-purpose
**Estimated Time:** 5 hours
**Priority:** MEDIUM (can start immediately with ADR-001)

**Scope:**
- Create `docs/architecture/adrs/001-database-postgresql.md`
- Create `docs/architecture/adrs/002-authentication.md`
- Create `docs/architecture/adrs/003-deployment-platform.md`
- Update `docs/architecture/adrs/README.md` to index ADRs

**Work Breakdown:**

1. **ADR-001: Database Selection (1.5 hours)**
   - Copy template from PRD lines 1559-1727
   - Customize for ARCA API specifics:
     - Context: Invoice data (transactional, JSONB, full-text search)
     - Decision: PostgreSQL 15 (AWS RDS or Supabase)
     - Rationale: ACID, JSONB support, cost-effective
     - Alternatives: MongoDB, MySQL, DynamoDB
     - Consequences: Vertical scaling limits, index management
     - Cost: $50-60/month Year 1
   - This ADR is mostly template adaptation

2. **ADR-002: Authentication Strategy (2 hours)**
   - Context: Authenticate API consumers, manage ARCA certificates
   - Decision:
     - API consumers: Bearer token (API keys with bcrypt)
     - ARCA integration: Certificate-based, auto-renewal, cached tokens
     - Rate limiting per tier (100/1000 req/min)
   - Rationale: API keys simple, certificate auto-renewal reduces friction
   - Alternatives: OAuth 2.0 (overkill), Basic Auth (insecure), JWT (complex rotation)
   - Consequences: Need Redis for caching, certificate encryption (AES-256)
   - Security: Never expose certs in logs

3. **ADR-003: Deployment Platform (1.5 hours)**
   - Context: Scalable, cost-effective Node.js/Python deployment
   - Decision: Railway (MVP), migrate to AWS ECS if needed
   - Rationale: Railway fast/cheap ($5-20/mo), ECS better at scale
   - Alternatives: Heroku (expensive), GCP Cloud Run (lock-in), VPS (overhead)
   - Consequences: Railway limits (migration eventually), but fast iteration
   - Migration plan: Docker from day one (portable)
   - Cost: Railway $20/mo (MVP), AWS ECS $100-200/mo (scale)

**Files:**
- `docs/architecture/adrs/001-database-postgresql.md` (create)
- `docs/architecture/adrs/002-authentication.md` (create)
- `docs/architecture/adrs/003-deployment-platform.md` (create)
- `docs/architecture/adrs/README.md` (update)

**Coordination:**
- ADR-001 can start immediately (independent)
- ADR-002 and ADR-003 should reference overview/context from Stream A
- Wait for Stream A completion before cross-referencing

---

## Coordination Between Streams

**Synchronization Points:**
1. Stream B can start ADR-001 immediately (independent)
2. Stream A completes overview + context (hour 3.5)
3. Stream B references Stream A docs in ADR-002 and ADR-003 (hour 4-5)
4. Both streams complete, final cross-linking (hour 5-6)

**Communication:**
- Stream B reads `.claude/epics/engineering-documentation/updates/3/stream-a.md` to check Stream A progress
- Stream A signals completion in update file
- Final coordination: Ensure all documents link to each other properly

---

## Files Summary

**Stream A Creates:**
- `docs/architecture/00-overview.md`
- `docs/architecture/01-system-context.md`

**Stream B Creates:**
- `docs/architecture/adrs/001-database-postgresql.md`
- `docs/architecture/adrs/002-authentication.md`
- `docs/architecture/adrs/003-deployment-platform.md`

**Both Update:**
- `docs/architecture/README.md` (link to overview, context, ADRs)
- `docs/architecture/adrs/README.md` (index of ADRs)

---

## Commit Strategy

**Stream A:**
```
Issue #3: Add architecture overview
Issue #3: Add system context diagram
```

**Stream B:**
```
Issue #3: Add ADR-001 database selection
Issue #3: Add ADR-002 authentication strategy
Issue #3: Add ADR-003 deployment platform
```

**Final:**
```
Issue #3: Cross-link architecture documents
```

---

## Success Criteria
- [ ] All 5 documents completed
- [ ] Mermaid diagram renders in GitHub (test at https://mermaid.live/)
- [ ] All ADRs follow format: Context, Decision, Rationale, Alternatives, Consequences
- [ ] Quality attributes quantified (uptime %, latency ms, cost $)
- [ ] External dependencies documented
- [ ] Documents cross-reference each other
- [ ] Zero broken internal links

---

## Estimated Total Time
- **Sequential**: 8-10 hours (1.25 days)
- **Parallel (2 streams)**: 5-6 hours (0.75 days)
- **Time Saved**: 3-4 hours (40% reduction)

---

## Next Tasks Unblocked
After completion:
- Task #4 (OpenAPI specification) - READY
- Task #5 (Service architecture) - READY
- Task #6 (Flow diagrams) - READY
- Task #7 (Development guides) - READY
- Task #8 (Operations docs) - READY

All 4 parallel tasks (#5, #6, #7, #8) become ready simultaneously after Task #3.
