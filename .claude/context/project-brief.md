---
created: 2025-10-15T02:35:31Z
last_updated: 2025-10-15T02:35:31Z
version: 1.0
author: Claude Code PM System
---

# Project Brief

## Project Name
**ARCA API** - Plataforma de Facturación Electrónica Inteligente

## Tagline
*"De complejidad SOAP a simplicidad REST en 5 minutos, con IA que piensa por vos"*

## What Is This?
ARCA API is a modern, developer-first platform that transforms Argentina's complex electronic invoicing system (AFIP/ARCA) into a simple REST API. It abstracts away SOAP complexity, certificate management, and regulatory compliance, allowing developers to integrate invoicing in minutes instead of weeks.

## Why Does It Exist?

### The Problem
1. **Technical Complexity**: AFIP uses outdated SOAP/XML protocols instead of modern REST/JSON
2. **Time-Consuming Integration**: Developers spend 2+ weeks implementing invoicing
3. **Maintenance Burden**: Frequent regulatory changes break existing implementations
4. **Poor Developer Experience**: Fragmented documentation, complex certificate management
5. **High Costs**: Existing solutions cost $30-100/month with restrictive free tiers

### The Solution
A developer-friendly API platform that:
- Provides modern REST/JSON interface to AFIP's SOAP services
- Handles all certificate management and authentication automatically
- Includes AI-powered invoice generation from natural language
- Offers generous free tier (500 invoices/month vs competitors' 10-50)
- Maintains automatic compliance with regulatory changes
- Ships with idiomatic SDKs in 6+ programming languages

### Market Opportunity
- **TAM**: 500K businesses in Argentina with e-invoicing requirements
- **SAM**: 50K businesses needing API integrations
- **SOM**: Target 2K businesses in Year 1
- **Revenue Potential**: $120K ARR Year 1, $500K+ ARR Year 2

## Who Is This For?

### Primary Users (70%)
**Developers & Technical Integrators**
- Full-stack developers at startups and agencies
- Building e-commerce, SaaS, or business management systems
- Need fast, reliable invoicing integration
- Value developer experience and documentation

### Secondary Users (20%)
**Tech-Savvy Business Owners**
- E-commerce store owners
- Need automated invoicing for their online stores
- Want "set it and forget it" compliance
- Use platforms like Shopify, WooCommerce, Mercado Libre

### Tertiary Users (10%)
**Agencies & Consultancies**
- Build solutions for multiple clients
- Need white-label, multi-tenant capabilities
- Want to resell invoicing as a service

## Key Features

### MVP (3 months)
- Electronic invoice generation (Types A, B, C)
- Automatic AFIP authentication
- REST API with comprehensive documentation
- SDKs: JavaScript/TypeScript, Python, PHP
- Basic dashboard for invoice management
- Free tier: 500 invoices/month
- Sandbox environment

### Phase 2 (6 months)
- AI-powered invoice generation from natural language
- Webhooks for real-time notifications
- E-commerce integrations (Shopify, Mercado Libre, Tienda Nube)
- Analytics and reporting
- Additional SDKs (Ruby, Go, .NET)

### Phase 3 (12 months)
- Predictive compliance with ML
- White-label for agencies
- Multi-country expansion (Brazil, Chile)
- Marketplace for third-party integrations
- Mobile SDKs

## Success Criteria

### 12-Month Goals
**User Metrics**
- 5,000 registered users
- 2,000 monthly active users
- 600 paying customers
- NPS score: 70+

**Business Metrics**
- $20K Monthly Recurring Revenue (MRR)
- $240K Annual Recurring Revenue (ARR)
- 10% free-to-paid conversion rate
- <5% monthly churn

**Technical Metrics**
- 99.9% API uptime
- <200ms average response time
- <0.1% error rate

**Product Metrics**
- Time to first invoice: <30 minutes
- 60% 7-day retention
- 40% 30-day retention

## Business Model

### Freemium SaaS

**Free Tier**
- 500 invoices/month
- All invoice types (A, B, C)
- Basic API access
- Community support
- Sandbox environment

**Starter ($15/month)**
- 2,000 invoices/month
- Priority email support
- Advanced analytics
- Webhook notifications
- Team members (up to 3)

**Professional ($50/month)**
- 10,000 invoices/month
- Priority support + Slack
- White-label options
- Custom integrations
- Team members (up to 10)
- SLA: 99.9% uptime

**Enterprise (Custom)**
- Unlimited invoices
- Dedicated support
- Custom SLA
- On-premise option
- Multi-tenant
- Revenue sharing for resellers

### Revenue Projections (Year 1)
- Q1: $300 MRR (20 paid users)
- Q2: $2K MRR (100 paid users)
- Q3: $8K MRR (300 paid users)
- Q4: $20K MRR (600 paid users)

## Competitive Advantage

### Key Differentiators
1. **Generous Free Tier**: 500 invoices/month vs competitors' 10-50
2. **AI Integration**: Only solution with natural language invoice generation
3. **Open Source**: Core SDKs are open source, building community trust
4. **Superior DX**: Best documentation, fastest onboarding, most SDKs
5. **Predictive Compliance**: Proactive alerts vs reactive fixes

### Competitive Landscape
- **AfipSDK**: Established but expensive ($50-100/mo), outdated UI
- **TusFacturas**: Complete features but vendor lock-in, limited for developers
- **Facturante**: Simple but basic, no webhooks, $25/mo
- **In-house**: 3-6 months dev time, $10K+ cost, ongoing maintenance

**ARCA API Position**: Developer-first, AI-powered, freemium with best DX

## Scope & Constraints

### In Scope
- Argentine electronic invoicing (AFIP compliance)
- Invoice types: A, B, C, M (monotributo)
- REST API and SDKs
- Dashboard for management
- AI-powered features
- E-commerce integrations

### Out of Scope (V1)
- Physical point-of-sale terminals
- Inventory management
- Accounting software (QuickBooks-like features)
- Payroll processing
- Native mobile apps (SDKs only)
- Countries outside Argentina

### Technical Constraints
- Must integrate with AFIP's SOAP API (legacy requirement)
- Certificate-based authentication (AFIP requirement)
- CAE must be obtained from AFIP (regulatory requirement)
- AFIP rate limits and availability

### Business Constraints
- Bootstrap/limited initial funding
- Solo founder → need MVP focus
- Argentine market → localized requirements
- Regulatory compliance critical

## Timeline & Milestones

### Q1 2025 (MVP - 3 months)
- ✅ PRD completion
- ⏳ Development environment setup
- ⏳ Core API infrastructure
- ⏳ AFIP integration layer
- ⏳ Invoice endpoints (A, B, C)
- ⏳ Authentication system
- ⏳ 3 SDKs (JS, Python, PHP)
- ⏳ Basic dashboard
- ⏳ Documentation site
- **Launch**: Closed beta with 50 developers

### Q2 2025 (Iteration - 3 months)
- AI invoice generation
- Webhooks
- Analytics dashboard
- First e-commerce integrations
- Public beta
- **Milestone**: 500 registered users, 20 paying

### Q3 2025 (Growth - 3 months)
- Additional SDKs (Ruby, Go, .NET)
- More integrations
- Advanced analytics
- Performance optimizations
- Marketing push
- **Milestone**: 1,500 users, 100 paying

### Q4 2025 (Scale - 3 months)
- Predictive compliance MVP
- White-label features
- Enterprise tier
- Mobile SDKs
- Platform optimizations
- **Milestone**: 5,000 users, 600 paying

## Risks & Mitigation

### Technical Risks
- **AFIP API changes**: Mitigate with adapter pattern, abstraction layer
- **Performance issues**: Implement caching, queue system, horizontal scaling
- **Security breaches**: Follow OWASP guidelines, regular audits, bug bounty

### Business Risks
- **Low conversion rate**: Strong free tier value, excellent onboarding, case studies
- **Competitive pressure**: Focus on differentiators (AI, DX, free tier)
- **Regulatory changes**: Automated monitoring, proactive updates

### Market Risks
- **Slow adoption**: Developer marketing, community building, content strategy
- **Support burden**: Excellent documentation, automated support, community forums

## Team & Resources

### Current State
- Solo founder/developer
- Bootstrap funding
- Part-time initially

### Needed Resources
**MVP Phase**
- Developer (solo) - Full-stack TypeScript
- Designer (freelance) - Dashboard UI/UX
- Documentation writer (part-time)

**Growth Phase**
- Backend developer
- Frontend developer
- Developer advocate
- Support engineer

## Key Stakeholders

### Internal
- Founder/Developer (you)
- Future team members

### External
- **Users**: Developers, business owners, agencies
- **Partners**: E-commerce platforms (Shopify, Mercado Libre)
- **Regulators**: AFIP/ARCA (compliance)
- **Community**: Open source contributors

## Success Factors

### Critical for Success
1. **Developer Experience**: Best-in-class documentation and DX
2. **Free Tier**: Generous enough to drive adoption
3. **AI Features**: Unique differentiator
4. **Reliability**: 99.9%+ uptime, fast responses
5. **Community**: Active developers providing feedback
6. **Marketing**: Developer-focused content and SEO

### Nice to Have
- White-label capabilities
- Multi-country support
- Mobile SDKs
- Marketplace

## Repository
- **GitHub**: github.com/lorenzotomasdiez/ArcAPI
- **Project Name**: afip (working directory)
- **Branch Strategy**: Trunk-based development
- **License**: MIT (SDKs), Proprietary (API service)

## Notes

- Project in **planning phase** - no code yet
- Comprehensive PRD exists (`prd-idea.md` - 77KB)
- Focus on MVP first, iterate based on user feedback
- Developer adoption is key metric
- Word-of-mouth and community crucial for growth
- Argentine market first, regional expansion later
- AI features are major differentiator but not required for MVP
