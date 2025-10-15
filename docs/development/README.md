# Development Documentation

Developer setup guides, coding standards, testing strategies, and contribution guidelines for ARCA API development.

## Overview

This section provides everything a developer needs to:
- Set up local development environment
- Understand coding standards and best practices
- Write and run tests
- Contribute code via pull requests
- Debug issues locally

## Status

> **Status**: In Progress - Task #7: Write Development Guides
>
> ✅ Local Development Setup Guide - **COMPLETED** (Stream A)
>
> 🔄 Coding Standards Guide - In Progress (Stream B)
>
> 🔄 Testing Strategy Guide - In Progress (Stream C)

## Available Documents

### 1. Local Development Setup ✅

**File**: [`setup.md`](./setup.md)

**Status**: Complete

Complete guide to setting up local development environment:

- **Prerequisites**
  - Node.js 20+, Python 3.11+, Docker
  - PostgreSQL 15+, Redis 7+
  - Git, VSCode (recommended)

- **Installation**
  - Clone repository
  - Install dependencies (npm, pip)
  - Configure environment variables
  - Initialize database
  - Seed test data

- **Running Services Locally**
  - Docker Compose setup
  - Running individual services
  - API available at http://localhost:3000
  - Dashboard at http://localhost:3001

- **Development Tools**
  - VSCode extensions
  - Debugger configuration
  - Database management tools
  - API testing (Postman/Insomnia collections)

- **Test Certificates**
  - ARCA test certificates for local development
  - Sandbox account setup
  - Mock ARCA API for offline development

**Time to Complete**: 45-60 minutes

**What's Included**:
- Prerequisites (Node.js, Python, Docker, PostgreSQL, Redis)
- Environment configuration with complete .env example
- Database setup with migrations and seeding
- Redis cache setup
- Development server startup (API, Dashboard, AI Service)
- Testing setup and verification
- ARCA certificate configuration for homologación
- Comprehensive troubleshooting guide
- Verification checklist

**Key Features**:
- All commands are copy-paste ready
- Tested on macOS, Linux, and Windows (WSL2)
- Includes Docker and local installation options
- Covers common issues and solutions
- Links to next steps and related documentation

👉 **[Read Setup Guide](./setup.md)**

### 2. Coding Standards (TODO - Stream B)

**File**: `coding-standards.md`

Language-specific coding standards:

**TypeScript/JavaScript:**
- ESLint configuration
- Prettier formatting
- Naming conventions (camelCase, PascalCase)
- File organization
- Import ordering
- Error handling patterns
- Async/await best practices

**Python:**
- Black formatting
- Flake8/Pylint rules
- Type hints (mypy)
- Docstring format (Google style)
- Import organization
- Error handling

**General Principles:**
- DRY (Don't Repeat Yourself)
- SOLID principles
- Functional programming where appropriate
- Clear variable/function names
- Comments for "why", not "what"
- Maximum function length: 50 lines
- Maximum file length: 300 lines

### 3. Testing Strategy (TODO - Stream C)

**File**: `testing-strategy.md`

Comprehensive testing approach:

**Unit Tests:**
- Coverage target: 80%+
- Test framework: Jest (JS), pytest (Python)
- Mock external dependencies
- Fast execution (<5 minutes)

**Integration Tests:**
- Test service interactions
- Use test database
- Mock external APIs (ARCA, OpenAI)
- Run in CI pipeline

**End-to-End Tests:**
- Full flow testing
- Use Playwright/Cypress
- Run against staging
- Cover critical paths

**Contract Tests:**
- Validate API specs (OpenAPI)
- Validate service contracts
- Ensure backward compatibility
- Generate from specifications

**Load Tests:**
- k6 or Artillery
- Simulate 1000 req/min
- Identify bottlenecks
- Run before releases

**Performance Benchmarks:**
- P95 latency targets
- Memory usage limits
- Database query performance

### 4. Git Workflow (TODO - Future Task)

**File**: `git-workflow.md`

Branch strategy and commit conventions:

**Branch Strategy:**
- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: New features
- `fix/*`: Bug fixes
- `hotfix/*`: Production hotfixes

**Commit Message Format:**
```
type(scope): subject

body

footer
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Example:
```
feat(invoices): add AI-powered invoice generation

Implement natural language to structured invoice conversion using
OpenAI GPT-4. Includes prompt engineering and validation.

Closes #42
```

**Pull Request Process:**
1. Create feature branch from `develop`
2. Implement with tests
3. Ensure CI passes (tests, linting)
4. Request review from 2 engineers
5. Address feedback
6. Squash merge to `develop`

### 5. Code Review Guidelines (TODO - Future Task)

**File**: `code-review.md`

What to look for in code reviews:

**Functionality:**
- Does it work as intended?
- Are edge cases handled?
- Is error handling robust?

**Tests:**
- Are tests comprehensive?
- Do tests pass?
- Is coverage sufficient?

**Code Quality:**
- Follows coding standards?
- Clear and maintainable?
- Proper abstractions?

**Performance:**
- Any performance concerns?
- Database queries optimized?
- Appropriate caching?

**Security:**
- Input validation?
- SQL injection prevention?
- Secrets not hardcoded?

**Documentation:**
- Public APIs documented?
- Complex logic explained?
- README updated if needed?

### 6. Debugging Guide (TODO - Future Task)

**File**: `debugging.md`

How to debug common issues:

- VSCode debugger setup
- Chrome DevTools for frontend
- Database query debugging
- API request/response logging
- Distributed tracing (OpenTelemetry)
- Common errors and solutions

## Development Tools

### Required Tools

- **Git**: Version control
- **Node.js 20+**: Backend runtime
- **Python 3.11+**: AI service
- **Docker**: Containerization
- **Docker Compose**: Local orchestration
- **PostgreSQL 15+**: Database
- **Redis 7+**: Cache and queue

### Recommended Tools

- **VSCode**: Code editor
- **Postman/Insomnia**: API testing
- **DBeaver/pgAdmin**: Database management
- **RedisInsight**: Redis browser
- **k9s**: Kubernetes management (if used)

### VSCode Extensions

- ESLint
- Prettier
- Python (Pylance)
- Docker
- GitLens
- Thunder Client (API testing)
- Markdown All in One

## Quick Start

> Full guide will be in `setup.md`

```bash
# Clone repository
git clone https://github.com/org/arca-api.git
cd arca-api

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your settings

# Start services
docker-compose up -d

# Run database migrations
npm run migrate

# Start development server
npm run dev

# Run tests
npm test
```

## Testing Commands

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- path/to/test.spec.ts

# Run in watch mode
npm test -- --watch
```

## Code Quality Commands

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run typecheck

# Check all (lint + format + typecheck)
npm run check

# Fix auto-fixable issues
npm run lint:fix
npm run format:fix
```

## Related Documentation

- [Architecture](../architecture/README.md) - System design
- [API Specifications](../specifications/api/README.md) - API contracts
- [Flows](../flows/README.md) - How the system works
- [Operations](../operations/README.md) - Deployment

---

**Last Updated**: 2025-10-15
**Status**: In Progress (Task #7 - Stream A Complete)
**Next**: Streams B & C (Coding Standards & Testing Strategy)
