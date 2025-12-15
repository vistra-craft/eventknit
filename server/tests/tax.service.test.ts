import { TaxService } from '../src/services/tax.service';

const prismaMock = {
  taxRate: {
    findFirst: jest.fn(),
  },
};

jest.mock('../src/config/database', () => ({
  prisma: prismaMock,
}));

describe('TaxService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns zero tax when no rate', async () => {
    prismaMock.taxRate.findFirst.mockResolvedValue(null);

    const result = await TaxService.calculateTax(100, { country: 'US' });
    expect(result.taxAmount).toBe(0);
    expect(result.total).toBe(100);
    expect(result.taxRate).toBe(0);
  });

  it('calculates tax when rate exists', async () => {
    prismaMock.taxRate.findFirst.mockResolvedValue({
      country: 'US',
      state: 'CA',
      city: 'SF',
      rate: 7.5,
      taxType: 'SALES_TAX',
      isActive: true,
    });

    const result = await TaxService.calculateTax(200, { country: 'US', state: 'CA', city: 'SF' });

    expect(result.taxRate).toBe(7.5);
    expect(result.taxAmount).toBeCloseTo(15);
    expect(result.total).toBeCloseTo(215);
    expect(result.taxType).toBe('SALES_TAX');
  });
});

