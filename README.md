# ARCA API

Modern REST API for electronic invoicing in Argentina (ARCA/AFIP).

## Overview

ARCA API simplifies interaction with Argentina's ARCA/AFIP electronic invoicing system, providing a modern REST API that abstracts the complexity of the government's SOAP-based API.

**Key Features:**
- REST API with AI-powered invoice generation
- Multiple language SDKs (JavaScript, Python, PHP, Ruby, Go, .NET)
- Developer Dashboard for management and analytics
- Webhook Engine for real-time notifications
- MCP Server for LLM integrations
- Comprehensive analytics and reporting

## Documentation

Comprehensive engineering documentation is available in the [`docs/`](./docs/README.md) directory:

### Quick Links

- **[Documentation Hub](./docs/README.md)** - Complete documentation index
- **[Architecture](./docs/architecture/README.md)** - System design and architectural decisions
- **[API Specifications](./docs/specifications/api/README.md)** - OpenAPI/REST API contracts
- **[System Flows](./docs/flows/README.md)** - Visual flow diagrams
- **[Development Guide](./docs/development/README.md)** - Setup and coding standards
- **[Operations](./docs/operations/README.md)** - Deployment and monitoring
- **[Security](./docs/security/README.md)** - Security architecture and compliance

## Getting Started

### For Developers

1. Review the [Architecture Overview](./docs/architecture/README.md) to understand the system
2. Follow the [Development Setup Guide](./docs/development/README.md) to configure your environment
3. Review [API Specifications](./docs/specifications/api/README.md) for contract details
4. Check [System Flows](./docs/flows/README.md) to understand how the system works

### For DevOps Engineers

1. Review [Infrastructure Architecture](./docs/architecture/04-infrastructure.md)
2. Follow the [Deployment Guide](./docs/operations/README.md)
3. Configure [Monitoring and Alerting](./docs/operations/README.md)
4. Familiarize with [Runbooks](./docs/operations/runbooks/README.md) for incident response

### For Security Reviewers

1. Review [Security Architecture](./docs/security/README.md)
2. Verify [Compliance Requirements](./docs/security/compliance/README.md)
3. Check [Architecture Decision Records](./docs/architecture/adrs/README.md) for security decisions

## Project Status

This project is in active development as part of the ARCA API platform initiative.

**Current Phase:** Architecture and Documentation (Week 1-2)

See the [product vision document](./prd-idea.md) for complete product details.

## Architecture Highlights

- **Microservices Architecture**: 8+ interconnected services
- **High Availability**: 99.95% uptime target with multi-AZ deployment
- **Scalability**: Support for 100K+ invoices per day
- **Security**: ISO 27001 and GDPR compliant by design
- **Cost Optimized**: <$0.02 per invoice processed

## Technology Stack

- **Backend**: Node.js (TypeScript), Python (FastAPI)
- **Frontend**: Next.js, React, TailwindCSS
- **Database**: PostgreSQL, Redis
- **Infrastructure**: Docker, Kubernetes/ECS, Terraform
- **Observability**: Prometheus, Grafana, OpenTelemetry

See [Architecture - Services](./docs/architecture/02-services.md) for detailed technology decisions.

## Contributing

We follow a spec-driven development approach where specifications are written before implementation.

1. Review [Contribution Guide](./docs/development/README.md)
2. Check [Coding Standards](./docs/development/README.md)
3. Follow [Git Workflow](./docs/development/README.md)
4. Submit pull requests with tests

All contributions must:
- Include comprehensive tests (80%+ coverage)
- Pass all CI checks (linting, tests, security scans)
- Be reviewed by at least 2 engineers
- Update documentation as needed

## Development Principles

- **Spec-Driven Development**: Write specifications before code
- **Documentation First**: Update docs alongside code changes
- **Security by Design**: Security built in from the start
- **Test Driven**: Comprehensive test coverage
- **Continuous Improvement**: Regular architecture reviews

## License

[License TBD]

## Contact

- **Engineering Team**: engineering@arcaapi.com
- **Security Issues**: security@arcaapi.com
- **General Inquiries**: contact@arcaapi.com

## Resources

- [Product Vision](./prd-idea.md) - Complete product requirements
- [Documentation](./docs/README.md) - Engineering documentation
- [Architecture](./docs/architecture/README.md) - System architecture
- [API Specs](./docs/specifications/api/README.md) - API contracts

---

**Last Updated**: 2025-10-15
**Status**: Active Development
**Documentation Status**: Foundation Complete (Task #2)
