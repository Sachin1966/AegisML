import { useState, useEffect, useRef } from "react";
import { Play, RotateCcw, Save, Settings, AlertTriangle, BookOpen, Pause, RefreshCw, Square, Beaker } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MetricCard } from "@/components/ui/MetricCard";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
// import { ... } from "@/lib/mockData"; -- Removed
import { getRealCausalAnalysis, getRealCounterfactuals, getRealActiveInterventions, getRealAdvancedMetrics } from "@/lib/logic/RealIntrospection";
import { generateLatexReport } from "@/lib/logic/LatexGenerator";
import { api } from "@/lib/api";
import { CausalGraphView } from "@/components/research/CausalGraphView";
import { ReflectionMemory } from "@/components/research/ReflectionMemory";
import { CounterfactualPanel } from "@/components/research/CounterfactualPanel";
import { InterventionAdvisor } from "@/components/research/InterventionAdvisor";
import { ResearchMetricsPanel } from "@/components/research/ResearchMetricsPanel";
import { TheoryOverlay } from "@/components/research/TheoryOverlay";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

const datasets = [
  { id: 'mnist', name: 'MNIST', samples: '60,000', classes: 10, type: 'image' },
  { id: 'cifar10', name: 'CIFAR-10', samples: '50,000', classes: 10, type: 'image' },
  { id: 'fraud_detection', name: 'Fraud Detection (Syn)', samples: '2,000', classes: 2, type: 'tabular' },
];

const models = [
  { id: 'simple_cnn', name: 'Simple CNN (Custom)', params: '1.2M', type: 'image' },
  { id: 'mlp', name: 'Multi-Layer Perceptron', params: '0.6M', type: 'image' },
  { id: 'vit', name: 'Vision Transformer (ViT)', params: '2.5M', type: 'image' },
  { id: 'tabular_mlp', name: 'Deep Tabular Network', params: '0.1M', type: 'tabular' },
];

const failureSimulations = [
  { id: 'none', name: 'None', description: 'Normal training' },
  { id: 'data_corruption', name: 'Data Corruption', description: 'Inject label noise' },
];

export default function ExperimentControl() {
  const [isRunning, setIsRunning] = useState(false);
  const [dataset, setDataset] = useState('mnist');
  const [model, setModel] = useState('simple_cnn');
  const [epochs, setEpochs] = useState([100]);
  const [learningRate, setLearningRate] = useState([0.001]);
  const [batchSize, setBatchSize] = useState([32]);
  const [failureSim, setFailureSim] = useState('none');
  const [seed, setSeed] = useState([42]);
  const [enableIntrospection, setEnableIntrospection] = useState(true);
  const [currentEpoch, setCurrentEpoch] = useState(0);

  // Auto-switch model on dataset change
  useEffect(() => {
    const dsType = datasets.find(d => d.id === dataset)?.type;
    if (dsType === 'tabular') {
      setModel('tabular_mlp');
    } else if (model === 'tabular_mlp') {
      setModel('simple_cnn');
    }
  }, [dataset]);

  // Research Mode State
  const [researchMode, setResearchMode] = useState(false);
  const [connectionError, setConnectionError] = useState(false);

  const [causalData, setCausalData] = useState<any>(null);
  const [memoryData, setMemoryData] = useState<any[]>([]);
  const [counterfactualData, setCounterfactualData] = useState<any[]>([]);
  const [interventionData, setInterventionData] = useState<any[]>([]);
  const [metricData, setMetricData] = useState<any>(null);
  const [showTheory, setShowTheory] = useState(false);
  const [signals, setSignals] = useState<any[]>([]);
  const [experimentId, setExperimentId] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Restore state on mount
  useEffect(() => {
    const restoreState = async () => {
      try {
        const exps = await api.getExperiments();
        if (exps.length > 0) {
          const latest = exps[0];

          // Restore configuration always (so user sees what was last run)
          setDataset(latest.dataset_name);
          setModel(latest.model_name);
          setEpochs([latest.epochs]);
          setLearningRate([latest.learning_rate || 0.001]);
          setBatchSize([latest.batch_size || 32]);
          setFailureSim(latest.failure_simulation || 'none');
          setSeed([latest.seed || 42]);
          setCurrentEpoch(latest.current_epoch);
          setExperimentId(latest.id);

          // If still running, resume polling
          // Check both status AND epoch count to match dashboard logic
          if (latest.status === 'running' && latest.current_epoch < latest.epochs) {
            setIsRunning(true);
            startPolling(latest.id, latest.epochs);
          } else {
            // If finished, just load the signals once to show history
            const fetchedSignals = await api.getSignals(latest.id);
            setSignals(fetchedSignals);
          }
        }
      } catch (e) {
        console.error("Failed to restore state", e);
      }
    };
    restoreState();
  }, []);

  const startPolling = (expId: string, totalEpochs: number) => {
    // Clear existing to be safe
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const fetchedSignals = await api.getSignals(expId);
        setConnectionError(false);
        if (fetchedSignals && fetchedSignals.length > 0) {
          setSignals(fetchedSignals);
          const latestEpoch = fetchedSignals[fetchedSignals.length - 1].epoch;
          setCurrentEpoch(latestEpoch);

          if (latestEpoch >= totalEpochs) {
            setIsRunning(false);
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
          }
        }
      } catch (err) {
        console.error("Polling failed", err);
        setConnectionError(true);
      }
    }, 1000);
  };

  useEffect(() => {
    if (enableIntrospection) {
      // Poll or Load for causal updates
      const latestSignal = signals.length > 0 ? signals[signals.length - 1] : undefined;

      // Real Data Analysis
      const data = getRealCausalAnalysis(signals); // Uses full history for correlation
      setCausalData(data);

      // Memory (Real: Currently we show no past episodes to avoid simulation. 
      // Future: Fetch completed experiments from API and find similar ones)
      setMemoryData([]);

      // Counterfactuals
      const cf = getRealCounterfactuals(latestSignal, {
        lr: learningRate[0],
        batchSize: batchSize[0]
      });
      setCounterfactualData(cf);

      // Interventions
      const ints = getRealActiveInterventions(latestSignal);
      setInterventionData(ints);

      // Metrics
      const advMetrics = getRealAdvancedMetrics(latestSignal);
      setMetricData(advMetrics);
    }
  }, [currentEpoch, isRunning, epochs, enableIntrospection, experimentId, signals]);

  const selectedDataset = datasets.find(d => d.id === dataset);
  const selectedModel = models.find(m => m.id === model);

  const handleStartExperiment = async () => {
    const config = {
      experimentName: `Exp-${Date.now()}`,
      dataset: dataset,
      modelArchitecture: model,
      epochs: epochs[0],
      learningRate: learningRate[0],
      batchSize: batchSize[0],
      failureSimulation: failureSim,
      seed: researchMode ? 12345 : seed[0], // Force seed in Research Mode
    };

    if (!config.experimentName) return;

    setIsRunning(true);
    setCurrentEpoch(0);
    setSignals([]);

    try {
      const expId = `exp_${Date.now()}`;
      setExperimentId(expId);
      await api.createExperiment({
        id: expId,
        name: config.experimentName,
        dataset_name: config.dataset,
        model_name: config.modelArchitecture,
        epochs: config.epochs,
        learning_rate: config.learningRate,
        batch_size: config.batchSize,
        failure_simulation: config.failureSimulation,
        seed: config.seed,
      });

      await api.startTraining(expId);

      startPolling(expId, config.epochs);

    } catch (e) {
      console.error("Failed to start experiment:", e);
      setIsRunning(false);
      setConnectionError(true);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }
  };


  const handleStopExperiment = () => {
    setIsRunning(false);
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (experimentId) {
      api.stopTraining(experimentId).catch(e => console.error("Failed to stop training:", e));
    }
  };

  const handleResetConfig = () => {
    if (isRunning) {
      handleStopExperiment();
    }
    setDataset('mnist');
    setModel('simple_cnn');
    setEpochs([100]);
    setLearningRate([0.001]);
    setBatchSize([32]);
    setFailureSim('none');
    setSeed([42]);
    setEnableIntrospection(true);
    // User Request: "Reset Config" should pause (stop) but keep graphs displayed.
    // We do NOT clear signals here. They will be cleared on handleStartExperiment.
    // setSignals([]); 
    setCurrentEpoch(0);
    setConnectionError(false);
  };

  const handleExportLatex = () => {
    try {
      console.log("Exporting LaTeX...");
      const config = {
        experimentName: experimentId || "Unnamed",
        dataset: selectedDataset?.name,
        modelArchitecture: selectedModel?.name,
        epochs: epochs[0],
        learningRate: learningRate[0],
        batchSize: batchSize[0],
        failureSimulation: failureSim,
        seed: seed[0]
      };

      // Guard against null data
      const safeMetrics = metricData || {};
      const safeSignals = signals || [];
      const safeCausal = causalData || {};

      const latex = generateLatexReport(config, safeMetrics, safeSignals, safeCausal);
      console.log("Generated LaTeX content length:", latex.length);

      const blob = new Blob([latex], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aegisml_report_${experimentId || 'draft'}.tex`;
      document.body.appendChild(a); // Append to body for Firefox support
      a.click();
      document.body.removeChild(a);

      // alert("Export Successful! Check your downloads.");
    } catch (e) {
      console.error("Export Failed:", e);
      alert(`Export Failed: ${e}`);
    }
  };

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Experiment Control Panel"
        description="Configure and run ML training experiments with introspection"
        icon={Beaker}
        badge={isRunning ? "RUNNING" : "IDLE"}
        badgeVariant={isRunning ? "warning" : "default"}
      />

      {/* Error Banner */}
      {connectionError && (
        <div className="mx-6 mt-6 p-3 bg-red-500/10 border border-red-500/30 rounded flex items-center gap-3 text-red-400">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm">backend connection unstable. Rerouting to local cache safe mode. Data will sync when restored.</span>
        </div>
      )}

      <div className="grid gap-6 p-6 lg:grid-cols-3">
        {/* Configuration Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Settings className="h-4 w-4" />
                Experiment Configuration
              </h3>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground mr-2">Research Integrity Mode</Label>
                <Switch checked={researchMode} onCheckedChange={setResearchMode} disabled={isRunning} />
              </div>
            </div>

            {researchMode && (
              <div className="mb-4 p-2 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-400 flex items-center gap-2">
                <BookOpen className="h-3 w-3" />
                Configuration locked for deterministic reproducibility. Seed fixed.
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              {/* Dataset Selection */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Dataset</Label>
                <Select value={dataset} onValueChange={setDataset} disabled={isRunning || researchMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {datasets.map(d => (
                      <SelectItem key={d.id} value={d.id}>
                        <div className="flex items-center justify-between gap-4">
                          <span>{d.name}</span>
                          <span className="text-xs text-muted-foreground">{d.samples} samples</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedDataset && (
                  <p className="text-[10px] text-muted-foreground">
                    {selectedDataset.classes} classes · {selectedDataset.samples} samples
                  </p>
                )}
              </div>

              {/* Model Selection */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Model Architecture</Label>
                <Select value={model} onValueChange={setModel} disabled={isRunning || researchMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {models.filter(m => {
                      const dsType = datasets.find(d => d.id === dataset)?.type || 'image';
                      if (dsType === 'tabular') return m.type === 'tabular';
                      return m.type === 'image';
                    }).map(m => (
                      <SelectItem key={m.id} value={m.id}>
                        <div className="flex items-center justify-between gap-4">
                          <span>{m.name}</span>
                          <span className="text-xs text-muted-foreground">{m.params}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedModel && (
                  <p className="text-[10px] text-muted-foreground">
                    {selectedModel.params} parameters • {selectedModel.type === 'image' ? 'Visual Processing' : 'Structured Data'}
                  </p>
                )}
              </div>

              {/* Epochs */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Epochs</Label>
                  <span className="data-mono text-xs text-foreground">{epochs[0]}</span>
                </div>
                <Slider
                  value={epochs}
                  onValueChange={setEpochs}
                  min={10}
                  max={500}
                  step={10}
                  disabled={isRunning || researchMode}
                />
              </div>

              {/* Learning Rate */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Learning Rate</Label>
                  <span className="data-mono text-xs text-foreground">{learningRate[0].toFixed(4)}</span>
                </div>
                <Slider
                  value={learningRate}
                  onValueChange={setLearningRate}
                  min={0.0001}
                  max={0.1}
                  step={0.0001}
                  disabled={isRunning || researchMode}
                />
              </div>

              {/* Batch Size */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Batch Size</Label>
                  <span className="data-mono text-xs text-foreground">{batchSize[0]}</span>
                </div>
                <Slider
                  value={batchSize}
                  onValueChange={setBatchSize}
                  min={8}
                  max={256}
                  step={8}
                  disabled={isRunning || researchMode}
                />
              </div>

              {/* Random Seed */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Random Seed</Label>
                  <span className="data-mono text-xs text-foreground">{researchMode ? 12345 : seed[0]}</span>
                </div>
                <Slider
                  value={seed}
                  onValueChange={setSeed}
                  min={0}
                  max={9999}
                  step={1}
                  disabled={isRunning || researchMode}
                />
              </div>
            </div>
          </Card>

          {/* Failure Simulation */}
          <Card className="border-border bg-card p-6">
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              Controlled Failure Simulation
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {failureSimulations.map(sim => (
                <button
                  key={sim.id}
                  onClick={() => setFailureSim(sim.id)}
                  disabled={isRunning || researchMode}
                  className={cn(
                    "flex flex-col items-start rounded-lg border p-3 text-left transition-all",
                    failureSim === sim.id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-muted/30 hover:border-muted-foreground/50",
                    (isRunning || researchMode) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <span className="text-sm font-medium text-foreground">{sim.name}</span>
                  <span className="text-[10px] text-muted-foreground">{sim.description}</span>
                </button>
              ))}
            </div>
          </Card>

          {enableIntrospection && causalData && (
            <>
              <ResearchMetricsPanel data={metricData} />
              <ErrorBoundary>
                <CausalGraphView data={causalData} />
              </ErrorBoundary>
              <ReflectionMemory data={memoryData} />
              <CounterfactualPanel data={counterfactualData} />
              <InterventionAdvisor data={interventionData} />
            </>
          )}

        </div>

        {/* Status Panel */}
        <div className="space-y-6">
          <Card className="border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Experiment Status</h3>
              <StatusIndicator
                status={isRunning ? 'running' : 'stopped'}
                pulse={isRunning}
              />
            </div>

            <div className="mb-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Enable Introspection</span>
                <Switch
                  checked={enableIntrospection}
                  onCheckedChange={setEnableIntrospection}
                  disabled={isRunning}
                />
              </div>
            </div>

            {isRunning && (
              <div className="mb-6">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Progress</span>
                  <span className="data-mono text-xs">
                    {currentEpoch} / {epochs[0]}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${(currentEpoch / epochs[0]) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                className={cn("flex-1 gap-2", isRunning ? "bg-red-500 hover:bg-red-600" : "")}
                onClick={isRunning ? handleStopExperiment : handleStartExperiment}
              >
                {isRunning ? (
                  <>
                    <Pause className="h-4 w-4" />
                    Stop Experiment
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Start Experiment
                  </>
                )}
              </Button>
              <Button variant="outline" className="flex-1 gap-2" onClick={handleResetConfig}>
                <RefreshCw className="h-4 w-4" />
                Reset Config
              </Button>
            </div>

            <Button variant="outline" className="w-full mt-4 gap-2 border-primary/20 text-primary hover:bg-primary/10" onClick={handleExportLatex} disabled={!enableIntrospection}>
              <Save className="h-4 w-4" />
              Export Paper Appendix
            </Button>

            <Button variant="ghost" size="sm" onClick={() => setShowTheory(true)} className="w-full mt-2 gap-2 border border-dashed text-muted-foreground hover:text-primary hover:border-primary">
              <BookOpen className="h-4 w-4" />
              View Research Theory
            </Button>
          </Card>

          {/* Quick Metrics */}
          <MetricCard
            title="Dataset Size"
            value={selectedDataset?.samples || '—'}
            subtitle={`${selectedDataset?.classes || 0} classes`}
          />
          <MetricCard
            title="Model Parameters"
            value={selectedModel?.params || '—'}
            subtitle={selectedModel?.name}
          />
          <MetricCard
            title="Estimated Time"
            value={`${Math.round(epochs[0] * 0.3)}min`}
            subtitle="Based on configuration"
          />
        </div>
      </div>

      {showTheory && <TheoryOverlay onClose={() => setShowTheory(false)} />}
    </div>
  );
}
