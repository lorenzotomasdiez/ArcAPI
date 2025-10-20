# AI Service Contract

## Overview

The AI Service is responsible for converting natural language descriptions into structured invoice data using Large Language Models (LLM). It provides an internal API endpoint that accepts plain-text invoice descriptions and returns ARCA-compliant invoice structures.

**Service Type**: Internal Microservice
**Technology**: Python + FastAPI + OpenAI GPT-4
**Communication**: REST/HTTPS
**Authentication**: Internal-Service-Token

## Responsibility

- Accept natural language invoice descriptions from REST API Core
- Extract structured invoice data (items, amounts, customer info, taxes)
- Validate against ARCA requirements
- Return confidence scores and warnings
- Provide AI metadata for observability

## API Contract

### Endpoint

```
POST /internal/ai/generate-invoice
```

### Authentication

Requests must include an internal service token:

```
Authorization: Bearer <internal-service-token>
```

Token format: JWT signed by auth service, contains service identity and permissions.

### Input Schema

```json
{
  "type": "object",
  "properties": {
    "description": {
      "type": "string",
      "description": "Natural language description of the invoice",
      "minLength": 10,
      "maxLength": 5000,
      "example": "Factura para Juan Pérez por 3 horas de consultoría a $5000/hora"
    },
    "user_context": {
      "type": "object",
      "description": "Additional context to improve generation accuracy",
      "properties": {
        "user_id": {
          "type": "string",
          "format": "uuid",
          "description": "User ID making the request"
        },
        "previous_invoices": {
          "type": "array",
          "description": "Recent invoices for pattern learning",
          "maxItems": 5,
          "items": {
            "type": "object"
          }
        },
        "preferences": {
          "type": "object",
          "description": "User preferences (default tax rates, units, etc.)",
          "properties": {
            "default_iva_rate": {
              "type": "number",
              "enum": [0, 10.5, 21, 27]
            },
            "default_currency": {
              "type": "string",
              "enum": ["ARS", "USD"]
            }
          }
        }
      }
    }
  },
  "required": ["description"]
}
```

### Output Schema

#### Success Response (200 OK)

```json
{
  "type": "object",
  "properties": {
    "invoice": {
      "type": "object",
      "description": "Structured invoice data in ARCA format",
      "properties": {
        "tipo_comprobante": {
          "type": "integer",
          "description": "Invoice type code (1=Factura A, 6=Factura B, 11=Factura C)",
          "enum": [1, 6, 11]
        },
        "punto_venta": {
          "type": "integer",
          "description": "Point of sale number",
          "default": 1
        },
        "concepto": {
          "type": "integer",
          "description": "Concept (1=Products, 2=Services, 3=Both)",
          "enum": [1, 2, 3]
        },
        "fecha_servicio_desde": {
          "type": "string",
          "format": "date",
          "description": "Service start date (for service invoices)"
        },
        "fecha_servicio_hasta": {
          "type": "string",
          "format": "date",
          "description": "Service end date (for service invoices)"
        },
        "fecha_vencimiento_pago": {
          "type": "string",
          "format": "date",
          "description": "Payment due date"
        },
        "cliente": {
          "type": "object",
          "description": "Customer information",
          "properties": {
            "tipo_documento": {
              "type": "integer",
              "description": "Document type (80=CUIT, 96=DNI, 99=Other)"
            },
            "numero_documento": {
              "type": "string",
              "description": "Document number"
            },
            "razon_social": {
              "type": "string",
              "description": "Customer name or business name"
            },
            "domicilio": {
              "type": "string",
              "description": "Customer address"
            }
          },
          "required": ["tipo_documento", "numero_documento", "razon_social"]
        },
        "items": {
          "type": "array",
          "description": "Invoice line items",
          "items": {
            "type": "object",
            "properties": {
              "cantidad": {
                "type": "number",
                "description": "Quantity"
              },
              "descripcion": {
                "type": "string",
                "description": "Item description"
              },
              "precio_unitario": {
                "type": "number",
                "description": "Unit price (without tax)"
              },
              "unidad_medida": {
                "type": "string",
                "description": "Unit of measure"
              },
              "alicuota_iva": {
                "type": "number",
                "description": "VAT rate (0, 10.5, 21, 27)",
                "enum": [0, 10.5, 21, 27]
              }
            },
            "required": ["cantidad", "descripcion", "precio_unitario"]
          },
          "minItems": 1
        },
        "tributos": {
          "type": "array",
          "description": "Additional taxes and tributes",
          "items": {
            "type": "object",
            "properties": {
              "tipo": {
                "type": "integer",
                "description": "Tax type code"
              },
              "descripcion": {
                "type": "string",
                "description": "Tax description"
              },
              "base_imponible": {
                "type": "number",
                "description": "Taxable base"
              },
              "alicuota": {
                "type": "number",
                "description": "Tax rate percentage"
              },
              "importe": {
                "type": "number",
                "description": "Tax amount"
              }
            }
          }
        },
        "confidence": {
          "type": "number",
          "description": "AI confidence score (0.0-1.0)",
          "minimum": 0,
          "maximum": 1
        }
      },
      "required": ["tipo_comprobante", "cliente", "items", "confidence"]
    },
    "ai_metadata": {
      "type": "object",
      "description": "Metadata about the AI generation process",
      "properties": {
        "model": {
          "type": "string",
          "description": "Model used for generation",
          "example": "gpt-4"
        },
        "tokens_used": {
          "type": "integer",
          "description": "Total tokens consumed (prompt + completion)",
          "example": 450
        },
        "processing_time_ms": {
          "type": "integer",
          "description": "Time taken to process the request in milliseconds",
          "example": 1200
        }
      },
      "required": ["model", "tokens_used", "processing_time_ms"]
    }
  },
  "required": ["invoice", "ai_metadata"]
}
```

### Error Responses

All errors follow [RFC 7807 Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc7807) format.

#### 400 Bad Request - Invalid Input

```json
{
  "type": "https://arcaapi.com/errors/invalid-input",
  "title": "Invalid Input",
  "status": 400,
  "detail": "Description must be at least 10 characters long",
  "instance": "/internal/ai/generate-invoice",
  "trace_id": "abc123"
}
```

#### 400 Bad Request - AI Generation Failed

```json
{
  "type": "https://arcaapi.com/errors/ai-generation-failed",
  "title": "AI Generation Failed",
  "status": 400,
  "detail": "Description too vague, need more details about customer and items",
  "instance": "/internal/ai/generate-invoice",
  "trace_id": "def456",
  "suggestions": [
    "Include customer name or identification",
    "Specify item quantities and prices",
    "Clarify invoice type (A, B, or C)"
  ]
}
```

#### 401 Unauthorized - Missing or Invalid Token

```json
{
  "type": "https://arcaapi.com/errors/unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Invalid or missing internal service token",
  "instance": "/internal/ai/generate-invoice",
  "trace_id": "ghi789"
}
```

#### 429 Too Many Requests - Rate Limit Exceeded

```json
{
  "type": "https://arcaapi.com/errors/rate-limit-exceeded",
  "title": "Rate Limit Exceeded",
  "status": 429,
  "detail": "AI service rate limit exceeded",
  "instance": "/internal/ai/generate-invoice",
  "trace_id": "jkl012",
  "retry_after": 60
}
```

#### 500 Internal Server Error - AI Service Error

```json
{
  "type": "https://arcaapi.com/errors/ai-service-error",
  "title": "AI Service Error",
  "status": 500,
  "detail": "OpenAI API error or internal processing failure",
  "instance": "/internal/ai/generate-invoice",
  "trace_id": "mno345"
}
```

#### 503 Service Unavailable - AI Service Down

```json
{
  "type": "https://arcaapi.com/errors/service-unavailable",
  "title": "Service Unavailable",
  "status": 503,
  "detail": "AI service is temporarily unavailable",
  "instance": "/internal/ai/generate-invoice",
  "trace_id": "pqr678",
  "retry_after": 30
}
```

#### 504 Gateway Timeout - Request Timeout

```json
{
  "type": "https://arcaapi.com/errors/timeout",
  "title": "Gateway Timeout",
  "status": 504,
  "detail": "AI generation timed out after 5 seconds",
  "instance": "/internal/ai/generate-invoice",
  "trace_id": "stu901"
}
```

## Performance Expectations

- **Timeout**: 5 seconds (AI calls can be slow)
- **Latency**: P50 < 1.5s, P95 < 3s
- **Throughput**: 100 requests/minute per instance
- **Availability**: 99.5% uptime (can fallback to manual mode)

## Timeout Behavior

The REST API Core sets a **5-second timeout** for AI service calls:

1. If response received within 5 seconds → Return invoice data
2. If timeout exceeded → REST API returns 504 to client with suggestion to use "advanced mode" (manual input)
3. AI Service should implement internal timeout of 4.5 seconds to respond before client timeout

## Retry Strategy

**REST API Core Responsibility**:
- NO automatic retries on AI service failures
- If AI service returns 5xx or times out → Suggest fallback to manual mode
- Retries would be counterproductive (AI calls are expensive and slow)

**Fallback Behavior**:
```json
{
  "error": {
    "code": "AI_SERVICE_UNAVAILABLE",
    "message": "AI service is temporarily unavailable",
    "suggestion": "Use advanced mode to create invoice manually"
  }
}
```

## Error Handling Strategy

| Error Type | Status Code | Retry? | Action |
|------------|-------------|--------|--------|
| Invalid input | 400 | No | Show error to user, suggest corrections |
| AI generation failed | 400 | No | Show suggestions, offer manual mode |
| Unauthorized | 401 | No | Service misconfiguration, alert DevOps |
| Rate limit | 429 | Yes (after delay) | Wait retry_after seconds |
| AI service error | 500 | No | Log error, suggest manual mode |
| Service unavailable | 503 | No | Suggest manual mode immediately |
| Timeout | 504 | No | Suggest manual mode immediately |

## Request Examples

### Example 1: Simple Service Invoice

**Request:**
```json
{
  "description": "Factura para Juan Pérez por 3 horas de consultoría a $5000/hora"
}
```

**Response (200 OK):**
```json
{
  "invoice": {
    "tipo_comprobante": 11,
    "punto_venta": 1,
    "concepto": 2,
    "fecha_servicio_desde": "2025-10-01",
    "fecha_servicio_hasta": "2025-10-15",
    "fecha_vencimiento_pago": "2025-10-30",
    "cliente": {
      "tipo_documento": 96,
      "numero_documento": "12345678",
      "razon_social": "Juan Pérez",
      "domicilio": "Calle Falsa 123, Buenos Aires"
    },
    "items": [
      {
        "cantidad": 3,
        "descripcion": "Horas de consultoría",
        "precio_unitario": 5000.00,
        "unidad_medida": "horas",
        "alicuota_iva": 21
      }
    ],
    "tributos": [],
    "confidence": 0.92
  },
  "ai_metadata": {
    "model": "gpt-4",
    "tokens_used": 380,
    "processing_time_ms": 1150
  }
}
```

### Example 2: Product Invoice with User Context

**Request:**
```json
{
  "description": "Vender 5 notebooks HP a $50000 cada una a TechCorp SA",
  "user_context": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "previous_invoices": [
      {
        "cliente": {
          "tipo_documento": 80,
          "numero_documento": "30123456789",
          "razon_social": "TechCorp SA"
        }
      }
    ],
    "preferences": {
      "default_iva_rate": 21,
      "default_currency": "ARS"
    }
  }
}
```

**Response (200 OK):**
```json
{
  "invoice": {
    "tipo_comprobante": 1,
    "punto_venta": 1,
    "concepto": 1,
    "cliente": {
      "tipo_documento": 80,
      "numero_documento": "30123456789",
      "razon_social": "TechCorp SA",
      "domicilio": "Av. Libertador 1000, CABA"
    },
    "items": [
      {
        "cantidad": 5,
        "descripcion": "Notebook HP",
        "precio_unitario": 50000.00,
        "unidad_medida": "unidades",
        "alicuota_iva": 21
      }
    ],
    "tributos": [],
    "confidence": 0.95
  },
  "ai_metadata": {
    "model": "gpt-4",
    "tokens_used": 520,
    "processing_time_ms": 1420
  }
}
```

### Example 3: Vague Description (Error)

**Request:**
```json
{
  "description": "Factura a cliente"
}
```

**Response (400 Bad Request):**
```json
{
  "type": "https://arcaapi.com/errors/ai-generation-failed",
  "title": "AI Generation Failed",
  "status": 400,
  "detail": "Description too vague, need more details about customer, items, and amounts",
  "instance": "/internal/ai/generate-invoice",
  "trace_id": "xyz123",
  "suggestions": [
    "Include customer name or CUIT/DNI",
    "Specify what products or services are being invoiced",
    "Include quantities and prices"
  ]
}
```

## Confidence Score Interpretation

The `confidence` field indicates AI certainty about the generated invoice:

- **0.9 - 1.0**: High confidence - All fields extracted clearly
- **0.7 - 0.89**: Medium confidence - Some assumptions made, suggest review
- **0.5 - 0.69**: Low confidence - Many assumptions, require user confirmation
- **< 0.5**: Very low confidence - Generation should fail with suggestions

**REST API Core Behavior**:
- If confidence >= 0.7 → Show generated invoice for review
- If confidence < 0.7 → Show warning and suggest manual verification
- Always allow user to edit AI-generated data before submission

## Observability

### Logging

AI Service logs all requests with:
- Request ID (trace_id)
- User ID (from context)
- Description (first 100 chars)
- Model used
- Tokens consumed
- Processing time
- Confidence score
- Error details (if failed)

### Metrics

Track the following metrics:
- Request rate (requests/second)
- Success rate (%)
- Error rate by type (400/500/504)
- Latency (P50, P95, P99)
- Token usage (total, per request)
- Confidence score distribution
- OpenAI API errors

### Alerts

Trigger alerts when:
- Error rate > 5% for 5 minutes
- P95 latency > 4 seconds
- OpenAI API errors > 10/minute
- Service availability < 99.5% in 24h window

## Testing

### Contract Tests

```python
# test_ai_service_contract.py

import pytest
from jsonschema import validate

def test_valid_invoice_generation():
    """Test successful invoice generation with valid input"""
    request = {
        "description": "Factura a Juan Pérez por consultoría $5000"
    }

    response = ai_service.generate_invoice(request)

    assert response.status_code == 200
    validate(instance=response.json(), schema=output_schema)
    assert response.json()["invoice"]["confidence"] >= 0.7
    assert response.json()["ai_metadata"]["model"] == "gpt-4"

def test_vague_description_returns_error():
    """Test that vague descriptions return helpful error"""
    request = {
        "description": "Factura"
    }

    response = ai_service.generate_invoice(request)

    assert response.status_code == 400
    assert response.json()["type"] == "https://arcaapi.com/errors/ai-generation-failed"
    assert "suggestions" in response.json()

def test_timeout_handling():
    """Test that timeouts are handled correctly"""
    request = {
        "description": "Very complex invoice..." * 100
    }

    with pytest.raises(TimeoutError):
        ai_service.generate_invoice(request, timeout=5.0)

def test_user_context_improves_accuracy():
    """Test that user context improves generation quality"""
    request_without_context = {
        "description": "Invoice to TechCorp"
    }

    request_with_context = {
        "description": "Invoice to TechCorp",
        "user_context": {
            "previous_invoices": [
                {"cliente": {"numero_documento": "30123456789"}}
            ]
        }
    }

    response1 = ai_service.generate_invoice(request_without_context)
    response2 = ai_service.generate_invoice(request_with_context)

    assert response2.json()["invoice"]["confidence"] >= response1.json()["invoice"]["confidence"]
```

## Security Considerations

1. **Authentication**: Service-to-service JWT tokens only
2. **Input Validation**: Sanitize description to prevent prompt injection
3. **Rate Limiting**: 100 requests/minute per service instance
4. **PII Handling**: Customer data in description is not logged
5. **Token Security**: Internal service tokens rotated every 24 hours

## Related Documentation

- [Architecture - Services](../../architecture/02-services.md) - Service design overview
- [API Specifications](../api/README.md) - External API documentation
- [Flows - Invoice Creation](../../flows/01-invoice-creation.md) - End-to-end flow
- [Development - Testing](../../development/README.md) - Testing guidelines

---

**Last Updated**: 2025-10-15
**Status**: Active
**Owner**: AI Service Team
**Version**: 1.0
