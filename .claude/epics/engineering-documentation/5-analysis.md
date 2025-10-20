---
issue: 5
title: Document service architecture (C4 Level 2)
analyzed: 2025-10-15T13:18:45Z
estimated_hours: 11
parallelization_factor: 3.0
---

# Parallel Work Analysis: Issue #5

## Overview
Create comprehensive service architecture documentation including C4 Level 2 Container diagram showing all 8 ARCA API services, their interactions, data stores, and internal service contracts. This task involves creating multiple independent documents that can be developed in parallel.

## Parallel Streams

### Stream A: C4 Level 2 Diagram & Services Overview
**Scope**: Create the C4 Container diagram and main service architecture document with overview of all 8 services
**Files**:
- `docs/architecture/02-services.md` (create - main document with Mermaid diagram)
- `docs/architecture/README.md` (update - add link to services doc)
**Agent Type**: general-purpose
**Can Start**: immediately
**Estimated Hours**: 6
**Dependencies**: none (Task 2 and 3 already completed)

**Details**:
- Create C4 Level 2 Container diagram using Mermaid (customize from PRD template)
- Document all 8 services with responsibility, technology, scaling strategy, data access
- Explain service interactions and communication patterns
- Document 3 data stores (PostgreSQL, Redis, S3/R2)
- Verify Mermaid diagram renders correctly in GitHub

### Stream B: AI Service Contract
**Scope**: Document the AI Service internal API contract for invoice generation
**Files**:
- `docs/specifications/services/ai-service-contract.md` (create)
- `docs/specifications/services/README.md` (update - add AI service to index)
**Agent Type**: general-purpose
**Can Start**: immediately
**Estimated Hours**: 2.5
**Dependencies**: none

**Details**:
- Document POST /internal/ai/generate-invoice endpoint
- Define request/response schemas
- Specify error handling (RFC 7807 format)
- Document timeout behavior (5 seconds)
- Explain retry strategy and fallback behavior
- Include example requests and responses
- Document AI metadata (model, tokens used, processing time)

### Stream C: Webhook Service Contract
**Scope**: Document the Webhook Engine internal contract for event delivery
**Files**:
- `docs/specifications/services/webhook-service-contract.md` (create)
- `docs/specifications/services/README.md` (update - add Webhook service to index)
**Agent Type**: general-purpose
**Can Start**: immediately
**Estimated Hours**: 2.5
**Dependencies**: none

**Details**:
- Document Redis queue job format
- Define webhook delivery protocol (POST with signature)
- Specify retry strategy (exponential backoff: 1min, 5min, 15min)
- Document HMAC-SHA256 signature verification
- Explain response handling (2xx success, 4xx fail, 5xx retry)
- Document logging strategy (webhook_deliveries table)
- Include example job payloads and delivery requests

## Coordination Points

### Shared Files
- `docs/specifications/services/README.md` - Streams B & C both update this file (coordinate to avoid conflicts)

**Mitigation**:
- Stream B creates the README if it doesn't exist and adds AI service
- Stream C checks if README exists before updating, appends Webhook service
- Or: Stream A creates the README skeleton, Streams B & C just append their entries

### Sequential Requirements
None - all streams can work fully in parallel since:
- Stream A works on architecture docs
- Stream B works on AI service contract
- Stream C works on Webhook service contract
- Minimal file overlap (only README.md shared by B & C)

## Conflict Risk Assessment
- **Low Risk**: Streams A, B, C work on completely different primary files
- **Medium Risk**: Streams B and C both update `docs/specifications/services/README.md` (easily coordinated)
- **High Risk**: None

**Mitigation for Medium Risk**:
- Have Stream A create the `docs/specifications/services/README.md` with basic structure
- Streams B and C append their service entries without modifying the structure

## Parallelization Strategy

**Recommended Approach**: parallel

**Execution Plan**:
- Launch all 3 streams simultaneously
- Stream A is the longest (6 hours) - critical path
- Streams B and C complete faster (2.5 hours each)
- All streams work on independent files with minimal coordination needed

This approach maximizes parallelization since the work is naturally split by document type:
- Architecture docs (Stream A)
- Service contracts (Streams B & C)

## Expected Timeline

With parallel execution:
- Wall time: 6 hours (longest stream: Stream A)
- Total work: 11 hours (6 + 2.5 + 2.5)
- Efficiency gain: 45% (5 hours saved)

Without parallel execution:
- Wall time: 11 hours (sequential)

## Notes

**Parallelization Benefits**:
- High parallelization factor (3x) - three independent work streams
- Work naturally separates by document type
- Minimal coordination overhead (only README.md shared)
- Each stream produces complete, standalone deliverable

**Why This Works Well**:
- Stream A (C4 diagram) is independent and self-contained
- Stream B (AI contract) is independent and self-contained
- Stream C (Webhook contract) is independent and self-contained
- No complex dependencies between streams
- Each agent can work autonomously

**Coordination Strategy**:
- Stream A creates `docs/specifications/services/README.md` skeleton first
- Streams B and C wait briefly for README to exist, then append their entries
- Alternative: Use git merge to combine README updates if conflicts occur

**Quality Assurance**:
- Each stream should verify Mermaid diagrams render (if applicable)
- Cross-reference service names between docs for consistency
- Ensure internal API contracts use same error format (RFC 7807)

**Success Indicator**:
- Backend team can understand service boundaries from Stream A output
- AI service developers can implement contract from Stream B output
- Webhook engine developers can implement contract from Stream C output
- All three documents integrate seamlessly without contradictions
