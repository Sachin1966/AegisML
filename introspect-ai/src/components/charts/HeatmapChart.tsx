import { cn } from "@/lib/utils";

interface HeatmapData {
  label: string;
  values: number[];
}

interface HeatmapChartProps {
  data: HeatmapData[];
  xLabels: string[];
  title: string;
  className?: string;
  colorScale?: 'blue' | 'red' | 'diverging';
}

export function HeatmapChart({
  data,
  xLabels,
  title,
  className,
  colorScale = 'blue',
}: HeatmapChartProps) {
  const getColor = (value: number) => {
    const normalized = Math.max(0, Math.min(1, value));
    
    if (colorScale === 'blue') {
      const lightness = 90 - normalized * 50;
      return `hsl(187, 75%, ${lightness}%)`;
    } else if (colorScale === 'red') {
      const lightness = 90 - normalized * 50;
      return `hsl(0, 72%, ${lightness}%)`;
    } else {
      // Diverging: blue to white to red
      if (normalized < 0.5) {
        const lightness = 50 + (0.5 - normalized) * 80;
        return `hsl(187, 75%, ${lightness}%)`;
      } else {
        const lightness = 50 + (normalized - 0.5) * 80;
        return `hsl(0, 72%, ${100 - lightness}%)`;
      }
    }
  };

  return (
    <div className={cn("viz-container", className)}>
      <h3 className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <div className="overflow-x-auto">
        <div className="min-w-fit">
          {/* X-axis labels */}
          <div className="flex">
            <div className="w-20 shrink-0" />
            {xLabels.map((label, i) => (
              <div 
                key={i} 
                className="flex h-8 w-10 items-end justify-center text-[10px] text-muted-foreground"
              >
                <span className="rotate-[-45deg] whitespace-nowrap">{label}</span>
              </div>
            ))}
          </div>
          
          {/* Heatmap rows */}
          {data.map((row, rowIndex) => (
            <div key={rowIndex} className="flex items-center">
              <div className="w-20 shrink-0 pr-2 text-right text-xs text-muted-foreground">
                {row.label}
              </div>
              {row.values.map((value, colIndex) => (
                <div
                  key={colIndex}
                  className="group relative h-8 w-10 border border-background/50"
                  style={{ backgroundColor: getColor(value) }}
                >
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="rounded bg-card px-1 py-0.5 text-[10px] font-mono shadow">
                      {value.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      
      {/* Color scale legend */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <span className="text-[10px] text-muted-foreground">Low</span>
        <div 
          className="h-2 w-24 rounded"
          style={{
            background: colorScale === 'diverging' 
              ? 'linear-gradient(90deg, hsl(187, 75%, 70%), hsl(0, 0%, 95%), hsl(0, 72%, 55%))'
              : colorScale === 'blue'
              ? 'linear-gradient(90deg, hsl(187, 75%, 90%), hsl(187, 75%, 40%))'
              : 'linear-gradient(90deg, hsl(0, 72%, 90%), hsl(0, 72%, 40%))'
          }}
        />
        <span className="text-[10px] text-muted-foreground">High</span>
      </div>
    </div>
  );
}
