import { cn } from "@/lib/utils";

interface GaugeChartProps {
  value: number;
  min?: number;
  max?: number;
  title: string;
  subtitle?: string;
  thresholds?: { warning: number; critical: number };
  className?: string;
}

export function GaugeChart({
  value,
  min = 0,
  max = 1,
  title,
  subtitle,
  thresholds = { warning: 0.5, critical: 0.75 },
  className,
}: GaugeChartProps) {
  const percentage = ((value - min) / (max - min)) * 100;
  const angle = (percentage / 100) * 180;
  
  const getColor = () => {
    const normalizedValue = (value - min) / (max - min);
    if (normalizedValue >= thresholds.critical) return 'text-destructive';
    if (normalizedValue >= thresholds.warning) return 'text-accent';
    return 'text-success';
  };

  const getGlowClass = () => {
    const normalizedValue = (value - min) / (max - min);
    if (normalizedValue >= thresholds.critical) return 'metric-glow-danger';
    if (normalizedValue >= thresholds.warning) return 'metric-glow-warning';
    return '';
  };

  return (
    <div className={cn("viz-container flex flex-col items-center", getGlowClass(), className)}>
      <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      
      <div className="relative h-24 w-48">
        {/* Background arc */}
        <svg className="absolute inset-0" viewBox="0 0 100 60">
          <path
            d="M 10 55 A 40 40 0 0 1 90 55"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Threshold markers */}
          <path
            d="M 10 55 A 40 40 0 0 1 90 55"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${percentage * 1.26} 126`}
          />
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--success))" />
              <stop offset="50%" stopColor="hsl(var(--accent))" />
              <stop offset="100%" stopColor="hsl(var(--destructive))" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Needle */}
        <div 
          className="absolute bottom-0 left-1/2 h-16 w-0.5 origin-bottom bg-foreground transition-transform duration-500"
          style={{ transform: `translateX(-50%) rotate(${angle - 90}deg)` }}
        >
          <div className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-foreground" />
        </div>
        
        {/* Center circle */}
        <div className="absolute bottom-0 left-1/2 h-4 w-4 -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-foreground bg-card" />
      </div>
      
      <div className="mt-2 text-center">
        <span className={cn("data-mono text-xl font-bold", getColor())}>
          {value.toFixed(3)}
        </span>
        {subtitle && (
          <p className="text-[10px] text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
