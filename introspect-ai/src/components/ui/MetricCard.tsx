import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  variant = 'default',
  className,
}: MetricCardProps) {
  const variantStyles = {
    default: 'border-border',
    success: 'border-success/30 metric-glow',
    warning: 'border-accent/30 metric-glow-warning',
    danger: 'border-destructive/30 metric-glow-danger',
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground';

  return (
    <div className={cn(
      "viz-container flex flex-col gap-2",
      variantStyles[variant],
      className
    )}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </div>
      
      <div className="flex items-baseline gap-2">
        <span className="data-mono text-2xl font-bold text-foreground">
          {typeof value === 'number' ? value.toFixed(3) : value}
        </span>
        {trend && (
          <div className={cn("flex items-center gap-1", trendColor)}>
            <TrendIcon className="h-3 w-3" />
            {trendValue && <span className="text-xs">{trendValue}</span>}
          </div>
        )}
      </div>
      
      {subtitle && (
        <span className="text-xs text-muted-foreground">{subtitle}</span>
      )}
    </div>
  );
}
