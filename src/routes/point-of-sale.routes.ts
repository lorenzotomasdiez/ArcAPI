/**
 * Point of Sale routes
 * Manages ARCA points of sale (puntos de venta)
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { pointOfSaleRepository } from '../repositories/point-of-sale.repository';
import { logger } from '../config/logger';

const router = Router();

// All routes require authentication
router.use(authenticate());

/**
 * POST /api/v1/points-of-sale
 * Create a new point of sale
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { number, name, isProduction, metadata } = req.body;

    // Validation
    if (number === undefined || !name || isProduction === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: number, name, isProduction',
      });
    }

    if (typeof number !== 'number' || number < 1) {
      return res.status(400).json({
        success: false,
        error: 'Point of sale number must be a positive integer',
      });
    }

    const userId = req.user!.id;

    // Check if point of sale already exists
    const existingPos = await pointOfSaleRepository.findByUserAndNumber(userId, number);
    if (existingPos) {
      return res.status(409).json({
        success: false,
        error: 'Point of sale with this number already exists',
        data: existingPos,
      });
    }

    const pointOfSale = await pointOfSaleRepository.create({
      userId,
      number,
      name,
      isProduction,
      metadata,
    });

    logger.info('Point of sale created', {
      userId,
      posId: pointOfSale.id,
      number,
    });

    res.status(201).json({
      success: true,
      data: pointOfSale,
    });
  } catch (error) {
    logger.error('Error creating point of sale', { error, userId: req.user?.id });

    res.status(500).json({
      success: false,
      error: 'Failed to create point of sale',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/v1/points-of-sale
 * Get all points of sale for the authenticated user
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { number, isActive } = req.query;

    const filters: any = { userId };

    if (number !== undefined) filters.number = parseInt(number as string, 10);
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    const pointsOfSale = await pointOfSaleRepository.findAll(filters);

    res.json({
      success: true,
      data: pointsOfSale,
      count: pointsOfSale.length,
    });
  } catch (error) {
    logger.error('Error fetching points of sale', { error, userId: req.user?.id });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch points of sale',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/v1/points-of-sale/default
 * Get the default point of sale for the user
 */
router.get('/default', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const pointOfSale = await pointOfSaleRepository.getDefaultForUser(userId);

    if (!pointOfSale) {
      return res.status(404).json({
        success: false,
        error: 'No point of sale found. Please create one first.',
      });
    }

    res.json({
      success: true,
      data: pointOfSale,
    });
  } catch (error) {
    logger.error('Error fetching default point of sale', { error, userId: req.user?.id });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch default point of sale',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/v1/points-of-sale/:id
 * Get a specific point of sale by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const pointOfSale = await pointOfSaleRepository.findById(id);

    if (!pointOfSale) {
      return res.status(404).json({
        success: false,
        error: 'Point of sale not found',
      });
    }

    // Ensure the point of sale belongs to the authenticated user
    if (pointOfSale.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    res.json({
      success: true,
      data: pointOfSale,
    });
  } catch (error) {
    logger.error('Error fetching point of sale', { error, userId: req.user?.id, posId: req.params.id });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch point of sale',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/v1/points-of-sale/:id/next-invoice-number/:invoiceType
 * Get the next available invoice number for a specific invoice type
 */
router.get('/:id/next-invoice-number/:invoiceType', async (req: Request, res: Response) => {
  try {
    const { id, invoiceType } = req.params;
    const userId = req.user!.id;

    const invoiceTypeNum = parseInt(invoiceType, 10);
    if (isNaN(invoiceTypeNum)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid invoice type',
      });
    }

    const pointOfSale = await pointOfSaleRepository.findById(id);

    if (!pointOfSale) {
      return res.status(404).json({
        success: false,
        error: 'Point of sale not found',
      });
    }

    // Ensure the point of sale belongs to the authenticated user
    if (pointOfSale.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    const nextNumber = await pointOfSaleRepository.getNextInvoiceNumber(id, invoiceTypeNum);

    res.json({
      success: true,
      data: {
        pointOfSaleNumber: pointOfSale.number,
        invoiceType: invoiceTypeNum,
        nextNumber,
        formatted: `${String(pointOfSale.number).padStart(4, '0')}-${String(nextNumber).padStart(8, '0')}`,
      },
    });
  } catch (error) {
    logger.error('Error fetching next invoice number', {
      error,
      userId: req.user?.id,
      posId: req.params.id,
      invoiceType: req.params.invoiceType,
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch next invoice number',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * PUT /api/v1/points-of-sale/:id
 * Update a point of sale
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { name, isProduction, metadata } = req.body;

    const existingPos = await pointOfSaleRepository.findById(id);

    if (!existingPos) {
      return res.status(404).json({
        success: false,
        error: 'Point of sale not found',
      });
    }

    // Ensure the point of sale belongs to the authenticated user
    if (existingPos.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    const updatedPos = await pointOfSaleRepository.update(id, {
      name,
      isProduction,
      metadata,
    });

    logger.info('Point of sale updated', {
      userId,
      posId: id,
    });

    res.json({
      success: true,
      data: updatedPos,
    });
  } catch (error) {
    logger.error('Error updating point of sale', { error, userId: req.user?.id, posId: req.params.id });

    res.status(500).json({
      success: false,
      error: 'Failed to update point of sale',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /api/v1/points-of-sale/:id
 * Soft delete a point of sale (mark as inactive)
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { permanent } = req.query;

    const existingPos = await pointOfSaleRepository.findById(id);

    if (!existingPos) {
      return res.status(404).json({
        success: false,
        error: 'Point of sale not found',
      });
    }

    // Ensure the point of sale belongs to the authenticated user
    if (existingPos.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    let deletedPos;
    if (permanent === 'true') {
      deletedPos = await pointOfSaleRepository.delete(id);
      logger.info('Point of sale permanently deleted', { userId, posId: id });
    } else {
      deletedPos = await pointOfSaleRepository.softDelete(id);
      logger.info('Point of sale soft deleted', { userId, posId: id });
    }

    res.json({
      success: true,
      data: deletedPos,
      message: permanent === 'true' ? 'Point of sale permanently deleted' : 'Point of sale deactivated',
    });
  } catch (error) {
    logger.error('Error deleting point of sale', { error, userId: req.user?.id, posId: req.params.id });

    res.status(500).json({
      success: false,
      error: 'Failed to delete point of sale',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
