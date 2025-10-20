---
issue: 9
title: Setup CI/CD documentation validation pipeline
analyzed: 2025-10-19T18:13:50Z
estimated_hours: 7
parallelization_factor: 2.5
---

# Parallel Work Analysis: Issue #9

## Overview

Set up a comprehensive GitHub Actions CI/CD pipeline that validates all documentation on every pull request. This includes OpenAPI spec validation, broken link detection, Mermaid diagram syntax validation, spell checking, and enforcement of documentation updates when code changes.

The work can be split into three parallel streams: configuration files creation, GitHub Actions workflow development, and integration/testing. These streams have minimal overlap and can be developed independently before final integration.

## Parallel Streams

### Stream A: Configuration Files & Settings
**Scope**: Create all validation tool configuration files
**Files**:
- `.markdown-link-check.json` (link checker configuration)
- `.spectral.yaml` (OpenAPI linter rules)
- `.cspell.json` (spell checker dictionary)
- `.markdownlint.json` (markdown linter rules)

**Agent Type**: devops-specialist
**Can Start**: immediately
**Estimated Hours**: 2 hours
**Dependencies**: none

**Details**:
- Create `.markdown-link-check.json` with localhost/example.com ignores, retry logic, and timeout settings
- Create `.spectral.yaml` extending spectral:oas with custom rules for operationId, tags, descriptions
- Create `.cspell.json` with ARCA-specific terms (AFIP, CUIT, monotributo, CAE, IVA, etc.)
- Create `.markdownlint.json` allowing 120-char lines, inline HTML for diagrams, frontmatter before H1
- All configs must be independently testable with their respective CLI tools

### Stream B: GitHub Actions Workflow
**Scope**: Build the complete GitHub Actions workflow file
**Files**:
- `.github/workflows/docs-validation.yml`

**Agent Type**: devops-specialist
**Can Start**: immediately (can reference Stream A configs, they follow standard schemas)
**Estimated Hours**: 2.5 hours
**Dependencies**: none (can develop in parallel, configs are predictable)

**Details**:
- Create workflow triggered on PR with paths: `docs/**`, `src/**`, `.github/workflows/docs-validation.yml`
- Set up Node.js 20 with npm caching
- Install validation tools: spectral-cli, markdown-link-check, mermaid-cli, cspell, markdownlint-cli2
- Implement 6 validation steps (each with `if: always()` for fail-fast):
  1. OpenAPI spec validation with Spectral
  2. Broken link detection
  3. Mermaid diagram syntax validation
  4. Spell check with cspell
  5. Require docs for code changes (fail if src/ changes but docs/ doesn't)
  6. Markdown linting
- Add validation summary step
- Optimize for speed: parallel checks, GitHub Actions cache

### Stream C: Package Scripts & Documentation
**Scope**: Local validation tooling and developer documentation
**Files**:
- `package.json` (add validation scripts)
- `docs/development/README.md` (update with validation guide)
- Project root `README.md` (add CI status badge)

**Agent Type**: fullstack-specialist
**Can Start**: after Stream A completes (needs to reference actual config files)
**Estimated Hours**: 1.5 hours
**Dependencies**: Stream A (needs config file names/paths)

**Details**:
- Add npm scripts to `package.json`:
  - `validate:docs` - run all checks
  - `validate:openapi` - Spectral only
  - `validate:links` - markdown-link-check only
  - `validate:spelling` - cspell only
  - `validate:markdown` - markdownlint-cli2 only
- Update `docs/development/README.md` with "How to validate docs locally" section
- Add troubleshooting guide (how to add words to spell check, handle false positives)
- Add CI status badge to main README.md: `![Docs Validation](https://github.com/...)`

### Stream D: Testing & Validation
**Scope**: End-to-end testing of the complete CI/CD pipeline
**Files**:
- All files from Streams A, B, C (integration testing)
- Temporary test files (to validate CI catches errors)

**Agent Type**: qa-specialist
**Can Start**: after Streams A & B complete
**Estimated Hours**: 1 hour
**Dependencies**: Streams A, B (needs workflow + configs)

**Details**:
- Run validation locally on existing docs to identify current errors
- Fix any errors found (broken links, spelling mistakes, etc.)
- Test each validation check independently:
  - Intentionally break OpenAPI spec → verify CI catches it
  - Add broken link → verify CI catches it
  - Add spelling error → verify CI catches it
  - Change code without docs → verify CI catches it
- Verify workflow runs in <3 minutes (performance target)
- Ensure error messages are actionable (not cryptic)
- Create test PR to validate workflow runs on actual PRs

## Coordination Points

### Shared Files
Minimal file conflicts - streams work on different files:
- Stream A: Configuration files in project root
- Stream B: `.github/workflows/` directory
- Stream C: `package.json`, documentation files
- Stream D: Testing (no new files, validation only)

**Potential conflicts**:
- `package.json` - Stream C adds validation scripts
  - **Mitigation**: If package.json doesn't exist yet, Stream C creates it. If it exists, Stream C adds to scripts section only.

### Sequential Requirements
1. **Streams A & B can run in parallel** (independent work, no conflicts)
2. **Stream C depends on Stream A** (needs config file paths/names for documentation)
3. **Stream D depends on A & B** (needs workflow + configs to test)
4. **Final integration**: Stream C can be integrated while Stream D tests (minimal conflict)

## Conflict Risk Assessment
- **Low Risk**: Streams work on completely different files
- **Very Low**: Stream C only adds to package.json scripts (additive, not modifying existing)
- **No Risk**: Stream D is read-only testing, no file modifications

**Overall Risk**: Very Low - excellent candidate for parallelization

## Parallelization Strategy

**Recommended Approach**: hybrid (parallel start, sequential integration)

**Execution Plan**:
1. **Phase 1 (Parallel)**: Launch Stream A and Stream B simultaneously
   - Stream A creates all config files (2 hours)
   - Stream B creates GitHub Actions workflow (2.5 hours)
   - These streams are completely independent

2. **Phase 2 (Sequential)**: Stream C depends on A
   - Wait for Stream A to complete
   - Launch Stream C to create package scripts and docs (1.5 hours)

3. **Phase 3 (Testing)**: Stream D integrates and validates
   - Wait for Streams A & B to complete
   - Launch Stream D for end-to-end testing (1 hour)
   - Stream C can complete in parallel with Stream D (no conflicts)

**Timeline**:
- T+0h: Start Streams A & B
- T+2h: Stream A completes, start Stream C
- T+2.5h: Stream B completes, start Stream D
- T+3.5h: Stream C completes
- T+3.5h: Stream D completes
- **Total wall time**: 3.5 hours (vs 7 hours sequential)

## Expected Timeline

**With parallel execution**:
- Wall time: **3.5 hours** (bottleneck: Stream B at 2.5h + Stream C at 1.5h OR Stream D at 1h)
- Total work: 7 hours
- Efficiency gain: **50%** (7h → 3.5h)

**Without parallel execution**:
- Wall time: 7 hours (sequential: A → B → C → D)

**Optimized parallel execution** (2 agents):
- Agent 1: Stream A (2h) → Stream C (1.5h) = 3.5h
- Agent 2: Stream B (2.5h) → Stream D (1h) = 3.5h
- **Total wall time**: 3.5 hours

## Notes

**Why this parallelization works well**:
- Streams A & B are completely independent (different file sets)
- Stream C has minimal dependency on A (just needs config file names)
- Stream D is pure testing/validation (read-only, no file creation conflicts)
- All streams follow standard patterns (configs follow tool schemas, workflow follows GitHub Actions syntax)

**Special Considerations**:
- **Stream B can proceed without Stream A**: GitHub Actions workflow references config files by path, doesn't need their content upfront. Stream B developer can use placeholder/example configs and integrate actual configs from Stream A at the end.
- **Stream C documentation**: Can be drafted in parallel with Stream A, just needs config file names (which are known upfront: `.cspell.json`, `.spectral.yaml`, etc.)

**Testing Strategy (Stream D)**:
- Test locally first using `act` (GitHub Actions local runner) to avoid CI quota usage
- Create intentional errors to validate each check works
- Verify actionable error messages (engineers know how to fix issues)

**Quick Wins**:
- Use GitHub Actions cache for npm install (saves 30-60s per run)
- Run validation checks in parallel within the workflow (use job matrix)
- Provide "fix command" in error output (e.g., "Run: npx cspell --words-only --unique docs/**/*.md to get word list")

**Success Indicators**:
- All existing docs pass validation (zero errors)
- CI catches intentionally broken link in <3 minutes
- CI fails when code changes without docs (tested scenario)
- Local validation scripts work (`pnpm validate:docs` succeeds)

**Future Optimizations** (out of scope):
- Cache validation results (only re-check changed files)
- Generate HTML report of validation results
- Auto-fix simple issues (spelling, formatting) with suggested commits
