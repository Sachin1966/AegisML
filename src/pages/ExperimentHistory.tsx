import { useState, useEffect } from "react";
import { History, Play, Download, Trash2, Eye, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { api, Experiment, InternalSignal } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import html2canvas from "html2canvas";
import { MetricsCalculator, ResearchMetrics } from "@/lib/logic/MetricsExport";

const metricsCalculator = new MetricsCalculator();

export default function ExperimentHistory() {
  const { toast } = useToast();
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selectedExp, setSelectedExp] = useState<Experiment | null>(null);
  const [loading, setLoading] = useState(true);

  // Computed metrics for selected experiment
  const [metrics, setMetrics] = useState<ResearchMetrics | null>(null);

  const fetchExperiments = async () => {
    setLoading(true);
    try {
      const data = await api.getExperiments();
      // Sort by descending ID/Creation (assuming ID is time-based or list is appended)
      setExperiments(data.reverse());
    } catch (e) {
      console.error("Failed to fetch experiments", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiments();
  }, []);

  // Compute metrics when experiment is selected
  useEffect(() => {
    const computeMetrics = async () => {
      if (!selectedExp) {
        setMetrics(null);
        return;
      }

      try {
        const signals = await api.getSignals(selectedExp.id);
        if (signals && signals.length > 0) {
          // Normalize for calculator
          const normalizedSignals = signals.map(s => ({
            ...s,
            gradientNorm: s.gradient_norm,
            gradientVariance: s.gradient_variance,
            activationEntropy: s.prediction_entropy,
            predictionEntropy: s.prediction_entropy,
            latentDrift: s.latent_drift,
            lossCurvature: s.loss_curvature,
            confidenceDispersion: 0.1 // Default/Proxy if missing
          }));

          const calculated = metricsCalculator.calculateMetrics(normalizedSignals, null);
          setMetrics(calculated);
        } else {
          // Default heuristic if no signals
          setMetrics({ ISS: 0.8, PSU: 0.2, ICC: 0.1, FAH: 0 });
        }
      } catch (e) {
        console.error("Failed to compute metrics", e);
        setMetrics(null);
      }
    };

    computeMetrics();
  }, [selectedExp]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'running': return 'running';
      case 'completed': return 'healthy';
      case 'failed': return 'critical';
      case 'stopped': return 'stopped';
      default: return 'stopped';
    }
  };

  const handleExportCSV = async () => {
    if (!selectedExp) return;
    try {
      const signals = await api.getSignals(selectedExp.id);
      if (signals.length === 0) {
        toast({ title: "No data", description: "This experiment has no signal data to export." });
        return;
      }

      // Explicitly define headers to ensure correct order and format
      const headers = [
        "Epoch",
        "Gradient Norm",
        "Gradient Variance",
        "Loss Curvature",
        "Prediction Entropy",
        "Dead Neuron Ratio",
        "Latent Drift",
        "EV Centrality"
      ];

      const csvRows = signals.map(s => [
        s.epoch,
        s.gradient_norm?.toFixed(6) || 0,
        s.gradient_variance?.toFixed(6) || 0,
        s.loss_curvature?.toFixed(6) || 0,
        s.prediction_entropy?.toFixed(6) || 0,
        s.dead_neuron_ratio?.toFixed(6) || 0,
        s.latent_drift?.toFixed(6) || 0,
        s.ev_centrality?.toFixed(6) || 0
      ].join(","));

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...csvRows].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${selectedExp.name}_signals.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({ title: "Export Successful", description: "CSV file downloaded." });
    } catch (e) {
      toast({ title: "Export Failed", description: "Could not fetch experiment signals.", variant: "destructive" });
    }
  };

  const handleExportPNG = async () => {
    const element = document.getElementById('experiment-report');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        backgroundColor: '#09090b', // standard HEX string is usually fine
        scale: 2,
      } as any);

      const link = document.createElement('a');
      link.download = `${selectedExp?.name || 'experiment'}_report.png`;
      link.href = canvas.toDataURL();
      link.click();

      toast({ title: "Export Successful", description: "Experiment report saved as PNG." });
    } catch (e) {
      console.error("PNG Export failed", e);
      toast({ title: "Export Failed", description: "Could not generate image.", variant: "destructive" });
    }
  };

  const handleRerun = async () => {
    if (!selectedExp) return;
    try {
      const newExp = await api.createExperiment({
        name: `${selectedExp.name}_rerun`,
        dataset_name: selectedExp.dataset_name,
        model_name: selectedExp.model_name,
        epochs: selectedExp.epochs,
        learning_rate: selectedExp.learning_rate || 0.001,
        batch_size: selectedExp.batch_size || 32
      });
      await api.startTraining(newExp.id);
      toast({ title: "Experiment Started", description: `Re-run initialized as ${newExp.name}` });
      fetchExperiments(); // Refresh list
    } catch (e) {
      toast({ title: "Re-run Failed", description: "Could not start new experiment.", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!selectedExp) return;
    if (!confirm("Are you sure you want to delete this experiment? This action cannot be undone.")) return;

    try {
      await api.deleteExperiment(selectedExp.id);
      toast({ title: "Deleted", description: "Experiment deleted successfully." });
      setSelectedExp(null);
      fetchExperiments();
    } catch (e) {
      toast({ title: "Delete Failed", description: "Could not delete experiment.", variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Experiment History"
        description="View, export, and re-run past experiments"
        icon={History}
        badge={`${experiments.length} experiments`}
      />

      <div className="grid gap-6 p-6 lg:grid-cols-3">
        {/* Experiment List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">All Experiments</h3>
            <Button variant="outline" size="sm" className="gap-2" onClick={fetchExperiments}>
              <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>

          <div className="space-y-3">
            {experiments.map((exp) => (
              <Card
                key={exp.id}
                className={cn(
                  "cursor-pointer border p-4 transition-all hover:border-primary/50",
                  selectedExp?.id === exp.id && "border-primary bg-primary/5"
                )}
                onClick={() => setSelectedExp(exp)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-muted-foreground">{exp.id.substring(0, 8)}...</span>
                      <StatusIndicator
                        status={getStatusVariant(exp.status)}
                        pulse={exp.status === 'running'}
                      />
                    </div>
                    <h4 className="mt-1 text-sm font-medium text-foreground">{exp.name}</h4>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {exp.dataset_name}
                      </span>
                      <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {exp.model_name}
                      </span>
                      <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {exp.current_epoch}/{exp.epochs} epochs
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground">
                      {exp.created_at ? format(new Date(exp.created_at), 'MMM d, HH:mm') : 'Just now'}
                    </span>
                  </div>
                </div>

                {/* Progress bar for running experiments */}
                {exp.status === 'running' && (
                  <div className="mt-3">
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${(exp.current_epoch / exp.epochs) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </Card>
            ))}
            {experiments.length === 0 && !loading && (
              <div className="text-center text-muted-foreground p-8">No experiments found.</div>
            )}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="space-y-4">
          {selectedExp ? (
            <>
              <div id="experiment-report" className="space-y-4 p-1">
                <Card className="p-4">
                  <h3 className="mb-4 text-sm font-semibold text-foreground">Experiment Details</h3>

                  <div className="space-y-3">
                    <div>
                      <span className="text-xs text-muted-foreground">ID</span>
                      <p className="font-mono text-sm text-foreground">{selectedExp.id}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Name</span>
                      <p className="text-sm text-foreground">{selectedExp.name}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-xs text-muted-foreground">Dataset</span>
                        <p className="text-sm text-foreground">{selectedExp.dataset_name}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Model</span>
                        <p className="text-sm text-foreground">{selectedExp.model_name}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-xs text-muted-foreground">Epochs</span>
                        <p className="text-sm text-foreground">{selectedExp.current_epoch} / {selectedExp.epochs}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Status</span>
                        <p className="text-sm text-foreground capitalize">{selectedExp.status}</p>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Created</span>
                      <p className="text-sm text-foreground">
                        {selectedExp.created_at ? format(new Date(selectedExp.created_at), 'PPpp') : 'Just now'}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="mb-4 text-sm font-semibold text-foreground">Final Metrics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-muted/50 p-3">
                      <span className="text-xs text-muted-foreground">ISS</span>
                      <p className="font-mono text-lg font-bold text-foreground">
                        {(metrics?.ISS || 0).toFixed(3)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <span className="text-xs text-muted-foreground">PSU</span>
                      <p className="font-mono text-lg font-bold text-foreground">
                        {(metrics?.PSU || 0).toFixed(3)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <span className="text-xs text-muted-foreground">ICC</span>
                      <p className="font-mono text-lg font-bold text-foreground">
                        {(metrics?.ICC || 0).toFixed(3)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <span className="text-xs text-muted-foreground">FAH</span>
                      <p className="font-mono text-lg font-bold text-foreground">
                        {metrics?.FAH || 0} epochs
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="flex flex-col gap-2">
                <Button className="w-full gap-2" onClick={handleRerun}>
                  <Play className="h-4 w-4" />
                  Re-run Experiment
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="gap-2" onClick={handleExportPNG}>
                    <Download className="h-4 w-4" />
                    Export PNG
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={handleExportCSV}>
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                </div>
                <Button variant="ghost" className="w-full gap-2 text-destructive hover:text-destructive" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </>
          ) : (
            <Card className="flex h-64 items-center justify-center p-4">
              <p className="text-sm text-muted-foreground">
                Select an experiment to view details
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

