import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
  badgeVariant?: 'default' | 'success' | 'warning' | 'danger';
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  badge,
  badgeVariant = 'default',
  children
}: PageHeaderProps) {
  const badgeColors = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-accent/10 text-accent',
    danger: 'bg-destructive/10 text-destructive',
  };

  return (
    <div className="flex items-center justify-between border-b border-border bg-card/50 px-6 py-4">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-foreground">{title}</h1>
            {badge && (
              <span className={cn(
                "rounded-full px-3 py-1 text-xs font-medium",
                badgeColors[badgeVariant]
              )}>
                {badge}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {children}
      </div>
    </div>
  );
}
