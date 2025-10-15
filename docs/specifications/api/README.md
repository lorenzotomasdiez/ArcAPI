# API Specifications

This directory contains the OpenAPI 3.1 specifications for the ARCA API REST API.

## Overview

The ARCA API provides a modern REST API for electronic invoicing in Argentina, abstracting the complexity of the ARCA/AFIP SOAP API.

**Base URLs:**
- Production: `https://api.arcaapi.com/v1`
- Sandbox: `https://sandbox.arcaapi.com/v1`

## Documentation

> **Status**: TODO - Pending completion in Task #4
>
> The complete OpenAPI specification will be created in **Task #4: Create API Specifications**

### Planned Files

- **`openapi.yaml`** - Complete REST API specification (Week 2-3)
  - All endpoints documented
  - Request/response schemas
  - Authentication flows
  - Error responses
  - Rate limiting
  - Examples

## API Overview

### Authentication

- **Method**: Bearer token authentication
- **Header**: `Authorization: Bearer sk_live_...` or `Authorization: Bearer sk_test_...`
- **Key Types**:
  - `sk_live_...`: Production keys
  - `sk_test_...`: Sandbox keys

### Versioning

- **Strategy**: URL-based versioning
- **Current Version**: v1
- **Format**: `/v1/`, `/v2/`
- **Deprecation**: 6 months notice for version EOL

### Rate Limiting

- **Free Tier**: 100 requests/minute
- **Pro Tier**: 1,000 requests/minute
- **Enterprise**: Custom limits
- **Headers**:
  - `X-RateLimit-Limit`: Total requests allowed
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Unix timestamp for reset

### Error Format

All errors follow RFC 7807 Problem Details:

```json
{
  "type": "https://arcaapi.com/errors/validation",
  "title": "Validation Error",
  "status": 400,
  "detail": "Invalid invoice type",
  "instance": "/v1/invoices",
  "errors": [
    {
      "field": "tipo_comprobante",
      "message": "Must be 1, 6, or 11"
    }
  ]
}
```

## Core Endpoints

> **Note**: Full specifications will be in `openapi.yaml` when created

### Invoices

- `POST /v1/invoices` - Create invoice
- `GET /v1/invoices/:id` - Get invoice details
- `GET /v1/invoices` - List invoices
- `GET /v1/invoices/:id/pdf` - Download invoice PDF

### Certificates

- `POST /v1/certificates` - Upload ARCA certificate
- `GET /v1/certificates` - List certificates
- `DELETE /v1/certificates/:id` - Delete certificate

### Webhooks

- `POST /v1/webhooks` - Create webhook endpoint
- `GET /v1/webhooks` - List webhooks
- `PUT /v1/webhooks/:id` - Update webhook
- `DELETE /v1/webhooks/:id` - Delete webhook

### Customers

- `POST /v1/customers` - Create customer
- `GET /v1/customers` - List customers
- `GET /v1/customers/:id` - Get customer
- `PUT /v1/customers/:id` - Update customer

### API Keys

- `POST /v1/api-keys` - Create API key
- `GET /v1/api-keys` - List API keys
- `DELETE /v1/api-keys/:id` - Revoke API key

## Using the Specification

This section explains how to validate the OpenAPI specification, generate documentation, and use it for development.

### Validation

Validate the OpenAPI spec to ensure it follows best practices and has no errors:

```bash
# Install Spectral (if not already installed)
npm install -g @stoplight/spectral-cli

# Validate the spec
spectral lint docs/specifications/api/openapi.yaml

# Expected output: No errors or warnings
```

**What Spectral checks:**
- OpenAPI 3.1 format compliance
- No undefined schemas or circular references
- All operations have unique operationIds
- All operations are tagged
- Examples match their schemas
- Consistent naming conventions

### Documentation Generation

Generate beautiful, interactive HTML documentation from the OpenAPI spec:

#### Using Redocly

```bash
# Install Redocly CLI
npm install -g @redocly/cli

# Generate static HTML documentation
npx @redocly/cli build-docs docs/specifications/api/openapi.yaml -o api-docs.html

# Preview documentation locally (interactive server)
npx @redocly/cli preview-docs docs/specifications/api/openapi.yaml
# Opens at http://localhost:8080
```

#### Using Swagger UI

```bash
# Install Swagger UI CLI
npm install -g swagger-ui-cli

# Serve interactive documentation
swagger-ui-cli docs/specifications/api/openapi.yaml

# Or use Docker
docker run -p 80:8080 -e SWAGGER_JSON=/openapi.yaml -v $(pwd)/docs/specifications/api:/usr/share/nginx/html swaggerapi/swagger-ui
```

### Development Usage

#### Generate TypeScript Types

Automatically generate TypeScript types from the OpenAPI spec:

```bash
# Install openapi-typescript
npm install -D openapi-typescript

# Generate types
npx openapi-typescript docs/specifications/api/openapi.yaml --output src/types/api.ts
```

**Example usage:**
```typescript
import type { paths, components } from './types/api';

type Invoice = components['schemas']['Invoice'];
type CreateInvoiceRequest = paths['/invoices']['post']['requestBody']['content']['application/json'];
```

#### Generate Client SDKs

Generate client libraries in various languages:

**Python:**
```bash
openapi-generator generate \
  -i docs/specifications/api/openapi.yaml \
  -g python \
  -o python-client/
```

**JavaScript/TypeScript:**
```bash
openapi-generator generate \
  -i docs/specifications/api/openapi.yaml \
  -g typescript-axios \
  -o ts-client/
```

**PHP:**
```bash
openapi-generator generate \
  -i docs/specifications/api/openapi.yaml \
  -g php \
  -o php-client/
```

See [OpenAPI Generator](https://openapi-generator.tech/docs/generators) for all supported languages.

#### Mock Server for Development

Run a mock server that returns example responses from the spec:

```bash
# Install Prism
npm install -g @stoplight/prism-cli

# Start mock server
prism mock docs/specifications/api/openapi.yaml

# Server runs at http://localhost:4010
# Example: curl http://localhost:4010/v1/invoices
```

**Features:**
- Returns example responses from the spec
- Validates request payloads against schemas
- Simulates error responses
- No backend implementation needed

**Use cases:**
- Frontend development before backend is ready
- Testing edge cases and error handling
- Demo/prototype without infrastructure

#### Contract Testing

Generate contract tests to validate your API implementation matches the spec:

**Using Dredd:**
```bash
# Install Dredd
npm install -g dredd

# Run contract tests
dredd docs/specifications/api/openapi.yaml https://api.arcaapi.com
```

**Using Schemathesis:**
```bash
# Install Schemathesis
pip install schemathesis

# Run property-based tests
schemathesis run docs/specifications/api/openapi.yaml --base-url https://api.arcaapi.com
```

### Code Generation for Stubs

Generate server stubs to kickstart backend implementation:

```bash
# Node.js/Express
openapi-generator generate \
  -i docs/specifications/api/openapi.yaml \
  -g nodejs-express-server \
  -o backend/

# Python/FastAPI
openapi-generator generate \
  -i docs/specifications/api/openapi.yaml \
  -g python-fastapi \
  -o backend/

# Go
openapi-generator generate \
  -i docs/specifications/api/openapi.yaml \
  -g go-server \
  -o backend/
```

## SDK Support

Official SDKs will be generated from this OpenAPI specification:

- JavaScript/TypeScript SDK
- Python SDK
- PHP SDK
- Ruby SDK
- Go SDK
- .NET SDK

See [SDK specifications](../../specifications/) for language-specific design docs.

## References

### OpenAPI & Standards

- [OpenAPI 3.1 Specification](https://spec.openapis.org/oas/v3.1.0) - Official OpenAPI spec
- [RFC 7807 Problem Details](https://datatracker.ietf.org/doc/html/rfc7807) - Error response format
- [OpenAPI Best Practices](https://oai.github.io/Documentation/best-practices.html) - Style guide

### Tools Documentation

- [Spectral](https://stoplight.io/open-source/spectral) - OpenAPI linter
- [Redocly](https://redocly.com/docs/) - Documentation generation
- [Swagger UI](https://swagger.io/tools/swagger-ui/) - Interactive API docs
- [Prism](https://stoplight.io/open-source/prism) - Mock server
- [OpenAPI Generator](https://openapi-generator.tech/) - Code generation

## Related Documentation

- [API Overview](../../README.md) - Documentation hub
- [Authentication Flow](../../flows/README.md) - Visual auth flow
- [Service Architecture](../../architecture/02-services.md) - Backend services
- [Development Guide](../../development/README.md) - Testing the API
- [Specifications Index](../README.md) - All specifications

---

**Last Updated**: 2025-10-15
**Status**: Active (Updated in Task #4 Stream C)
**Next Review**: After full Task #4 completion
