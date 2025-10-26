/**
 * Client routes
 * Manages customer/client information
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { clientRepository } from '../repositories/client.repository';
import { logger } from '../config/logger';
import { getDocumentTypeByCode, getIVAConditionByCode } from '../data/reference-data';

const router = Router();

// All routes require authentication
router.use(authenticate());

/**
 * POST /api/v1/clients
 * Create a new client
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { taxId, taxIdType, name, email, phone, address, city, province, postalCode, ivaCondition, metadata } =
      req.body;

    // Validation
    if (!taxId || !taxIdType || !name || !ivaCondition) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: taxId, taxIdType, name, ivaCondition',
      });
    }

    // Validate document type
    const documentType = getDocumentTypeByCode(taxIdType);
    if (!documentType) {
      return res.status(400).json({
        success: false,
        error: `Invalid taxIdType: ${taxIdType}`,
      });
    }

    // Validate IVA condition
    const ivaConditionData = getIVAConditionByCode(ivaCondition);
    if (!ivaConditionData) {
      return res.status(400).json({
        success: false,
        error: `Invalid ivaCondition: ${ivaCondition}`,
      });
    }

    const userId = req.user!.id;

    // Check if client already exists
    const existingClient = await clientRepository.findByUserAndTaxId(userId, taxId);
    if (existingClient) {
      return res.status(409).json({
        success: false,
        error: 'Client with this tax ID already exists',
        data: existingClient,
      });
    }

    const client = await clientRepository.create({
      userId,
      taxId,
      taxIdType,
      name,
      email,
      phone,
      address,
      city,
      province,
      postalCode,
      ivaCondition,
      metadata,
    });

    logger.info('Client created', {
      userId,
      clientId: client.id,
      taxId,
    });

    res.status(201).json({
      success: true,
      data: client,
    });
  } catch (error) {
    logger.error('Error creating client', { error, userId: req.user?.id });

    res.status(500).json({
      success: false,
      error: 'Failed to create client',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/v1/clients
 * Get all clients for the authenticated user
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { taxId, name, email, ivaCondition, isActive } = req.query;

    const filters: any = { userId };

    if (taxId) filters.taxId = taxId as string;
    if (name) filters.name = name as string;
    if (email) filters.email = email as string;
    if (ivaCondition) filters.ivaCondition = ivaCondition as string;
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    const clients = await clientRepository.findAll(filters);

    res.json({
      success: true,
      data: clients,
      count: clients.length,
    });
  } catch (error) {
    logger.error('Error fetching clients', { error, userId: req.user?.id });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch clients',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/v1/clients/:id
 * Get a specific client by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const client = await clientRepository.findById(id);

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client not found',
      });
    }

    // Ensure the client belongs to the authenticated user
    if (client.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    res.json({
      success: true,
      data: client,
    });
  } catch (error) {
    logger.error('Error fetching client', { error, userId: req.user?.id, clientId: req.params.id });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch client',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * PUT /api/v1/clients/:id
 * Update a client
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { name, email, phone, address, city, province, postalCode, ivaCondition, metadata } = req.body;

    const existingClient = await clientRepository.findById(id);

    if (!existingClient) {
      return res.status(404).json({
        success: false,
        error: 'Client not found',
      });
    }

    // Ensure the client belongs to the authenticated user
    if (existingClient.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    // Validate IVA condition if provided
    if (ivaCondition) {
      const ivaConditionData = getIVAConditionByCode(ivaCondition);
      if (!ivaConditionData) {
        return res.status(400).json({
          success: false,
          error: `Invalid ivaCondition: ${ivaCondition}`,
        });
      }
    }

    const updatedClient = await clientRepository.update(id, {
      name,
      email,
      phone,
      address,
      city,
      province,
      postalCode,
      ivaCondition,
      metadata,
    });

    logger.info('Client updated', {
      userId,
      clientId: id,
    });

    res.json({
      success: true,
      data: updatedClient,
    });
  } catch (error) {
    logger.error('Error updating client', { error, userId: req.user?.id, clientId: req.params.id });

    res.status(500).json({
      success: false,
      error: 'Failed to update client',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /api/v1/clients/:id
 * Soft delete a client (mark as inactive)
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { permanent } = req.query;

    const existingClient = await clientRepository.findById(id);

    if (!existingClient) {
      return res.status(404).json({
        success: false,
        error: 'Client not found',
      });
    }

    // Ensure the client belongs to the authenticated user
    if (existingClient.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    let deletedClient;
    if (permanent === 'true') {
      deletedClient = await clientRepository.delete(id);
      logger.info('Client permanently deleted', { userId, clientId: id });
    } else {
      deletedClient = await clientRepository.softDelete(id);
      logger.info('Client soft deleted', { userId, clientId: id });
    }

    res.json({
      success: true,
      data: deletedClient,
      message: permanent === 'true' ? 'Client permanently deleted' : 'Client deactivated',
    });
  } catch (error) {
    logger.error('Error deleting client', { error, userId: req.user?.id, clientId: req.params.id });

    res.status(500).json({
      success: false,
      error: 'Failed to delete client',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
