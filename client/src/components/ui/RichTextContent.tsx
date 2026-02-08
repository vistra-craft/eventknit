import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';

interface RichTextContentProps {
  content: string;
  className?: string;
}

/**
 * RichTextContent Component
 * Safely renders HTML content from rich text editor
 * Uses DOMPurify to sanitize HTML and prevent XSS attacks
 */
export function RichTextContent({ content, className }: RichTextContentProps) {
  // Return empty div if no content
  if (!content || content.trim() === '') {
    return null;
  }

  // Sanitize HTML to prevent XSS attacks
  const sanitizedHTML = DOMPurify.sanitize(content, {
    // Allow safe HTML tags
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'b', 'i',
      'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'code', 'pre', 'a', 'span', 'div'
    ],
    // Allow safe attributes
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    // Ensure links open safely
    ADD_ATTR: ['target', 'rel'],
  });

  // Apply safe sanitized HTML
  return (
    <div
      className={cn(
        'prose prose-sm dark:prose-invert max-w-none',
        'rich-text-content',
        className
      )}
      dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
    />
  );
}

export default RichTextContent;
