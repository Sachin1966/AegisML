import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";
import { cn } from "@/lib/utils";

interface DataSeries {
  key: string;
  label: string;
  color: string;
}

interface MultiSignalChartProps<T extends { epoch: number }> {
  data: T[];
  series: DataSeries[];
  title: string;
  className?: string;
  height?: number;
}

export function MultiSignalChart<T extends { epoch: number }>({
  data,
  series,
  title,
  className,
  height = 280,
}: MultiSignalChartProps<T>) {
  return (
    <div className={cn("viz-container", className)}>
      <h3 className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data as any[]} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="hsl(var(--border))" 
            opacity={0.5} 
          />
          <XAxis 
            dataKey="epoch" 
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
            label={{ value: 'Epoch', position: 'bottom', offset: -5, fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
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
          <Legend 
            wrapperStyle={{ fontSize: '11px' }}
            iconType="line"
          />
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: s.color }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
