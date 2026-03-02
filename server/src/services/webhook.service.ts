/* global URL */
import { prisma } from '../config/database.js';
import { Prisma } from '@prisma/client';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import crypto from 'crypto';
import axios from 'axios';

export class WebhookService {
  /**
   * Create webhook configuration (used by tests and admin UI)
   */
  static async createWebhook(data: {
    name: string;
    url: string;
    secret: string;
    events: string[];
    isActive?: boolean;
  }) {
    try {
      // basic URL validation
      try {
        new URL(data.url);
      } catch {
        throw new ValidationError('Invalid webhook URL');
      }

      const config = await prisma.webhookEndpoint.create({
        data: {
          name: data.name,
          url: data.url,
          secret: data.secret,
          eventTypes: data.events,
          isActive: data.isActive ?? true,
        },
      });

      return config;
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      logger.error('Error creating webhook config:', error);
      throw error;
    }
  }

  /**
   * Sign an outgoing payload using the stored secret
   */
  static async signPayload(configId: string, payload: unknown) {
    const config = await prisma.webhookEndpoint.findUnique({
      where: { id: configId },
    });

    if (!config || !config.isActive) {
      throw new NotFoundError('Webhook config not found');
    }

    const body = JSON.stringify(payload);
    const hmac = crypto.createHmac('sha256', config.secret || '');
    hmac.update(body);
    return hmac.digest('hex');
  }

  /**
   * Verify an incoming payload signature
   */
  static async verifySignature(configId: string, payload: unknown, signature: string) {
    const config = await prisma.webhookEndpoint.findUnique({
      where: { id: configId },
    });

    if (!config || !config.isActive) {
      return false;
    }

    const expected = await this.signPayload(configId, payload);
    return expected === signature;
  }

  /**
   * Create webhook endpoint
   */
  static async createEndpoint(data: {
    name: string;
    url: string;
    description?: string;
    eventTypes: string[];
    secret?: string;
    headers?: Record<string, string>;
    maxRetries?: number;
    retryDelay?: number;
    createdBy?: string;
  }) {
    try {
      // Validate URL
      try {
        new URL(data.url);
      } catch {
        throw new ValidationError('Invalid webhook URL');
      }

      // Generate secret if not provided
      const secret = data.secret || crypto.randomBytes(32).toString('hex');

      const endpoint = await prisma.webhookEndpoint.create({
        data: {
          name: data.name,
          url: data.url,
          description: data.description,
          eventTypes: data.eventTypes,
          secret,
          headers: data.headers || {},
          maxRetries: data.maxRetries || 3,
          retryDelay: data.retryDelay || 1000,
          createdBy: data.createdBy,
        },
      });

      logger.info(`Webhook endpoint created: ${endpoint.id}`);
      return endpoint;
    } catch (error: unknown) {
      if (error instanceof ValidationError) {
        throw error;
      }
      logger.error('Error creating webhook endpoint:', error);
      throw new ValidationError(`Failed to create webhook endpoint: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all webhook endpoints
   */
  static async getEndpoints(filters?: {
    isActive?: boolean;
    eventType?: string;
  }) {
    try {
      const where: {
        isActive?: boolean;
        eventTypes?: { has: string };
      } = {};

      if (filters?.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      if (filters?.eventType) {
        where.eventTypes = { has: filters.eventType };
      }

      const endpoints = await prisma.webhookEndpoint.findMany({
        where,
        include: {
          _count: {
            select: {
              deliveries: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return endpoints;
    } catch (error: unknown) {
      logger.error('Error fetching webhook endpoints:', error);
      throw new ValidationError(`Failed to fetch endpoints: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get webhook endpoint by ID
   */
  static async getEndpointById(endpointId: string) {
    try {
      const endpoint = await prisma.webhookEndpoint.findUnique({
        where: { id: endpointId },
        include: {
          deliveries: {
            orderBy: { triggeredAt: 'desc' },
            take: 50,
          },
        },
      });

      if (!endpoint) {
        throw new NotFoundError('Webhook endpoint not found');
      }

      return endpoint;
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error fetching webhook endpoint:', error);
      throw new ValidationError(`Failed to fetch endpoint: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update webhook endpoint
   */
  static async updateEndpoint(
    endpointId: string,
    data: {
      name?: string;
      url?: string;
      description?: string;
      eventTypes?: string[];
      secret?: string;
      headers?: Record<string, string>;
      maxRetries?: number;
      retryDelay?: number;
      isActive?: boolean;
    },
  ) {
    try {
      const endpoint = await prisma.webhookEndpoint.findUnique({
        where: { id: endpointId },
      });

      if (!endpoint) {
        throw new NotFoundError('Webhook endpoint not found');
      }

      // Validate URL if provided
      if (data.url) {
        try {
          new URL(data.url);
        } catch {
          throw new ValidationError('Invalid webhook URL');
        }
      }

      const updated = await prisma.webhookEndpoint.update({
        where: { id: endpointId },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.url && { url: data.url }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.eventTypes && { eventTypes: data.eventTypes }),
          ...(data.secret && { secret: data.secret }),
          ...(data.headers && { headers: data.headers }),
          ...(data.maxRetries !== undefined && { maxRetries: data.maxRetries }),
          ...(data.retryDelay !== undefined && { retryDelay: data.retryDelay }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      });

      logger.info(`Webhook endpoint updated: ${endpointId}`);
      return updated;
    } catch (error: unknown) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      logger.error('Error updating webhook endpoint:', error);
      throw new ValidationError(`Failed to update endpoint: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete webhook endpoint
   */
  static async deleteEndpoint(endpointId: string) {
    try {
      const endpoint = await prisma.webhookEndpoint.findUnique({
        where: { id: endpointId },
      });

      if (!endpoint) {
        throw new NotFoundError('Webhook endpoint not found');
      }

      await prisma.webhookEndpoint.delete({
        where: { id: endpointId },
      });

      logger.info(`Webhook endpoint deleted: ${endpointId}`);
      return { success: true };
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error deleting webhook endpoint:', error);
      throw new ValidationError(`Failed to delete endpoint: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Trigger webhook for an event
   */
  static async triggerWebhook(
    eventType: string,
    eventData: Record<string, unknown>,
    eventId?: string,
  ) {
    try {
      // Find all active endpoints subscribed to this event type
      const endpoints = await prisma.webhookEndpoint.findMany({
        where: {
          isActive: true,
          eventTypes: { has: eventType },
        },
      });

      if (endpoints.length === 0) {
        logger.debug(`No webhook endpoints found for event type: ${eventType}`);
        return { triggered: 0 };
      }

      // Trigger webhook for each endpoint
      const promises = endpoints.map((endpoint) =>
        this.deliverWebhook(endpoint.id, eventType, eventData, eventId),
      );

      await Promise.allSettled(promises);

      logger.info(`Webhook triggered for event: ${eventType} to ${endpoints.length} endpoints`);
      return { triggered: endpoints.length };
    } catch (error: unknown) {
      logger.error('Error triggering webhook:', error);
      // Don't throw - webhook failures shouldn't break the main flow
      return { triggered: 0, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Deliver webhook to an endpoint
   */
  private static async deliverWebhook(
    endpointId: string,
    eventType: string,
    eventData: Record<string, unknown>,
    eventId?: string,
  ) {
    try {
      const endpoint = await prisma.webhookEndpoint.findUnique({
        where: { id: endpointId },
      });

      if (!endpoint || !endpoint.isActive) {
        return;
      }

      // Create delivery record
      const delivery = await prisma.webhookDelivery.create({
        data: {
          endpointId,
          eventType,
          eventId,
          payload: eventData as Prisma.JsonValue,
          status: 'PENDING',
          maxAttempts: endpoint.maxRetries,
        },
      });

      // Attempt delivery
      await this.attemptDelivery(delivery.id, endpoint);

      // Update endpoint statistics
      await prisma.webhookEndpoint.update({
        where: { id: endpointId },
        data: {
          lastTriggeredAt: new Date(),
        },
      });
    } catch (error: unknown) {
      logger.error(`Error delivering webhook to endpoint ${endpointId}:`, error);
    }
  }

  /**
   * Attempt to deliver a webhook
   */
  private static async attemptDelivery(
    deliveryId: string,
    endpoint: { url: string; secret?: string | null; headers?: Prisma.JsonValue },
  ) {
    try {
      const delivery = await prisma.webhookDelivery.findUnique({
        where: { id: deliveryId },
      });

      if (!delivery) {
        return;
      }

      // Prepare payload
      const payload = {
        event: delivery.eventType,
        data: delivery.payload,
        timestamp: new Date().toISOString(),
      };

      // Generate signature if secret exists
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'EventKnit-Webhook/1.0',
        ...(endpoint.headers as Record<string, string> || {}),
      };

      if (endpoint.secret) {
        const signature = crypto
          .createHmac('sha256', endpoint.secret)
          .update(JSON.stringify(payload))
          .digest('hex');
        headers['X-Webhook-Signature'] = signature;
      }

      // Send webhook using axios
      const response = await axios.post(endpoint.url, payload, {
        headers,
        timeout: 10000, // 10 second timeout
        validateStatus: () => true, // Don't throw on any status code
      });

      const responseBody = typeof response.data === 'string' 
        ? response.data 
        : JSON.stringify(response.data);

      // Update delivery record
      const isSuccess = response.status >= 200 && response.status < 300;

      await prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          attemptCount: { increment: 1 },
          status: isSuccess ? 'SUCCESS' : delivery.attemptCount + 1 >= endpoint.maxRetries ? 'FAILED' : 'RETRYING',
          responseCode: response.status,
          responseBody: responseBody.substring(0, 1000), // Limit response body size
          deliveredAt: isSuccess ? new Date() : null,
          nextRetryAt: !isSuccess && delivery.attemptCount + 1 < endpoint.maxRetries
            ? new Date(Date.now() + endpoint.retryDelay * Math.pow(2, delivery.attemptCount)) // Exponential backoff
            : null,
        },
      });

      // Update endpoint statistics
      await prisma.webhookEndpoint.update({
        where: { id: endpoint.id },
        data: {
          successCount: isSuccess ? { increment: 1 } : undefined,
          failureCount: !isSuccess ? { increment: 1 } : undefined,
        },
      });

      // Schedule retry if failed and not exceeded max attempts
      if (!isSuccess && delivery.attemptCount + 1 < endpoint.maxRetries) {
        // Retry will be handled by a background job or cron
        logger.info(`Webhook delivery ${deliveryId} will be retried`);
      }
    } catch (error: unknown) {
      logger.error(`Error attempting webhook delivery ${deliveryId}:`, error);

      // Update delivery as failed
      await prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          attemptCount: { increment: 1 },
          status: 'FAILED',
          errorMessage: error.message?.substring(0, 500),
          nextRetryAt: null,
        },
      });
    }
  }

  /**
   * Retry failed webhook deliveries
   */
  static async retryFailedDeliveries() {
    try {
      const failedDeliveries = await prisma.webhookDelivery.findMany({
        where: {
          status: 'RETRYING',
          nextRetryAt: {
            lte: new Date(),
          },
        },
        include: {
          endpoint: true,
        },
        take: 100, // Process in batches
      });

      for (const delivery of failedDeliveries) {
        if (delivery.attemptCount < delivery.maxAttempts) {
          await this.attemptDelivery(delivery.id, delivery.endpoint);
        } else {
          // Mark as permanently failed
          await prisma.webhookDelivery.update({
            where: { id: delivery.id },
            data: {
              status: 'FAILED',
              nextRetryAt: null,
            },
          });
        }
      }

      logger.info(`Retried ${failedDeliveries.length} webhook deliveries`);
      return { retried: failedDeliveries.length };
    } catch (error: unknown) {
      logger.error('Error retrying webhook deliveries:', error);
      throw new ValidationError(`Failed to retry deliveries: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test webhook endpoint
   */
  static async testEndpoint(endpointId: string) {
    try {
      const endpoint = await prisma.webhookEndpoint.findUnique({
        where: { id: endpointId },
      });

      if (!endpoint) {
        throw new NotFoundError('Webhook endpoint not found');
      }

      // Send test webhook
      const testPayload = {
        event: 'webhook.test',
        data: {
          message: 'This is a test webhook from EventKnit',
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };

      await this.deliverWebhook(endpointId, 'webhook.test', testPayload.data, 'test');

      return { success: true, message: 'Test webhook sent' };
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error testing webhook endpoint:', error);
      throw new ValidationError(`Failed to test endpoint: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get webhook delivery history
   */
  static async getDeliveryHistory(filters?: {
    endpointId?: string;
    eventType?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 50;
      const skip = (page - 1) * limit;

      const where: {
        endpointId?: string;
        status?: string;
        triggeredAt?: { gte?: Date; lte?: Date };
      } = {};

      if (filters?.endpointId) {
        where.endpointId = filters.endpointId;
      }

      if (filters?.eventType) {
        where.eventType = filters.eventType;
      }

      if (filters?.status) {
        where.status = filters.status;
      }

      const [deliveries, total] = await Promise.all([
        prisma.webhookDelivery.findMany({
          where,
          include: {
            endpoint: {
              select: {
                id: true,
                name: true,
                url: true,
              },
            },
          },
          orderBy: { triggeredAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.webhookDelivery.count({ where }),
      ]);

      return {
        deliveries,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: unknown) {
      logger.error('Error fetching webhook delivery history:', error);
      throw new ValidationError(`Failed to fetch delivery history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
