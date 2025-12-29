import { useState } from "react";
import { BarChart3, Target, Clock, CheckCircle2, XCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MetricCard } from "@/components/ui/MetricCard";
import { MultiSignalChart } from "@/components/charts/MultiSignalChart";
import { SignalChart } from "@/components/charts/SignalChart";
import { Card } from "@/components/ui/card";
import { generateEpochSignals, generateMetrics } from "@/lib/mockData";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  Cell
} from "recharts";

const modelComparison = [
  { model: 'MLP-3Layer', iss: 0.72, psu: 0.28, fah: 8, leadTime: 12 },
  { model: 'CNN-ResNet18', iss: 0.81, psu: 0.21, fah: 11, leadTime: 16 },
  { model: 'Transformer', iss: 0.68, psu: 0.35, fah: 6, leadTime: 9 },
  { model: 'VGG16', iss: 0.75, psu: 0.25, fah: 9, leadTime: 14 },
];

export default function EvaluationMetrics() {
  const [signals] = useState(() => generateEpochSignals(100, true));
  const [metrics] = useState(() => generateMetrics(signals, true));

  // Generate ISS/PSU trend data
  const trendData = signals.map((s, i) => ({
    epoch: s.epoch,
    iss: Math.max(0, 0.85 - (i > 60 ? (i - 60) * 0.01 : 0) + (Math.random() - 0.5) * 0.05),
    psu: Math.min(1, 0.15 + (i > 60 ? (i - 60) * 0.012 : 0) + (Math.random() - 0.5) * 0.03),
    accuracy: s.accuracy,
  }));

  // Early warning vs accuracy drop comparison
  const comparisonData = [
    { epoch: 60, event: 'First ISS Drop', accuracy: 0.89, predicted: true },
    { epoch: 65, event: 'PSU Spike', accuracy: 0.87, predicted: true },
    { epoch: 70, event: 'ICC Alert', accuracy: 0.82, predicted: true },
    { epoch: 75, event: 'Accuracy Drop', accuracy: 0.71, predicted: false },
    { epoch: 80, event: 'Model Failure', accuracy: 0.58, predicted: false },
  ];

  return (
    <div className="flex flex-col">
      <PageHeader 
        title="Metrics & Evaluation"
        description="Novel metrics analysis and early-warning system evaluation"
        icon={BarChart3}
      />

      <div className="p-6 space-y-6">
        {/* Summary Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Avg Lead Time"
            value="12.5"
            subtitle="epochs before failure"
            icon={Clock}
            variant="success"
          />
          <MetricCard
            title="Detection Rate"
            value="94.2%"
            subtitle="failures predicted"
            icon={Target}
            variant="success"
          />
          <MetricCard
            title="False Positive Rate"
            value="8.3%"
            subtitle="false alarms"
            variant="warning"
          />
          <MetricCard
            title="Cross-Model Generalization"
            value="87.5%"
            subtitle="transfer accuracy"
            variant="success"
          />
        </div>

        {/* ISS/PSU Trends */}
        <MultiSignalChart
          data={trendData}
          series={[
            { key: 'iss', label: 'ISS (Stability)', color: 'hsl(var(--chart-cyan))' },
            { key: 'psu', label: 'PSU (Uncertainty)', color: 'hsl(var(--chart-amber))' },
            { key: 'accuracy', label: 'Accuracy', color: 'hsl(var(--chart-emerald))' },
          ]}
          title="ISS / PSU Trends vs Accuracy"
          height={350}
        />

        {/* Early Warning vs Accuracy Drop */}
        <Card className="p-6">
          <h3 className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Early Warning Timeline vs Accuracy Degradation
          </h3>
          <div className="space-y-4">
            {comparisonData.map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <span className="data-mono text-sm">{item.epoch}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{item.event}</span>
                    {item.predicted ? (
                      <span className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs text-success">
                        <CheckCircle2 className="h-3 w-3" />
                        Predicted
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        <XCircle className="h-3 w-3" />
                        Ground Truth
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div 
                        className="h-full bg-primary transition-all"
                        style={{ width: `${item.accuracy * 100}%` }}
                      />
                    </div>
                    <span className="data-mono text-xs text-muted-foreground">
                      {(item.accuracy * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg bg-success/10 p-3">
            <p className="text-sm text-success">
              <strong>Lead-time advantage:</strong> Internal signals detected failure 15 epochs before accuracy dropped
            </p>
          </div>
        </Card>

        {/* Cross-Architecture Comparison */}
        <Card className="p-6">
          <h3 className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Cross-Architecture Performance
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={modelComparison} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="model" 
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="iss" name="ISS" fill="hsl(var(--chart-cyan))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="psu" name="PSU" fill="hsl(var(--chart-amber))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* FAH Comparison */}
        <Card className="p-6">
          <h3 className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Failure Anticipation Horizon by Model
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={modelComparison} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis 
                type="number"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                label={{ value: 'Epochs', position: 'bottom', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                type="category"
                dataKey="model"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="fah" name="FAH (epochs)" radius={[0, 4, 4, 0]}>
                {modelComparison.map((entry, index) => (
                  <Cell 
                    key={index}
                    fill={entry.fah > 9 ? 'hsl(var(--success))' : entry.fah > 7 ? 'hsl(var(--chart-cyan))' : 'hsl(var(--chart-amber))'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
