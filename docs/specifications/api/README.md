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

### Generate Types

TypeScript/JavaScript:
```bash
npx openapi-typescript openapi.yaml --output types.ts
```

Python:
```bash
openapi-generator generate -i openapi.yaml -g python -o python-client/
```

### Mock Server

Run a mock server for development:
```bash
prism mock openapi.yaml
```

### Validation

Validate the OpenAPI spec:
```bash
spectral lint openapi.yaml
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

## Related Documentation

- [API Overview](../../README.md) - Documentation hub
- [Authentication Flow](../../flows/README.md) - Visual auth flow
- [Service Architecture](../../architecture/02-services.md) - Backend services
- [Development Guide](../../development/README.md) - Testing the API

---

**Last Updated**: 2025-10-15
**Status**: Placeholder (Spec Pending Task #4)
**Next Review**: After Task #4 completion
