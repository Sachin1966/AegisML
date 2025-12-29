import { useState } from "react";
import { Search, Layers, TrendingUp, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { HeatmapChart } from "@/components/charts/HeatmapChart";
import { Card } from "@/components/ui/card";
import { generateLayerStats, LayerStats } from "@/lib/mockData";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";
import { cn } from "@/lib/utils";

const signalImportance = [
  { signal: 'Gradient Variance', importance: 0.92, category: 'Gradient' },
  { signal: 'Loss Curvature', importance: 0.87, category: 'Optimization' },
  { signal: 'ICC Score', importance: 0.84, category: 'Confidence' },
  { signal: 'Dead Neuron Ratio', importance: 0.78, category: 'Activation' },
  { signal: 'Latent Drift', importance: 0.73, category: 'Representation' },
  { signal: 'Prediction Entropy', importance: 0.69, category: 'Output' },
  { signal: 'Activation Entropy', importance: 0.62, category: 'Activation' },
  { signal: 'Inter-class Separation', importance: 0.55, category: 'Representation' },
  { signal: 'Gradient Norm', importance: 0.48, category: 'Gradient' },
  { signal: 'Confidence Dispersion', importance: 0.42, category: 'Output' },
];

export default function Explainability() {
  const [layerStats] = useState<LayerStats[]>(() => generateLayerStats());
  
  // Generate heatmap data for layer instability over epochs
  const heatmapData = layerStats.map(layer => ({
    label: layer.layerName,
    values: Array.from({ length: 10 }, (_, i) => 
      Math.max(0, layer.instabilityScore + (i - 5) * 0.05 + Math.random() * 0.1)
    ),
  }));
  const epochLabels = Array.from({ length: 10 }, (_, i) => `E${70 + i * 3}`);

  // Failure propagation data
  const propagationData = [
    { layer: 'conv1', delay: 0, intensity: 0.2 },
    { layer: 'conv2', delay: 2, intensity: 0.45 },
    { layer: 'conv3', delay: 4, intensity: 0.72 },
    { layer: 'fc1', delay: 5, intensity: 0.88 },
    { layer: 'fc2', delay: 6, intensity: 0.95 },
    { layer: 'output', delay: 7, intensity: 1.0 },
  ];

  return (
    <div className="flex flex-col">
      <PageHeader 
        title="Explainability Engine"
        description="Signal attribution and failure propagation analysis"
        icon={Search}
      />

      <div className="p-6 space-y-6">
        {/* Signal Importance Ranking */}
        <Card className="p-6">
          <h3 className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            Signal Importance Ranking
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart 
              data={signalImportance} 
              layout="vertical" 
              margin={{ left: 120, right: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis 
                type="number"
                domain={[0, 1]}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                type="category"
                dataKey="signal"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                width={115}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [(value * 100).toFixed(1) + '%', 'Importance']}
              />
              <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                {signalImportance.map((entry, index) => (
                  <Cell 
                    key={index}
                    fill={entry.importance > 0.8 
                      ? 'hsl(var(--destructive))' 
                      : entry.importance > 0.6 
                      ? 'hsl(var(--chart-amber))' 
                      : 'hsl(var(--chart-cyan))'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 flex items-center justify-center gap-6 text-xs">
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-destructive" />
              High Impact (&gt;80%)
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-chart-amber" />
              Medium (60-80%)
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-chart-cyan" />
              Lower (&lt;60%)
            </span>
          </div>
        </Card>

        {/* Layer Instability Heatmap */}
        <HeatmapChart
          data={heatmapData}
          xLabels={epochLabels}
          title="Layer-wise Instability Over Time"
          colorScale="red"
        />

        {/* Failure Propagation */}
        <Card className="p-6">
          <h3 className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            Failure Propagation Path
          </h3>
          <div className="relative">
            {/* Network visualization */}
            <div className="flex items-center justify-between py-8">
              {propagationData.map((layer, i) => (
                <div key={layer.layer} className="relative flex flex-col items-center">
                  {/* Connection line */}
                  {i < propagationData.length - 1 && (
                    <div 
                      className="absolute left-1/2 top-1/2 h-0.5 w-24 -translate-y-1/2 bg-gradient-to-r from-muted-foreground/50 to-destructive/80"
                      style={{ 
                        left: '100%',
                        opacity: 0.3 + layer.intensity * 0.7
                      }}
                    />
                  )}
                  
                  {/* Node */}
                  <div 
                    className={cn(
                      "relative flex h-16 w-16 items-center justify-center rounded-xl border-2 transition-all",
                      layer.intensity > 0.7 
                        ? "border-destructive bg-destructive/20 metric-glow-danger" 
                        : layer.intensity > 0.4 
                        ? "border-accent bg-accent/20 metric-glow-warning"
                        : "border-primary bg-primary/10"
                    )}
                  >
                    <Layers className={cn(
                      "h-6 w-6",
                      layer.intensity > 0.7 ? "text-destructive" : layer.intensity > 0.4 ? "text-accent" : "text-primary"
                    )} />
                  </div>
                  
                  {/* Label */}
                  <span className="mt-2 text-sm font-medium text-foreground">{layer.layer}</span>
                  
                  {/* Metrics */}
                  <div className="mt-1 text-center">
                    <p className="data-mono text-xs text-muted-foreground">
                      t+{layer.delay} epochs
                    </p>
                    <p className={cn(
                      "data-mono text-xs",
                      layer.intensity > 0.7 ? "text-destructive" : "text-muted-foreground"
                    )}>
                      {(layer.intensity * 100).toFixed(0)}% affected
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Legend */}
            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span>Failure origin: <strong className="text-primary">conv1</strong></span>
              <span>→</span>
              <span>Full propagation: <strong className="text-destructive">7 epochs</strong></span>
            </div>
          </div>
        </Card>

        {/* Layer Contribution Table */}
        <Card className="p-6">
          <h3 className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Layer-wise Contribution to Instability
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-3 text-left text-xs font-medium text-muted-foreground">Layer</th>
                  <th className="py-3 text-left text-xs font-medium text-muted-foreground">Gradient Norm</th>
                  <th className="py-3 text-left text-xs font-medium text-muted-foreground">Activation Mean</th>
                  <th className="py-3 text-left text-xs font-medium text-muted-foreground">Instability</th>
                  <th className="py-3 text-left text-xs font-medium text-muted-foreground">Contribution</th>
                </tr>
              </thead>
              <tbody>
                {layerStats.map((layer, i) => (
                  <tr key={layer.layerName} className="border-b border-border/50">
                    <td className="py-3 font-mono text-sm text-foreground">{layer.layerName}</td>
                    <td className="py-3 font-mono text-sm text-muted-foreground">
                      {layer.gradientNorm.toFixed(4)}
                    </td>
                    <td className="py-3 font-mono text-sm text-muted-foreground">
                      {layer.activationMean.toFixed(4)}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 overflow-hidden rounded-full bg-muted">
                          <div 
                            className={cn(
                              "h-full",
                              layer.instabilityScore > 0.6 ? "bg-destructive" : 
                              layer.instabilityScore > 0.3 ? "bg-accent" : "bg-success"
                            )}
                            style={{ width: `${layer.instabilityScore * 100}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs text-muted-foreground">
                          {(layer.instabilityScore * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={cn(
                        "rounded-full px-2 py-1 text-xs font-medium",
                        layer.contribution > 0.7 ? "bg-destructive/10 text-destructive" :
                        layer.contribution > 0.4 ? "bg-accent/10 text-accent" :
                        "bg-muted text-muted-foreground"
                      )}>
                        {(layer.contribution * 100).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
