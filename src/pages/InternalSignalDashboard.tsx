import { useState, useEffect } from "react";
import { Activity, Zap, Layers, Brain } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MetricCard } from "@/components/ui/MetricCard";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { SignalChart } from "@/components/charts/SignalChart";
import { MultiSignalChart } from "@/components/charts/MultiSignalChart";
// import { generateEpochSignals, EpochSignal } from "@/lib/mockData"; -- Removed
import { api, InternalSignal } from "@/lib/api";

export default function InternalSignalDashboard() {
  const [signals, setSignals] = useState<InternalSignal[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [experimentId, setExperimentId] = useState<string | null>(null);

  useEffect(() => {
    // Get latest active experiment and sync status
    const init = async () => {
      try {
        const exps = await api.getExperiments();
        if (exps.length > 0) {
          const latest = exps[0];
          setExperimentId(latest.id);
          setIsLive(latest.status === 'running' && (latest.current_epoch < latest.epochs));
        }
      } catch (e) {
        console.error("Failed to fetch experiments", e);
      }
    };
    init();

    // Poll for status updates (e.g. if started/stopped from another tab)
    const statusInterval = setInterval(async () => {
      try {
        const exps = await api.getExperiments();
        if (exps.length > 0) {
          const latest = exps[0];
          // Only update experiment ID if it changed to a newer one
          if (latest.id !== experimentId) setExperimentId(latest.id);

          // If we are currently "Live" but backend says stopped -> Stop
          // If we are "Paused" but backend says running -> Start (Auto-sync)
          // Also check if epochs completed (backend might still say running if not fixed yet)
          setIsLive(latest.status === 'running' && (latest.current_epoch < latest.epochs));
        }
      } catch (e) {
        console.error("Status polling error", e);
      }
    }, 2000);

    return () => clearInterval(statusInterval);
  }, [experimentId]); // Re-run if ID changes, but mainly runs on mount 

  // Fetch signals when experimentId is available (initial load + updates)
  useEffect(() => {
    if (!experimentId) return;

    const fetchSignals = async () => {
      try {
        const data = await api.getSignals(experimentId);
        setSignals(data); // Load existing data regardless of live status
      } catch (e) {
        console.error("Signal fetch error", e);
      }
    };

    fetchSignals(); // Initial fetch

    // Continue polling ONLY if live
    if (isLive) {
      const interval = setInterval(fetchSignals, 2000);
      return () => clearInterval(interval);
    }
  }, [isLive, experimentId]);

  const latestSignal = signals[signals.length - 1];
  const prevSignal = signals[signals.length - 2] || latestSignal;
  const avgGradientNorm = signals.slice(-10).reduce((a, b) => a + b.gradient_norm, 0) / 10;

  const entChange = latestSignal ? latestSignal.prediction_entropy - prevSignal.prediction_entropy : 0;
  const driftChange = latestSignal ? latestSignal.latent_drift - prevSignal.latent_drift : 0;
  const dnChange = latestSignal ? latestSignal.dead_neuron_ratio - prevSignal.dead_neuron_ratio : 0;

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Internal Signal Dashboard"
        description="Real-time monitoring of internal training dynamics"
        icon={Activity}
        badge={isLive ? "LIVE" : "PAUSED"}
        badgeVariant={isLive ? "success" : "default"}
      />

      <div className="p-6 space-y-6">
        {/* Top Metrics Row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Gradient Norm"
            value={latestSignal?.gradient_norm || 0}
            icon={Zap}
            trend={avgGradientNorm > 1 ? 'up' : 'stable'}
            trendValue={avgGradientNorm > 1 ? '+12%' : ''}
            variant={avgGradientNorm > 1.5 ? 'warning' : 'default'}
          />
          <MetricCard
            title="Activation Entropy"
            value={latestSignal?.prediction_entropy || 0}
            icon={Layers}
            trend={entChange > 0.1 ? 'up' : entChange < -0.1 ? 'down' : 'stable'}
            trendValue={(entChange > 0 ? '+' : '') + (entChange * 100).toFixed(1) + '%'}
            variant="default"
          />
          <MetricCard
            title="Dead Neuron Ratio"
            value={latestSignal?.dead_neuron_ratio || 0}
            icon={Brain}
            trend={dnChange > 0.005 ? 'up' : 'stable'}
            trendValue={dnChange > 0.005 ? '+' + (dnChange * 100).toFixed(1) + '%' : ''}
            variant={latestSignal?.dead_neuron_ratio > 0.15 ? 'danger' : 'default'}
          />
          <MetricCard
            title="Latent Drift"
            value={latestSignal?.latent_drift || 0}
            trend={driftChange > 0.01 ? 'up' : 'stable'}
            trendValue={(driftChange > 0 ? '+' : '') + driftChange.toFixed(3)}
            variant={latestSignal?.latent_drift > 0.3 ? 'warning' : 'default'}
          />
        </div>

        {/* Main Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          <SignalChart
            data={signals}
            dataKey="gradient_norm"
            title="Gradient Norm over Epochs"
            color="hsl(var(--chart-cyan))"
            threshold={1.5}
            thresholdLabel="Alert"
          />
          <SignalChart
            data={signals}
            dataKey="gradient_variance"
            title="Gradient Variance"
            color="hsl(var(--chart-amber))"
            threshold={0.5}
            thresholdLabel="Unstable"
          />
        </div>

        {/* Activation Statistics */}
        <MultiSignalChart
          data={signals}
          series={[
            { key: 'prediction_entropy', label: 'Entropy', color: 'hsl(var(--chart-violet))' },
            { key: 'dead_neuron_ratio', label: 'Dead Neurons', color: 'hsl(var(--chart-rose))' },
          ]}
          title="Network Confidence Stats"
          height={300}
        />

        {/* Secondary Charts */}
        <div className="grid gap-6 lg:grid-cols-3">
          <SignalChart
            data={signals}
            dataKey="dead_neuron_ratio"
            title="Dead Neuron Ratio"
            color="hsl(var(--chart-rose))"
            threshold={0.2}
            thresholdLabel="Critical"
          />
          <SignalChart
            data={signals}
            dataKey="latent_drift"
            title="Latent Space Centroid Drift"
            color="hsl(var(--chart-emerald))"
          />
          <SignalChart
            data={signals}
            dataKey="ev_centrality"
            title="Eigenvector Centrality"
            color="hsl(var(--chart-blue))"
          />
        </div>

        {/* Loss Curvature & Confidence */}
        <div className="grid gap-6 lg:grid-cols-2">
          <SignalChart
            data={signals}
            dataKey="loss_curvature"
            title="Loss Curvature (Sharpness Proxy)"
            color="hsl(var(--chart-amber))"
          />
          {/* Removed 2nd MultiSignalChart to simplify and avoid missing keys */}
        </div>

        {/* Status Footer */}
        <div className="flex items-center justify-between rounded-lg border border-border bg-card/50 px-4 py-3">
          <div className="flex items-center gap-4">
            <StatusIndicator status={isLive ? 'running' : 'stopped'} label={isLive ? 'Live Updates' : 'Paused'} pulse={isLive} />
            <span className="text-xs text-muted-foreground">
              Epoch {signals.length} · Last update: {new Date().toLocaleTimeString()}
            </span>
          </div>
          <button
            onClick={async () => {
              if (isLive && experimentId) {
                await api.stopTraining(experimentId);
                setIsLive(false);
              } else {
                setIsLive(true);
              }
            }}
            className="text-xs text-primary hover:underline"
          >
            {isLive ? 'Pause Experiment' : 'Resume Monitoring'}
          </button>
        </div>
      </div>
    </div>
  );
}
