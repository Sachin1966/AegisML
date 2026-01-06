
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Activity, Server, AlertTriangle, Cloud, Zap, Shield, PlayCircle, Rocket } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, ProductionTelemetry, CloudStatus, Experiment, ProductionMetrics } from "@/lib/api";
import { MultiSignalChart } from "@/components/charts/MultiSignalChart";
import { MetricCard } from "@/components/ui/MetricCard";
import { useToast } from "@/components/ui/use-toast";

export default function ProductionMonitoring() {
    const { toast } = useToast();
    const [telemetry, setTelemetry] = useState<ProductionTelemetry[]>([]);
    const [metrics, setMetrics] = useState<ProductionMetrics | null>(null);
    const [status, setStatus] = useState<CloudStatus | null>(null);
    const [experiments, setExperiments] = useState<Experiment[]>([]);
    const [selectedExpId, setSelectedExpId] = useState<string>("");
    const [isShadowActive, setIsShadowActive] = useState(false);
    const [isDeploying, setIsDeploying] = useState(false);
    const [deploymentInfo, setDeploymentInfo] = useState<{ model: string, status: string } | null>(null);

    // Initial Fetch
    useEffect(() => {
        api.getCloudStatus().then(setStatus);
        api.getExperiments().then(exps => {
            const completed = exps.filter(e => e.status === 'completed');
            setExperiments(completed);
        });
    }, []);

    // Telemetry Polling (Real Inference)
    useEffect(() => {
        const fetchTelemetry = async () => {
            try {
                // Fetch Logs for Table/Charts
                const data = await api.getProductionTelemetry(50);
                const sorted = data.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                setTelemetry(sorted);

                // Fetch Aggregated Metrics (Source of Truth)
                const agg = await api.getProductionMetrics(10);
                setMetrics(agg);
            } catch (e) {
                console.error("Failed to fetch telemetry", e);
            }
        };

        fetchTelemetry();
        const interval = setInterval(fetchTelemetry, 2000); // Poll every 2s
        return () => clearInterval(interval);
    }, []);

    const handleDeploy = async () => {
        if (!selectedExpId) return;
        setIsDeploying(true);
        try {
            // Safety: Clear previous telemetry to ensure clean state
            await api.clearTelemetry();
            setTelemetry([]);

            const res = await api.deployModel(selectedExpId);
            setDeploymentInfo({ model: res.model, status: "Active" });
            toast({
                title: "Deployment Successful",
                description: `Model ${res.model} is now live on the inference engine.`,
                variant: "default"
            });
        } catch (e) {
            toast({
                title: "Deployment Failed",
                description: "Could not load model weights or reference stats.",
                variant: "destructive"
            });
        } finally {
            setIsDeploying(false);
        }
    };

    const toggleShadowMode = async () => {
        const newState = !isShadowActive;
        try {
            await api.toggleShadowMode(newState);
            setIsShadowActive(newState);
            toast({
                title: newState ? "Passive Introspection Enabled" : "Passive Introspection Disabled",
                description: newState ? "Computing real-time drift and entropy on inference." : "Shadow introspection paused.",
            });
        } catch (e) {
            toast({ title: "Failed to toggle Shadow Mode", variant: "destructive" });
        }
    };

    // Derived Metrics for Charts
    const chartData = telemetry.map((t, i) => ({
        epoch: i, // Index as proxy for time
        timestamp: t.timestamp,
        latency: t.latency_ms,
        entropy: t.shadow_signals?.entropy || 0,
        drift: t.input_drift_metric,
        confidence: t.confidence_score
    }));

    // Server-side aggregates used below (Singular Truth)

    return (
        <div className="flex flex-col space-y-6">
            <PageHeader
                title="Production Monitoring"
                description="Live inference telemetry from deployed models. No simulation."
                icon={Cloud}
            />

            {/* Deployment Control */}
            <Card className="p-4 bg-muted/20 border-primary/20">
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <label className="text-sm font-medium mb-1 block">Deploy Model to Production</label>
                        <Select onValueChange={setSelectedExpId} value={selectedExpId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a trained experiment..." />
                            </SelectTrigger>
                            <SelectContent>
                                {experiments.map(exp => (
                                    <SelectItem key={exp.id} value={exp.id}>
                                        {exp.name} ({exp.model_name} on {exp.dataset_name}) - Epoch {exp.epochs}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button
                        onClick={handleDeploy}
                        disabled={!selectedExpId || isDeploying}
                        className="mt-6"
                    >
                        {isDeploying ? <Server className="mr-2 h-4 w-4 animate-bounce" /> : <Rocket className="mr-2 h-4 w-4" />}
                        {isDeploying ? "Deploying..." : "Deploy Model"}
                    </Button>
                </div>
            </Card>

            <div className="p-6 space-y-6 pt-0">
                {/* Cloud Status Panel */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="p-4 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Active Deployment</span>
                            <Server className="h-4 w-4 text-primary" />
                        </div>
                        <div className="mt-2 text-2xl font-bold">
                            {deploymentInfo ? deploymentInfo.model.toUpperCase() : "NO MODEL"}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                            Status: <span className={deploymentInfo ? "text-green-500" : "text-red-500"}>
                                {deploymentInfo ? deploymentInfo.status : "Offline"}
                            </span>
                        </div>
                    </Card>

                    <MetricCard
                        title="Requests / Sec"
                        value={metrics?.rps.toFixed(1) ?? "0.0"}
                        subtitle="Real-time (10s window)"
                        icon={Zap}
                        variant={metrics?.rps && metrics.rps > 0 ? "default" : "default"}
                    />

                    <MetricCard
                        title="Avg Latency"
                        value={metrics?.avg_latency ? `${metrics.avg_latency.toFixed(0)} ms` : "No traffic"}
                        subtitle={metrics?.avg_latency ? "Real-time Aggregation" : "Waiting for requests..."}
                        icon={Activity}
                        variant={metrics?.avg_latency ? (metrics.avg_latency > 100 ? "warning" : "default") : "default"}
                    />

                    <Card className="p-4 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Passive Introspection</span>
                            <Shield className={`h-4 w-4 ${isShadowActive ? "text-green-500" : "text-muted-foreground"}`} />
                        </div>
                        <div className="mt-2 text-sm text-cyan-600 font-medium">
                            {isShadowActive ? "Active (Compute On)" : "Disabled (Low Latency)"}
                        </div>
                        <Button
                            variant={isShadowActive ? "destructive" : "outline"}
                            size="sm"
                            className="mt-2 w-full"
                            onClick={toggleShadowMode}
                        >
                            <PlayCircle className="mr-2 h-3 w-3" />
                            {isShadowActive ? "Stop Passive Introspection" : "Start Passive Introspection"}
                        </Button>
                    </Card>
                </div>

                {/* Live Charts */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Latency & Confidence */}
                    <MultiSignalChart
                        data={chartData}
                        series={[
                            { key: 'latency', label: 'Latency (ms)', color: 'hsl(var(--chart-blue))' },
                            { key: 'confidence', label: 'Confidence Score', color: 'hsl(var(--chart-emerald))' }
                        ]}
                        title="Real Inference Telemetry"
                        height={300}
                    />

                    {/* Shadow Introspection (Drift & Entropy) */}
                    <MultiSignalChart
                        data={chartData}
                        series={[
                            { key: 'drift', label: 'Drift Score (vs Baseline)', color: 'hsl(var(--chart-amber))' },
                            { key: 'entropy', label: 'Production Entropy', color: 'hsl(var(--chart-rose))' }
                        ]}
                        title="Shadow Mode Signals"
                        height={300}
                    />
                </div>

                {/* Recent Logs Table */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Live Traffic Logs</h3>
                    <div className="max-h-[300px] overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="text-left text-muted-foreground border-b uppercase text-xs">
                                <tr>
                                    <th className="pb-2">Time</th>
                                    <th className="pb-2">Status</th>
                                    <th className="pb-2">Latency</th>
                                    <th className="pb-2">Drift (vs Adaptive)</th>
                                    <th className="pb-2">Confidence</th>
                                    <th className="pb-2">Risk Analysis</th>
                                </tr>
                            </thead>
                            <tbody>
                                {telemetry.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-muted-foreground">
                                            No traffic detected. Run <code>python generate_traffic.py</code> to simulate users.
                                        </td>
                                    </tr>
                                )}
                                {telemetry.slice().reverse().map((t) => (
                                    <tr key={t.id} className="border-b last:border-0 hover:bg-muted/50">
                                        <td className="py-2 font-mono">{new Date(t.timestamp).toLocaleTimeString()}</td>
                                        <td className="py-2">
                                            <Badge variant={t.status_code === 200 ? "outline" : "destructive"}>
                                                {t.status_code}
                                            </Badge>
                                        </td>
                                        <td className="py-2">{t.latency_ms.toFixed(0)} ms</td>
                                        <td className="py-2">
                                            <div className="flex flex-col">
                                                <span className={t.input_drift_metric > (t.adaptive_thresholds?.drift || 1.0) ? "text-red-500 font-bold" : "text-muted-foreground"}>
                                                    {t.input_drift_metric.toFixed(3)}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    Limit: {(t.adaptive_thresholds?.drift || 0).toFixed(2)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-2">
                                            {(t.confidence_score * 100).toFixed(1)}%
                                        </td>
                                        <td className="py-2">
                                            <Badge className={
                                                t.failure_risk === "Stable" ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" :
                                                    t.failure_risk === "Warning" ? "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20" :
                                                        "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                            }>
                                                {t.failure_risk}
                                            </Badge>
                                            {t.causal_trace && (
                                                <div className="text-[10px] text-red-400 mt-1">
                                                    {t.causal_trace}
                                                </div>
                                            )}
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
