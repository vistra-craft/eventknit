import { Badge } from "@/components/ui/badge";

interface EventTagsProps {
  tags?: string[];
  category?: string | null;
}

export const EventTags = ({ tags, category }: EventTagsProps) => {
  const allTags: string[] = [];
  if (category) allTags.push(category);
  if (tags && tags.length > 0) allTags.push(...tags);

  if (allTags.length === 0) return null;

  return (
    <section>
      <h3 className="text-section-header mb-3">Tags & Categories</h3>
      <div className="flex flex-wrap gap-2">
        {allTags.length > 0 ? (
          allTags.map((tag, index) => (
            <Badge 
              key={`${tag}-${index}`}
              variant="secondary"
              className="px-3 py-1.5 text-sm hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
            >
              {tag}
            </Badge>
          ))
        ) : (
          <p className="text-sm text-muted-foreground italic">No tags or categories available</p>
        )}
      </div>
    </section>
  );
};
