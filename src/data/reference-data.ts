/**
 * Reference data for ARCA/AFIP invoicing
 * This data is relatively static and cached in-memory
 */

export interface InvoiceType {
  id: number;
  code: string;
  name: string;
  description: string;
  category: 'factura' | 'nota_credito' | 'nota_debito' | 'recibo' | 'otros';
}

export interface VATRate {
  id: number;
  code: string;
  rate: number;
  description: string;
}

export interface DocumentType {
  id: number;
  code: string;
  name: string;
  description: string;
}

export interface ConceptType {
  id: number;
  code: string;
  name: string;
  description: string;
}

export interface TaxType {
  id: number;
  code: string;
  name: string;
  description: string;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export interface IVACondition {
  id: number;
  code: string;
  name: string;
  description: string;
}

/**
 * ARCA Invoice Types (Tipos de Comprobante)
 * Source: AFIP Web Services Specification
 */
export const INVOICE_TYPES: InvoiceType[] = [
  // Facturas
  { id: 1, code: 'FA', name: 'Factura A', description: 'Factura A (Responsable Inscripto)', category: 'factura' },
  { id: 6, code: 'FB', name: 'Factura B', description: 'Factura B (Monotributo, Consumidor Final)', category: 'factura' },
  { id: 11, code: 'FC', name: 'Factura C', description: 'Factura C (Responsable Monotributo)', category: 'factura' },
  { id: 51, code: 'FM', name: 'Factura M', description: 'Factura M (Exportación)', category: 'factura' },
  { id: 201, code: 'FE', name: 'Factura E', description: 'Factura E (Bienes usados)', category: 'factura' },

  // Notas de Crédito
  { id: 3, code: 'NCA', name: 'Nota de Crédito A', description: 'Nota de Crédito A', category: 'nota_credito' },
  { id: 8, code: 'NCB', name: 'Nota de Crédito B', description: 'Nota de Crédito B', category: 'nota_credito' },
  { id: 13, code: 'NCC', name: 'Nota de Crédito C', description: 'Nota de Crédito C', category: 'nota_credito' },
  { id: 53, code: 'NCM', name: 'Nota de Crédito M', description: 'Nota de Crédito M (Exportación)', category: 'nota_credito' },

  // Notas de Débito
  { id: 2, code: 'NDA', name: 'Nota de Débito A', description: 'Nota de Débito A', category: 'nota_debito' },
  { id: 7, code: 'NDB', name: 'Nota de Débito B', description: 'Nota de Débito B', category: 'nota_debito' },
  { id: 12, code: 'NDC', name: 'Nota de Débito C', description: 'Nota de Débito C', category: 'nota_debito' },
  { id: 52, code: 'NDM', name: 'Nota de Débito M', description: 'Nota de Débito M (Exportación)', category: 'nota_debito' },

  // Recibos
  { id: 4, code: 'RECA', name: 'Recibo A', description: 'Recibo A', category: 'recibo' },
  { id: 9, code: 'RECB', name: 'Recibo B', description: 'Recibo B', category: 'recibo' },
  { id: 15, code: 'RECC', name: 'Recibo C', description: 'Recibo C', category: 'recibo' },
];

/**
 * VAT Rates (Alícuotas de IVA)
 * Source: AFIP Web Services Specification
 */
export const VAT_RATES: VATRate[] = [
  { id: 3, code: '0', rate: 0, description: 'IVA 0%' },
  { id: 4, code: '10.5', rate: 10.5, description: 'IVA 10.5%' },
  { id: 5, code: '21', rate: 21, description: 'IVA 21%' },
  { id: 6, code: '27', rate: 27, description: 'IVA 27%' },
  { id: 8, code: '5', rate: 5, description: 'IVA 5%' },
  { id: 9, code: '2.5', rate: 2.5, description: 'IVA 2.5%' },
  { id: 1, code: 'EX', rate: 0, description: 'Exento' },
  { id: 2, code: 'NG', rate: 0, description: 'No Gravado' },
];

/**
 * Document Types (Tipos de Documento)
 * Source: AFIP Web Services Specification
 */
export const DOCUMENT_TYPES: DocumentType[] = [
  { id: 80, code: 'CUIT', name: 'CUIT', description: 'Clave Única de Identificación Tributaria' },
  { id: 86, code: 'CUIL', name: 'CUIL', description: 'Código Único de Identificación Laboral' },
  { id: 87, code: 'CDI', name: 'CDI', description: 'Cédula de Identidad' },
  { id: 89, code: 'LE', name: 'LE', description: 'Libreta de Enrolamiento' },
  { id: 90, code: 'LC', name: 'LC', description: 'Libreta Cívica' },
  { id: 91, code: 'CI_EXT', name: 'CI Extranjera', description: 'Cédula de Identidad Extranjera' },
  { id: 92, code: 'EN_TRAMITE', name: 'En Trámite', description: 'Documento en Trámite' },
  { id: 93, code: 'ACTA_NAC', name: 'Acta Nacimiento', description: 'Acta de Nacimiento' },
  { id: 95, code: 'CI_BS_AS', name: 'CI Buenos Aires', description: 'Cédula de Identidad Bs. As.' },
  { id: 96, code: 'DNI', name: 'DNI', description: 'Documento Nacional de Identidad' },
  { id: 94, code: 'PASAPORTE', name: 'Pasaporte', description: 'Pasaporte' },
  { id: 99, code: 'SIN_IDENTIFICAR', name: 'Sin Identificar', description: 'Consumidor Final / Operaciones < $1000' },
];

/**
 * Concept Types (Tipos de Concepto)
 * Source: AFIP Web Services Specification
 */
export const CONCEPT_TYPES: ConceptType[] = [
  { id: 1, code: 'PRODUCTOS', name: 'Productos', description: 'Venta de productos' },
  { id: 2, code: 'SERVICIOS', name: 'Servicios', description: 'Prestación de servicios' },
  { id: 3, code: 'MIXTO', name: 'Productos y Servicios', description: 'Productos y Servicios' },
];

/**
 * Tax Types (Tipos de Tributos)
 * Source: AFIP Web Services Specification
 */
export const TAX_TYPES: TaxType[] = [
  { id: 1, code: 'IMP_NAC', name: 'Impuestos Nacionales', description: 'Impuestos Nacionales' },
  { id: 2, code: 'IMP_PROV', name: 'Impuestos Provinciales', description: 'Impuestos Provinciales' },
  { id: 3, code: 'IMP_MUN', name: 'Impuestos Municipales', description: 'Impuestos Municipales' },
  { id: 4, code: 'IMP_INT', name: 'Impuestos Internos', description: 'Impuestos Internos' },
  { id: 5, code: 'IIBB', name: 'Ingresos Brutos', description: 'Ingresos Brutos' },
  { id: 6, code: 'PERC_IVA', name: 'Percepción de IVA', description: 'Percepción de IVA' },
  { id: 7, code: 'PERC_IIBB', name: 'Percepción de IIBB', description: 'Percepción de Ingresos Brutos' },
  { id: 99, code: 'OTROS', name: 'Otros', description: 'Otros Tributos' },
];

/**
 * Currencies (Monedas)
 * Source: AFIP Web Services Specification
 */
export const CURRENCIES: Currency[] = [
  { code: 'ARS', name: 'Peso Argentino', symbol: '$' },
  { code: 'USD', name: 'Dólar Estadounidense', symbol: 'US$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'BRL', name: 'Real Brasileño', symbol: 'R$' },
  { code: 'CLP', name: 'Peso Chileno', symbol: 'CLP$' },
  { code: 'UYU', name: 'Peso Uruguayo', symbol: 'UYU$' },
];

/**
 * IVA Conditions (Condiciones ante IVA)
 * Source: AFIP Web Services Specification
 */
export const IVA_CONDITIONS: IVACondition[] = [
  { id: 1, code: 'RI', name: 'Responsable Inscripto', description: 'Responsable Inscripto en IVA' },
  { id: 2, code: 'RM', name: 'Responsable Monotributo', description: 'Sujeto adherido al Monotributo' },
  { id: 3, code: 'NE', name: 'Responsable No Inscripto', description: 'Responsable No Inscripto' },
  { id: 4, code: 'CF', name: 'Consumidor Final', description: 'Consumidor Final' },
  { id: 5, code: 'EX', name: 'Exento', description: 'Sujeto Exento' },
  { id: 6, code: 'RM_EX', name: 'Monotributo Social', description: 'Sujeto Monotributo Social' },
  { id: 7, code: 'PEQUENO_CONTRIB', name: 'Pequeño Contribuyente Eventual', description: 'Pequeño Contribuyente Eventual' },
  { id: 8, code: 'PEQUENO_CONTRIB_SOC', name: 'Pequeño Contribuyente Social', description: 'Pequeño Contribuyente Eventual Social' },
  { id: 9, code: 'NO_RESP', name: 'No Responsable', description: 'No Responsable' },
  { id: 10, code: 'IVA_LIB', name: 'IVA Liberado', description: 'IVA Liberado - Ley 19.640' },
  { id: 11, code: 'RI_AGENTE_PERC', name: 'RI - Agente de Percepción', description: 'Responsable Inscripto - Agente de Percepción' },
  { id: 12, code: 'PEQUENO_CONTRIB_EVENTUAL_SOC', name: 'Pequeño Contribuyente Eventual Social', description: 'Pequeño Contribuyente Eventual Social' },
  { id: 13, code: 'IVA_NO_ALCANZADO', name: 'IVA No Alcanzado', description: 'IVA No Alcanzado' },
];

/**
 * Helper functions for reference data lookup
 */

export function getInvoiceTypeById(id: number): InvoiceType | undefined {
  return INVOICE_TYPES.find((type) => type.id === id);
}

export function getInvoiceTypeByCode(code: string): InvoiceType | undefined {
  return INVOICE_TYPES.find((type) => type.code.toUpperCase() === code.toUpperCase());
}

export function getVATRateById(id: number): VATRate | undefined {
  return VAT_RATES.find((rate) => rate.id === id);
}

export function getVATRateByRate(rate: number): VATRate | undefined {
  return VAT_RATES.find((r) => r.rate === rate);
}

export function getDocumentTypeById(id: number): DocumentType | undefined {
  return DOCUMENT_TYPES.find((type) => type.id === id);
}

export function getDocumentTypeByCode(code: string): DocumentType | undefined {
  return DOCUMENT_TYPES.find((type) => type.code.toUpperCase() === code.toUpperCase());
}

export function getConceptTypeById(id: number): ConceptType | undefined {
  return CONCEPT_TYPES.find((type) => type.id === id);
}

export function getTaxTypeById(id: number): TaxType | undefined {
  return TAX_TYPES.find((type) => type.id === id);
}

export function getCurrencyByCode(code: string): Currency | undefined {
  return CURRENCIES.find((currency) => currency.code.toUpperCase() === code.toUpperCase());
}

export function getIVAConditionById(id: number): IVACondition | undefined {
  return IVA_CONDITIONS.find((condition) => condition.id === id);
}

export function getIVAConditionByCode(code: string): IVACondition | undefined {
  return IVA_CONDITIONS.find((condition) => condition.code.toUpperCase() === code.toUpperCase());
}

/**
 * Validation helpers
 */

export function isValidInvoiceType(id: number): boolean {
  return INVOICE_TYPES.some((type) => type.id === id);
}

export function isValidVATRate(id: number): boolean {
  return VAT_RATES.some((rate) => rate.id === id);
}

export function isValidDocumentType(id: number): boolean {
  return DOCUMENT_TYPES.some((type) => type.id === id);
}

export function isValidConceptType(id: number): boolean {
  return CONCEPT_TYPES.some((type) => type.id === id);
}

export function isValidCurrency(code: string): boolean {
  return CURRENCIES.some((currency) => currency.code.toUpperCase() === code.toUpperCase());
}
