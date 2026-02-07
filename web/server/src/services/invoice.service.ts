import { prisma } from '../config/database.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { Decimal } from '@prisma/client/runtime/library';

export class InvoiceService {
  /**
   * Generate invoice number
   */
  private static generateInvoiceNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INV-${year}-${random}`;
  }

  /**
   * Create invoice for a payment transaction
   */
  static async createInvoice(
    transactionId: string,
    templateId?: string,
    options?: {
      includeTax?: boolean;
      taxRate?: number;
      dueDate?: Date;
      notes?: string;
      terms?: string;
    },
  ) {
    try {
      // Get transaction with related data
      const transaction = await prisma.eventPaymentTransaction.findUnique({
        where: { id: transactionId },
        include: {
          registration: {
            include: {
              attendee: true,
              ticketLineItems: true,
              event: {
                include: {
                  organizer: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      organizationName: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!transaction) {
        throw new NotFoundError('Payment transaction not found');
      }

      // Check if invoice already exists
      const existingInvoice = await prisma.invoice.findUnique({
        where: { transactionId },
      });

      if (existingInvoice) {
        logger.warn(`Invoice already exists for transaction: ${transactionId}`);
        return existingInvoice;
      }

      // Get template (or use default)
      let template = null;
      if (templateId) {
        template = await prisma.invoiceTemplate.findUnique({
          where: { id: templateId },
        });
      } else {
        template = await prisma.invoiceTemplate.findFirst({
          where: { isDefault: true, isActive: true },
        });
      }

      // Calculate invoice items from ticket line items
      const invoiceItems = transaction.registration.ticketLineItems.map((item) => ({
        description: `${item.ticketType} x ${item.quantity}`,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        itemType: 'TICKET',
        itemId: item.id,
      }));

      // Calculate subtotal
      let subtotal = new Decimal(0);
      for (const item of invoiceItems) {
        subtotal = subtotal.plus(new Decimal(item.totalPrice));
      }

      // Calculate tax if enabled
      let taxAmount = new Decimal(0);
      if (options?.includeTax) {
        if (options?.taxRate) {
          // Use provided tax rate
          taxAmount = subtotal.times(new Decimal(options.taxRate / 100));
        } else {
          // Try to get tax rate from attendee location
          try {
            const { TaxService } = await import('./tax.service.js');
            const attendee = transaction.registration.attendee;
            if (attendee.country) {
              const taxCalculation = await TaxService.calculateTax(
                Number(subtotal),
                {
                  country: attendee.country,
                  state: attendee.state || undefined,
                  city: attendee.city || undefined,
                },
              );
              taxAmount = new Decimal(taxCalculation.taxAmount);
            }
          } catch (taxError) {
            // If tax calculation fails, continue without tax
            logger.warn('Failed to calculate tax automatically:', taxError);
          }
        }
      }

      // Calculate total
      const totalAmount = subtotal.plus(taxAmount);

      // Generate invoice number
      let invoiceNumber = this.generateInvoiceNumber();
      let attempts = 0;
      while (attempts < 10) {
        const existing = await prisma.invoice.findUnique({
          where: { invoiceNumber },
        });
        if (!existing) break;
        invoiceNumber = this.generateInvoiceNumber();
        attempts++;
      }

      // Get billing information
      const attendee = transaction.registration.attendee;
      const billToName = attendee.firstName && attendee.lastName
        ? `${attendee.firstName} ${attendee.lastName}`
        : attendee.email || transaction.attendeeName || 'Customer';

      // Create invoice
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          transactionId,
          registrationId: transaction.registrationId,
          eventId: transaction.eventId,
          issueDate: new Date(),
          dueDate: options?.dueDate || null,
          status: transaction.paymentStatus === 'success' ? 'PAID' : 'SENT',
          subtotal,
          taxAmount: options?.includeTax ? taxAmount : null,
          totalAmount,
          currency: transaction.currency,
          billToName,
          billToEmail: transaction.attendeeEmail,
          billToAddress: attendee.address || null,
          billToCity: attendee.city || null,
          billToState: attendee.state || null,
          billToCountry: attendee.country || null,
          billToZipCode: attendee.zipCode || null,
          templateId: template?.id || null,
          notes: options?.notes || null,
          terms: options?.terms || null,
          items: {
            create: invoiceItems,
          },
        },
        include: {
          items: true,
          transaction: true,
          registration: {
            include: {
              attendee: true,
              event: {
                include: {
                  organizer: {
                    select: {
                      organizationName: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Update template usage
      if (template) {
        await prisma.invoiceTemplate.update({
          where: { id: template.id },
          data: {
            usageCount: { increment: 1 },
            lastUsedAt: new Date(),
          },
        });
      }

      logger.info(`Invoice created: ${invoice.invoiceNumber} for transaction: ${transactionId}`);
      return invoice;
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      logger.error('Error creating invoice:', error);
      throw new ValidationError(`Failed to create invoice: ${error.message}`);
    }
  }

  /**
   * Get invoice by ID
   */
  static async getInvoiceById(invoiceId: string) {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          items: true,
          transaction: {
            include: {
              event: {
                include: {
                  organizer: {
                    select: {
                      organizationName: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
          registration: {
            include: {
              attendee: true,
              event: true,
            },
          },
          event: true,
        },
      });

      if (!invoice) {
        throw new NotFoundError('Invoice not found');
      }

      return invoice;
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error fetching invoice:', error);
      throw new ValidationError(`Failed to fetch invoice: ${error.message}`);
    }
  }

  /**
   * Get invoice by invoice number
   */
  static async getInvoiceByNumber(invoiceNumber: string) {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { invoiceNumber },
        include: {
          items: true,
          transaction: {
            include: {
              event: {
                include: {
                  organizer: {
                    select: {
                      organizationName: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
          registration: {
            include: {
              attendee: true,
              event: true,
            },
          },
          event: true,
        },
      });

      if (!invoice) {
        throw new NotFoundError('Invoice not found');
      }

      return invoice;
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error fetching invoice:', error);
      throw new ValidationError(`Failed to fetch invoice: ${error.message}`);
    }
  }

  /**
   * Get invoices for a user
   */
  static async getUserInvoices(userId: string, filters?: {
    status?: string;
    eventId?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 20;
      const skip = (page - 1) * limit;

      const where: any = {
        registration: {
          attendeeId: userId,
        },
      };

      if (filters?.status) {
        where.status = filters.status;
      }

      if (filters?.eventId) {
        where.eventId = filters.eventId;
      }

      const [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
          where,
          include: {
            items: true,
            event: {
              select: {
                id: true,
                title: true,
                startDate: true,
              },
            },
          },
          orderBy: { issueDate: 'desc' },
          skip,
          take: limit,
        }),
        prisma.invoice.count({ where }),
      ]);

      return {
        invoices,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      logger.error('Error fetching user invoices:', error);
      throw new ValidationError(`Failed to fetch invoices: ${error.message}`);
    }
  }

  /**
   * Get invoices for an event (organizer view)
   */
  static async getEventInvoices(eventId: string, filters?: {
    status?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 20;
      const skip = (page - 1) * limit;

      const where: any = { eventId };

      if (filters?.status) {
        where.status = filters.status;
      }

      const [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
          where,
          include: {
            items: true,
            registration: {
              include: {
                attendee: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: { issueDate: 'desc' },
          skip,
          take: limit,
        }),
        prisma.invoice.count({ where }),
      ]);

      return {
        invoices,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      logger.error('Error fetching event invoices:', error);
      throw new ValidationError(`Failed to fetch invoices: ${error.message}`);
    }
  }

  /**
   * Generate invoice HTML
   */
  static async generateInvoiceHTML(invoiceId: string): Promise<string> {
    try {
      const invoice = await this.getInvoiceById(invoiceId);

      // Get template
      let template = null;
      if (invoice.templateId) {
        template = await prisma.invoiceTemplate.findUnique({
          where: { id: invoice.templateId },
        });
      } else {
        template = await prisma.invoiceTemplate.findFirst({
          where: { isDefault: true, isActive: true },
        });
      }

      // Use default template if none found
      const htmlTemplate = template?.htmlContent || this.getDefaultInvoiceTemplate();
      const cssContent = template?.cssContent || this.getDefaultInvoiceCSS();

      // Prepare template variables
      const variables = {
        invoiceNumber: invoice.invoiceNumber,
        issueDate: invoice.issueDate.toLocaleDateString(),
        dueDate: invoice.dueDate?.toLocaleDateString() || 'N/A',
        status: invoice.status,
        billToName: invoice.billToName,
        billToEmail: invoice.billToEmail,
        billToAddress: invoice.billToAddress || '',
        billToCity: invoice.billToCity || '',
        billToState: invoice.billToState || '',
        billToCountry: invoice.billToCountry || '',
        billToZipCode: invoice.billToZipCode || '',
        eventTitle: invoice.event.title,
        organizerName: invoice.transaction.event.organizer.organizationName || 'Event Organizer',
        organizerEmail: invoice.transaction.event.organizer.email || '',
        subtotal: Number(invoice.subtotal).toFixed(2),
        taxAmount: invoice.taxAmount ? Number(invoice.taxAmount).toFixed(2) : '0.00',
        totalAmount: Number(invoice.totalAmount).toFixed(2),
        currency: invoice.currency,
        items: invoice.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice).toFixed(2),
          totalPrice: Number(item.totalPrice).toFixed(2),
        })),
        notes: invoice.notes || '',
        terms: invoice.terms || '',
      };

      // Replace template variables
      let html = htmlTemplate;
      Object.entries(variables).forEach(([key, value]) => {
        if (key === 'items') {
          // Handle items separately
          const itemsHtml = (value as any[]).map((item: any) => `
            <tr>
              <td>${item.description}</td>
              <td>${item.quantity}</td>
              <td>${invoice.currency} ${item.unitPrice}</td>
              <td>${invoice.currency} ${item.totalPrice}</td>
            </tr>
          `).join('');
          html = html.replace('{{items}}', itemsHtml);
        } else {
          html = html.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
        }
      });

      // Combine with CSS
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>${cssContent}</style>
        </head>
        <body>
          ${html}
        </body>
        </html>
      `;
    } catch (error: any) {
      logger.error('Error generating invoice HTML:', error);
      throw new ValidationError(`Failed to generate invoice HTML: ${error.message}`);
    }
  }

  /**
   * Mark invoice as sent
   */
  static async markInvoiceAsSent(invoiceId: string, sentTo: string) {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
      });

      if (!invoice) {
        throw new NotFoundError('Invoice not found');
      }

      const updated = await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          sentTo,
        },
      });

      logger.info(`Invoice marked as sent: ${invoiceId}`);
      return updated;
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error marking invoice as sent:', error);
      throw new ValidationError(`Failed to mark invoice as sent: ${error.message}`);
    }
  }

  /**
   * Update invoice status
   */
  static async updateInvoiceStatus(invoiceId: string, status: string) {
    try {
      const validStatuses = ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'];
      if (!validStatuses.includes(status)) {
        throw new ValidationError(`Invalid invoice status: ${status}`);
      }

      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
      });

      if (!invoice) {
        throw new NotFoundError('Invoice not found');
      }

      const updated = await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status,
          ...(status === 'PAID' && { sentAt: new Date() }),
        },
      });

      logger.info(`Invoice status updated: ${invoiceId} to ${status}`);
      return updated;
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error updating invoice status:', error);
      throw new ValidationError(`Failed to update invoice status: ${error.message}`);
    }
  }

  /**
   * Default invoice template
   */
  private static getDefaultInvoiceTemplate(): string {
    return `
      <div class="invoice-container">
        <div class="invoice-header">
          <h1>INVOICE</h1>
          <div class="invoice-info">
            <p><strong>Invoice #:</strong> {{invoiceNumber}}</p>
            <p><strong>Issue Date:</strong> {{issueDate}}</p>
            <p><strong>Due Date:</strong> {{dueDate}}</p>
            <p><strong>Status:</strong> {{status}}</p>
          </div>
        </div>
        
        <div class="invoice-body">
          <div class="bill-to">
            <h3>Bill To:</h3>
            <p>{{billToName}}</p>
            <p>{{billToEmail}}</p>
            <p>{{billToAddress}}</p>
            <p>{{billToCity}}, {{billToState}} {{billToZipCode}}</p>
            <p>{{billToCountry}}</p>
          </div>
          
          <div class="from">
            <h3>From:</h3>
            <p>{{organizerName}}</p>
            <p>{{organizerEmail}}</p>
          </div>
          
          <div class="event-info">
            <h3>Event:</h3>
            <p>{{eventTitle}}</p>
          </div>
        </div>
        
        <table class="invoice-items">
          <thead>
            <tr>
              <th>Description</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {{items}}
          </tbody>
        </table>
        
        <div class="invoice-summary">
          <div class="summary-row">
            <span>Subtotal:</span>
            <span>{{currency}} {{subtotal}}</span>
          </div>
          <div class="summary-row">
            <span>Tax:</span>
            <span>{{currency}} {{taxAmount}}</span>
          </div>
          <div class="summary-row total">
            <span>Total:</span>
            <span>{{currency}} {{totalAmount}}</span>
          </div>
        </div>
        
        {{#if notes}}
        <div class="invoice-notes">
          <h3>Notes:</h3>
          <p>{{notes}}</p>
        </div>
        {{/if}}
        
        {{#if terms}}
        <div class="invoice-terms">
          <h3>Payment Terms:</h3>
          <p>{{terms}}</p>
        </div>
        {{/if}}
      </div>
    `;
  }

  /**
   * Default invoice CSS
   */
  private static getDefaultInvoiceCSS(): string {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: Arial, sans-serif;
        padding: 20px;
        color: #333;
      }
      
      .invoice-container {
        max-width: 800px;
        margin: 0 auto;
        background: white;
        padding: 40px;
        border: 1px solid #ddd;
      }
      
      .invoice-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 2px solid #333;
      }
      
      .invoice-header h1 {
        font-size: 32px;
        color: #333;
      }
      
      .invoice-info p {
        margin: 5px 0;
        text-align: right;
      }
      
      .invoice-body {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 30px;
        margin-bottom: 30px;
      }
      
      .bill-to, .from, .event-info {
        margin-bottom: 20px;
      }
      
      .bill-to h3, .from h3, .event-info h3 {
        margin-bottom: 10px;
        color: #666;
      }
      
      .invoice-items {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 30px;
      }
      
      .invoice-items th,
      .invoice-items td {
        padding: 12px;
        text-align: left;
        border-bottom: 1px solid #ddd;
      }
      
      .invoice-items th {
        background-color: #f5f5f5;
        font-weight: bold;
      }
      
      .invoice-summary {
        margin-top: 20px;
        text-align: right;
      }
      
      .summary-row {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        width: 300px;
        margin-left: auto;
      }
      
      .summary-row.total {
        font-size: 18px;
        font-weight: bold;
        border-top: 2px solid #333;
        padding-top: 10px;
        margin-top: 10px;
      }
      
      .invoice-notes,
      .invoice-terms {
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #ddd;
      }
      
      .invoice-notes h3,
      .invoice-terms h3 {
        margin-bottom: 10px;
        color: #666;
      }
    `;
  }
}
