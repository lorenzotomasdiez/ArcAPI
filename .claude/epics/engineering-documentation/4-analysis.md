---
issue: 4
title: Create OpenAPI specification for MVP endpoints
analyzed: 2025-10-15T12:03:18Z
estimated_hours: 14
parallelization_factor: 2.5
---

# Parallel Work Analysis: Issue #4

## Overview
Create a comprehensive OpenAPI 3.1 specification documenting all ARCA API MVP endpoints (invoices, certificates, reference data, API keys). The spec serves as an executable contract enabling parallel frontend/backend/SDK development. Work can be parallelized by splitting endpoint groups and documentation into independent streams.

## Parallel Streams

### Stream A: Core Infrastructure & Invoice Endpoints
**Scope**: OpenAPI base structure, authentication, error schemas, and invoice endpoints (POST, GET, PATCH with simple/advanced modes)
**Files**:
- `docs/specifications/api/openapi.yaml` (create - metadata, security, invoice paths, base schemas)
**Agent Type**: backend-specialist
**Can Start**: immediately
**Estimated Hours**: 6
**Dependencies**: none

**Details**:
- Set up OpenAPI 3.1 structure (info, servers, security)
- Define BearerAuth security scheme
- Create RFC 7807 ProblemDetails error schema
- Define reusable error responses (400, 401, 429, 500)
- Document invoice endpoints (POST/GET/PATCH /invoices)
- Create SimpleInvoiceRequest, AdvancedInvoiceRequest, Invoice schemas
- Add nested schemas: Cliente, InvoiceItem, etc.
- Include request/response examples for invoices

### Stream B: Certificates & Reference Data Endpoints
**Scope**: Certificate management and reference data endpoints
**Files**:
- `docs/specifications/api/openapi.yaml` (add - certificates & reference-data paths)
**Agent Type**: backend-specialist
**Can Start**: after Stream A completes base structure (sequential dependency)
**Estimated Hours**: 3
**Dependencies**: Stream A (needs base OpenAPI structure)

**Details**:
- Document certificate endpoints (POST/GET/DELETE /certificates)
- Create Certificate schema (with .pfx upload handling)
- Document all reference data endpoints (invoice-types, iva-rates, document-types, currencies, sales-points)
- Create reference data response schemas (simple lists)
- Add examples for certificate upload and reference data responses

### Stream C: API Key Management & Documentation
**Scope**: API key endpoints and supporting documentation
**Files**:
- `docs/specifications/api/openapi.yaml` (add - api-keys paths)
- `docs/specifications/api/README.md` (create - usage guide)
- `docs/specifications/README.md` (update - add API spec link)
**Agent Type**: fullstack-specialist
**Can Start**: after Stream A completes base structure (sequential dependency)
**Estimated Hours**: 2.5
**Dependencies**: Stream A (needs base OpenAPI structure)

**Details**:
- Document API key endpoints (POST/GET/DELETE /api-keys)
- Create ApiKey schema (with prefix display, hashing notes)
- Add rate limiting documentation (100 req/min free, 1000 req/min pro)
- Create README explaining spec validation and doc generation
- Update specifications index with API spec link

### Stream D: Validation & Quality Assurance
**Scope**: Spectral validation, example verification, HTML documentation generation
**Files**:
- `docs/specifications/api/openapi.yaml` (validate & fix errors)
- Generated HTML documentation (preview)
**Agent Type**: backend-specialist
**Can Start**: after Streams A, B, C complete
**Estimated Hours**: 2.5
**Dependencies**: Streams A, B, C (needs complete spec)

**Details**:
- Install Spectral CLI (`npx @stoplight/spectral-cli lint`)
- Fix all Spectral errors (missing operationIds, undefined schemas, etc.)
- Verify all examples match schemas
- Check naming consistency (camelCase vs snake_case)
- Generate HTML docs with Redocly or Swagger UI
- Preview interactive documentation
- Verify all acceptance criteria met

## Coordination Points

### Shared Files
All streams modify `docs/specifications/api/openapi.yaml`:
- **Stream A** creates base structure (lines 1-200 approx.)
- **Stream B** adds paths (certificates, reference-data sections)
- **Stream C** adds paths (api-keys section) + README files
- **Stream D** validates and fixes across entire file

**Merge Strategy**: Sequential execution (A → B+C parallel → D) avoids merge conflicts

### Sequential Requirements
1. Stream A must complete base OpenAPI structure before B or C can add paths
2. Streams B and C can run in parallel (different path sections)
3. Stream D must wait for A, B, C to complete (validates final spec)

## Conflict Risk Assessment
- **Low Risk**: Streams B and C work on different path sections (no overlap)
- **Medium Risk**: Stream A creates base structure - must complete first
- **High Risk**: None (sequential strategy prevents conflicts)

## Parallelization Strategy

**Recommended Approach**: hybrid

**Execution Plan**:
1. **Phase 1**: Stream A creates base infrastructure (6 hours)
2. **Phase 2**: Streams B and C run in parallel (3 hours max) - different path sections
3. **Phase 3**: Stream D validates complete spec (2.5 hours)

This approach minimizes coordination overhead while achieving meaningful parallelization in Phase 2.

## Expected Timeline

With parallel execution:
- Wall time: 11.5 hours (6 + 3 + 2.5)
- Total work: 14 hours
- Efficiency gain: 18% (2.5 hours saved)

Without parallel execution:
- Wall time: 14 hours (sequential)

## Notes

**Parallelization Constraints**:
- All work modifies single file (`openapi.yaml`)
- Dependencies require sequential base structure creation
- Limited parallelization opportunity (only Phase 2)

**Why Limited Parallelization**:
- OpenAPI spec is a monolithic YAML file
- Base structure (metadata, security, error schemas) must exist before endpoint paths can be added
- Validation must happen after all content complete

**Alternative Considered**: Splitting into separate YAML files with $ref, but adds complexity without significant time savings

**Success Metrics**:
- Spectral reports 0 errors
- All 18 MVP endpoints documented
- Frontend/backend teams can start mocking/implementing APIs immediately

**Critical Path**: Stream A (base structure) is blocking - prioritize this first
