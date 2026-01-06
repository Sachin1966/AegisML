import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine 
} from "recharts";
import { cn } from "@/lib/utils";

interface SignalChartProps<T extends { epoch: number }> {
  data: T[];
  dataKey: keyof T & string;
  title: string;
  color?: string;
  threshold?: number;
  thresholdLabel?: string;
  className?: string;
  showGrid?: boolean;
}

export function SignalChart<T extends { epoch: number }>({
  data,
  dataKey,
  title,
  color = "hsl(var(--chart-cyan))",
  threshold,
  thresholdLabel,
  className,
  showGrid = true,
}: SignalChartProps<T>) {
  return (
    <div className={cn("viz-container", className)}>
      <h3 className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data as any[]} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          {showGrid && (
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))" 
              opacity={0.5} 
            />
          )}
          <XAxis 
            dataKey="epoch" 
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
          />
          <YAxis 
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
            width={50}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
          />
          {threshold && (
            <ReferenceLine 
              y={threshold} 
              stroke="hsl(var(--destructive))" 
              strokeDasharray="5 5"
              label={{ 
                value: thresholdLabel || 'Threshold', 
                fill: 'hsl(var(--destructive))',
                fontSize: 10,
                position: 'right'
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: color }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
