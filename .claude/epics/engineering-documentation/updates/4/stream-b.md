---
issue: 4
stream: Certificates & Reference Data Endpoints
agent: general-purpose
started: 2025-10-15T12:06:13Z
completed: 2025-10-15T15:30:00Z
status: completed
---

# Stream B: Certificates & Reference Data Endpoints

## Scope
Document certificate management endpoints and all reference data endpoints for ARCA invoice types, IVA rates, document types, currencies, and sales points.

## Files Modified
- `docs/specifications/api/openapi.yaml` (added certificates & reference-data paths and schemas)

## Completed Work

### Certificate Endpoints Added
1. **POST /certificates** - Upload ARCA certificate (.pfx file)
   - Multipart/form-data upload with password
   - Certificate metadata extraction
   - Security notes about encryption and storage
   - Proper error responses (400 with examples, 413 for file size)

2. **GET /certificates** - List all user certificates
   - Returns metadata only (not actual certificates)
   - Includes certificate status (active/expired/revoked)

3. **DELETE /certificates/{id}** - Delete certificate
   - Permanent deletion with warning
   - 204 no content response

### Certificate Schema
Created `Certificate` schema with fields:
- id (UUID)
- nombre (friendly name)
- cuit (associated CUIT)
- fecha_vencimiento (expiration date)
- estado (active/expired/revoked)
- subject (DN)
- issuer (DN)
- created_at, updated_at

### Reference Data Endpoints Added

1. **GET /reference-data/invoice-types** - ARCA invoice types
   - Factura A (código 1), B (6), C (11), M (51)
   - Notas de Crédito A, B, C
   - Detailed descriptions and usage notes

2. **GET /reference-data/iva-rates** - IVA rates and codes
   - 0% (Exento - código 3)
   - 10.5% (Reducido - código 4)
   - 21% (General - código 5)
   - 27% (Adicional - código 6)

3. **GET /reference-data/document-types** - Document type codes
   - CUIT (80), DNI (96), CUIL (86), CDI (87)
   - Pasaporte (94), Consumidor Final (99)
   - Detailed notes for each type

4. **GET /reference-data/currencies** - Supported currencies
   - ARS (Pesos), USD (Dólar), EUR (Euro), BRL (Real)
   - ARCA codes and ISO codes
   - Currency symbols

5. **GET /reference-data/sales-points** - Available sales points
   - Sales point numbers and descriptions
   - Active/inactive status
   - Last invoice number used

### Reference Data Schemas
Created schemas for:
- `InvoiceType` (codigo, descripcion, clase, notas)
- `IvaRate` (codigo, porcentaje, descripcion)
- `DocumentType` (codigo, descripcion, notas)
- `Currency` (codigo, descripcion, simbolo, codigo_iso)
- `SalesPoint` (numero, descripcion, activo, ultimo_numero_usado)

## Implementation Details

All endpoints follow the same pattern as Stream A:
- Proper tagging (Certificates, ReferenceData)
- Reused error responses (BadRequest, Unauthorized, RateLimited, InternalError)
- Complete examples with real ARCA codes
- Detailed descriptions explaining when to use each code
- Cross-references to related endpoints

## Validation

Endpoints have been designed to match the patterns established by Stream A. Integration with Stream D's Spectral validation will verify the complete specification.

## Next Steps

Ready for Stream C (invoice endpoints detail refinement) and Stream D (validation and finalization).
