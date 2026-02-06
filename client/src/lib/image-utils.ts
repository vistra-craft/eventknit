/**
 * Helper to get object-position CSS value from focal point coordinates
 */
export function getFocalPointStyle(focalX?: number | null, focalY?: number | null) {
  const x = focalX ?? 50;
  const y = focalY ?? 50;
  return `${x}% ${y}%`;
}
