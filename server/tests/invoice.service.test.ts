import { InvoiceService } from '../src/services/invoice.service';
import { NotFoundError } from '../src/utils/errors';
import { Decimal } from '@prisma/client/runtime/library';

const prismaMock = {
  eventPaymentTransaction: { findUnique: jest.fn() },
  invoice: { findUnique: jest.fn(), create: jest.fn() },
  invoiceTemplate: { findUnique: jest.fn(), findFirst: jest.fn() },
};

jest.mock('../src/config/database', () => ({
  prisma: prismaMock,
}));

describe('InvoiceService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  const baseTransaction = {
    id: 'txn-1',
    registrationId: 'reg-1',
    amount: new Decimal(100),
    currency: 'USD',
    registration: {
      attendee: { id: 'att-1', email: 'a@test.com' },
      ticketLineItems: [
        { id: 'tli-1', ticketType: 'GA', quantity: 1, unitPrice: new Decimal(100), totalPrice: new Decimal(100) },
      ],
      event: { organizer: { id: 'org-1', firstName: 'Org', lastName: 'Owner', organizationName: 'Org Inc', email: 'o@test.com' } },
    },
  };

  it('throws when transaction missing', async () => {
    prismaMock.eventPaymentTransaction.findUnique.mockResolvedValue(null);

    await expect(InvoiceService.createInvoice('missing')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('returns existing invoice if present', async () => {
    prismaMock.eventPaymentTransaction.findUnique.mockResolvedValue(baseTransaction as any);
    prismaMock.invoice.findUnique.mockResolvedValue({ id: 'inv-existing' });

    const invoice = await InvoiceService.createInvoice('txn-1');
    expect(invoice).toEqual({ id: 'inv-existing' });
  });

  it('creates invoice when none exists', async () => {
    prismaMock.eventPaymentTransaction.findUnique.mockResolvedValue(baseTransaction as any);
    prismaMock.invoice.findUnique.mockResolvedValue(null);
    prismaMock.invoiceTemplate.findFirst.mockResolvedValue({ id: 'tmpl-1' });
    prismaMock.invoice.create.mockResolvedValue({ id: 'inv-1', invoiceNumber: 'INV-2024-0001' });

    const invoice = await InvoiceService.createInvoice('txn-1', undefined, { includeTax: false });

    expect(prismaMock.invoice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          transactionId: 'txn-1',
          registrationId: 'reg-1',
          totalAmount: expect.any(Decimal),
          currency: 'USD',
        }),
      }),
    );
    expect(invoice).toEqual({ id: 'inv-1', invoiceNumber: 'INV-2024-0001' });
  });
});

