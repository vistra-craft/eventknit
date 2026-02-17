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
    <div className="flex flex-wrap gap-2">
      {allTags.map((tag, index) => (
        <Badge
          key={`${tag}-${index}`}
          variant="secondary"
          className="px-2.5 py-1 text-xs hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
        >
          {tag}
        </Badge>
      ))}
    </div>
  );
};
