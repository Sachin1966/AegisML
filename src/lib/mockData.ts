// Mock data generators for the research dashboard

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
  failureProbability: number;
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

// Generate mock epoch signals with realistic patterns
export function generateEpochSignals(epochs: number, hasFailure: boolean = false): EpochSignal[] {
  const signals: EpochSignal[] = [];
  const failureEpoch = hasFailure ? Math.floor(epochs * 0.7) : epochs + 100;

  for (let epoch = 1; epoch <= epochs; epoch++) {
    const progress = epoch / epochs;
    const failureProximity = hasFailure && epoch >= failureEpoch ? (epoch - failureEpoch) / (epochs - failureEpoch) : 0;
    
    // Normal training patterns with gradual improvement
    const baseAccuracy = 0.5 + 0.4 * (1 - Math.exp(-3 * progress));
    const baseLoss = 2.5 * Math.exp(-2 * progress) + 0.1;
    
    // Degradation on failure
    const accuracyDrop = failureProximity * 0.3;
    const lossSurge = failureProximity * 1.5;
    
    signals.push({
      epoch,
      gradientNorm: 0.5 + Math.random() * 0.3 + failureProximity * 2,
      gradientVariance: 0.1 + Math.random() * 0.1 + failureProximity * 0.8,
      activationMean: 0.3 + Math.random() * 0.1 - failureProximity * 0.2,
      activationVariance: 0.15 + Math.random() * 0.05 + failureProximity * 0.3,
      activationEntropy: 2.5 + Math.random() * 0.5 - failureProximity * 1.2,
      deadNeuronRatio: 0.02 + Math.random() * 0.03 + failureProximity * 0.15,
      latentDrift: 0.1 * progress + Math.random() * 0.05 + failureProximity * 0.4,
      interClassSeparation: 0.8 + 0.15 * progress - failureProximity * 0.4,
      predictionEntropy: 1.5 * (1 - progress) + 0.3 + failureProximity * 0.8,
      confidenceDispersion: 0.2 + Math.random() * 0.1 + failureProximity * 0.5,
      lossCurvature: 0.5 + Math.random() * 0.2 + failureProximity * 1.2,
      accuracy: Math.max(0, Math.min(1, baseAccuracy - accuracyDrop + (Math.random() - 0.5) * 0.05)),
      loss: Math.max(0.05, baseLoss + lossSurge + (Math.random() - 0.5) * 0.1),
    });
  }
  
  return signals;
}

// Generate introspection metrics
export function generateMetrics(signals: EpochSignal[], hasFailure: boolean): IntrospectionMetrics {
  const lastSignal = signals[signals.length - 1];
  const avgGradientVariance = signals.slice(-10).reduce((a, b) => a + b.gradientVariance, 0) / 10;
  
  return {
    iss: hasFailure ? 0.35 + Math.random() * 0.2 : 0.75 + Math.random() * 0.2,
    psu: hasFailure ? 0.65 + Math.random() * 0.2 : 0.2 + Math.random() * 0.15,
    icc: hasFailure ? 0.7 + Math.random() * 0.2 : 0.15 + Math.random() * 0.1,
    fah: hasFailure ? Math.floor(Math.random() * 10) + 3 : 0,
    failureProbability: hasFailure ? 0.75 + Math.random() * 0.2 : 0.1 + Math.random() * 0.1,
  };
}

// Generate layer statistics
export function generateLayerStats(): LayerStats[] {
  const layers = ['conv1', 'conv2', 'conv3', 'fc1', 'fc2', 'output'];
  return layers.map((layerName, i) => ({
    layerName,
    gradientNorm: 0.3 + Math.random() * 0.5,
    activationMean: 0.2 + Math.random() * 0.3,
    instabilityScore: Math.random() * 0.8,
    contribution: Math.random(),
  })).sort((a, b) => b.contribution - a.contribution);
}

// Generate mock experiments
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

// Real-time signal generator for live dashboard
export function generateLiveSignal(epoch: number, baseSignals: EpochSignal[]): EpochSignal {
  const lastSignal = baseSignals[baseSignals.length - 1] || {
    gradientNorm: 0.5,
    gradientVariance: 0.1,
    activationMean: 0.3,
    activationVariance: 0.15,
    activationEntropy: 2.5,
    deadNeuronRatio: 0.02,
    latentDrift: 0.1,
    interClassSeparation: 0.8,
    predictionEntropy: 1.2,
    confidenceDispersion: 0.2,
    lossCurvature: 0.5,
    accuracy: 0.5,
    loss: 2.0,
  };
  
  return {
    epoch,
    gradientNorm: lastSignal.gradientNorm + (Math.random() - 0.5) * 0.1,
    gradientVariance: Math.max(0, lastSignal.gradientVariance + (Math.random() - 0.5) * 0.02),
    activationMean: lastSignal.activationMean + (Math.random() - 0.5) * 0.02,
    activationVariance: Math.max(0, lastSignal.activationVariance + (Math.random() - 0.5) * 0.01),
    activationEntropy: Math.max(0, lastSignal.activationEntropy + (Math.random() - 0.5) * 0.1),
    deadNeuronRatio: Math.max(0, Math.min(1, lastSignal.deadNeuronRatio + (Math.random() - 0.5) * 0.005)),
    latentDrift: lastSignal.latentDrift + Math.random() * 0.01,
    interClassSeparation: Math.max(0, Math.min(1, lastSignal.interClassSeparation + (Math.random() - 0.5) * 0.02)),
    predictionEntropy: Math.max(0, lastSignal.predictionEntropy * 0.99 + (Math.random() - 0.5) * 0.05),
    confidenceDispersion: Math.max(0, lastSignal.confidenceDispersion + (Math.random() - 0.5) * 0.02),
    lossCurvature: Math.max(0, lastSignal.lossCurvature + (Math.random() - 0.5) * 0.05),
    accuracy: Math.min(1, lastSignal.accuracy * 1.005 + (Math.random() - 0.5) * 0.01),
    loss: Math.max(0.05, lastSignal.loss * 0.995 + (Math.random() - 0.5) * 0.02),
  };
}
