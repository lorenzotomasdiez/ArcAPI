---
issue: 6
title: Create critical flow diagrams
analyzed: 2025-10-15T14:11:57Z
estimated_hours: 9
parallelization_factor: 2.5
---

# Parallel Work Analysis: Issue #6

## Overview

Document 5 critical user and system flows using Mermaid diagrams to visualize ARCA API's end-to-end behavior. This includes user flows (invoice creation simple/advanced, authentication) and system flows (ARCA integration error handling, webhook delivery with retries). Each flow requires Mermaid diagrams plus comprehensive narrative documentation covering overview, actors, preconditions, step-by-step explanations, error scenarios, and performance targets.

## Parallel Streams

### Stream A: User Flows (Invoice Creation)
**Scope**: Document the two invoice creation flows - simple mode (with AI) and advanced mode (direct structured data)
**Files**:
- `docs/flows/user-flows.md` (create Flows 1 & 2)
- PRD reference: lines 1245-1406 (template)
**Agent Type**: documentation-specialist
**Can Start**: immediately
**Estimated Hours**: 3
**Dependencies**: none

**Details**:
- Flow 1: Invoice Creation (Simple Mode) with AI Service integration
  - Mermaid sequence diagram (User → API → Auth → AI → ARCA → DB)
  - Narrative covering NLP parsing, IVA calculation, CAE retrieval
  - Error scenarios: 401, 429, 400, 500, 503
  - Performance target: P95 <4s
- Flow 2: Invoice Creation (Advanced Mode) - simplified Flow 1
  - Remove AI service step
  - Direct validation of structured data
  - Performance target: P95 <2s

### Stream B: User Flows (Authentication Setup)
**Scope**: Document certificate upload and authentication flow with token caching strategy
**Files**:
- `docs/flows/user-flows.md` (add Flow 3)
**Agent Type**: documentation-specialist
**Can Start**: immediately
**Estimated Hours**: 2
**Dependencies**: none

**Details**:
- Flow 3: Certificate Upload & Authentication Setup
  - Mermaid sequence diagram covering one-time setup vs every-request auth
  - Certificate encryption (AES-256), storage, and retrieval
  - Token caching strategy (11h expiry, 10h TTL in Redis)
  - Auto-renewal when token expires

### Stream C: System Flows (Error Handling & ARCA Integration)
**Scope**: Document the complete error handling flowchart for ARCA integration
**Files**:
- `docs/flows/system-flows.md` (create Flow 4)
**Agent Type**: documentation-specialist
**Can Start**: immediately
**Estimated Hours**: 2
**Dependencies**: none

**Details**:
- Flow 4: ARCA Integration & Error Handling
  - Mermaid flowchart covering all decision points
  - Auth validation → Rate limiting → Credit check → ARCA token → Submission
  - All error scenarios: 401, 429, 402, 400, 503
  - Retry logic for transient failures
  - Circuit breaker pattern

### Stream D: System Flows (Webhook Delivery)
**Scope**: Document webhook delivery with retry logic and exponential backoff
**Files**:
- `docs/flows/system-flows.md` (add Flow 5)
**Agent Type**: documentation-specialist
**Can Start**: immediately
**Estimated Hours**: 2
**Dependencies**: none

**Details**:
- Flow 5: Webhook Delivery with Retries
  - Mermaid sequence diagram for at-least-once delivery
  - HMAC signature generation
  - Exponential backoff (1min, 5min, 15min)
  - Distinguishing 4xx (no retry) vs 5xx (retry) errors

## Coordination Points

### Shared Files
- `docs/flows/user-flows.md` - Streams A & B (coordinate to avoid conflicts)
  - **Strategy**: Stream A creates file with Flows 1 & 2, Stream B appends Flow 3
- `docs/flows/system-flows.md` - Streams C & D (coordinate to avoid conflicts)
  - **Strategy**: Stream C creates file with Flow 4, Stream D appends Flow 5
- `docs/flows/README.md` - Final integration point (updated after all streams complete)

### Sequential Requirements
1. **User flows file**: Stream A creates → Stream B appends
2. **System flows file**: Stream C creates → Stream D appends
3. **README update**: After all 4 streams complete, create/update `docs/flows/README.md` index

### Cross-references
All flows should link to:
- Architecture docs (`docs/architecture/02-services.md` from Issue #5)
- API specifications (`docs/specifications/api/` from Issue #3)

## Conflict Risk Assessment

**Low Risk**: Different streams work on different sections of two main files
- Streams A & B: Both edit `user-flows.md` but different sections (A writes Flows 1-2, B writes Flow 3)
- Streams C & D: Both edit `system-flows.md` but different sections (C writes Flow 4, D writes Flow 5)

**Mitigation**:
- Use sequential writing strategy (creator + appender pattern)
- Stream A creates `user-flows.md` with Flows 1-2, B adds Flow 3
- Stream C creates `system-flows.md` with Flow 4, D adds Flow 5
- Final README update happens after all flows complete

## Parallelization Strategy

**Recommended Approach**: hybrid (parallel + sequential coordination)

**Execution Plan**:
1. **Phase 1 (Parallel)**: Launch Streams A, B, C, D simultaneously
   - Stream A: Creates `user-flows.md` with Flows 1 & 2 (3h)
   - Stream B: Prepares Flow 3 content (2h) → waits for Stream A
   - Stream C: Creates `system-flows.md` with Flow 4 (2h)
   - Stream D: Prepares Flow 5 content (2h) → waits for Stream C

2. **Phase 2 (Sequential)**: Append operations
   - Stream B: Appends Flow 3 to `user-flows.md` (after A completes)
   - Stream D: Appends Flow 5 to `system-flows.md` (after C completes)

3. **Phase 3 (Integration)**: Create flows README with index of all 5 flows

## Expected Timeline

**With parallel execution**:
- **Phase 1**: 3 hours (limiting factor: Stream A)
- **Phase 2**: 1 hour (appending operations)
- **Phase 3**: 0.5 hours (README creation)
- **Total wall time**: ~4.5 hours

**Without parallel execution** (sequential):
- Stream A: 3h
- Stream B: 2h
- Stream C: 2h
- Stream D: 2h
- Integration: 0.5h
- **Total time**: ~9.5 hours

**Efficiency gain**: 55% time savings (9.5h → 4.5h)

## Notes

**Why Parallel Execution Works**:
- Each flow is independent from a content perspective
- Diagrams don't depend on each other
- Narratives can be written simultaneously
- Only coordination point is file merging (easily managed with sequential writes)

**Template Advantage**:
- PRD lines 1245-1406 provide complete flow template (160+ lines)
- Don't start from scratch - customize existing examples
- Error handling table templates already available

**Testing Requirements**:
- All Mermaid diagrams must be tested on https://mermaid.live/ before commit
- Verify GitHub rendering for all diagrams
- Each flow should be peer-reviewed for technical accuracy

**Success Criteria**:
- Support engineer can debug production issues using flow diagrams
- New engineers can understand system behavior after reading flows
- Non-technical stakeholders can grasp high-level system operation
- All 5 flows have complete documentation (diagram + narrative)

**Critical Path**:
- Stream A (3h) is the longest duration
- Stream B depends on A completing
- Stream C (2h) runs parallel to A
- Stream D depends on C completing
- All streams must complete before README integration
