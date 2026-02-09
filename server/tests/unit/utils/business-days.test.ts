import { isBusinessDay, subtractBusinessDays, addBusinessDays } from '../../../src/utils/business-days.js';

describe('Business Day Utilities', () => {
  describe('isBusinessDay', () => {
    it('should return true for Monday', () => {
      // 2026-02-09 is a Monday
      expect(isBusinessDay(new Date('2026-02-09'))).toBe(true);
    });

    it('should return true for Tuesday', () => {
      expect(isBusinessDay(new Date('2026-02-10'))).toBe(true);
    });

    it('should return true for Wednesday', () => {
      expect(isBusinessDay(new Date('2026-02-11'))).toBe(true);
    });

    it('should return true for Thursday', () => {
      expect(isBusinessDay(new Date('2026-02-12'))).toBe(true);
    });

    it('should return true for Friday', () => {
      expect(isBusinessDay(new Date('2026-02-13'))).toBe(true);
    });

    it('should return false for Saturday', () => {
      // 2026-02-07 is a Saturday
      expect(isBusinessDay(new Date('2026-02-07'))).toBe(false);
    });

    it('should return false for Sunday', () => {
      // 2026-02-08 is a Sunday
      expect(isBusinessDay(new Date('2026-02-08'))).toBe(false);
    });
  });

  describe('subtractBusinessDays', () => {
    it('should subtract 5 business days without crossing a weekend', () => {
      // Friday Feb 13 minus 5 business days = Friday Feb 6
      const result = subtractBusinessDays(new Date('2026-02-13'), 5);
      expect(result.getDate()).toBe(6);
      expect(result.getMonth()).toBe(1); // February
    });

    it('should subtract 5 business days crossing a weekend', () => {
      // Wednesday Feb 11 minus 5 business days = Wednesday Feb 4
      const result = subtractBusinessDays(new Date('2026-02-11'), 5);
      expect(result.getDate()).toBe(4);
      expect(result.getMonth()).toBe(1);
    });

    it('should subtract 1 business day from Monday to return Friday', () => {
      // Monday Feb 9 minus 1 business day = Friday Feb 6
      const result = subtractBusinessDays(new Date('2026-02-09'), 1);
      expect(result.getDate()).toBe(6);
      expect(result.getMonth()).toBe(1);
    });

    it('should return the same date when subtracting 0 business days', () => {
      const input = new Date('2026-02-11');
      const result = subtractBusinessDays(input, 0);
      expect(result.getDate()).toBe(11);
    });

    it('should handle crossing multiple weekends', () => {
      // Friday Feb 20 minus 10 business days = Friday Feb 6
      const result = subtractBusinessDays(new Date('2026-02-20'), 10);
      expect(result.getDate()).toBe(6);
      expect(result.getMonth()).toBe(1);
    });

    it('should not modify the original date', () => {
      const input = new Date('2026-02-11');
      const originalDate = input.getDate();
      subtractBusinessDays(input, 3);
      expect(input.getDate()).toBe(originalDate);
    });
  });

  describe('addBusinessDays', () => {
    it('should add 5 business days from Monday to next Monday', () => {
      // Monday Feb 9 plus 5 business days = Monday Feb 16
      const result = addBusinessDays(new Date('2026-02-09'), 5);
      expect(result.getDate()).toBe(16);
      expect(result.getMonth()).toBe(1);
    });

    it('should add 1 business day from Friday to next Monday', () => {
      // Friday Feb 6 plus 1 business day = Monday Feb 9
      const result = addBusinessDays(new Date('2026-02-06'), 1);
      expect(result.getDate()).toBe(9);
      expect(result.getMonth()).toBe(1);
    });

    it('should return the same date when adding 0 business days', () => {
      const input = new Date('2026-02-11');
      const result = addBusinessDays(input, 0);
      expect(result.getDate()).toBe(11);
    });

    it('should handle adding from a Saturday', () => {
      // Saturday Feb 7 plus 1 business day = Monday Feb 9
      const result = addBusinessDays(new Date('2026-02-07'), 1);
      expect(result.getDate()).toBe(9);
      expect(result.getMonth()).toBe(1);
    });

    it('should not modify the original date', () => {
      const input = new Date('2026-02-11');
      const originalDate = input.getDate();
      addBusinessDays(input, 3);
      expect(input.getDate()).toBe(originalDate);
    });
  });
});
