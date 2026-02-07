/**
 * Helper utilities for generating transaction numbers and financial identifiers
 */

/**
 * Generate a unique transaction number
 * Format: PREFIX-YYYY-NNNNNN (e.g., "EPT-2024-000001")
 */
export function generateTransactionNumber(prefix: string): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `${prefix}-${year}-${random}`;
}

/**
 * Generate a unique fee number
 * Format: PF-YYYY-NNNNNN
 */
export function generateFeeNumber(): string {
  return generateTransactionNumber('PF');
}

/**
 * Generate a unique disbursement number
 * Format: DISB-YYYY-NNNNNN
 */
export function generateDisbursementNumber(): string {
  return generateTransactionNumber('DISB');
}

/**
 * Generate a unique refund number
 * Format: REF-YYYY-NNNNNN
 */
export function generateRefundNumber(): string {
  return generateTransactionNumber('REF');
}

/**
 * Generate a unique reconciliation number
 * Format: REC-YYYY-NNNNNN
 */
export function generateReconciliationNumber(): string {
  return generateTransactionNumber('REC');
}

/**
 * Generate a unique payment transaction number
 * Format: EPT-YYYY-NNNNNN
 */
export function generatePaymentTransactionNumber(): string {
  return generateTransactionNumber('EPT');
}

