import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

interface AboutSectionProps {
  fullDescription?: string | null;
  description?: string | null;
}

export const AboutSection = ({ fullDescription, description }: AboutSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Use fullDescription if available, otherwise fall back to description
  const aboutText = fullDescription || description || 'No description available.';
  
  // Truncate description to 300 characters
  const TRUNCATE_LENGTH = 300;
  const shouldTruncate = aboutText.length > TRUNCATE_LENGTH;
  const displayText = shouldTruncate && !isExpanded
    ? aboutText.substring(0, TRUNCATE_LENGTH) + '...'
    : aboutText;

  return (
    <section>
      <h2 className="text-3xl font-bold mb-4">About This Event</h2>
      <div className="prose prose-lg max-w-none text-muted-foreground">
        <p className="leading-relaxed whitespace-pre-line">
          {displayText}
        </p>
        {shouldTruncate && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 text-primary hover:text-primary/80 p-0 mt-2"
          >
            {isExpanded ? (
              <>
                Show Less
                <ChevronUp className="w-4 h-4 ml-1" />
              </>
            ) : (
              <>
                Show More
                <ChevronDown className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        )}
      </div>
    </section>
  );
};
