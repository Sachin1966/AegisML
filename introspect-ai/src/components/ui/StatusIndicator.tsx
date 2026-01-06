import { cn } from "@/lib/utils";

interface StatusIndicatorProps {
  status: 'healthy' | 'warning' | 'critical' | 'running' | 'stopped';
  label?: string;
  pulse?: boolean;
}

export function StatusIndicator({ status, label, pulse = false }: StatusIndicatorProps) {
  const statusConfig = {
    healthy: { color: 'bg-success', text: 'text-success', label: 'Healthy' },
    warning: { color: 'bg-accent', text: 'text-accent', label: 'Warning' },
    critical: { color: 'bg-destructive', text: 'text-destructive', label: 'Critical' },
    running: { color: 'bg-primary', text: 'text-primary', label: 'Running' },
    stopped: { color: 'bg-muted-foreground', text: 'text-muted-foreground', label: 'Stopped' },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <span className={cn(
        "relative h-2 w-2 rounded-full",
        config.color,
        pulse && "animate-pulse"
      )}>
        {pulse && (
          <span className={cn(
            "absolute inset-0 rounded-full opacity-50",
            config.color,
            "animate-ping"
          )} />
        )}
      </span>
      <span className={cn("text-xs font-medium", config.text)}>
        {label || config.label}
      </span>
    </div>
  );
}
