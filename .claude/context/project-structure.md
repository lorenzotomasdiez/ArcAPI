---
created: 2025-10-15T02:35:31Z
last_updated: 2025-10-15T02:35:31Z
version: 1.0
author: Claude Code PM System
---

# Project Structure

## Current Directory Structure

```
afip/
├── .git/                       # Git repository
├── .claude/                    # Claude Code PM System
│   ├── context/                # Project context documentation
│   │   └── README.md           # Context system documentation
│   ├── hooks/                  # Claude Code hooks
│   │   └── bash-worktree-fix.sh
│   └── scripts/                # Automation scripts
│       ├── pm/                 # Project management scripts
│       │   ├── blocked.sh
│       │   ├── epic-list.sh
│       │   ├── epic-show.sh
│       │   ├── epic-status.sh
│       │   ├── help.sh
│       │   ├── in-progress.sh
│       │   ├── init.sh
│       │   ├── next.sh
│       │   ├── prd-list.sh
│       │   ├── prd-status.sh
│       │   ├── search.sh
│       │   ├── standup.sh
│       │   ├── status.sh
│       │   └── validate.sh
│       ├── check-path-standards.sh
│       ├── fix-path-standards.sh
│       └── test-and-log.sh
├── .cursor/                    # Cursor IDE configuration
└── prd-idea.md                 # Comprehensive Product Requirements Document
```

## Planned Architecture

Based on the PRD, the project will evolve into this structure:

### Backend API
```
backend/
├── src/
│   ├── api/                    # REST API endpoints
│   │   ├── v1/
│   │   │   ├── invoices/       # Invoice endpoints
│   │   │   ├── auth/           # Authentication
│   │   │   ├── webhooks/       # Webhook management
│   │   │   └── analytics/      # Analytics endpoints
│   │   └── middleware/         # Express middleware
│   ├── services/               # Business logic
│   │   ├── afip/              # AFIP/ARCA integration
│   │   ├── ai/                # AI invoice generation
│   │   ├── compliance/        # Compliance checking
│   │   └── notifications/     # Email/webhook notifications
│   ├── models/                 # Database models
│   ├── utils/                  # Utility functions
│   ├── config/                 # Configuration
│   └── db/                     # Database migrations
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── docs/
    └── api/                    # API documentation
```

### Frontend Dashboard
```
frontend/
├── src/
│   ├── components/             # React components
│   │   ├── Dashboard/
│   │   ├── Invoices/
│   │   ├── Analytics/
│   │   └── Settings/
│   ├── pages/                  # Next.js pages
│   ├── hooks/                  # Custom React hooks
│   ├── services/               # API client
│   ├── utils/                  # Utilities
│   └── styles/                 # CSS/Tailwind
├── public/
└── tests/
```

### SDKs
```
sdks/
├── javascript/                 # JS/TS SDK
│   ├── src/
│   ├── tests/
│   └── examples/
├── python/                     # Python SDK
│   ├── arca_api/
│   ├── tests/
│   └── examples/
├── php/                        # PHP SDK
│   ├── src/
│   ├── tests/
│   └── examples/
├── ruby/                       # Ruby SDK (Phase 2)
├── go/                         # Go SDK (Phase 2)
└── dotnet/                     # .NET SDK (Phase 2)
```

### Infrastructure
```
infrastructure/
├── docker/                     # Docker configurations
│   ├── docker-compose.yml
│   ├── Dockerfile.api
│   └── Dockerfile.worker
├── kubernetes/                 # K8s manifests (Enterprise)
├── terraform/                  # Infrastructure as Code
└── scripts/                    # Deployment scripts
```

### Documentation
```
docs/
├── api-reference/              # API documentation
├── guides/                     # Integration guides
│   ├── quickstart/
│   ├── authentication/
│   ├── invoicing/
│   └── webhooks/
├── sdks/                       # SDK documentation
└── examples/                   # Code examples
```

## File Organization Patterns

### Backend Patterns
- **Route files**: Kebab-case (e.g., `invoice-routes.js`)
- **Service files**: PascalCase (e.g., `InvoiceService.js`)
- **Model files**: PascalCase (e.g., `Invoice.js`)
- **Test files**: `*.test.js` or `*.spec.js`
- **Config files**: Kebab-case (e.g., `database-config.js`)

### Frontend Patterns
- **Components**: PascalCase directories with index file
- **Pages**: Kebab-case (Next.js routing)
- **Hooks**: camelCase with `use` prefix (e.g., `useInvoices.js`)
- **Utils**: camelCase (e.g., `formatCurrency.js`)

### SDK Patterns
- Language-specific conventions
- Consistent folder structure across all SDKs
- Examples directory in each SDK

## Module Organization

### Core Modules (MVP)
1. **Authentication Module**
   - AFIP/ARCA certificate management
   - JWT token generation
   - API key management

2. **Invoice Module**
   - Invoice creation (Types A, B, C)
   - Invoice validation
   - AFIP submission
   - Status tracking

3. **Integration Module**
   - AFIP SOAP client
   - Response parsing
   - Error handling

### Future Modules (Post-MVP)
1. **AI Module**
   - Natural language processing
   - Invoice generation from text
   - Smart field completion

2. **Compliance Module**
   - Regulatory change detection
   - Proactive alerts
   - Tax category validation

3. **Analytics Module**
   - Invoice statistics
   - Revenue tracking
   - Tax reporting

4. **Webhook Module**
   - Event subscription
   - Webhook delivery
   - Retry logic

## Integration Points

### External Services
- **AFIP/ARCA**: SOAP API for electronic invoicing
- **Database**: PostgreSQL for data persistence
- **Cache**: Redis for session/rate limiting
- **Queue**: Bull/RabbitMQ for background jobs
- **Storage**: S3-compatible for PDFs/attachments
- **Email**: SendGrid/SES for notifications
- **Analytics**: Mixpanel/PostHog for product analytics

### Internal Communication
- REST API between frontend and backend
- gRPC for internal microservices (future)
- WebSockets for real-time updates (webhooks)

## Configuration Management

### Environment-based
- `.env.development`
- `.env.staging`
- `.env.production`

### Config Files
- Database configuration
- AFIP credentials
- API keys
- Feature flags

## Build Artifacts

### Development
- Source maps enabled
- Hot module replacement
- Debug logging

### Production
- Minified bundles
- Optimized assets
- Error tracking (Sentry)
- Performance monitoring

## Notes

- Project is currently in **planning phase** - directories will be created as needed
- Structure follows **monorepo** pattern for easier development
- Claude Code PM system already established in `.claude/`
- Will use **trunk-based development** with feature flags
- Modular architecture allows for independent scaling of components
