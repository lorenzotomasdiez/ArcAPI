---
created: 2025-10-15T02:35:31Z
last_updated: 2025-10-15T02:35:31Z
version: 1.0
author: Claude Code PM System
---

# Technical Context

## Technology Stack

### Backend (Planned)

**Runtime & Framework**
- **Node.js** v18+ LTS
- **Express.js** v4.x - REST API framework
- **TypeScript** v5.x - Type safety and better DX

**Database**
- **PostgreSQL** v15+ - Primary data store
  - Invoice records
  - User accounts
  - Transaction history
- **Redis** v7+ - Caching & sessions
  - Rate limiting
  - Session management
  - Queue management

**Authentication & Security**
- **JWT** - API authentication
- **bcrypt** - Password hashing
- **helmet** - Security headers
- **CORS** - Cross-origin configuration
- **x509 certificates** - AFIP/ARCA integration

**API & Integration**
- **SOAP** - AFIP/ARCA legacy protocol
- **REST** - Modern API interface
- **GraphQL** (Future) - Flexible querying
- **WebSockets** - Real-time webhooks

**Background Jobs**
- **Bull** or **BullMQ** - Job queue
- **node-cron** - Scheduled tasks
- Worker processes for:
  - Invoice processing
  - PDF generation
  - Email sending
  - Webhook delivery

**Testing**
- **Jest** - Unit & integration tests
- **Supertest** - API endpoint testing
- **ts-jest** - TypeScript test support
- **faker** - Test data generation

**Logging & Monitoring**
- **Winston** or **Pino** - Structured logging
- **Morgan** - HTTP request logging
- **Sentry** - Error tracking
- **DataDog** or **New Relic** - APM (Production)

### Frontend (Planned)

**Framework & Core**
- **Next.js** v14+ - React framework
- **React** v18+ - UI library
- **TypeScript** v5.x - Type safety

**Styling**
- **Tailwind CSS** v3.x - Utility-first CSS
- **shadcn/ui** - Component library
- **Radix UI** - Accessible primitives

**State Management**
- **Zustand** or **Jotai** - Lightweight state
- **React Query** v5 - Server state management
- **SWR** (alternative) - Data fetching

**Forms & Validation**
- **React Hook Form** - Form handling
- **Zod** - Schema validation

**Data Visualization**
- **Recharts** or **Chart.js** - Analytics charts
- **react-table** - Data tables

**Testing**
- **Vitest** - Unit tests
- **Playwright** or **Cypress** - E2E tests
- **Testing Library** - Component tests

### SDKs (Planned)

**JavaScript/TypeScript**
- **TypeScript** with full type definitions
- **Axios** for HTTP
- **Zod** for runtime validation
- ESM + CJS builds

**Python**
- **Python** 3.9+
- **requests** for HTTP
- **pydantic** for validation
- **pytest** for testing
- Type hints throughout

**PHP**
- **PHP** 8.1+
- **Guzzle** for HTTP
- **Composer** package management
- **PHPUnit** for testing
- PSR-4 autoloading

**Ruby** (Phase 2)
- **Ruby** 3.0+
- **faraday** for HTTP
- **RSpec** for testing

**Go** (Phase 2)
- **Go** 1.21+
- Standard library HTTP
- Strict typing
- Go modules

**.NET** (Phase 2)
- **.NET** 7+
- **HttpClient** for requests
- **xUnit** for testing
- NuGet packages

### Infrastructure & DevOps

**Containerization**
- **Docker** - Application containers
- **Docker Compose** - Local development

**Orchestration** (Production)
- **Kubernetes** or **AWS ECS** - Container orchestration
- **Helm** - K8s package management

**CI/CD**
- **GitHub Actions** - Automation pipeline
- **Vercel** - Frontend deployment
- **Railway** or **Render** - Backend hosting (MVP)
- **AWS** or **GCP** - Production infrastructure

**Infrastructure as Code**
- **Terraform** - Infrastructure provisioning
- **Ansible** (optional) - Configuration management

**CDN & Storage**
- **CloudFlare** - CDN & DDoS protection
- **AWS S3** or **Backblaze B2** - File storage
- PDF generation and storage

### AI & Machine Learning (Phase 2+)

**AI Services**
- **OpenAI GPT-4** - Natural language invoice generation
- **Anthropic Claude** - Alternative LLM
- **Langchain** - LLM orchestration

**ML Infrastructure**
- **Python ML stack** (scikit-learn, pandas)
- **MLflow** - Model tracking
- Compliance prediction models

### Development Tools

**Version Control**
- **Git** - Source control
- **GitHub** - Repository hosting
- **Git LFS** (if needed) - Large file storage

**Code Quality**
- **ESLint** - JavaScript/TypeScript linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **lint-staged** - Pre-commit linting

**Documentation**
- **TypeDoc** - TypeScript documentation
- **Swagger/OpenAPI** - API documentation
- **Docusaurus** - Documentation site
- **Storybook** - Component documentation

**Package Management**
- **pnpm** or **npm** - Node.js packages
- **pip** - Python packages
- **Composer** - PHP packages
- **Bundler** - Ruby gems

### External Services & APIs

**AFIP/ARCA Integration**
- **WSAA** - Web Service de Autenticación y Autorización
- **WSFEV1** - Web Service Factura Electrónica V1
- **WSConstancia** - Constancia de Inscripción
- X.509 certificates for authentication

**Third-party Integrations** (Future)
- **Mercado Libre API** - E-commerce integration
- **Shopify API** - Store integration
- **Tienda Nube API** - Argentine e-commerce
- **WooCommerce API** - WordPress commerce

**Communication**
- **SendGrid** or **AWS SES** - Transactional email
- **Twilio** (future) - SMS notifications
- **Slack API** (future) - Team notifications

**Payment Processing** (Future)
- **Stripe** - International payments
- **Mercado Pago** - Argentine payment gateway

**Analytics & Metrics**
- **Mixpanel** or **PostHog** - Product analytics
- **Google Analytics** - Web analytics
- **Prometheus** + **Grafana** - Infrastructure metrics

## Development Environment

### Required Software
- **Node.js** v18+ LTS
- **PostgreSQL** v15+
- **Redis** v7+
- **Docker** & **Docker Compose**
- **Git**

### Optional Tools
- **Postman** or **Insomnia** - API testing
- **pgAdmin** or **TablePlus** - Database GUI
- **Redis Commander** - Redis GUI
- **VSCode** or **Cursor** - IDE

### Environment Variables
```
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/arca_api
REDIS_URL=redis://localhost:6379

# AFIP/ARCA
AFIP_ENVIRONMENT=testing|production
AFIP_CERT_PATH=/path/to/cert.pem
AFIP_KEY_PATH=/path/to/key.pem
AFIP_CUIT=XXXXXXXXXX

# Auth
JWT_SECRET=secret_key_here
JWT_EXPIRES_IN=7d

# External Services
OPENAI_API_KEY=sk-...
SENDGRID_API_KEY=SG...

# App Config
NODE_ENV=development|staging|production
PORT=3000
API_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3001
```

## Dependencies (Current)

**Note**: Project is in planning phase - no `package.json` yet.

### Planned Core Dependencies

**Backend**
```json
{
  "express": "^4.18.0",
  "typescript": "^5.0.0",
  "pg": "^8.11.0",
  "redis": "^4.6.0",
  "jsonwebtoken": "^9.0.0",
  "bcrypt": "^5.1.0",
  "zod": "^3.22.0",
  "winston": "^3.11.0",
  "bull": "^4.12.0",
  "soap": "^1.0.0"
}
```

**Frontend**
```json
{
  "next": "^14.0.0",
  "react": "^18.0.0",
  "tailwindcss": "^3.4.0",
  "zustand": "^4.4.0",
  "@tanstack/react-query": "^5.0.0",
  "react-hook-form": "^7.48.0",
  "zod": "^3.22.0"
}
```

## Architecture Decisions

### API Design
- **RESTful** principles for simplicity
- **Versioned** API (`/v1/`, `/v2/`)
- **JSON** request/response format
- **Pagination** for list endpoints
- **Rate limiting** to prevent abuse

### Database Design
- **PostgreSQL** for ACID compliance
- **Normalized** schema with foreign keys
- **Indexes** on frequently queried fields
- **Soft deletes** for audit trail
- **Migrations** for schema changes

### Caching Strategy
- **Redis** for frequently accessed data
- **TTL-based** expiration
- **Cache invalidation** on updates
- **Rate limit** counters

### Error Handling
- **Structured errors** with error codes
- **Localized** error messages (ES/EN)
- **Detailed logging** for debugging
- **User-friendly** messages in responses

### Security
- **HTTPS only** in production
- **API key** or **JWT** authentication
- **Input validation** on all endpoints
- **SQL injection** prevention (parameterized queries)
- **XSS** prevention (sanitization)
- **CSRF** tokens for web forms
- **Rate limiting** per IP/user

## Performance Targets

- **API Response**: < 200ms (p95)
- **Invoice Generation**: < 2s
- **AFIP Submission**: < 5s (depends on AFIP)
- **Uptime**: 99.9% SLA
- **Concurrent Users**: 1000+ (MVP)

## Scalability Considerations

- **Horizontal scaling** of API servers
- **Database read replicas** for analytics
- **Queue workers** for async processing
- **CDN** for static assets
- **Load balancing** for high availability

## Compliance & Standards

- **AFIP RG 4291** - Electronic invoicing regulations
- **AFIP RG 5616** - Recent regulatory updates
- **GDPR** considerations (if EU users)
- **PCI DSS** (if handling payments)
- **SOC 2** (Enterprise tier)

## Notes

- Stack emphasizes **developer experience** (DX)
- Technology choices favor **proven, stable** solutions
- **Open source** where possible to reduce costs
- **TypeScript everywhere** for consistency and safety
- Focus on **API-first** architecture
- All services designed for **cloud-native** deployment
