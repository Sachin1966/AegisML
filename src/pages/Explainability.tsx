import { useState, useEffect } from "react";
import { Search, Layers, TrendingUp, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { HeatmapChart } from "@/components/charts/HeatmapChart";
import { Card } from "@/components/ui/card";
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
import { api, InternalSignal } from "@/lib/api";

interface LayerStat {
  layerName: string;
  gradientNorm: number;
  activationMean: number;
  instabilityScore: number;
  contribution: number;
}

interface PropagationNode {
  layer: string;
  delay: number;
  intensity: number;
}

export default function Explainability() {
  const [signals, setSignals] = useState<InternalSignal[]>([]);
  const [loading, setLoading] = useState(true);

  // Poll for data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const exps = await api.getExperiments();
        if (exps.length > 0) {
          const latestId = exps[0].id;
          const data = await api.getSignals(latestId);
          setSignals(data);
        }
      } catch (e) {
        console.error("Failed to fetch signals", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  const latest = signals[signals.length - 1] || {
    gradient_norm: 0,
    gradient_variance: 0,
    loss_curvature: 0,
    prediction_entropy: 0,
    dead_neuron_ratio: 0,
    latent_drift: 0
  };

  // 1. Dynamic Signal Importance (Derived from real magnitudes)
  const signalImportance = [
    { signal: 'Gradient Variance', importance: Math.min(1, latest.gradient_variance * 5), category: 'Gradient' },
    { signal: 'Loss Curvature', importance: Math.min(1, latest.loss_curvature * 2), category: 'Optimization' },
    { signal: 'Dead Neuron Ratio', importance: Math.min(1, latest.dead_neuron_ratio * 10), category: 'Activation' },
    { signal: 'Latent Drift', importance: Math.min(1, latest.latent_drift * 3), category: 'Representation' },
    { signal: 'Prediction Entropy', importance: Math.min(1, latest.prediction_entropy * 2), category: 'Output' },
    { signal: 'Gradient Norm', importance: Math.min(1, latest.gradient_norm / 10), category: 'Gradient' },
  ].sort((a, b) => b.importance - a.importance);

  // 2. Real Temporal Contribution Stats
  // Instead of fake layers, we show how much each signal contributes to the total "Instability Score"
  const layerStats: LayerStat[] = [
    { layerName: 'Gradient Dynamics', weight: 0.4, signal: latest.gradient_variance * 5 },
    { layerName: 'Latent Stability', weight: 0.3, signal: latest.latent_drift * 3 },
    { layerName: 'Prediction Confidence', weight: 0.3, signal: (1 - latest.prediction_entropy) * 0.5 }
  ].map(l => ({
    layerName: l.layerName,
    gradientNorm: latest.gradient_norm, // Global context
    activationMean: latest.prediction_entropy, // Real entropy as proxy
    instabilityScore: Math.min(1, l.signal),
    contribution: l.weight * Math.min(1, l.signal)
  })).sort((a, b) => b.instabilityScore - a.instabilityScore);

  // 3. Propagation Data (Heuristic based on Entropy & Drift)
  const propagationData: PropagationNode[] = [
    { layer: 'conv1', delay: 0, intensity: Math.min(1, latest.latent_drift) },
    { layer: 'conv2', delay: 2, intensity: Math.min(1, latest.latent_drift * 1.2) },
    { layer: 'fc1', delay: 5, intensity: Math.min(1, latest.gradient_variance * 4) },
    { layer: 'output', delay: 8, intensity: Math.min(1, latest.prediction_entropy * 3) }
  ];

  const originLayer = propagationData.reduce((prev, current) => (prev.intensity > current.intensity) ? prev : current).layer;
  const totalDelay = 8; // Fixed for this topology visualization

  // 4. Heatmap from historical signals (Projected to Key Metrics)
  const heatmapData = [
    { label: 'Grad Norm', key: 'gradient_norm', scale: 1 },
    { label: 'Grad Var', key: 'gradient_variance', scale: 5 },
    { label: 'Drift', key: 'latent_drift', scale: 2 },
    { label: 'Entropy', key: 'prediction_entropy', scale: 1 }
  ].map(metric => ({
    label: metric.label,
    values: signals.slice(-15).map(s => {
      // @ts-ignore
      const val = s[metric.key] || 0;
      return Math.min(1, val * metric.scale); // Normalized for heatmap visualization
    })
  }));
  const epochLabels = signals.slice(-15).map(s => `E${s.epoch}`);

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Explainability Engine"
        description="Signal attribution and failure propagation analysis"
        icon={Search}
        badge="Real-Time"
        badgeVariant="success"
      />

      <div className="p-6 space-y-6">
        {/* Signal Importance Ranking */}
        <Card className="p-6">
          <h3 className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            Signal Importance Ranking (Live)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
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
        </Card>

        {/* Layer Instability Heatmap */}
        {heatmapData[0].values.length > 0 && (
          <HeatmapChart
            data={heatmapData}
            xLabels={epochLabels}
            title="Layer-wise Instability Over Time (Projected)"
            colorScale="red"
          />
        )}

        {/* Failure Propagation */}
        <Card className="p-6">
          <h3 className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            Failure Propagation Path (Heuristic)
          </h3>
          <div className="relative">
            {/* Network visualization */}
            <div className="flex items-center justify-between py-8">
              {propagationData.map((layer, i) => (
                <div key={layer.layer} className="relative flex flex-col items-center">
                  {/* Connection line */}
                  {i < propagationData.length - 1 && (
                    <div
                      className="absolute left-1/2 top-1/2 h-0.5 w-full -translate-y-1/2 bg-gradient-to-r from-muted-foreground/50 to-destructive/80"
                      style={{
                        left: '50%',
                        width: '100%',
                        opacity: 0.3 + layer.intensity * 0.7,
                        zIndex: 0
                      }}
                    />
                  )}

                  {/* Node */}
                  <div
                    className={cn(
                      "relative flex h-16 w-16 items-center justify-center rounded-xl border-2 transition-all z-10 bg-card",
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
                      t+{layer.delay}
                    </p>
                    <p className={cn(
                      "data-mono text-xs",
                      layer.intensity > 0.7 ? "text-destructive" : "text-muted-foreground"
                    )}>
                      {(layer.intensity * 100).toFixed(0)}% risk
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span>Failure origin: <strong className="text-primary">{originLayer}</strong></span>
              <span>→</span>
              <span>Full propagation: <strong className="text-destructive">{totalDelay} epochs</strong></span>
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
                  <th className="py-3 text-left text-xs font-medium text-muted-foreground">Gradient Norm (Dist)</th>
                  <th className="py-3 text-left text-xs font-medium text-muted-foreground">Instability</th>
                  <th className="py-3 text-left text-xs font-medium text-muted-foreground">Est. Contribution</th>
                </tr>
              </thead>
              <tbody>
                {layerStats.map((layer, i) => (
                  <tr key={layer.layerName} className="border-b border-border/50">
                    <td className="py-3 font-mono text-sm text-foreground">{layer.layerName}</td>
                    <td className="py-3 font-mono text-sm text-muted-foreground">
                      {layer.gradientNorm.toFixed(4)}
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
                        layer.contribution > 0.25 ? "bg-destructive/10 text-destructive" :
                          layer.contribution > 0.15 ? "bg-accent/10 text-accent" :
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
