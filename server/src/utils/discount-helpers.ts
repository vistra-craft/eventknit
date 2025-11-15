/**
 * Calculate discount percentage
 */
export const calculateDiscountPercentage = (
  originalPrice: number,
  currentPrice: number
): number => {
  if (!originalPrice || originalPrice === 0) return 0;
  if (!currentPrice || currentPrice < 0) return 0;
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
};

/**
 * Calculate discount amount
 */
export const calculateDiscountAmount = (
  originalPrice: number,
  currentPrice: number
): number => {
  if (!originalPrice || !currentPrice) return 0;
  return Math.max(0, originalPrice - currentPrice);
};

/**
 * Validate discount values
 */
export const validateDiscount = (
  originalPrice: number,
  currentPrice: number
): { valid: boolean; error?: string } => {
  if (originalPrice <= 0) {
    return { valid: false, error: 'Original price must be greater than 0' };
  }
  if (currentPrice < 0) {
    return { valid: false, error: 'Current price cannot be negative' };
  }
  if (currentPrice > originalPrice) {
    return {
      valid: false,
      error: 'Current price cannot exceed original price',
    };
  }
  return { valid: true };
};

