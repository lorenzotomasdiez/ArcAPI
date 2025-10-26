/**
 * Reference data routes
 * Provides access to ARCA/AFIP reference data (invoice types, VAT rates, etc.)
 */

import { Router, Request, Response } from 'express';
import {
  INVOICE_TYPES,
  VAT_RATES,
  DOCUMENT_TYPES,
  CONCEPT_TYPES,
  TAX_TYPES,
  CURRENCIES,
  IVA_CONDITIONS,
  getInvoiceTypeById,
  getInvoiceTypeByCode,
  getVATRateById,
  getDocumentTypeById,
  getConceptTypeById,
  getTaxTypeById,
  getCurrencyByCode,
  getIVAConditionById,
} from '../data/reference-data';

const router = Router();

/**
 * GET /api/v1/reference/invoice-types
 * Get all invoice types
 */
router.get('/invoice-types', (req: Request, res: Response) => {
  const { category } = req.query;

  let filteredTypes = INVOICE_TYPES;

  if (category && typeof category === 'string') {
    filteredTypes = INVOICE_TYPES.filter((type) => type.category === category);
  }

  res.json({
    success: true,
    data: filteredTypes,
    count: filteredTypes.length,
  });
});

/**
 * GET /api/v1/reference/invoice-types/:id
 * Get invoice type by ID
 */
router.get('/invoice-types/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid invoice type ID',
    });
  }

  const invoiceType = getInvoiceTypeById(id);

  if (!invoiceType) {
    return res.status(404).json({
      success: false,
      error: 'Invoice type not found',
    });
  }

  res.json({
    success: true,
    data: invoiceType,
  });
});

/**
 * GET /api/v1/reference/vat-rates
 * Get all VAT rates
 */
router.get('/vat-rates', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: VAT_RATES,
    count: VAT_RATES.length,
  });
});

/**
 * GET /api/v1/reference/vat-rates/:id
 * Get VAT rate by ID
 */
router.get('/vat-rates/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid VAT rate ID',
    });
  }

  const vatRate = getVATRateById(id);

  if (!vatRate) {
    return res.status(404).json({
      success: false,
      error: 'VAT rate not found',
    });
  }

  res.json({
    success: true,
    data: vatRate,
  });
});

/**
 * GET /api/v1/reference/document-types
 * Get all document types
 */
router.get('/document-types', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: DOCUMENT_TYPES,
    count: DOCUMENT_TYPES.length,
  });
});

/**
 * GET /api/v1/reference/document-types/:id
 * Get document type by ID
 */
router.get('/document-types/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid document type ID',
    });
  }

  const documentType = getDocumentTypeById(id);

  if (!documentType) {
    return res.status(404).json({
      success: false,
      error: 'Document type not found',
    });
  }

  res.json({
    success: true,
    data: documentType,
  });
});

/**
 * GET /api/v1/reference/concept-types
 * Get all concept types
 */
router.get('/concept-types', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: CONCEPT_TYPES,
    count: CONCEPT_TYPES.length,
  });
});

/**
 * GET /api/v1/reference/concept-types/:id
 * Get concept type by ID
 */
router.get('/concept-types/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid concept type ID',
    });
  }

  const conceptType = getConceptTypeById(id);

  if (!conceptType) {
    return res.status(404).json({
      success: false,
      error: 'Concept type not found',
    });
  }

  res.json({
    success: true,
    data: conceptType,
  });
});

/**
 * GET /api/v1/reference/tax-types
 * Get all tax types
 */
router.get('/tax-types', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: TAX_TYPES,
    count: TAX_TYPES.length,
  });
});

/**
 * GET /api/v1/reference/tax-types/:id
 * Get tax type by ID
 */
router.get('/tax-types/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid tax type ID',
    });
  }

  const taxType = getTaxTypeById(id);

  if (!taxType) {
    return res.status(404).json({
      success: false,
      error: 'Tax type not found',
    });
  }

  res.json({
    success: true,
    data: taxType,
  });
});

/**
 * GET /api/v1/reference/currencies
 * Get all supported currencies
 */
router.get('/currencies', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: CURRENCIES,
    count: CURRENCIES.length,
  });
});

/**
 * GET /api/v1/reference/currencies/:code
 * Get currency by code
 */
router.get('/currencies/:code', (req: Request, res: Response) => {
  const code = req.params.code.toUpperCase();

  const currency = getCurrencyByCode(code);

  if (!currency) {
    return res.status(404).json({
      success: false,
      error: 'Currency not found',
    });
  }

  res.json({
    success: true,
    data: currency,
  });
});

/**
 * GET /api/v1/reference/iva-conditions
 * Get all IVA conditions
 */
router.get('/iva-conditions', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: IVA_CONDITIONS,
    count: IVA_CONDITIONS.length,
  });
});

/**
 * GET /api/v1/reference/iva-conditions/:id
 * Get IVA condition by ID
 */
router.get('/iva-conditions/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid IVA condition ID',
    });
  }

  const ivaCondition = getIVAConditionById(id);

  if (!ivaCondition) {
    return res.status(404).json({
      success: false,
      error: 'IVA condition not found',
    });
  }

  res.json({
    success: true,
    data: ivaCondition,
  });
});

/**
 * GET /api/v1/reference
 * Get all reference data (useful for SDK initialization)
 */
router.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      invoiceTypes: INVOICE_TYPES,
      vatRates: VAT_RATES,
      documentTypes: DOCUMENT_TYPES,
      conceptTypes: CONCEPT_TYPES,
      taxTypes: TAX_TYPES,
      currencies: CURRENCIES,
      ivaConditions: IVA_CONDITIONS,
    },
    counts: {
      invoiceTypes: INVOICE_TYPES.length,
      vatRates: VAT_RATES.length,
      documentTypes: DOCUMENT_TYPES.length,
      conceptTypes: CONCEPT_TYPES.length,
      taxTypes: TAX_TYPES.length,
      currencies: CURRENCIES.length,
      ivaConditions: IVA_CONDITIONS.length,
    },
  });
});

export default router;
