import { useState } from "react";
import { Beaker, Play, Square, RefreshCw, Settings } from "lucide-react";
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

const datasets = [
  { id: 'mnist', name: 'MNIST', samples: '60,000', classes: 10 },
  { id: 'cifar10', name: 'CIFAR-10', samples: '50,000', classes: 10 },
  { id: 'imagenet100', name: 'ImageNet-100', samples: '130,000', classes: 100 },
  { id: 'synthetic', name: 'Synthetic-Drift', samples: '10,000', classes: 5 },
];

const models = [
  { id: 'mlp', name: 'MLP-3Layer', params: '1.2M' },
  { id: 'cnn', name: 'CNN-ResNet18', params: '11.7M' },
  { id: 'transformer', name: 'Transformer-Small', params: '6.4M' },
  { id: 'vgg', name: 'CNN-VGG16', params: '138M' },
];

const failureSimulations = [
  { id: 'none', name: 'None', description: 'Normal training' },
  { id: 'data_corruption', name: 'Data Corruption', description: 'Inject label noise' },
  { id: 'covariate_shift', name: 'Covariate Shift', description: 'Input distribution shift' },
  { id: 'concept_drift', name: 'Concept Drift', description: 'Target distribution shift' },
  { id: 'lr_spike', name: 'LR Spike', description: 'Sudden learning rate increase' },
  { id: 'batch_shock', name: 'Batch Size Shock', description: 'Batch size perturbation' },
];

export default function ExperimentControl() {
  const [isRunning, setIsRunning] = useState(false);
  const [dataset, setDataset] = useState('mnist');
  const [model, setModel] = useState('cnn');
  const [epochs, setEpochs] = useState([100]);
  const [learningRate, setLearningRate] = useState([0.001]);
  const [batchSize, setBatchSize] = useState([32]);
  const [failureSim, setFailureSim] = useState('none');
  const [seed, setSeed] = useState([42]);
  const [enableIntrospection, setEnableIntrospection] = useState(true);
  const [currentEpoch, setCurrentEpoch] = useState(0);

  const selectedDataset = datasets.find(d => d.id === dataset);
  const selectedModel = models.find(m => m.id === model);

  const handleStart = () => {
    setIsRunning(true);
    setCurrentEpoch(0);
    // Simulate training progress
    const interval = setInterval(() => {
      setCurrentEpoch(prev => {
        if (prev >= epochs[0]) {
          setIsRunning(false);
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 200);
  };

  const handleStop = () => {
    setIsRunning(false);
  };

  return (
    <div className="flex flex-col">
      <PageHeader 
        title="Experiment Control Panel"
        description="Configure and run ML training experiments with introspection"
        icon={Beaker}
        badge={isRunning ? "RUNNING" : "IDLE"}
        badgeVariant={isRunning ? "warning" : "default"}
      />

      <div className="grid gap-6 p-6 lg:grid-cols-3">
        {/* Configuration Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border bg-card p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Settings className="h-4 w-4" />
              Experiment Configuration
            </h3>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Dataset Selection */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Dataset</Label>
                <Select value={dataset} onValueChange={setDataset} disabled={isRunning}>
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
                <Select value={model} onValueChange={setModel} disabled={isRunning}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map(m => (
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
                    {selectedModel.params} parameters
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
                  disabled={isRunning}
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
                  disabled={isRunning}
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
                  disabled={isRunning}
                />
              </div>

              {/* Random Seed */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Random Seed</Label>
                  <span className="data-mono text-xs text-foreground">{seed[0]}</span>
                </div>
                <Slider
                  value={seed}
                  onValueChange={setSeed}
                  min={0}
                  max={9999}
                  step={1}
                  disabled={isRunning}
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
                  disabled={isRunning}
                  className={cn(
                    "flex flex-col items-start rounded-lg border p-3 text-left transition-all",
                    failureSim === sim.id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-muted/30 hover:border-muted-foreground/50",
                    isRunning && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <span className="text-sm font-medium text-foreground">{sim.name}</span>
                  <span className="text-[10px] text-muted-foreground">{sim.description}</span>
                </button>
              ))}
            </div>
          </Card>
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

            <div className="flex gap-3">
              {!isRunning ? (
                <Button onClick={handleStart} className="flex-1 gap-2">
                  <Play className="h-4 w-4" />
                  Start Experiment
                </Button>
              ) : (
                <Button onClick={handleStop} variant="destructive" className="flex-1 gap-2">
                  <Square className="h-4 w-4" />
                  Stop
                </Button>
              )}
              <Button variant="outline" size="icon" disabled={isRunning}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
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
    </div>
  );
}
