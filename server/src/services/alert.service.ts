/**
 * Alert Service
 * Coordinates multi-channel notifications for capacity and other system alerts
 */

import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { websocketService } from './websocket.service.js';
import { emailService } from './email.service.js';
import { pushNotificationService } from './push-notification.service.js';
import { CapacityAlert } from './venue-capacity.service.js';

export type AlertChannel = 'websocket' | 'email' | 'push' | 'sms' | 'webhook';

export interface AlertPayload {
  eventId: string;
  type: 'capacity' | 'zone_capacity' | 'quota' | 'system';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

export class AlertService {
  /**
   * Send capacity alert through configured channels
   */
  static async sendCapacityAlert(alert: CapacityAlert): Promise<void> {
    const severity = this.getSeverityFromThreshold(alert.threshold);
    const title = this.getCapacityAlertTitle(alert);
    const message = this.getCapacityAlertMessage(alert);

    // Get event details for context
    const event = await prisma.event.findUnique({
      where: { id: alert.eventId },
      select: {
        title: true,
        organizerId: true,
      },
    });

    if (!event) {
      logger.warn('Event not found for alert', { eventId: alert.eventId });
      return;
    }

    // Get event staff with admin roles
    const eventStaff = await prisma.eventStaff.findMany({
      where: {
        eventId: alert.eventId,
        role: { in: ['SUPERADMIN', 'ADMIN_STAFF'] },
      },
      select: {
        staffId: true,
      },
    });

    // Collect recipient user IDs
    const recipientIds = new Set<string>();
    recipientIds.add(event.organizerId);
    eventStaff.forEach((s) => recipientIds.add(s.staffId));

    const payload: AlertPayload = {
      eventId: alert.eventId,
      type: alert.type === 'zone' ? 'zone_capacity' : 'capacity',
      severity,
      title,
      message,
      data: {
        threshold: alert.threshold,
        currentOccupancy: alert.currentOccupancy,
        maxCapacity: alert.maxCapacity,
        percentageFilled: alert.percentageFilled,
        zoneId: alert.zoneId,
        zoneName: alert.zoneName,
      },
      timestamp: alert.timestamp,
    };

    // Send through all configured channels
    await Promise.all([
      this.sendWebSocketAlert(alert.eventId, alert),
      this.sendEmailAlert(payload, Array.from(recipientIds), event.title),
      this.sendPushAlert(payload, Array.from(recipientIds)),
    ]);

    // Log the alert
    logger.info('Capacity alert sent', {
      eventId: alert.eventId,
      type: alert.type,
      threshold: alert.threshold,
      channels: ['websocket', 'email', 'push'],
    });
  }

  /**
   * Send alert via WebSocket
   */
  private static async sendWebSocketAlert(
    eventId: string,
    capacityAlert: CapacityAlert,
  ): Promise<void> {
    try {
      // Format for websocket capacity alert
      const wsAlert = {
        zoneId: capacityAlert.zoneId || eventId,
        zoneName: capacityAlert.zoneName || 'Venue',
        currentOccupancy: capacityAlert.currentOccupancy,
        maxCapacity: capacityAlert.maxCapacity,
        percentage: capacityAlert.percentageFilled,
        threshold: capacityAlert.threshold,
      };

      websocketService.emitCapacityAlert(eventId, wsAlert);
    } catch (error) {
      logger.error('Failed to send WebSocket alert', { error, eventId });
    }
  }

  /**
   * Send alert via Email
   */
  private static async sendEmailAlert(
    payload: AlertPayload,
    recipientIds: string[],
    eventTitle: string,
  ): Promise<void> {
    if (recipientIds.length === 0) return;

    try {
      // Get recipient emails
      const users = await prisma.user.findMany({
        where: { id: { in: recipientIds } },
        select: { email: true, firstName: true },
      });

      for (const user of users) {
        await emailService.sendEmail({
          to: user.email,
          subject: `[${payload.severity.toUpperCase()}] ${payload.title} - ${eventTitle}`,
          html: this.formatEmailBody(payload, eventTitle, user.firstName || 'User'),
        });
      }
    } catch (error) {
      logger.error('Failed to send email alert', { error, recipientCount: recipientIds.length });
    }
  }

  /**
   * Send alert via Push Notification
   */
  private static async sendPushAlert(
    payload: AlertPayload,
    recipientIds: string[],
  ): Promise<void> {
    if (recipientIds.length === 0) return;

    try {
      await pushNotificationService.sendToUsers(recipientIds, {
        title: payload.title,
        body: payload.message,
        data: {
          type: payload.type,
          eventId: payload.eventId,
          ...payload.data,
        },
      });
    } catch (error) {
      logger.error('Failed to send push alert', { error, recipientCount: recipientIds.length });
    }
  }

  /**
   * Determine severity from threshold
   */
  private static getSeverityFromThreshold(threshold: number): 'info' | 'warning' | 'critical' {
    if (threshold >= 95) return 'critical';
    if (threshold >= 80) return 'warning';
    return 'info';
  }

  /**
   * Generate alert title from capacity alert
   */
  private static getCapacityAlertTitle(alert: CapacityAlert): string {
    const location = alert.zoneName || 'Venue';
    if (alert.threshold >= 100) {
      return `${location} at Maximum Capacity`;
    }
    return `${location} at ${alert.threshold}% Capacity`;
  }

  /**
   * Generate alert message from capacity alert
   */
  private static getCapacityAlertMessage(alert: CapacityAlert): string {
    const location = alert.zoneName || 'The venue';
    if (alert.threshold >= 100) {
      return `${location} has reached maximum capacity (${alert.currentOccupancy}/${alert.maxCapacity}). New check-ins will be blocked.`;
    }
    return `${location} is now at ${alert.percentageFilled}% capacity (${alert.currentOccupancy}/${alert.maxCapacity}).`;
  }

  /**
   * Format email body for capacity alert
   */
  private static formatEmailBody(
    payload: AlertPayload,
    eventTitle: string,
    recipientName: string,
  ): string {
    const severityColors = {
      info: '#3498db',
      warning: '#f39c12',
      critical: '#e74c3c',
    };

    const color = severityColors[payload.severity];
    const data = payload.data as {
      currentOccupancy?: number;
      maxCapacity?: number;
      percentageFilled?: number;
      zoneName?: string;
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${color}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .metric { font-size: 24px; font-weight: bold; color: ${color}; }
          .footer { margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0;">${payload.title}</h2>
            <p style="margin: 10px 0 0;">${eventTitle}</p>
          </div>
          <div class="content">
            <p>Hi ${recipientName},</p>
            <p>${payload.message}</p>
            <p class="metric">${data.currentOccupancy} / ${data.maxCapacity}</p>
            <p>Current occupancy: <strong>${data.percentageFilled}%</strong></p>
            ${data.zoneName ? `<p>Location: <strong>${data.zoneName}</strong></p>` : ''}
            <p>Time: ${payload.timestamp.toLocaleString()}</p>
          </div>
          <div class="footer">
            <p>This is an automated alert from EventKnit. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Send a batch of capacity alerts
   */
  static async sendCapacityAlerts(alerts: CapacityAlert[]): Promise<void> {
    for (const alert of alerts) {
      await this.sendCapacityAlert(alert);
    }
  }

  /**
   * Send custom alert
   */
  static async sendCustomAlert(
    eventId: string,
    title: string,
    message: string,
    severity: 'info' | 'warning' | 'critical' = 'info',
    channels: AlertChannel[] = ['websocket'],
  ): Promise<void> {
    if (channels.includes('websocket')) {
      // Emit as a custom alert through websocket
      websocketService.emitCapacityAlert(eventId, {
        zoneId: 'system',
        zoneName: title,
        currentOccupancy: 0,
        maxCapacity: 0,
        percentage: 0,
        threshold: 0,
      });
    }

    logger.info('Custom alert sent', { eventId, title, severity, channels });
  }
}
