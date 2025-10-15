# Local Development Setup Guide

Complete guide for setting up your local ARCA API development environment. Follow these steps to go from zero to a fully running development environment in under 1 hour.

**Estimated Total Time**: 45-60 minutes

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Redis Setup](#redis-setup)
- [Development Servers](#development-servers)
- [Testing Setup](#testing-setup)
- [ARCA Certificates](#arca-certificates)
- [Troubleshooting](#troubleshooting)
- [Next Steps](#next-steps)

## Prerequisites

**Time Estimate**: 15-20 minutes (if installing from scratch)

### Required Software

#### 1. Node.js 20+ (with nvm)

We use Node.js 20 LTS for the backend API and dashboard. We recommend using nvm (Node Version Manager) for easy Node.js version management.

**Install nvm** (if not already installed):
```bash
# macOS/Linux
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart your terminal or run:
source ~/.bashrc  # or ~/.zshrc for zsh
```

**Install and use Node.js 20**:
```bash
# Install Node.js 20
nvm install 20

# Set as default
nvm alias default 20

# Use Node.js 20
nvm use 20

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

#### 2. pnpm (Package Manager)

We use pnpm for faster and more efficient package management.

```bash
# Install pnpm globally
npm install -g pnpm

# Verify installation
pnpm --version  # Should show 8.x.x or higher
```

#### 3. Python 3.11+ (for AI Service)

The AI service requires Python 3.11 or higher.

```bash
# macOS (using Homebrew)
brew install python@3.11

# Ubuntu/Debian
sudo apt update
sudo apt install python3.11 python3.11-venv python3-pip

# Verify installation
python3.11 --version  # Should show Python 3.11.x
pip3 --version        # Should show pip 23.x.x
```

#### 4. Docker & Docker Compose

Docker is used for running PostgreSQL and Redis locally.

**macOS**:
```bash
# Install Docker Desktop from https://www.docker.com/products/docker-desktop
# Or using Homebrew:
brew install --cask docker

# Start Docker Desktop application
```

**Linux (Ubuntu/Debian)**:
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin

# Add your user to docker group (to avoid sudo)
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker compose version
```

#### 5. Git

```bash
# macOS
brew install git

# Ubuntu/Debian
sudo apt install git

# Verify installation
git --version  # Should show 2.x.x
```

#### 6. VS Code (Recommended)

We recommend VS Code with the following extensions:

```bash
# Install VS Code from https://code.visualstudio.com/

# Or using CLI (macOS)
brew install --cask visual-studio-code
```

**Recommended Extensions**:
- ESLint (dbaeumer.vscode-eslint)
- Prettier (esbenp.prettier-vscode)
- TypeScript (built-in)
- Docker (ms-azuretools.vscode-docker)
- GitLens (eamodio.gitlens)
- Thunder Client (rangav.vscode-thunder-client) - API testing
- Markdown All in One (yzhang.markdown-all-in-one)

Install extensions via VS Code Command Palette (`Cmd/Ctrl + Shift + P`):
```
ext install dbaeumer.vscode-eslint
ext install esbenp.prettier-vscode
ext install ms-azuretools.vscode-docker
ext install eamodio.gitlens
ext install rangav.vscode-thunder-client
ext install yzhang.markdown-all-in-one
```

---

## Clone Repository

**Time Estimate**: 2-3 minutes

```bash
# Clone the repository
git clone https://github.com/lorenzotomasdiez/ArcAPI.git
cd ArcAPI

# Verify you're on the correct branch
git branch  # Should show 'main' or 'develop'

# Install dependencies
pnpm install

# This may take 3-5 minutes depending on your internet connection
```

---

## Environment Configuration

**Time Estimate**: 5 minutes

### 1. Create .env File

Copy the example environment file and configure it:

```bash
# Copy the example file
cp .env.example .env

# Open in your editor
code .env  # or nano .env, vim .env, etc.
```

### 2. Required Environment Variables

Update your `.env` file with the following configuration:

```bash
# ============================================
# Application
# ============================================
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3001

# ============================================
# Database
# ============================================
DATABASE_URL=postgresql://arca_user:arca_password@localhost:5432/arca_dev
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# ============================================
# Redis
# ============================================
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
REDIS_DB=0

# ============================================
# Authentication
# ============================================
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d
API_KEY_SALT_ROUNDS=10

# ============================================
# ARCA/AFIP Configuration
# ============================================
# Use 'homologacion' for testing, 'production' for live
ARCA_ENVIRONMENT=homologacion
ARCA_HOMOLOGACION_URL=https://wswhomo.afip.gov.ar/wsfev1/service.asmx
ARCA_PRODUCTION_URL=https://servicios1.afip.gov.ar/wsfev1/service.asmx

# AFIP Authentication (WSAA)
ARCA_WSAA_HOMOLOGACION_URL=https://wsaahomo.afip.gov.ar/ws/services/LoginCms
ARCA_WSAA_PRODUCTION_URL=https://wsaa.afip.gov.ar/ws/services/LoginCms
ARCA_TOKEN_EXPIRY_HOURS=12

# Test CUIT (for homologación)
ARCA_TEST_CUIT=20123456789

# Certificate paths (will configure in ARCA Certificates section)
ARCA_CERT_PATH=./certs/test-cert.crt
ARCA_KEY_PATH=./certs/test-key.key
ARCA_CERT_PASSPHRASE=

# ============================================
# AI Service (Optional for local development)
# ============================================
# Leave blank to use mock AI service locally
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4-turbo
AI_SERVICE_URL=http://localhost:8000

# ============================================
# Email (Optional for local development)
# ============================================
# Leave blank to use console logging locally
SENDGRID_API_KEY=
EMAIL_FROM=noreply@arcaapi.com
EMAIL_ENABLED=false

# ============================================
# File Storage (Optional for local development)
# ============================================
# Use 'local' for development
STORAGE_PROVIDER=local
STORAGE_LOCAL_PATH=./storage
AWS_S3_BUCKET=
AWS_S3_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# ============================================
# Logging
# ============================================
LOG_LEVEL=debug
LOG_FORMAT=json
LOG_FILE_PATH=./logs/app.log

# ============================================
# Rate Limiting
# ============================================
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_ENABLED=true

# ============================================
# Feature Flags (Optional)
# ============================================
FEATURE_AI_INVOICING=false
FEATURE_WEBHOOKS=true
FEATURE_ANALYTICS=true
```

### 3. Generate JWT Secret

For development, generate a secure JWT secret:

```bash
# Generate a random secret (macOS/Linux)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Copy the output and paste it into your .env file for JWT_SECRET
```

---

## Database Setup

**Time Estimate**: 5-7 minutes

### Option 1: Docker (Recommended)

Start PostgreSQL using Docker:

```bash
# Start PostgreSQL container
docker run -d \
  --name arca-postgres \
  -e POSTGRES_USER=arca_user \
  -e POSTGRES_PASSWORD=arca_password \
  -e POSTGRES_DB=arca_dev \
  -p 5432:5432 \
  -v arca_postgres_data:/var/lib/postgresql/data \
  postgres:15

# Verify container is running
docker ps | grep arca-postgres

# Check logs (should show "database system is ready to accept connections")
docker logs arca-postgres
```

### Option 2: Local PostgreSQL Installation

If you prefer to install PostgreSQL locally:

**macOS**:
```bash
brew install postgresql@15
brew services start postgresql@15

# Create database and user
psql postgres -c "CREATE USER arca_user WITH PASSWORD 'arca_password';"
psql postgres -c "CREATE DATABASE arca_dev OWNER arca_user;"
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE arca_dev TO arca_user;"
```

**Ubuntu/Debian**:
```bash
sudo apt install postgresql-15
sudo systemctl start postgresql

# Create database and user
sudo -u postgres psql -c "CREATE USER arca_user WITH PASSWORD 'arca_password';"
sudo -u postgres psql -c "CREATE DATABASE arca_dev OWNER arca_user;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE arca_dev TO arca_user;"
```

### Run Database Migrations

```bash
# Run migrations to create tables
pnpm db:migrate

# Expected output:
# ✓ Running migrations...
# ✓ Migration 001_initial_schema completed
# ✓ Migration 002_add_invoices_table completed
# ✓ All migrations completed successfully
```

### Seed Test Data (Optional)

```bash
# Seed database with test data
pnpm db:seed

# Expected output:
# ✓ Seeding database...
# ✓ Created 5 test users
# ✓ Created 20 test invoices
# ✓ Seeding completed successfully

# Test data includes:
# - 5 user accounts (test1@example.com to test5@example.com)
# - 20 sample invoices in various states
# - 3 test points of sale
# - Sample webhook configurations
```

### Verify Database Setup

```bash
# Test database connection
pnpm db:test

# Expected output:
# ✓ Database connection successful
# ✓ Database version: PostgreSQL 15.x
# ✓ Tables: 15 tables found
```

---

## Redis Setup

**Time Estimate**: 2-3 minutes

### Start Redis with Docker

```bash
# Start Redis container
docker run -d \
  --name arca-redis \
  -p 6379:6379 \
  -v arca_redis_data:/data \
  redis:7

# Verify container is running
docker ps | grep arca-redis

# Test Redis connection
docker exec -it arca-redis redis-cli ping
# Expected output: PONG
```

### Alternative: Local Redis Installation

**macOS**:
```bash
brew install redis
brew services start redis

# Test connection
redis-cli ping  # Expected: PONG
```

**Ubuntu/Debian**:
```bash
sudo apt install redis-server
sudo systemctl start redis-server

# Test connection
redis-cli ping  # Expected: PONG
```

---

## Development Servers

**Time Estimate**: 5 minutes

### Start All Services with Docker Compose (Recommended)

If you prefer to use Docker Compose for all services:

```bash
# Start all services (API, Dashboard, PostgreSQL, Redis)
docker compose up -d

# View logs
docker compose logs -f

# Stop all services
docker compose down
```

### Start Services Individually

Open multiple terminal windows/tabs for each service:

#### Terminal 1: API Server

```bash
# Start the API server
pnpm dev:api

# Expected output:
# 🚀 ARCA API Server starting...
# ✓ Database connected
# ✓ Redis connected
# 🌐 Server listening on http://localhost:3000
# 📝 API Documentation: http://localhost:3000/docs
```

#### Terminal 2: Dashboard (Frontend)

```bash
# Start the dashboard
pnpm dev:dashboard

# Expected output:
# ▲ Next.js 14.x.x
# - Local:        http://localhost:3001
# - Network:      http://192.168.x.x:3001
# ✓ Ready in 2.5s
```

#### Terminal 3: AI Service (Optional)

If you want to test AI features locally:

```bash
# Navigate to AI service directory
cd services/ai-service

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start AI service
python main.py

# Expected output:
# INFO:     Started server process
# INFO:     Uvicorn running on http://127.0.0.1:8000
```

### Verify Services are Running

```bash
# Test API health endpoint
curl http://localhost:3000/health

# Expected output:
# {
#   "status": "ok",
#   "timestamp": "2025-10-15T12:00:00.000Z",
#   "services": {
#     "database": "connected",
#     "redis": "connected",
#     "arca": "available"
#   }
# }

# Test Dashboard
curl http://localhost:3001

# Should return HTML (or just open http://localhost:3001 in browser)
```

---

## Testing Setup

**Time Estimate**: 5 minutes

### Run Test Suite

```bash
# Run all tests
pnpm test

# Expected output:
# PASS tests/unit/InvoiceService.test.ts
# PASS tests/unit/AFIPAdapter.test.ts
# PASS tests/integration/invoice-api.test.ts
# 
# Test Suites: 15 passed, 15 total
# Tests:       127 passed, 127 total
# Coverage:    84.5%
```

### Run Specific Test Types

```bash
# Unit tests only (fast, no external dependencies)
pnpm test:unit

# Integration tests (requires database and Redis)
pnpm test:integration

# E2E tests (requires all services running)
pnpm test:e2e

# Run with coverage report
pnpm test:coverage

# Coverage report will be available at: coverage/index.html
```

### Test ARCA Connection

Verify connection to ARCA homologación environment:

```bash
# Test ARCA connection
pnpm test:arca-connection

# Expected output:
# ✓ Connecting to ARCA homologación...
# ✓ WSAA authentication successful
# ✓ WSFEV1 service available
# ✓ Token expiry: 2025-10-16T00:00:00.000Z (12 hours)
# 
# Connection successful! You're ready to create test invoices.
```

If connection fails, verify:
1. ARCA_HOMOLOGACION_URL is correct in .env
2. ARCA certificates are properly configured (see next section)
3. Your network allows HTTPS connections to wswhomo.afip.gov.ar

---

## ARCA Certificates

**Time Estimate**: 10 minutes

### Understanding ARCA Certificates

ARCA/AFIP requires X.509 certificates for authentication. For local development and testing, you'll use homologación (testing) certificates.

### Obtain Homologación Certificates

**Option 1: Use Test Certificates (Quick Start)**

We provide test certificates for local development:

```bash
# Create certs directory
mkdir -p certs

# Download test certificates
curl -o certs/test-cert.crt https://www.afip.gob.ar/ws/documentacion/certificados/homologacion.crt
curl -o certs/test-key.key https://www.afip.gob.ar/ws/documentacion/certificados/homologacion.key

# Update .env file with certificate paths (already configured above)
# ARCA_CERT_PATH=./certs/test-cert.crt
# ARCA_KEY_PATH=./certs/test-key.key
```

**Option 2: Generate Your Own Test Certificates**

For more realistic testing, generate your own certificate:

```bash
# Create certs directory
mkdir -p certs

# Generate private key
openssl genrsa -out certs/test-key.key 2048

# Generate certificate signing request (CSR)
openssl req -new -key certs/test-key.key -out certs/test-csr.csr

# Generate self-signed certificate
openssl x509 -req -days 365 -in certs/test-csr.csr \
  -signkey certs/test-key.key -out certs/test-cert.crt

# Update .env file paths if needed
```

**Option 3: Official AFIP Homologación Certificate**

For official testing with AFIP's homologación environment:

1. Visit [AFIP Homologación Portal](https://www.afip.gob.ar/ws/documentacion/default.asp)
2. Request a homologación certificate using your test CUIT
3. Download the certificate (.crt) and private key (.key)
4. Place files in `certs/` directory
5. Update .env file paths

### Verify Certificate Setup

```bash
# Verify certificate is valid
openssl x509 -in certs/test-cert.crt -text -noout

# Test WSAA authentication with certificate
pnpm test:wsaa-auth

# Expected output:
# ✓ Certificate loaded successfully
# ✓ Private key loaded successfully
# ✓ WSAA authentication successful
# ✓ Token generated (valid for 12 hours)
```

### Certificate Security Notes

- Never commit real certificates to git
- `.gitignore` already excludes `certs/` directory
- For production, use proper certificate management (Vault, AWS Secrets Manager)
- Rotate certificates before expiry

---

## Troubleshooting

### Common Issues and Solutions

#### 1. PostgreSQL Connection Refused

**Error**:
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions**:
```bash
# Check if PostgreSQL is running
docker ps | grep arca-postgres
# or (if local installation)
brew services list | grep postgresql

# Restart PostgreSQL container
docker restart arca-postgres

# Check logs for errors
docker logs arca-postgres

# Verify port 5432 is not in use
lsof -i :5432
```

#### 2. Redis Connection Timeout

**Error**:
```
Error: Redis connection timeout
```

**Solutions**:
```bash
# Check if Redis is running
docker ps | grep arca-redis

# Restart Redis container
docker restart arca-redis

# Test Redis connection
redis-cli ping

# Verify port 6379 is not in use
lsof -i :6379
```

#### 3. Module Not Found Errors

**Error**:
```
Error: Cannot find module 'express'
```

**Solutions**:
```bash
# Reinstall dependencies
rm -rf node_modules
pnpm install

# Clear pnpm cache if issues persist
pnpm store prune
pnpm install
```

#### 4. ARCA SOAP Errors

**Error**:
```
Error: ARCA SOAP request failed - Invalid certificate
```

**Solutions**:
```bash
# Verify certificate paths in .env
cat .env | grep ARCA_CERT

# Check certificate is readable
ls -l certs/test-cert.crt
cat certs/test-cert.crt

# Verify using homologación URL, not production
cat .env | grep ARCA_ENVIRONMENT
# Should show: ARCA_ENVIRONMENT=homologacion

# Test WSAA authentication
pnpm test:wsaa-auth
```

#### 5. Port Already in Use

**Error**:
```
Error: Port 3000 is already in use
```

**Solutions**:
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change port in .env
# PORT=3001
```

#### 6. Database Migration Failures

**Error**:
```
Error: Migration failed - relation already exists
```

**Solutions**:
```bash
# Rollback migrations
pnpm db:rollback

# Reset database (WARNING: destroys all data)
pnpm db:reset

# Run migrations again
pnpm db:migrate
```

#### 7. Docker Permission Denied

**Error**:
```
Error: permission denied while trying to connect to Docker daemon
```

**Solutions**:
```bash
# Add user to docker group (Linux)
sudo usermod -aG docker $USER
newgrp docker

# Or start Docker Desktop (macOS)
open -a Docker
```

#### 8. Python AI Service Errors

**Error**:
```
ModuleNotFoundError: No module named 'fastapi'
```

**Solutions**:
```bash
# Activate virtual environment
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt

# Verify Python version
python --version  # Should be 3.11+
```

---

## Verification Checklist

Before you start coding, verify everything is working:

```bash
# 1. Check Node.js and pnpm versions
node --version   # v20.x.x
pnpm --version   # 8.x.x

# 2. Check Docker containers are running
docker ps | grep arca-

# 3. Test database connection
pnpm db:test

# 4. Test Redis connection
redis-cli ping  # or docker exec -it arca-redis redis-cli ping

# 5. Verify API server
curl http://localhost:3000/health

# 6. Verify Dashboard
curl http://localhost:3001  # or open in browser

# 7. Run tests
pnpm test:unit

# 8. Test ARCA connection
pnpm test:arca-connection
```

If all checks pass, you're ready to start developing!

---

## Next Steps

Now that your environment is set up:

1. **Review Architecture**: Read [Architecture Overview](../architecture/README.md) to understand the system
2. **Check Coding Standards**: Review [Coding Standards](./coding-standards.md) for code style guidelines
3. **Understand Testing**: Read [Testing Strategy](./testing-strategy.md) for test approach
4. **Explore API Specs**: Check [API Specifications](../specifications/api/README.md) for API contracts
5. **Review Flows**: See [System Flows](../flows/README.md) to understand how the system works

### Useful Development Commands

```bash
# Development
pnpm dev              # Start all services
pnpm dev:api          # Start API only
pnpm dev:dashboard    # Start dashboard only

# Testing
pnpm test             # Run all tests
pnpm test:unit        # Run unit tests
pnpm test:integration # Run integration tests
pnpm test:e2e         # Run E2E tests
pnpm test:coverage    # Run with coverage

# Database
pnpm db:migrate       # Run migrations
pnpm db:rollback      # Rollback last migration
pnpm db:seed          # Seed test data
pnpm db:reset         # Reset database (WARNING: destroys data)
pnpm db:test          # Test connection

# Code Quality
pnpm lint             # Run ESLint
pnpm format           # Run Prettier
pnpm typecheck        # TypeScript type checking
pnpm check            # Run all checks (lint + format + typecheck)

# Build
pnpm build            # Build for production
pnpm build:api        # Build API only
pnpm build:dashboard  # Build dashboard only

# Docker
docker compose up -d         # Start all services
docker compose down          # Stop all services
docker compose logs -f       # View logs
docker compose restart       # Restart services
```

### Development Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and write tests
3. Run tests: `pnpm test`
4. Lint and format: `pnpm check`
5. Commit changes: `git commit -m "feat: your feature"`
6. Push and create PR: `git push origin feature/your-feature`

### Getting Help

- **Documentation**: Check [Documentation Hub](../README.md)
- **Architecture Questions**: See [Architecture Decision Records](../architecture/adrs/README.md)
- **API Questions**: Review [API Specifications](../specifications/api/README.md)
- **Team Chat**: [Internal communication channel]
- **Issues**: GitHub Issues for bugs and feature requests

---

**Setup Complete!** Happy coding! 🚀

---

**Last Updated**: 2025-10-15
**Status**: Complete
**Tested On**: macOS (Apple Silicon + Intel), Ubuntu 22.04, Windows 11 (WSL2)
**Average Setup Time**: 45-55 minutes
