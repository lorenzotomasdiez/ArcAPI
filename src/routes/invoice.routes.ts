/**
 * Invoice routes
 * Core API endpoints for invoice management
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { invoiceService } from '../services/invoice.service';
import { logger } from '../config/logger';

const router = Router();

// All routes require authentication
router.use(authenticate());

/**
 * POST /api/v1/invoices
 * Create a new invoice
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      clientId,
      pointOfSaleId,
      invoiceType,
      issueDate,
      dueDate,
      concept,
      currency,
      currencyExchangeRate,
      items,
      notes,
    } = req.body;

    // Validation
    if (!clientId || !invoiceType || !concept || !items) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: clientId, invoiceType, concept, items',
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one item is required',
      });
    }

    const userId = req.user!.id;

    // Create invoice
    const invoice = await invoiceService.createInvoice(userId, {
      clientId,
      pointOfSaleId,
      invoiceType,
      issueDate: issueDate ? new Date(issueDate) : undefined,
      dueDate: dueDate ? new Date(dueDate) : null,
      concept,
      currency,
      currencyExchangeRate,
      items,
      notes,
    });

    res.status(201).json({
      success: true,
      data: invoice,
      message: invoice?.status === 'APPROVED' ? 'Invoice created and approved by ARCA' : 'Invoice created',
    });
  } catch (error) {
    logger.error('Error creating invoice', { error, userId: req.user?.id });

    res.status(400).json({
      success: false,
      error: 'Failed to create invoice',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/v1/invoices
 * List invoices with filters and pagination
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      clientId,
      pointOfSaleId,
      invoiceType,
      status,
      dateFrom,
      dateTo,
      minAmount,
      maxAmount,
      page = '1',
      limit = '50',
    } = req.query;

    const filters: any = {};

    if (clientId) filters.clientId = clientId as string;
    if (pointOfSaleId) filters.pointOfSaleId = pointOfSaleId as string;
    if (invoiceType) filters.invoiceType = parseInt(invoiceType as string, 10);
    if (status) filters.status = status as string;
    if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
    if (dateTo) filters.dateTo = new Date(dateTo as string);
    if (minAmount) filters.minAmount = parseFloat(minAmount as string);
    if (maxAmount) filters.maxAmount = parseFloat(maxAmount as string);

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const result = await invoiceService.listInvoices(userId, filters, pageNum, limitNum);

    res.json({
      success: true,
      data: result.invoices,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: result.total,
        pages: Math.ceil(result.total / limitNum),
      },
    });
  } catch (error) {
    logger.error('Error listing invoices', { error, userId: req.user?.id });

    res.status(500).json({
      success: false,
      error: 'Failed to list invoices',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/v1/invoices/statistics
 * Get invoice statistics
 */
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { dateFrom, dateTo } = req.query;

    const filters: any = {};
    if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
    if (dateTo) filters.dateTo = new Date(dateTo as string);

    const statistics = await invoiceService.getStatistics(userId, filters.dateFrom, filters.dateTo);

    res.json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    logger.error('Error getting invoice statistics', { error, userId: req.user?.id });

    res.status(500).json({
      success: false,
      error: 'Failed to get statistics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/v1/invoices/:id
 * Get a specific invoice by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const invoice = await invoiceService.getInvoice(userId, id);

    res.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    logger.error('Error fetching invoice', { error, userId: req.user?.id, invoiceId: req.params.id });

    const statusCode = error instanceof Error && error.message === 'Invoice not found' ? 404 :
                       error instanceof Error && error.message === 'Access denied' ? 403 : 500;

    res.status(statusCode).json({
      success: false,
      error: 'Failed to fetch invoice',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/v1/invoices/:id/pdf
 * Generate PDF for an invoice (placeholder for future implementation)
 */
router.post('/:id/pdf', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Verify invoice exists and belongs to user
    await invoiceService.getInvoice(userId, id);

    // TODO: Implement PDF generation
    res.status(501).json({
      success: false,
      error: 'PDF generation not yet implemented',
      message: 'This feature will be available in a future release',
    });
  } catch (error) {
    logger.error('Error generating PDF', { error, userId: req.user?.id, invoiceId: req.params.id });

    res.status(500).json({
      success: false,
      error: 'Failed to generate PDF',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/v1/invoices/:id/email
 * Send invoice by email (placeholder for future implementation)
 */
router.post('/:id/email', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { to, subject, message } = req.body;

    // Verify invoice exists and belongs to user
    await invoiceService.getInvoice(userId, id);

    // TODO: Implement email sending
    res.status(501).json({
      success: false,
      error: 'Email sending not yet implemented',
      message: 'This feature will be available in a future release',
    });
  } catch (error) {
    logger.error('Error sending invoice email', { error, userId: req.user?.id, invoiceId: req.params.id });

    res.status(500).json({
      success: false,
      error: 'Failed to send email',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
