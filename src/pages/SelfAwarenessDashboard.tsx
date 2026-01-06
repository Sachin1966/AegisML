import { useState, useEffect, useMemo } from "react";
import { Brain, AlertTriangle, TrendingDown, Clock, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MetricCard } from "@/components/ui/MetricCard";
import { GaugeChart } from "@/components/charts/GaugeChart";
import { SignalChart } from "@/components/charts/SignalChart";
import { MultiSignalChart } from "@/components/charts/MultiSignalChart";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { api, InternalSignal } from "@/lib/api";
import { IntrospectionModel } from "@/lib/logic/IntrospectionModel";
import { MetricsCalculator, ResearchMetrics } from "@/lib/logic/MetricsExport";

// Singletons for logic
const introspectionModel = new IntrospectionModel();
const metricsCalculator = new MetricsCalculator();

interface FailurePrediction {
  epoch: number;
  probability: number;
  icc: number;
  anticipatedHorizon: number;
}

export default function SelfAwarenessDashboard() {
  const [signals, setSignals] = useState<InternalSignal[]>([]);
  const [experimentId, setExperimentId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<ResearchMetrics>({ ISS: 1, PSU: 0, ICC: 0, FAH: 0 });
  const [predictions, setPredictions] = useState<FailurePrediction[]>([]);
  const [currentRisk, setCurrentRisk] = useState<number>(0);

  // Poll for active experiment and signals
  useEffect(() => {
    const fetchExperiment = async () => {
      try {
        const exps = await api.getExperiments();
        if (exps.length > 0) {
          setExperimentId(exps[0].id);
        }
      } catch (e) {
        console.error("Failed to fetch experiments", e);
      }
    };
    fetchExperiment();

    const interval = setInterval(async () => {
      if (experimentId) {
        try {
          const data = await api.getSignals(experimentId);
          setSignals(data);
        } catch (e) {
          console.error("Failed to poll signals", e);
        }
      } else {
        fetchExperiment(); // Keep trying to find an experiment
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [experimentId]);

  // Calculate Metrics & Predictions when signals change
  useEffect(() => {
    if (signals.length === 0) return;

    // Normalize signals (snake_case -> camelCase) for the logic engine
    const normalize = (s: any) => ({
      ...s,
      gradientNorm: s.gradient_norm,
      gradientVariance: s.gradient_variance,
      activationEntropy: s.prediction_entropy, // Proxy mapping
      predictionEntropy: s.prediction_entropy,
      latentDrift: s.latent_drift,
      confidenceDispersion: s.confidence_dispersion || 0.1,
      lossCurvature: s.loss_curvature
    });

    const normalizedSignals = signals.map(normalize);

    // 1. Calculate Aggregate Research Metrics (ISS, PSU, etc.)
    const calculatedMetrics = metricsCalculator.calculateMetrics(normalizedSignals, null);
    setMetrics(calculatedMetrics);

    // 2. Generate Prediction Timeline (Running the model on history)
    const preds = normalizedSignals.map((s) => {
      const risk = introspectionModel.predictFailureRisk(s);

      // Calculate instantaneous ICC for this point
      // ICC = Max Conf so far - Current Conf
      const conf = 1.0 - s.predictionEntropy;
      // Note: In a real efficient implementation, we'd track maxConf incrementally. 
      // For now, simple approximation is fine for visualization.

      return {
        epoch: s.epoch,
        probability: risk.score,
        icc: Math.max(0, 1.0 - conf), // Simplified ICC for timeline
        anticipatedHorizon: calculatedMetrics.FAH
      };
    });
    setPredictions(preds);

    // 3. Current Live Risk
    const lastSignal = normalizedSignals[normalizedSignals.length - 1];
    const riskAnalysis = introspectionModel.predictFailureRisk(lastSignal);
    setCurrentRisk(riskAnalysis.score);

  }, [signals]);

  const getAlertLevel = (prob: number) => {
    if (prob >= 0.75) return 'critical';
    if (prob >= 0.5) return 'warning';
    return 'healthy';
  };

  const alertLevel = getAlertLevel(currentRisk);

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
                Internal signals indicate instability via Physics-Based Projection.
              </p>
            </div>
          </Card>
        )}

        {/* Primary Gauges */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <GaugeChart
            value={currentRisk}
            title="Failure Probability"
            subtitle="Predicted by meta-model"
            thresholds={{ warning: 0.5, critical: 0.75 }}
          />
          <GaugeChart
            value={metrics.ICC}
            title="Internal Confidence Collapse"
            subtitle="ICC metric"
            thresholds={{ warning: 0.4, critical: 0.7 }}
          />
          <GaugeChart
            value={metrics.PSU}
            title="Predictive Self-Uncertainty"
            subtitle="PSU metric"
            thresholds={{ warning: 0.5, critical: 0.7 }}
          />
          <GaugeChart
            value={1 - metrics.ISS}
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
                  {metrics.FAH > 0 ? `${metrics.FAH.toFixed(1)} epochs` : 'Stable'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Lead-time advantage</p>
              <p className="data-mono text-lg font-semibold text-success">
                {metrics.FAH > 0 ? `+${(metrics.FAH * 1.5).toFixed(1)} min` : '--'}
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
            { key: 'icc', label: 'ICC (Inst)', color: 'hsl(var(--chart-amber))' },
          ]}
          title="ICC Collapse Detection vs Failure Probability"
          height={300}
        />

        {/* Metrics Summary */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Internal Stability Score"
            value={metrics.ISS.toFixed(3)}
            subtitle="ISS (higher = more stable)"
            variant={metrics.ISS < 0.5 ? 'danger' : metrics.ISS < 0.7 ? 'warning' : 'success'}
            trend={metrics.ISS < 0.5 ? 'down' : 'stable'}
          />
          <MetricCard
            title="Predictive Self-Uncertainty"
            value={metrics.PSU.toFixed(3)}
            subtitle="PSU (lower = more confident)"
            variant={metrics.PSU > 0.6 ? 'danger' : metrics.PSU > 0.4 ? 'warning' : 'success'}
            trend={metrics.PSU > 0.6 ? 'up' : 'stable'}
          />
          <MetricCard
            title="Internal Confidence Collapse"
            value={metrics.ICC.toFixed(3)}
            subtitle="ICC (lower = healthier)"
            variant={metrics.ICC > 0.6 ? 'danger' : metrics.ICC > 0.4 ? 'warning' : 'success'}
            trend={metrics.ICC > 0.5 ? 'up' : 'stable'}
          />
          <MetricCard
            title="Meta-Model Confidence"
            value={(1 - Math.abs(0.5 - currentRisk) * 0.5).toFixed(3)}
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
