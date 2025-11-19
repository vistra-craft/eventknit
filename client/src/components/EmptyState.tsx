import React from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  className?: string;
  size?: "sm" | "md" | "lg";
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className,
  size = "md",
}) => {
  const sizeClasses = {
    sm: {
      icon: "h-8 w-8",
      title: "text-base",
      description: "text-sm",
      padding: "py-8",
    },
    md: {
      icon: "h-12 w-12",
      title: "text-lg",
      description: "text-base",
      padding: "py-12",
    },
    lg: {
      icon: "h-16 w-16",
      title: "text-xl",
      description: "text-lg",
      padding: "py-16",
    },
  };

  const sizeConfig = sizeClasses[size];

  return (
    <Card className={cn("bg-card border-border", className)}>
      <CardContent className={cn("flex flex-col items-center justify-center text-center", sizeConfig.padding)}>
        <div className={cn(
          "rounded-full bg-muted/50 p-4 mb-4 flex items-center justify-center",
          sizeConfig.icon
        )}>
          <Icon className={cn("text-muted-foreground", sizeConfig.icon)} />
        </div>
        <h3 className={cn("font-semibold text-foreground mb-2", sizeConfig.title)}>
          {title}
        </h3>
        <p className={cn("text-muted-foreground mb-6 max-w-md", sizeConfig.description)}>
          {description}
        </p>
        {action && (
          <Button
            onClick={action.onClick}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {action.icon && <action.icon className="h-4 w-4 mr-2" />}
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default EmptyState;

