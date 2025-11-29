import { Badge } from "@/components/ui/badge";

interface EventTagsProps {
  tags?: string[];
}

export const EventTags = ({ tags }: EventTagsProps) => {
  // If no tags are provided, we show the section but with a placeholder or empty state
  // per user request "let it be blank but atleast it should show"
  
  return (
    <section className="space-y-4">
      <h3 className="text-xl font-bold">Tags</h3>
      <div className="flex flex-wrap gap-2">
        {tags && tags.length > 0 ? (
          tags.map((tag) => (
            <Badge 
              key={tag} 
              variant="secondary"
              className="px-3 py-1.5 text-sm hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
            >
              {tag}
            </Badge>
          ))
        ) : (
          <p className="text-sm text-muted-foreground italic">No tags available</p>
        )}
      </div>
    </section>
  );
};
