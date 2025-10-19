---
name: engineering-documentation
status: completed
created: 2025-10-15T03:25:38Z
updated: 2025-10-19T18:44:40Z
completed: 2025-10-19T20:30:00Z
progress: 100%
prd: .claude/prds/engineering-documentation.md
github: https://github.com/lorenzotomasdiez/ArcAPI/issues/1
---

# Epic: Engineering Documentation System

## Overview

Build a **lean, template-driven documentation system** for ARCA API that enables spec-driven development while remaining maintainable by a small team. Rather than creating documentation from scratch, we'll leverage existing tools, templates, and automation to create a living documentation system that stays current with minimal overhead.

**Key Innovation**: Use the PRD itself as the foundation - it already contains comprehensive templates, examples, and structure. Our implementation will instantiate these templates with ARCA API-specific details and set up automation to keep them current.

**Technical Philosophy**:
- **Templates over custom**: Reuse the extensive templates already in the PRD
- **Automation over manual**: Validate, generate, and check documentation automatically
- **Incremental over comprehensive**: Start with critical path, expand as needed
- **Living over static**: Documentation that validates against code and updates automatically

## Architecture Decisions

### 1. Documentation-as-Code Approach
- **Decision**: All documentation lives in Git (`docs/` directory), version-controlled alongside code
- **Rationale**: Enables branching, reviewing, and versioning docs with code changes; supports atomic commits
- **Technology**: Markdown + Mermaid (both GitHub-native, zero additional tooling)
- **Trade-off**: Markdown less rich than specialized docs platforms, but gains versioning and developer familiarity

### 2. Spec-First Development with OpenAPI
- **Decision**: Write OpenAPI 3.1 specification before implementing any API endpoint
- **Rationale**: Enables parallel frontend/backend/SDK development; serves as executable contract for testing
- **Technology**: OpenAPI 3.1 (YAML), validated with Spectral in CI
- **Trade-off**: Upfront spec work slows initial development but prevents rework and integration issues

### 3. C4 Model for Architecture Diagrams
- **Decision**: Use C4 model levels (Context, Container, Component) for architecture docs
- **Rationale**: Industry-standard, provides multiple abstraction levels, well-documented
- **Technology**: Mermaid with C4 diagram support (renders in GitHub)
- **Trade-off**: Mermaid C4 syntax less mature than PlantUML, but benefits from GitHub native rendering

### 4. Template-Driven Documentation
- **Decision**: Instantiate templates from PRD rather than write from scratch
- **Rationale**: PRD already contains production-quality templates for ADRs, OpenAPI, flows, runbooks
- **Benefit**: Reduces implementation time from 8 weeks to <2 weeks; ensures consistency
- **Implementation**: Copy templates, fill in ARCA API specifics, validate

### 5. Automated Documentation Validation
- **Decision**: CI/CD pipeline validates all docs on every PR
- **Rationale**: Prevents documentation drift, broken links, invalid specs
- **Checks**:
  - OpenAPI spec validation (Spectral)
  - Broken link detection (markdown-link-check)
  - Mermaid syntax validation
  - Spell check (cspell)
- **Trade-off**: Adds 2-3 minutes to CI time but catches issues immediately

### 6. Progressive Documentation Strategy
- **Decision**: Implement in 3 phases (Foundation → Specs → Operations), not all at once
- **Phase 1 (Week 1)**: Architecture + directory structure
- **Phase 2 (Week 2)**: OpenAPI spec + critical flows
- **Phase 3 (Week 3)**: Operations docs + automation
- **Rationale**: Allows learning and adjustment; critical path first

## Technical Approach

### Documentation Structure (Instantiate from PRD Template)

The PRD already defines the complete structure. We'll create it and populate critical sections:

```
docs/
├── README.md                          # Hub with navigation (from PRD template)
├── architecture/
│   ├── 00-overview.md                 # ARCA API system overview (adapt PRD example)
│   ├── 01-system-context.md           # C4 Level 1 (customize PRD Mermaid diagram)
│   ├── 02-services.md                 # C4 Level 2 (8 services: API, Dashboard, AI, etc.)
│   ├── 03-data-architecture.md        # PostgreSQL schema from product PRD
│   ├── 04-infrastructure.md           # AWS/Railway HA setup
│   └── adrs/
│       ├── 001-database-postgresql.md # Adapt example ADR from PRD
│       ├── 002-authentication.md      # JWT + API keys approach
│       └── 003-deployment-platform.md # AWS ECS vs Railway decision
├── specifications/
│   ├── api/
│   │   ├── openapi.yaml               # MVP endpoints (invoices, auth, webhooks)
│   │   └── README.md                  # How to use OpenAPI spec
│   └── services/
│       ├── ai-service-contract.md     # Invoice generation interface
│       └── webhook-service-contract.md
├── flows/
│   ├── user-flows.md                  # Invoice creation, onboarding (from PRD examples)
│   └── system-flows.md                # Auth flow, ARCA integration (adapt PRD diagrams)
├── development/
│   ├── setup.md                       # Local dev environment
│   ├── coding-standards.md            # TypeScript/Python standards
│   └── testing-strategy.md            # Unit, integration, E2E approach
├── operations/
│   ├── deployment-guide.md            # How to deploy to staging/prod
│   ├── monitoring.md                  # Metrics, logs, traces
│   └── runbooks/
│       ├── arca-api-down.md           # What to do when ARCA unavailable
│       └── database-issues.md         # Connection pool, slow queries
└── security/
    ├── security-architecture.md       # Encryption, secrets, API keys
    └── compliance/
        └── gdpr.md                    # GDPR compliance checklist
```

### Automation Strategy

**CI/CD Documentation Pipeline** (GitHub Actions):

```yaml
name: Documentation Validation

on: [pull_request]

jobs:
  validate-docs:
    runs-on: ubuntu-latest
    steps:
      - name: Validate OpenAPI Specs
        run: npx @stoplight/spectral-cli lint docs/specifications/api/openapi.yaml

      - name: Check Broken Links
        run: npx markdown-link-check docs/**/*.md

      - name: Validate Mermaid Diagrams
        run: npx @mermaid-js/mermaid-cli mmdc --validate docs/**/*.md

      - name: Spell Check
        run: npx cspell "docs/**/*.md"

      - name: Require Docs for Code Changes
        # If src/ changes but docs/ doesn't, fail (enforces doc updates)
        run: |
          if git diff --name-only origin/main | grep '^src/' && \
             ! git diff --name-only origin/main | grep '^docs/'; then
            echo "Code changes require documentation updates"
            exit 1
          fi
```

### OpenAPI Spec Strategy

**Leverage PRD Template + Product Requirements**:

The PRD contains a complete OpenAPI template. We'll:
1. Copy template structure
2. Fill in MVP endpoints from product PRD:
   - `POST /invoices` (simple + advanced mode)
   - `GET /invoices/:id`
   - `GET /invoices` (list with pagination)
   - `POST /certificates` (upload ARCA certificate)
   - `GET /reference-data/*` (invoice types, IVA rates, etc.)
3. Define error responses (RFC 7807 Problem Details)
4. Add authentication (Bearer token)
5. Specify rate limits per tier

**Estimated effort**: 1-2 days (template provides 80% of structure)

### Mermaid Diagram Strategy

**Reuse PRD Examples**:

The PRD includes production-ready Mermaid diagrams for:
- System context (C4 Level 1) - customize with ARCA API specifics
- Service container (C4 Level 2) - adapt for 8 services
- Authentication flow - highly detailed sequence diagram
- HA infrastructure - multi-AZ deployment
- Invoice lifecycle data flow

**Approach**: Copy diagrams, modify labels and connections for ARCA API architecture

**Estimated effort**: 1 day to customize all diagrams

## Implementation Strategy

### Phase 1: Foundation (Days 1-3)

**Goal**: Directory structure, architecture overview, first ADR

**Deliverables**:
- `docs/` structure created
- `docs/README.md` navigation hub
- `docs/architecture/00-overview.md` (ARCA API system goals, quality attributes)
- `docs/architecture/01-system-context.md` (C4 Level 1 diagram)
- `docs/architecture/adrs/001-database-postgresql.md` (adapt PRD example)

**Success Criteria**:
- Any engineer can understand system scope in <30 min
- Architecture diagram renders in GitHub
- First ADR demonstrates decision-making rigor

### Phase 2: Specifications (Days 4-8)

**Goal**: OpenAPI spec, service contracts, critical flows

**Deliverables**:
- `docs/specifications/api/openapi.yaml` (MVP endpoints)
- `docs/architecture/02-services.md` (C4 Level 2: all 8 services)
- `docs/flows/user-flows.md` (invoice creation flow)
- `docs/flows/system-flows.md` (authentication, ARCA integration)
- `docs/architecture/adrs/002-authentication.md`

**Success Criteria**:
- Frontend can mock API from OpenAPI spec
- Backend can generate API stubs from spec
- All critical user journeys documented with diagrams

### Phase 3: Operations & Automation (Days 9-12)

**Goal**: Deployment docs, runbooks, CI validation

**Deliverables**:
- `docs/development/setup.md` (local dev guide)
- `docs/operations/deployment-guide.md`
- `docs/operations/runbooks/arca-api-down.md`
- `.github/workflows/docs-validation.yml` (CI pipeline)
- `docs/security/security-architecture.md`

**Success Criteria**:
- New engineer can set up local env in <1 hour
- CI fails if docs are invalid or links broken
- On-call can resolve incidents using runbooks

### Risk Mitigation

**Risk 1: Documentation becomes stale**
- **Mitigation**: CI enforces doc updates when code changes; quarterly review cadence

**Risk 2: Engineers skip writing docs**
- **Mitigation**: CI blocks merges if required docs missing; make templates easy to use

**Risk 3: Diagrams break or don't render**
- **Mitigation**: Test Mermaid rendering early; use simple diagrams; validate in CI

**Risk 4: Scope creep (too much documentation)**
- **Mitigation**: Strict prioritization - only create docs that block development or compliance

## Task Breakdown Preview

We'll create **8 focused tasks** (not 50+ granular ones) to keep the epic lean:

- [ ] **Task 1**: Setup documentation infrastructure (directory structure, templates, README hub)
- [ ] **Task 2**: Write core architecture documents (overview, system context C4 diagram, first 3 ADRs)
- [ ] **Task 3**: Create OpenAPI specification for MVP endpoints (invoices, auth, certificates)
- [ ] **Task 4**: Document service architecture (C4 Level 2, service contracts for AI/webhooks)
- [ ] **Task 5**: Create critical flow diagrams (user flows, system flows with Mermaid)
- [ ] **Task 6**: Write development guides (local setup, coding standards, testing strategy)
- [ ] **Task 7**: Create operational documentation (deployment, monitoring, first 2 runbooks)
- [ ] **Task 8**: Setup CI/CD documentation validation pipeline (OpenAPI lint, link check, spell check)

**Additional optimization opportunities identified**:
- Reuse product PRD database schema documentation (already comprehensive)
- Leverage existing `.claude/context/*.md` files as source material
- Use OpenAPI generators to create SDK stubs (reduces SDK design effort)
- Auto-generate ER diagrams from Prisma schema (if using Prisma ORM)

## Dependencies

### Internal Dependencies

1. **Product PRD** (✅ Complete)
   - Source of truth for features, architecture examples, templates
   - Database schema already documented
   - User flows described

2. **Technology Stack Decisions** (⏳ Pending)
   - Need: Backend language (Node.js vs Python vs Go)
   - Need: Database choice (PostgreSQL assumed in PRD)
   - Need: Cloud provider (AWS vs GCP vs Railway)
   - **Impact**: Blocks infrastructure docs and deployment guide
   - **Mitigation**: Can write technology-agnostic architecture first; ADRs document decisions later

3. **Git Repository Setup** (⏳ Pending)
   - Need: GitHub/GitLab repository with branch protection
   - **Impact**: Blocks CI/CD setup (Task 8)
   - **Mitigation**: Can write docs locally first, commit when repo ready

### External Dependencies

1. **OpenAPI Tooling** (✅ Available)
   - Spectral (linter), Swagger UI (renderer), Redocly
   - All open source, npm-installable

2. **GitHub Mermaid Rendering** (✅ Available)
   - GitHub natively renders Mermaid in markdown
   - Tested and working

3. **Google Engineering Review** (⏳ Scheduled)
   - Architecture review scheduled after Phase 2
   - **Impact**: May require revisions to architecture docs
   - **Mitigation**: Allow 1 week buffer for revisions

### Critical Path

```
Task 1 (Structure) → Task 2 (Architecture) → Task 3 (OpenAPI) → Task 8 (CI/CD)
                  ↓
                Task 4 (Services) → Task 5 (Flows)
                  ↓
                Task 6 (Dev) → Task 7 (Ops)
```

**Longest path**: Task 1 → 2 → 3 → 8 (estimated 6 days)
**Parallelization opportunity**: Tasks 4-7 can be done in any order after Task 2

## Success Criteria (Technical)

### Immediate (Week 1)
- [ ] Documentation directory structure exists and follows PRD template
- [ ] System context diagram (C4 Level 1) renders in GitHub
- [ ] First ADR demonstrates architectural rigor
- [ ] OpenAPI spec (v0.1) covers 5 MVP endpoints

### Short-Term (Week 2)
- [ ] Complete OpenAPI spec (v1.0) with all MVP endpoints
- [ ] Service architecture (C4 Level 2) documents all 8 services
- [ ] Critical user flows documented with Mermaid diagrams
- [ ] Authentication flow fully specified

### Medium-Term (Week 3)
- [ ] Local development setup guide tested by 2 engineers
- [ ] CI/CD pipeline validates docs on every PR
- [ ] Deployment guide enables staging deployment
- [ ] First 2 runbooks created (ARCA API down, DB issues)

### Quality Gates

**Before Google Engineering Review**:
- [ ] All architecture documents complete (overview, context, services, data, infrastructure)
- [ ] 3+ ADRs covering major decisions (database, auth, deployment)
- [ ] OpenAPI spec 100% complete for MVP
- [ ] Security architecture documented
- [ ] Zero broken links in documentation

**Before MVP Development Starts**:
- [ ] OpenAPI spec approved and frozen
- [ ] Service contracts defined for AI and webhooks
- [ ] Development setup guide validated
- [ ] CI pipeline rejecting invalid docs

**Before Production Deployment**:
- [ ] Deployment guide tested in staging
- [ ] Monitoring strategy implemented
- [ ] Incident response plan exists
- [ ] Security architecture reviewed

### Quantitative Metrics

| Metric | Target | How Measured |
|--------|--------|--------------|
| **Documentation Coverage** | 100% of MVP services | Manual checklist |
| **OpenAPI Validity** | 0 validation errors | Spectral CI check |
| **Link Health** | 0 broken links | markdown-link-check CI |
| **Onboarding Time** | <4 hours to understand architecture | New engineer survey |
| **Setup Time** | <1 hour to local dev env | Timed during guide testing |
| **Spec-Code Consistency** | 100% (all implemented endpoints in spec) | Manual review |

### Non-Goals (Explicit Out of Scope)

To keep this epic <10 tasks, we explicitly **defer** these items to future work:

- ❌ SDK documentation (will be created when SDKs are built)
- ❌ Mobile SDK specs (Phase 3 of product roadmap)
- ❌ End-user documentation (separate developer portal project)
- ❌ Video tutorials or interactive docs
- ❌ Multi-language documentation (English only for engineering docs)
- ❌ Comprehensive runbook library (start with 2, expand based on incidents)
- ❌ Advanced observability setup (start with basic monitoring, expand later)

## Estimated Effort

### Overall Timeline
- **Total Duration**: 12-15 working days (2.5-3 weeks)
- **Parallelization**: With 2 people, can compress to 8-10 calendar days
- **Critical Path**: 6 days (structure → architecture → OpenAPI → CI)

### Breakdown by Task

| Task | Effort (Days) | Parallelizable? | Blocker For |
|------|---------------|-----------------|-------------|
| 1. Documentation Infrastructure | 0.5 | No | All others |
| 2. Core Architecture Docs | 2 | No | Tasks 3-7 |
| 3. OpenAPI Specification | 2 | After Task 2 | Task 8, frontend work |
| 4. Service Architecture | 1.5 | After Task 2 | Backend development |
| 5. Flow Diagrams | 1 | After Task 2 | Team onboarding |
| 6. Development Guides | 1.5 | After Task 2 | Developer onboarding |
| 7. Operations Docs | 1.5 | After Task 2 | Deployment |
| 8. CI/CD Pipeline | 1 | After Task 3 | PR process |

**Optimization**: Tasks 4-7 can run in parallel with 2 people after Task 2 completes

### Resource Requirements

**People**:
- **Tech Lead**: 5 days (architecture docs, ADRs, OpenAPI spec, reviews)
- **Senior Engineer**: 3 days (flows, dev guides, ops docs)
- **DevOps Engineer**: 1 day (CI/CD pipeline setup)

**Total Effort**: ~9 person-days with 3 people = ~2 calendar weeks with reviews/refinement

**Tools/Infrastructure**:
- Zero cost (all open source: Spectral, markdown-link-check, cspell)
- GitHub Actions minutes (covered by free tier for small projects)

### Critical Path Items

**Week 1 Priorities**:
1. Documentation structure (Day 1)
2. System architecture (Days 2-3)
3. OpenAPI spec v0.1 (Days 4-5)
4. Review and refinement (Days 6-7)

**Week 2 Priorities**:
1. Complete OpenAPI spec (Days 8-9)
2. Service contracts and flows (Days 10-11)
3. Development guides (Days 12-13)
4. CI/CD automation (Day 14)

**Week 3 (Buffer + Polish)**:
1. Operations docs and runbooks
2. Google Engineering review prep
3. Revisions based on feedback
4. Final validation

### Dependencies on External Factors

**Accelerators** (can speed up timeline):
- Product PRD templates already exist (saves 4-5 days)
- OpenAPI template in PRD (saves 1-2 days)
- Mermaid diagram examples in PRD (saves 1 day)
- Existing `.claude/context/*.md` files provide context

**Blockers** (can delay timeline):
- Technology stack not decided → delays infrastructure docs (2-3 days)
- Google Engineering review unavailable → delays approval (1 week+)
- Team unfamiliar with OpenAPI → learning curve (2-3 days)

**Risk Buffer**: Built-in 3-day buffer (Week 3) for unknowns and revisions

## Next Steps

1. **Get approval for this epic** (confirm 8-task approach is acceptable)
2. **Decide technology stack** (Node.js vs alternatives, cloud provider)
3. **Run**: `/pm:epic-decompose engineering-documentation` to create the 8 tasks
4. **Assign owners**: Tech Lead takes architecture + OpenAPI, Senior Eng takes flows + guides
5. **Start Phase 1**: Create directory structure and first architecture docs

## Success Indicators

**We'll know this epic is successful when**:
- New engineer understands architecture in <4 hours (measured with onboarding survey)
- Frontend and backend can develop in parallel using OpenAPI spec (no blocking)
- CI pipeline rejects invalid documentation (tested with intentional errors)
- Google Engineering review approves architecture (external validation)
- Zero "what does this service do?" questions after Week 2 (team confidence)
- Deployment to staging succeeds following deployment guide (operational readiness)

**This documentation system will be the foundation for all ARCA API development - getting it right now prevents months of rework later.**

---

## Tasks Created

- [x] #2 - Setup documentation infrastructure (parallel: false) ✅ COMPLETED
- [x] #3 - Write core architecture documents (parallel: false) ✅ COMPLETED
- [x] #4 - Create OpenAPI specification for MVP endpoints (parallel: false) ✅ COMPLETED
- [x] #5 - Document service architecture (C4 Level 2) (parallel: true) ✅ COMPLETED
- [x] #6 - Create critical flow diagrams (parallel: true) ✅ COMPLETED
- [x] #7 - Write development guides (parallel: true) ✅ COMPLETED
- [x] #8 - Create operational documentation (parallel: true) ✅ COMPLETED
- [x] #9 - Setup CI/CD documentation validation pipeline (parallel: false) ✅ COMPLETED

**Total tasks:** 8
**Parallel tasks:** 4 (Tasks #5, #6, #7, #8 can run concurrently after Task #3)
**Sequential tasks:** 4 (Tasks #2, #3, #4, #9 form the critical path)
**Estimated total effort:** 68-84 hours (can be compressed to 12-15 working days with parallelization)

**Critical Path:** Task #2 → Task #3 → Task #4 → Task #9 (estimated 30-38 hours)

**Parallelization Strategy:**
- **Phase 1** (Sequential): Task #2 (infrastructure) → Task #3 (architecture) [Days 1-3]
- **Phase 2** (Mixed): Task #4 (OpenAPI) on critical path, while Tasks #5-#8 can run in parallel [Days 4-8]
- **Phase 3** (Sequential): Task #9 (CI/CD) after OpenAPI spec exists [Day 9]

**Task Dependencies:**
- Tasks #3-#9 depend on Task #2 (infrastructure)
- Tasks #4-#8 depend on Task #3 (architecture foundation)
- Task #9 depends on Task #4 (needs OpenAPI spec to validate)
- Tasks #5-#8 have no conflicts and can run fully in parallel

**Effort Breakdown by Role:**
- **Tech Lead**: 30-34 hours (Tasks #2, #3, #4, #9 + reviews)
- **Senior Engineer**: 28-32 hours (Tasks #5, #6, #7, #8 in parallel)
- **DevOps Engineer**: 6-8 hours (Task #9 support)
- **Total Team Effort**: 64-74 hours

**Timeline Scenarios:**
- **Solo (1 person)**: 13-17 working days (2.5-3.5 weeks)
- **Pair (2 people)**: 8-10 working days (1.5-2 weeks) ← Recommended
- **Team (3 people)**: 6-8 working days (1-1.5 weeks)

**GitHub Issues:**
- Epic: https://github.com/lorenzotomasdiez/ArcAPI/issues/1
- View all tasks: https://github.com/lorenzotomasdiez/ArcAPI/issues?q=is%3Aissue+label%3Aepic%3Aengineering-documentation

**Next Action:** Assign Task #2 to Tech Lead to begin infrastructure setup.
