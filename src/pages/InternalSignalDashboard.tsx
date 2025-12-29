import { useState, useEffect } from "react";
import { Activity, Zap, Layers, Brain } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MetricCard } from "@/components/ui/MetricCard";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { SignalChart } from "@/components/charts/SignalChart";
import { MultiSignalChart } from "@/components/charts/MultiSignalChart";
import { generateEpochSignals, EpochSignal } from "@/lib/mockData";

export default function InternalSignalDashboard() {
  const [signals, setSignals] = useState<EpochSignal[]>([]);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    // Initialize with mock data
    setSignals(generateEpochSignals(80, true));
    
    // Simulate live updates
    if (isLive) {
      const interval = setInterval(() => {
        setSignals(prev => {
          if (prev.length >= 150) return prev;
          const lastEpoch = prev[prev.length - 1]?.epoch || 0;
          const newSignal = generateEpochSignals(1, false)[0];
          newSignal.epoch = lastEpoch + 1;
          return [...prev, newSignal];
        });
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isLive]);

  const latestSignal = signals[signals.length - 1];
  const avgGradientNorm = signals.slice(-10).reduce((a, b) => a + b.gradientNorm, 0) / 10;
  const gradientVariance = signals.slice(-10).reduce((a, b) => a + b.gradientVariance, 0) / 10;

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
            value={latestSignal?.gradientNorm || 0}
            icon={Zap}
            trend={avgGradientNorm > 1 ? 'up' : 'stable'}
            trendValue={avgGradientNorm > 1 ? '+12%' : ''}
            variant={avgGradientNorm > 1.5 ? 'warning' : 'default'}
          />
          <MetricCard
            title="Activation Entropy"
            value={latestSignal?.activationEntropy || 0}
            icon={Layers}
            trend="stable"
            variant="default"
          />
          <MetricCard
            title="Dead Neuron Ratio"
            value={latestSignal?.deadNeuronRatio || 0}
            icon={Brain}
            trend={latestSignal?.deadNeuronRatio > 0.1 ? 'up' : 'stable'}
            variant={latestSignal?.deadNeuronRatio > 0.15 ? 'danger' : 'default'}
          />
          <MetricCard
            title="Latent Drift"
            value={latestSignal?.latentDrift || 0}
            trend="up"
            trendValue="+0.05"
            variant={latestSignal?.latentDrift > 0.3 ? 'warning' : 'default'}
          />
        </div>

        {/* Main Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          <SignalChart
            data={signals}
            dataKey="gradientNorm"
            title="Gradient Norm over Epochs"
            color="hsl(var(--chart-cyan))"
            threshold={1.5}
            thresholdLabel="Alert"
          />
          <SignalChart
            data={signals}
            dataKey="gradientVariance"
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
            { key: 'activationMean', label: 'Mean', color: 'hsl(var(--chart-cyan))' },
            { key: 'activationVariance', label: 'Variance', color: 'hsl(var(--chart-amber))' },
            { key: 'activationEntropy', label: 'Entropy', color: 'hsl(var(--chart-violet))' },
          ]}
          title="Activation Statistics"
          height={300}
        />

        {/* Secondary Charts */}
        <div className="grid gap-6 lg:grid-cols-3">
          <SignalChart
            data={signals}
            dataKey="deadNeuronRatio"
            title="Dead Neuron Ratio"
            color="hsl(var(--chart-rose))"
            threshold={0.2}
            thresholdLabel="Critical"
          />
          <SignalChart
            data={signals}
            dataKey="latentDrift"
            title="Latent Space Centroid Drift"
            color="hsl(var(--chart-emerald))"
          />
          <SignalChart
            data={signals}
            dataKey="interClassSeparation"
            title="Inter-Class Separation"
            color="hsl(var(--chart-blue))"
          />
        </div>

        {/* Loss Curvature & Confidence */}
        <div className="grid gap-6 lg:grid-cols-2">
          <SignalChart
            data={signals}
            dataKey="lossCurvature"
            title="Loss Curvature (Sharpness Proxy)"
            color="hsl(var(--chart-amber))"
          />
          <MultiSignalChart
            data={signals}
            series={[
              { key: 'predictionEntropy', label: 'Prediction Entropy', color: 'hsl(var(--chart-rose))' },
              { key: 'confidenceDispersion', label: 'Confidence Dispersion', color: 'hsl(var(--chart-violet))' },
            ]}
            title="Prediction Uncertainty Signals"
          />
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
            onClick={() => setIsLive(!isLive)}
            className="text-xs text-primary hover:underline"
          >
            {isLive ? 'Pause' : 'Resume'}
          </button>
        </div>
      </div>
    </div>
  );
}
