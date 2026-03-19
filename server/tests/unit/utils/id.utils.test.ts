import { isValidUUID } from '../../../src/utils/id.utils.js';

describe('isValidUUID', () => {
  it('should return true for a valid lowercase UUID', () => {
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('should return true for a valid uppercase UUID', () => {
    expect(isValidUUID('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
  });

  it('should return true for a mixed-case UUID', () => {
    expect(isValidUUID('550e8400-E29B-41d4-a716-446655440000')).toBe(true);
  });

  it('should return false for a slug', () => {
    expect(isValidUUID('ai-machine-learning-workshop-2026')).toBe(false);
  });

  it('should return false for a numeric string', () => {
    expect(isValidUUID('12345')).toBe(false);
  });

  it('should return false for an empty string', () => {
    expect(isValidUUID('')).toBe(false);
  });

  it('should return false for a UUID without hyphens', () => {
    expect(isValidUUID('550e8400e29b41d4a716446655440000')).toBe(false);
  });

  it('should return false for a UUID with extra characters', () => {
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000x')).toBe(false);
  });

  it('should return false for a partial UUID', () => {
    expect(isValidUUID('550e8400-e29b-41d4')).toBe(false);
  });

  it('should return false for a UUID with invalid hex characters', () => {
    expect(isValidUUID('550g8400-e29b-41d4-a716-446655440000')).toBe(false);
  });
});
