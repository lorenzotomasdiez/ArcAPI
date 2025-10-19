# Deployment Guide

Complete deployment procedures for ARCA API in staging and production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Database Migrations](#database-migrations)
- [Deployment Procedures](#deployment-procedures)
  - [Staging Deployment](#staging-deployment)
  - [Production Deployment](#production-deployment)
- [Deployment Workflow](#deployment-workflow)
- [Health Checks](#health-checks)
- [Rollback Procedures](#rollback-procedures)
- [Deployment Checklist](#deployment-checklist)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying ARCA API, ensure you have the following tools and access:

### Required Tools

**Railway CLI** (Recommended for MVP):
```bash
# Install Railway CLI
npm install -g @railway/cli

# Verify installation
railway --version
```

**Docker** (for local testing):
```bash
# Install Docker Desktop from https://www.docker.com/products/docker-desktop/

# Verify installation
docker --version
docker-compose --version
```

**Git** (for deployment triggers):
```bash
# Verify installation
git --version

# Ensure you're authenticated with GitHub
git config --global user.name
git config --global user.email
```

**Node.js & pnpm**:
```bash
# Node.js 18+ required
node --version  # Should be v18.x or higher

# Install pnpm if not already installed
npm install -g pnpm

# Verify installation
pnpm --version
```

### Required Access

- **Railway Account**: Access to staging and production projects
- **GitHub Repository**: Push access to trigger CI/CD workflows
- **Database Access**: Connection strings for staging and production databases
- **ARCA Certificate**: Valid AFIP certificate for invoice authorization

### Environment Variables

The following environment variables are required for deployment:

**Core Configuration**:
```bash
NODE_ENV=production                    # Environment: development, staging, production
PORT=3000                              # API server port
API_URL=https://api.arcaapi.com       # Public API URL
```

**Database**:
```bash
DATABASE_URL=postgresql://user:pass@host:5432/dbname  # PostgreSQL connection string
DATABASE_POOL_SIZE=20                                  # Connection pool size (default: 20)
DATABASE_SSL=true                                      # Enable SSL for production
```

**Redis** (Session & Caching):
```bash
REDIS_URL=redis://user:pass@host:6379                 # Redis connection string
REDIS_TLS=true                                         # Enable TLS for production
```

**ARCA/AFIP Integration**:
```bash
ARCA_ENVIRONMENT=production            # production or homologacion (testing)
ARCA_CERTIFICATE_PATH=/secrets/cert.p12   # Path to AFIP certificate
ARCA_CERTIFICATE_PASSPHRASE=secret     # Certificate password
ARCA_CUIT=20123456789                  # Company CUIT number
ARCA_TOKEN_CACHE_TTL=36000             # Token cache TTL in seconds (10 hours)
```

**Authentication**:
```bash
JWT_SECRET=your-secret-key-here        # JWT signing secret (min 32 chars)
JWT_EXPIRES_IN=7d                      # JWT expiration time
API_KEY_SALT=your-salt-here            # Salt for API key hashing
```

**Webhook Configuration**:
```bash
WEBHOOK_SECRET=your-webhook-secret     # HMAC secret for webhook signatures
WEBHOOK_MAX_RETRIES=5                  # Max retry attempts for failed webhooks
```

**Monitoring & Logging**:
```bash
LOG_LEVEL=info                         # debug, info, warn, error
SENTRY_DSN=https://...@sentry.io/...  # Sentry error tracking (optional)
```

**AI Service** (for Simple Mode):
```bash
OPENAI_API_KEY=sk-...                  # OpenAI API key for invoice generation
AI_MODEL=gpt-4                         # AI model to use
```

## Environment Setup

### Staging Environment

Staging environment is used for testing changes before production deployment. It should mirror production configuration but use ARCA homologation endpoints.

**Configure Railway Project (Staging)**:

```bash
# Login to Railway
railway login

# Link to staging project
railway link
# Select: arca-api-staging

# Set environment variables
railway variables set NODE_ENV=staging
railway variables set ARCA_ENVIRONMENT=homologacion
railway variables set DATABASE_URL=postgresql://...  # Staging database
railway variables set REDIS_URL=redis://...          # Staging Redis

# Verify variables are set
railway variables
```

**Deploy to Staging**:

```bash
# From project root
railway up --service arca-api

# Monitor deployment logs
railway logs --service arca-api --follow
```

**Staging URLs**:
- API: `https://arca-api-staging.up.railway.app`
- Health Check: `https://arca-api-staging.up.railway.app/health`

### Production Environment

Production environment serves live traffic and uses ARCA production endpoints.

**Configure Railway Project (Production)**:

```bash
# Link to production project
railway link
# Select: arca-api-production

# Set environment variables (CRITICAL: Use production values)
railway variables set NODE_ENV=production
railway variables set ARCA_ENVIRONMENT=production
railway variables set DATABASE_URL=postgresql://...  # Production database
railway variables set REDIS_URL=redis://...          # Production Redis
railway variables set DATABASE_SSL=true
railway variables set REDIS_TLS=true

# Verify variables are set correctly
railway variables
```

**Production URLs**:
- API: `https://api.arcaapi.com`
- Health Check: `https://api.arcaapi.com/health`

### AWS ECS Alternative (For Production Scaling)

For production environments requiring advanced scaling, use AWS ECS:

**Prerequisites**:
```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /

# Configure AWS credentials
aws configure
```

**Deploy to ECS**:
```bash
# Build and push Docker image
docker build -t arca-api:latest .
docker tag arca-api:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/arca-api:latest

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com

# Push image
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/arca-api:latest

# Update ECS service to use new image
aws ecs update-service \
  --cluster arca-production \
  --service arca-api \
  --force-new-deployment \
  --region us-east-1

# Monitor deployment
aws ecs describe-services \
  --cluster arca-production \
  --services arca-api \
  --region us-east-1
```

## Database Migrations

**CRITICAL**: Always run database migrations BEFORE deploying application code. Running migrations after code deployment can cause runtime errors if the code expects schema changes that haven't been applied yet.

### Migration Workflow

```
┌─────────────────────────────────────────┐
│  1. Backup Database (Production Only)  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  2. Run Migrations                      │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  3. Verify Schema Changes               │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  4. Deploy Application Code             │
└─────────────────────────────────────────┘
```

### Staging Migrations

```bash
# Connect to staging project
railway link
# Select: arca-api-staging

# Run migrations
railway run pnpm db:migrate

# Verify migrations succeeded
railway run pnpm db:migrate:status

# Expected output:
# ✓ Migration 001_create_users.sql applied
# ✓ Migration 002_create_invoices.sql applied
# ✓ All migrations up to date
```

### Production Migrations

**Step 1: Backup Database**

```bash
# Connect to production project
railway link
# Select: arca-api-production

# Create backup (Railway automatic backups)
# Railway creates automatic daily backups
# Manual backup if needed:
railway run pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Or use managed backup
railway backup create --service postgres
```

**Step 2: Run Migrations**

```bash
# Run production migrations
railway run pnpm db:migrate

# Monitor migration output carefully
# Look for any errors or warnings
```

**Step 3: Verify Migrations**

```bash
# Check migration status
railway run pnpm db:migrate:status

# Verify critical tables exist
railway run psql $DATABASE_URL -c "\dt"

# Check row counts (ensure no data loss)
railway run psql $DATABASE_URL -c "SELECT COUNT(*) FROM invoices;"
railway run psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
```

**Step 4: Rollback if Needed**

If migration fails or causes issues:

```bash
# Rollback last migration
railway run pnpm db:migrate:rollback

# Verify rollback succeeded
railway run pnpm db:migrate:status

# Restore from backup if necessary
railway run psql $DATABASE_URL < backup_20251019_120000.sql
```

### Migration Best Practices

**DO**:
- ✅ Always backup production database before migrations
- ✅ Test migrations in staging first
- ✅ Run migrations during low-traffic windows
- ✅ Monitor database CPU/memory during migrations
- ✅ Use `CREATE INDEX CONCURRENTLY` to avoid locking
- ✅ Keep migrations reversible with rollback scripts

**DON'T**:
- ❌ Never deploy code before running migrations
- ❌ Don't skip testing migrations in staging
- ❌ Don't run migrations during peak traffic hours
- ❌ Don't create indexes without CONCURRENTLY (locks table)
- ❌ Don't delete columns without backward compatibility period

## Deployment Procedures

### Staging Deployment

Staging deployments are automatic on merge to `main` branch (if auto-deploy enabled) or manual via Railway CLI.

**Manual Staging Deployment**:

```bash
# Step 1: Ensure you're on latest main branch
git checkout main
git pull origin main

# Step 2: Run migrations (if any)
railway link  # Select staging
railway run pnpm db:migrate

# Step 3: Deploy to Railway
railway up --service arca-api

# Step 4: Monitor deployment
railway logs --service arca-api --follow

# Step 5: Verify health checks (wait 30 seconds for startup)
curl https://arca-api-staging.up.railway.app/health

# Expected response:
# {
#   "status": "ok",
#   "environment": "staging",
#   "database": "connected",
#   "redis": "connected",
#   "uptime": 45
# }
```

**Staging Deployment via GitHub Actions** (if configured):

```bash
# Push to main branch
git push origin main

# GitHub Actions workflow triggers automatically
# Monitor at: https://github.com/your-org/arca-api/actions

# Workflow steps:
# 1. Run tests
# 2. Build Docker image
# 3. Deploy to Railway staging
# 4. Run smoke tests
# 5. Notify team on Slack
```

### Production Deployment

Production deployments require manual approval to prevent accidental releases.

**Recommended Approach: GitHub Actions with Manual Approval**

**Step 1: Create Release Tag**

```bash
# Ensure main branch is ready for production
git checkout main
git pull origin main

# Create version tag (semantic versioning)
git tag -a v1.2.0 -m "Release v1.2.0: Add webhook retry improvements"

# Push tag to trigger deployment workflow
git push origin v1.2.0
```

**Step 2: Manual Approval in GitHub Actions**

```bash
# Navigate to GitHub Actions
# https://github.com/your-org/arca-api/actions

# Find the deployment workflow run
# Click "Review deployments"
# Select "production" environment
# Click "Approve and deploy"
```

**Step 3: Monitor Deployment**

```bash
# Watch GitHub Actions logs
# Or monitor via Railway:

railway link  # Select production
railway logs --service arca-api --follow
```

**Alternative: Manual Railway Deployment**

For urgent hotfixes or when GitHub Actions is unavailable:

```bash
# Step 1: Run migrations (if any)
railway link  # Select production
railway run pnpm db:migrate

# Step 2: Deploy to Railway
railway up --service arca-api --detach

# Step 3: Monitor deployment
railway logs --service arca-api --follow

# Step 4: Verify health checks
curl https://api.arcaapi.com/health

# Step 5: Run smoke tests
curl -X POST https://api.arcaapi.com/v1/invoices \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"description": "Test invoice", "amount": 100}'

# Expected: 201 Created with invoice ID
```

**Production Deployment Checklist**: See [Deployment Checklist](#deployment-checklist) section below.

## Deployment Workflow

The following diagram illustrates the complete deployment workflow from code merge to production release:

```mermaid
flowchart TB
    A[Code Merged to Main] --> B[CI: Run Tests]
    B --> C{Tests Pass?}
    C -->|No| D[Notify Team<br/>Block Deployment]
    C -->|Yes| E[CI: Build Docker Image]
    E --> F[Deploy to Staging]
    F --> G[Run Database Migrations<br/>Staging]
    G --> H[Deploy Application Code<br/>Staging]
    H --> I[Smoke Tests on Staging]
    I --> J{Smoke Tests Pass?}
    J -->|No| K[Rollback Staging<br/>Alert Team]
    J -->|Yes| L[Manual Approval Gate<br/>Production Deployment]
    L --> M{Approved?}
    M -->|No| N[Deployment Cancelled]
    M -->|Yes| O[Backup Production Database]
    O --> P[Run Database Migrations<br/>Production]
    P --> Q{Migrations Success?}
    Q -->|No| R[Rollback Migration<br/>Restore Backup<br/>Alert Team]
    Q -->|Yes| S[Deploy Application Code<br/>Production]
    S --> T[Health Checks]
    T --> U{Health Checks Pass?}
    U -->|No| V[Auto-Rollback to Previous Version<br/>Alert On-Call]
    U -->|Yes| W[Verify Critical Endpoints]
    W --> X{Endpoints Healthy?}
    X -->|No| V
    X -->|Yes| Y[Deployment Complete<br/>Notify Team]

    style D fill:#f88,stroke:#c00
    style K fill:#f88,stroke:#c00
    style R fill:#f88,stroke:#c00
    style V fill:#f88,stroke:#c00
    style Y fill:#8f8,stroke:#0c0
```

**Workflow Stages Explained**:

1. **CI Tests** (1-3 minutes): Run unit tests, integration tests, linting
2. **Build Image** (2-5 minutes): Build Docker image with new code
3. **Staging Deployment** (3-5 minutes): Deploy to staging environment
4. **Smoke Tests** (1-2 minutes): Verify critical endpoints work
5. **Manual Approval** (Variable): Team lead or DevOps approves production deployment
6. **Database Backup** (1-5 minutes): Create production database snapshot
7. **Production Migration** (1-10 minutes): Apply schema changes
8. **Production Deployment** (3-5 minutes): Deploy new application code
9. **Health Checks** (1-2 minutes): Verify all services are healthy
10. **Verification** (2-5 minutes): Test critical endpoints with real requests

**Total Deployment Time**: 15-45 minutes (depends on manual approval timing)

## Health Checks

Health check endpoints verify that the application and its dependencies are functioning correctly after deployment.

### Primary Health Check

**Endpoint**: `GET /health`

```bash
# Check application health
curl https://api.arcaapi.com/health

# Expected response (200 OK):
{
  "status": "ok",
  "environment": "production",
  "version": "1.2.0",
  "uptime": 3600,
  "timestamp": "2025-10-19T17:30:00Z",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

**Error Response** (503 Service Unavailable):
```json
{
  "status": "unhealthy",
  "environment": "production",
  "errors": [
    {
      "service": "database",
      "status": "disconnected",
      "message": "Connection pool exhausted"
    }
  ]
}
```

### ARCA Connection Check

**Endpoint**: `GET /health/arca`

Tests connectivity to ARCA/AFIP government services.

```bash
# Check ARCA connectivity
curl https://api.arcaapi.com/health/arca

# Expected response (200 OK):
{
  "status": "ok",
  "arca_reachable": true,
  "arca_environment": "production",
  "token_cached": true,
  "last_auth_success": "2025-10-19T15:30:00Z",
  "response_time_ms": 850
}
```

**Error Response** (503 Service Unavailable):
```json
{
  "status": "unhealthy",
  "arca_reachable": false,
  "error": "ARCA authentication timeout after 5000ms",
  "retry_recommended": true
}
```

### Database Health Check

**Endpoint**: `GET /health/database`

```bash
# Detailed database health check
curl https://api.arcaapi.com/health/database

# Expected response (200 OK):
{
  "status": "ok",
  "connection": "established",
  "pool": {
    "total": 20,
    "idle": 15,
    "active": 5
  },
  "latency_ms": 12,
  "last_query": "2025-10-19T17:29:45Z"
}
```

### Redis Health Check

**Endpoint**: `GET /health/redis`

```bash
# Check Redis connectivity and performance
curl https://api.arcaapi.com/health/redis

# Expected response (200 OK):
{
  "status": "ok",
  "connection": "established",
  "latency_ms": 3,
  "memory_used_mb": 128,
  "memory_max_mb": 512,
  "hit_rate": 0.92,
  "keys_count": 1547
}
```

### Automated Health Check Script

Use this script to verify all health checks after deployment:

```bash
#!/bin/bash
# health-check.sh - Post-deployment health verification

API_URL=${1:-https://api.arcaapi.com}
FAILED=0

echo "Running health checks on $API_URL..."
echo ""

# Primary health check
echo "1. Primary Health Check..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/health)
if [ $HTTP_CODE -eq 200 ]; then
  echo "   ✓ Primary health: OK ($HTTP_CODE)"
else
  echo "   ✗ Primary health: FAILED ($HTTP_CODE)"
  FAILED=$((FAILED + 1))
fi

# Database health check
echo "2. Database Health Check..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/health/database)
if [ $HTTP_CODE -eq 200 ]; then
  echo "   ✓ Database: OK ($HTTP_CODE)"
else
  echo "   ✗ Database: FAILED ($HTTP_CODE)"
  FAILED=$((FAILED + 1))
fi

# Redis health check
echo "3. Redis Health Check..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/health/redis)
if [ $HTTP_CODE -eq 200 ]; then
  echo "   ✓ Redis: OK ($HTTP_CODE)"
else
  echo "   ✗ Redis: FAILED ($HTTP_CODE)"
  FAILED=$((FAILED + 1))
fi

# ARCA health check
echo "4. ARCA Connection Check..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/health/arca)
if [ $HTTP_CODE -eq 200 ]; then
  echo "   ✓ ARCA: OK ($HTTP_CODE)"
else
  echo "   ✗ ARCA: FAILED ($HTTP_CODE)"
  FAILED=$((FAILED + 1))
fi

echo ""
if [ $FAILED -eq 0 ]; then
  echo "All health checks passed ✓"
  exit 0
else
  echo "$FAILED health check(s) failed ✗"
  exit 1
fi
```

**Usage**:
```bash
# Make script executable
chmod +x health-check.sh

# Run against production
./health-check.sh https://api.arcaapi.com

# Run against staging
./health-check.sh https://arca-api-staging.up.railway.app
```

## Rollback Procedures

If a deployment causes issues, follow these procedures to rollback to the previous working version.

### Immediate Rollback (Railway)

**Scenario**: Deployment completed but application is unhealthy or has critical bugs.

```bash
# Step 1: Connect to production environment
railway link
# Select: arca-api-production

# Step 2: Rollback to previous deployment
railway rollback

# Step 3: Monitor rollback logs
railway logs --service arca-api --follow

# Step 4: Verify health checks
curl https://api.arcaapi.com/health

# Expected: status "ok" from previous version
```

**Rollback Time**: 2-3 minutes

### Rollback via Railway Dashboard

1. Open Railway dashboard: https://railway.app/dashboard
2. Navigate to `arca-api-production` project
3. Click on `arca-api` service
4. Go to "Deployments" tab
5. Find the last stable deployment (marked with ✓)
6. Click "Redeploy" on that version
7. Confirm deployment
8. Monitor logs and health checks

### Database Migration Rollback

**Scenario**: Migration caused issues and needs to be reverted.

```bash
# Step 1: Rollback last migration
railway run pnpm db:migrate:rollback

# Step 2: Verify schema changes reverted
railway run pnpm db:migrate:status

# Step 3: If rollback fails, restore from backup
railway run psql $DATABASE_URL < backup_20251019_120000.sql

# Step 4: Verify data integrity
railway run psql $DATABASE_URL -c "SELECT COUNT(*) FROM invoices;"
```

### AWS ECS Rollback

For production deployments on AWS ECS:

```bash
# Step 1: List recent task definitions
aws ecs list-task-definitions \
  --family-prefix arca-api \
  --sort DESC \
  --max-items 5 \
  --region us-east-1

# Step 2: Rollback to previous task definition
aws ecs update-service \
  --cluster arca-production \
  --service arca-api \
  --task-definition arca-api:PREVIOUS_VERSION \
  --region us-east-1

# Step 3: Monitor rollback
aws ecs describe-services \
  --cluster arca-production \
  --services arca-api \
  --query 'services[0].deployments' \
  --region us-east-1

# Step 4: Wait for rollback to complete
aws ecs wait services-stable \
  --cluster arca-production \
  --services arca-api \
  --region us-east-1

# Step 5: Verify health
curl https://api.arcaapi.com/health
```

### Emergency Rollback (Circuit Breaker)

If rollback will take too long and service must be restored immediately:

```bash
# Enable maintenance mode (returns 503 with Retry-After header)
railway variables set MAINTENANCE_MODE=true

# Rollback application
railway rollback

# Disable maintenance mode after rollback completes
railway variables set MAINTENANCE_MODE=false
```

### Post-Rollback Actions

After successful rollback:

1. **Notify Team**: Alert on Slack/Discord that rollback occurred
2. **Create Incident**: Document the issue in incident tracking system
3. **Root Cause Analysis**: Investigate what caused the need to rollback
4. **Fix Forward**: Create a fix in development and test thoroughly
5. **Post-Mortem**: Schedule post-mortem meeting if SEV1 or SEV2

## Deployment Checklist

Use this checklist before every production deployment to prevent common mistakes.

### Pre-Deployment Checklist

**Code & Tests**:
- [ ] All tests passing in CI/CD pipeline
- [ ] Code reviewed and approved by at least one team member
- [ ] No `console.log` or debug statements in production code
- [ ] Environment-specific configurations verified (staging vs production)
- [ ] Version number updated in `package.json`

**Database**:
- [ ] Database migrations tested in staging environment
- [ ] Migration rollback scripts prepared and tested
- [ ] Production database backup created (automatic or manual)
- [ ] Migration estimated time calculated (check for long-running queries)
- [ ] Indexes created with `CONCURRENTLY` to avoid locking

**Infrastructure**:
- [ ] Railway/AWS credentials are valid and not expired
- [ ] All required environment variables set in production
- [ ] ARCA certificate valid and not expiring soon (check expiration date)
- [ ] SSL/TLS certificates valid for API domain
- [ ] Secrets rotated if needed (API keys, JWT secrets)

**Dependencies**:
- [ ] No breaking changes in updated dependencies
- [ ] Security vulnerabilities addressed (`pnpm audit`)
- [ ] Production dependencies only (no dev dependencies in build)

**Documentation**:
- [ ] CHANGELOG.md updated with release notes
- [ ] Breaking changes documented in API documentation
- [ ] Runbooks updated if new failure modes introduced

**Communication**:
- [ ] Team notified of deployment window
- [ ] Customers notified if downtime expected (via status page)
- [ ] On-call engineer available during deployment

### During Deployment Checklist

- [ ] Monitor deployment logs for errors
- [ ] Database migration completed successfully
- [ ] Application started without errors
- [ ] Health checks returning 200 OK
- [ ] ARCA connectivity test passing
- [ ] Redis connection established
- [ ] Database connection pool healthy

### Post-Deployment Checklist

- [ ] Primary health check passing (`/health`)
- [ ] ARCA health check passing (`/health/arca`)
- [ ] Database health check passing (`/health/database`)
- [ ] Redis health check passing (`/health/redis`)
- [ ] Smoke test passed (create test invoice)
- [ ] Error rate <0.1% (check monitoring dashboard)
- [ ] P95 latency within SLA (<200ms excluding ARCA)
- [ ] No critical errors in logs (Sentry/CloudWatch)
- [ ] Team notified of successful deployment
- [ ] Deployment tagged in git (`v1.2.0`)

### Rollback Decision Criteria

Rollback immediately if:

- ❌ Health checks failing for >2 minutes
- ❌ Error rate >5% for >1 minute
- ❌ P95 latency >5 seconds for >1 minute
- ❌ ARCA integration completely broken (0% success rate)
- ❌ Database migration failed and cannot be fixed forward
- ❌ Critical security vulnerability introduced
- ❌ Data loss or corruption detected

Consider rollback if:

- ⚠️ Error rate >2% for >5 minutes
- ⚠️ P95 latency >3 seconds for >5 minutes
- ⚠️ Non-critical features broken
- ⚠️ Memory leak detected (but not immediately critical)

## Troubleshooting

### Common Deployment Issues

#### Issue: Health Checks Failing After Deployment

**Symptoms**:
```bash
curl https://api.arcaapi.com/health
# 503 Service Unavailable
```

**Diagnosis**:
```bash
# Check application logs
railway logs --service arca-api --tail 100

# Common causes:
# - Database connection failed (check DATABASE_URL)
# - Redis connection failed (check REDIS_URL)
# - Application crashed on startup (check for errors)
```

**Resolution**:
```bash
# Verify environment variables are set
railway variables

# Test database connection
railway run psql $DATABASE_URL -c "SELECT 1;"

# Test Redis connection
railway run redis-cli -u $REDIS_URL ping

# If variables missing, set them:
railway variables set DATABASE_URL=postgresql://...

# Redeploy after fixing
railway up --service arca-api
```

#### Issue: Database Migration Failed

**Symptoms**:
```bash
railway run pnpm db:migrate
# Error: relation "new_table" already exists
```

**Diagnosis**:
```bash
# Check migration status
railway run pnpm db:migrate:status

# Check if migration partially applied
railway run psql $DATABASE_URL -c "\d new_table"
```

**Resolution**:
```bash
# Option 1: Rollback and re-run
railway run pnpm db:migrate:rollback
railway run pnpm db:migrate

# Option 2: Restore from backup
railway run psql $DATABASE_URL < backup_20251019_120000.sql
```

#### Issue: ARCA Authentication Failing

**Symptoms**:
```bash
curl https://api.arcaapi.com/health/arca
# {"status": "unhealthy", "error": "ARCA authentication failed"}
```

**Diagnosis**:
```bash
# Check ARCA certificate is set
railway variables | grep ARCA_CERTIFICATE

# Check certificate expiration
railway run openssl pkcs12 -in $ARCA_CERTIFICATE_PATH -nokeys -passin pass:$ARCA_CERTIFICATE_PASSPHRASE | openssl x509 -noout -dates

# Verify CUIT matches certificate
railway variables | grep ARCA_CUIT
```

**Resolution**:
```bash
# Upload new certificate if expired
railway run --service arca-api

# Set certificate path
railway variables set ARCA_CERTIFICATE_PATH=/secrets/new_cert.p12
railway variables set ARCA_CERTIFICATE_PASSPHRASE=new_password

# Restart service
railway restart --service arca-api
```

#### Issue: Deployment Stuck or Timeout

**Symptoms**:
- Deployment shows "Building..." for >10 minutes
- No logs appearing in Railway dashboard

**Diagnosis**:
```bash
# Check Railway status
railway status

# Check if previous deployment is still running
railway ps
```

**Resolution**:
```bash
# Cancel stuck deployment
# In Railway dashboard: Go to deployment and click "Cancel"

# Or force new deployment
railway up --service arca-api --detach
```

#### Issue: High Memory Usage After Deployment

**Symptoms**:
- Memory usage climbing steadily
- Application becomes slow over time
- Eventually crashes with "Out of Memory"

**Diagnosis**:
```bash
# Monitor memory usage
railway logs --service arca-api --follow | grep "memory"

# Check for memory leaks in recent code changes
# Review database connection handling
# Review Redis client usage
```

**Resolution**:
```bash
# Immediate: Restart service to free memory
railway restart --service arca-api

# Long-term: Fix memory leak and redeploy
# Common causes:
# - Not closing database connections
# - Growing arrays/caches without limits
# - Event listeners not being removed
```

### Getting Help

If deployment issues persist:

1. **Check Documentation**:
   - [Architecture - Infrastructure](../architecture/04-infrastructure.md)
   - [Operations - Monitoring](./monitoring.md)
   - [Runbooks](./runbooks/README.md)

2. **Review Logs**:
   - Railway: `railway logs --service arca-api --follow`
   - Sentry: Check error tracking dashboard
   - CloudWatch: Check application logs (if using AWS)

3. **Contact Team**:
   - Slack: `#engineering` or `#devops` channel
   - On-call: Page DevOps engineer via PagerDuty
   - Emergency: Escalate to Tech Lead or CTO

4. **Create Incident**:
   - Document issue in incident tracking system
   - Follow [Incident Response](./incident-response.md) procedures
   - Schedule post-mortem if SEV1 or SEV2

---

**Last Updated**: 2025-10-19
**Version**: 1.0.0
**Maintained By**: DevOps Team
**Next Review**: 2025-11-19
