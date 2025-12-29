import { useState, useEffect } from "react";
import { Brain, AlertTriangle, TrendingDown, Clock, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MetricCard } from "@/components/ui/MetricCard";
import { GaugeChart } from "@/components/charts/GaugeChart";
import { SignalChart } from "@/components/charts/SignalChart";
import { MultiSignalChart } from "@/components/charts/MultiSignalChart";
import { Card } from "@/components/ui/card";
import { generateEpochSignals, generateMetrics, IntrospectionMetrics } from "@/lib/mockData";
import { cn } from "@/lib/utils";

interface FailurePrediction {
  epoch: number;
  probability: number;
  icc: number;
  anticipatedHorizon: number;
}

export default function SelfAwarenessDashboard() {
  const [signals] = useState(() => generateEpochSignals(100, true));
  const [metrics, setMetrics] = useState<IntrospectionMetrics>(() => 
    generateMetrics(signals, true)
  );
  const [predictions, setPredictions] = useState<FailurePrediction[]>([]);

  useEffect(() => {
    // Generate failure predictions over time
    const preds: FailurePrediction[] = signals.map((s, i) => ({
      epoch: s.epoch,
      probability: Math.min(1, 0.1 + (i > 60 ? (i - 60) * 0.02 : 0) + Math.random() * 0.1),
      icc: Math.min(1, 0.05 + (i > 50 ? (i - 50) * 0.015 : 0) + Math.random() * 0.05),
      anticipatedHorizon: Math.max(0, 15 - (i > 50 ? (i - 50) * 0.3 : 0)),
    }));
    setPredictions(preds);
  }, [signals]);

  const getAlertLevel = (prob: number) => {
    if (prob >= 0.75) return 'critical';
    if (prob >= 0.5) return 'warning';
    return 'healthy';
  };

  const alertLevel = getAlertLevel(metrics.failureProbability);

  return (
    <div className="flex flex-col">
      <PageHeader 
        title="Self-Awareness Dashboard"
        description="Introspection meta-model: failure prediction without ground truth"
        icon={Brain}
        badge={alertLevel === 'critical' ? 'FAILURE IMMINENT' : alertLevel === 'warning' ? 'ELEVATED RISK' : 'STABLE'}
        badgeVariant={alertLevel === 'critical' ? 'danger' : alertLevel === 'warning' ? 'warning' : 'success'}
      />

      <div className="p-6 space-y-6">
        {/* Alert Banner */}
        {alertLevel !== 'healthy' && (
          <Card className={cn(
            "flex items-center gap-4 p-4 border-2",
            alertLevel === 'critical' 
              ? "border-destructive/50 bg-destructive/10" 
              : "border-accent/50 bg-accent/10"
          )}>
            <AlertTriangle className={cn(
              "h-6 w-6",
              alertLevel === 'critical' ? "text-destructive" : "text-accent"
            )} />
            <div>
              <h4 className={cn(
                "font-semibold",
                alertLevel === 'critical' ? "text-destructive" : "text-accent"
              )}>
                {alertLevel === 'critical' 
                  ? 'Critical: Model failure predicted within 5 epochs'
                  : 'Warning: Elevated failure probability detected'}
              </h4>
              <p className="text-sm text-muted-foreground">
                Internal signals indicate instability. Consider intervention.
              </p>
            </div>
          </Card>
        )}

        {/* Primary Gauges */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <GaugeChart
            value={metrics.failureProbability}
            title="Failure Probability"
            subtitle="Predicted by meta-model"
            thresholds={{ warning: 0.5, critical: 0.75 }}
          />
          <GaugeChart
            value={metrics.icc}
            title="Internal Confidence Collapse"
            subtitle="ICC metric"
            thresholds={{ warning: 0.4, critical: 0.7 }}
          />
          <GaugeChart
            value={metrics.psu}
            title="Predictive Self-Uncertainty"
            subtitle="PSU metric"
            thresholds={{ warning: 0.5, critical: 0.7 }}
          />
          <GaugeChart
            value={1 - metrics.iss}
            title="Instability Score"
            subtitle="Inverse of ISS"
            thresholds={{ warning: 0.4, critical: 0.6 }}
          />
        </div>

        {/* FAH Display */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                <Clock className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Failure Anticipation Horizon (FAH)
                </h3>
                <p className="text-3xl font-bold text-foreground">
                  {metrics.fah > 0 ? `${metrics.fah} epochs` : 'No failure predicted'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Lead-time advantage</p>
              <p className="data-mono text-lg font-semibold text-success">
                +{(metrics.fah * 1.5).toFixed(1)} min
              </p>
            </div>
          </div>
        </Card>

        {/* Failure Probability Timeline */}
        <SignalChart
          data={predictions}
          dataKey="probability"
          title="Failure Probability Timeline"
          color="hsl(var(--destructive))"
          threshold={0.75}
          thresholdLabel="Critical"
          className="h-auto"
        />

        {/* ICC Collapse Detection */}
        <MultiSignalChart
          data={predictions}
          series={[
            { key: 'probability', label: 'Failure Prob', color: 'hsl(var(--destructive))' },
            { key: 'icc', label: 'ICC', color: 'hsl(var(--chart-amber))' },
          ]}
          title="ICC Collapse Detection vs Failure Probability"
          height={300}
        />

        {/* Metrics Summary */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Internal Stability Score"
            value={metrics.iss}
            subtitle="ISS (higher = more stable)"
            variant={metrics.iss < 0.5 ? 'danger' : metrics.iss < 0.7 ? 'warning' : 'success'}
            trend={metrics.iss < 0.5 ? 'down' : 'stable'}
          />
          <MetricCard
            title="Predictive Self-Uncertainty"
            value={metrics.psu}
            subtitle="PSU (lower = more confident)"
            variant={metrics.psu > 0.6 ? 'danger' : metrics.psu > 0.4 ? 'warning' : 'success'}
            trend={metrics.psu > 0.6 ? 'up' : 'stable'}
          />
          <MetricCard
            title="Internal Confidence Collapse"
            value={metrics.icc}
            subtitle="ICC (lower = healthier)"
            variant={metrics.icc > 0.6 ? 'danger' : metrics.icc > 0.4 ? 'warning' : 'success'}
            trend={metrics.icc > 0.5 ? 'up' : 'stable'}
          />
          <MetricCard
            title="Meta-Model Confidence"
            value={(1 - Math.abs(0.5 - metrics.failureProbability) * 0.5).toFixed(3)}
            subtitle="Prediction certainty"
            icon={ShieldAlert}
          />
        </div>

        {/* Horizon Visualization */}
        <SignalChart
          data={predictions}
          dataKey="anticipatedHorizon"
          title="Anticipated Failure Horizon (epochs ahead)"
          color="hsl(var(--chart-amber))"
        />
      </div>
    </div>
  );
}
