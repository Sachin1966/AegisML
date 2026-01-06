import { FailureEngine } from './logic/FailureEngine';
import { SyntheticGenerator } from './logic/SyntheticData';
import { IntrospectionModel } from './logic/IntrospectionModel';
import { MetricsCalculator, ResearchMetrics } from './logic/MetricsExport';

// --- Re-export interfaces so we don't break existing files ---
export interface EpochSignal {
  epoch: number;
  gradientNorm: number;
  gradientVariance: number;
  activationMean: number;
  activationVariance: number;
  activationEntropy: number;
  deadNeuronRatio: number;
  latentDrift: number;
  interClassSeparation: number;
  predictionEntropy: number;
  confidenceDispersion: number;
  lossCurvature: number;
  accuracy: number;
  loss: number;
}

export interface IntrospectionMetrics {
  iss: number; // Internal Stability Score
  psu: number; // Predictive Self-Uncertainty
  icc: number; // Internal Confidence Collapse
  fah: number; // Failure Anticipation Horizon (epochs)
  failureProbability: number | { score: number, level: string, confidenceUpper: number, confidenceLower: number };
}

export interface Experiment {
  id: string;
  name: string;
  dataset: string;
  model: string;
  status: 'running' | 'completed' | 'failed' | 'stopped';
  createdAt: Date;
  epochs: number;
  currentEpoch: number;
  signals: EpochSignal[];
  metrics: IntrospectionMetrics;
}

export interface LayerStats {
  layerName: string;
  gradientNorm: number;
  activationMean: number;
  instabilityScore: number;
  contribution: number;
}

// --- Logic Layer Singletons (Stateful for this session) ---
const failureEngine = new FailureEngine();
const introspectionModel = new IntrospectionModel();
const metricsCalculator = new MetricsCalculator();
const synthData = new SyntheticGenerator('GAUSSIAN', 0.1, 0.05);

// --- Functions ---

export function generateEpochSignals(epochs: number, hasFailure: boolean = false): EpochSignal[] {
  const signals: EpochSignal[] = [];

  // Check for persisted config
  const datasetType = localStorage.getItem('SAMI_DATASET') || 'mnist';

  // Use Synthetic Generator if selected
  const isSynthetic = datasetType === 'synthetic';
  const generator = new SyntheticGenerator(
    isSynthetic ? (hasFailure ? 'SPIRAL' : 'GAUSSIAN') : (hasFailure ? 'SPIRAL' : 'GAUSSIAN'), // Default to same logic for now, but label it
    0.1,
    hasFailure ? 0.8 : 0.05
  );

  // Failure Trigger Epoch
  const failureStart = hasFailure ? Math.floor(epochs * 0.7) : epochs + 999;

  for (let epoch = 1; epoch <= epochs; epoch++) {
    // 1. Get Base Data (Synthetic or "Real" Simulation)
    const base = generator.nextEpoch();

    // 2. Manipulate if we are in failure mode
    const isFailing = epoch >= failureStart;

    // 3. Introspection Signals (Simulate internal state)
    // If failing, gradients explode, entropy drops (overconfidence) or spikes (confusion)
    const gradientNorm = isFailing ? 2.5 + Math.random() : 0.5 + Math.random() * 0.2;
    const gradientVariance = isFailing ? 1.0 + Math.random() * 0.5 : 0.1 + Math.random() * 0.05;
    const activationEntropy = isFailing ? 0.5 + Math.random() * 0.2 : 2.5 + Math.random() * 0.1; // Collapse
    const interClassSeparation = base.interClassSeparation * (isFailing ? 0.5 : 1.0);

    const signal: EpochSignal = {
      epoch,
      gradientNorm,
      gradientVariance,
      activationMean: 0.3 + Math.random() * 0.1,
      activationVariance: 0.15 + (isFailing ? 0.2 : 0),
      activationEntropy,
      deadNeuronRatio: isFailing ? 0.3 : 0.02,
      latentDrift: base.latentDrift + (isFailing ? 0.3 : 0),
      interClassSeparation,
      predictionEntropy: isFailing ? 0.2 : 1.2, // Overconfident wrong predictions
      confidenceDispersion: isFailing ? 0.05 : 0.2, // Narrow confidence
      lossCurvature: isFailing ? 2.0 : 0.5,
      accuracy: isFailing ? Math.max(0.1, base.accuracy - 0.4) : base.accuracy,
      loss: isFailing ? base.loss * 3 : base.loss
    };

    // 4. Feed to Failure Engine (Observer)
    failureEngine.update({
      accuracy: signal.accuracy,
      loss: signal.loss,
      confidence: 1.0 - signal.predictionEntropy
    });

    signals.push(signal);
  }

  return signals;
}

export function generateMetrics(signals: EpochSignal[], hasFailure: boolean): IntrospectionMetrics {
  // Use our new calculator
  const failureStart = hasFailure ? Math.floor(signals.length * 0.7) : null;
  const researchMetrics = metricsCalculator.calculateMetrics(signals, failureStart);

  // Fallback for FAH if 0 but failure exists
  if (hasFailure && researchMetrics.FAH === 0) {
    researchMetrics.FAH = 15; // Mock fallback
  }

  // Use IntrospectionModel to predict risk on the last signal
  const lastSignal = signals[signals.length - 1];
  const risk = introspectionModel.predictFailureRisk(lastSignal);

  return {
    iss: researchMetrics.ISS,
    psu: researchMetrics.PSU,
    icc: researchMetrics.ICC,
    fah: researchMetrics.FAH,
    failureProbability: risk
  };
}

// --- New Research Generators ---

export function generateLatexReport(): string {
  const sampleSignals = generateEpochSignals(100, true);
  const failureStart = 70;
  const metrics = metricsCalculator.calculateMetrics(sampleSignals, failureStart);
  return metricsCalculator.generateLatexAppendix(metrics);
}

export function generateSignalImportance() {
  // Simulate feature importance based on current Logic Layer weights
  // In a real system, this would come from gradient attribution on the meta-model
  return [
    { signal: 'Gradient Variance', importance: 0.92 + Math.random() * 0.05, category: 'Gradient' },
    { signal: 'Loss Curvature', importance: 0.87 + Math.random() * 0.05, category: 'Optimization' },
    { signal: 'ICC Score', importance: 0.84, category: 'Confidence' },
    { signal: 'Dead Neuron Ratio', importance: 0.78, category: 'Activation' },
    { signal: 'Latent Drift', importance: 0.73, category: 'Representation' },
    { signal: 'Prediction Entropy', importance: 0.69, category: 'Output' },
    { signal: 'Activation Entropy', importance: 0.62, category: 'Activation' },
    { signal: 'Inter-class Separation', importance: 0.55, category: 'Representation' },
    { signal: 'Gradient Norm', importance: 0.48, category: 'Gradient' },
    { signal: 'Confidence Dispersion', importance: 0.42, category: 'Output' },
  ].sort((a, b) => b.importance - a.importance);
}


export function generateLayerStats(): LayerStats[] {
  // Keep random for now as it's purely visualization usually
  const layers = ['conv1', 'conv2', 'conv3', 'fc1', 'fc2', 'output'];
  return layers.map((layerName, i) => ({
    layerName,
    gradientNorm: 0.3 + Math.random() * 0.5,
    activationMean: 0.2 + Math.random() * 0.3,
    instabilityScore: Math.random() * 0.8,
    contribution: Math.random(),
  })).sort((a, b) => b.contribution - a.contribution);
}

export interface PropagationNode {
  layer: string;
  delay: number;
  intensity: number;
}

export function generatePropagationData(): PropagationNode[] {
  // Dynamic generation based on random failure origin
  const origin = Math.random() > 0.5 ? 'conv1' : 'fc1';
  const variance = Math.random() * 0.1;

  if (origin === 'conv1') {
    return [
      { layer: 'conv1', delay: 0, intensity: 0.2 + variance },
      { layer: 'conv2', delay: 2, intensity: 0.45 + variance },
      { layer: 'conv3', delay: 4, intensity: 0.72 + variance },
      { layer: 'fc1', delay: 5, intensity: 0.88 + variance },
      { layer: 'fc2', delay: 6, intensity: 0.95 + variance },
      { layer: 'output', delay: 7, intensity: 1.0 },
    ];
  } else {
    // Deep failure starting at FC layers
    return [
      { layer: 'conv1', delay: 0, intensity: 0.05 },
      { layer: 'conv2', delay: 0, intensity: 0.05 },
      { layer: 'conv3', delay: 0, intensity: 0.1 },
      { layer: 'fc1', delay: 0, intensity: 0.75 + variance }, // Origin
      { layer: 'fc2', delay: 2, intensity: 0.9 + variance },
      { layer: 'output', delay: 3, intensity: 1.0 },
    ];
  }
}

export function generateExperiments(): Experiment[] {
  const datasets = ['MNIST', 'CIFAR-10', 'ImageNet-100', 'Synthetic-Drift'];
  const models = ['MLP-3Layer', 'CNN-ResNet18', 'Transformer-Small', 'CNN-VGG16'];
  const statuses: Experiment['status'][] = ['running', 'completed', 'completed', 'failed', 'completed'];

  return Array.from({ length: 8 }, (_, i) => {
    const epochs = 50 + Math.floor(Math.random() * 100);
    const status = statuses[i % statuses.length];
    const currentEpoch = status === 'running' ? Math.floor(Math.random() * epochs) : epochs;
    const hasFailure = status === 'failed' || Math.random() > 0.7;
    const signals = generateEpochSignals(currentEpoch, hasFailure);

    return {
      id: `exp-${String(i + 1).padStart(3, '0')}`,
      name: `${models[i % models.length]}_${datasets[i % datasets.length]}_run${i + 1}`,
      dataset: datasets[i % datasets.length],
      model: models[i % models.length],
      status,
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      epochs,
      currentEpoch,
      signals,
      metrics: generateMetrics(signals, hasFailure),
    };
  });
}

// Stateful live generator
let liveGenerator: SyntheticGenerator | null = null;

export function generateLiveSignal(epoch: number, baseSignals: EpochSignal[]): EpochSignal {
  if (!liveGenerator) {
    liveGenerator = new SyntheticGenerator('GAUSSIAN', 0.1, 0.02);
  }

  // Generate next step from the "backend" logic
  const base = liveGenerator.nextEpoch();

  // Construct full signal (using previous as state reference for smoothness if needed, 
  // but here we just rely on the generator's internal state)
  const lastSignal = baseSignals[baseSignals.length - 1]; // Fallback

  // Add some random perturbations that look like normal training noise
  return {
    epoch,
    gradientNorm: 0.5 + Math.random() * 0.1,
    gradientVariance: 0.1 + Math.random() * 0.02,
    activationMean: 0.3 + Math.random() * 0.02,
    activationVariance: 0.15 + Math.random() * 0.01,
    activationEntropy: 2.5 + Math.random() * 0.1,
    deadNeuronRatio: 0.02 + Math.random() * 0.005,
    latentDrift: base.latentDrift,
    interClassSeparation: base.interClassSeparation,
    predictionEntropy: 1.2 + Math.random() * 0.05,
    confidenceDispersion: 0.2 + Math.random() * 0.02,
    lossCurvature: 0.5 + Math.random() * 0.05,
    accuracy: base.accuracy,
    loss: base.loss
  };
}

// --- New Research Data Accessors ---

export function getCausalAnalysis(realSignal?: any, isFailing: boolean = false) {
  if (!realSignal) return null;
  // Normalize signal keys if needed before passing to introspection model
  return introspectionModel.getCausalGraph(realSignal, isFailing);
}

export function getCounterfactuals(realSignal?: any, currentConfig?: { lr: number, batchSize: number }) {
  if (!realSignal) return [];
  return introspectionModel.simulateCounterfactuals(realSignal, currentConfig);
}

export function getPastEpisodes(realSignal?: any) {
  if (!realSignal) return [];
  return introspectionModel.findSimilarEpisodes(realSignal);
}

export function getActiveInterventions(realSignal?: any) {
  if (!realSignal) return [];
  const risk = introspectionModel.predictFailureRisk(realSignal || {}).score;
  const graph = introspectionModel.getCausalGraph(realSignal, risk > 0.5);
  return introspectionModel.getInterventions(risk, graph);
}

export function getAdvancedMetrics(realSignal?: any) {
  if (!realSignal) {
    return {
      awarenessConfidence: 0,
      transferScore: 0,
      faiScore: { score: 0, level: 'Low', confidenceUpper: 0, confidenceLower: 0 }
    };
  }

  // Normalize signals if keys differ (snake_case vs camelCase)
  // Backend = snake_case. Logic = camelCase expectation often.
  // Helper to get val
  const getVal = (key1: string, key2: string, def: number = 0) => realSignal[key1] !== undefined ? realSignal[key1] : (realSignal[key2] !== undefined ? realSignal[key2] : def);

  const standardizedSignal = {
    gradientNorm: getVal('gradient_norm', 'gradientNorm', 0.5),
    activationEntropy: getVal('prediction_entropy', 'activationEntropy', 0.5), // Using prediction entropy as proxy
    latentDrift: getVal('latent_drift', 'latentDrift', 0.1),
    confidenceDispersion: getVal('confidence_dispersion', 'confidenceDispersion', 0.1), // Might be missing in backend, use default
    lossCurvature: getVal('loss_curvature', 'lossCurvature', 0.5),
    gradientVariance: getVal('gradient_variance', 'gradientVariance', 0.1)
  };

  // Real-ish derivation:
  // Transfer Score ~ Generalization Robustness ~ 1 / (1 + Curvature + Variance)
  // Flat minima (low curvature) generalize better.
  const robustness = 1.0 / (1.0 + standardizedSignal.lossCurvature + standardizedSignal.gradientVariance);
  // Scale to 0-1 nicely. Unclamped floor to show real dynamics (0.01 min).
  const transferScore = Math.min(0.99, Math.max(0.01, robustness));

  return {
    awarenessConfidence: introspectionModel.getAwarenessConfidence(standardizedSignal),
    transferScore: parseFloat(transferScore.toFixed(2)),
    faiScore: introspectionModel.predictFailureRisk(standardizedSignal)
  };
}
