/**
 * HTML escape utility to prevent XSS when interpolating user content into HTML templates.
 */
const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  '\'': '&#x27;',
};

const HTML_ESCAPE_REGEX = /[&<>"']/g;

/**
 * Escapes HTML special characters in a string to prevent XSS injection.
 * Use this whenever interpolating user-provided content into HTML templates.
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  return str.replace(HTML_ESCAPE_REGEX, (char) => HTML_ESCAPE_MAP[char] || char);
}
