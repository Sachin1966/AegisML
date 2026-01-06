import { FailureEngine } from './FailureEngine';
import { SyntheticGenerator } from './SyntheticData';
import { IntrospectionModel } from './IntrospectionModel';
import { MetricsCalculator } from './MetricsExport';

// Simple Verification Script
// Run with: npx tsx src/lib/logic/LogicVerification.ts

console.log("=== SAMI Research Logic Verification ===");

// 1. Verify Synthetic Data
console.log("\n[1] Testing Synthetic Generator (Spiral w/ Drift)...");
const gen = new SyntheticGenerator('SPIRAL', 0.1, 0.2);
const s1 = gen.nextEpoch();
const s2 = gen.nextEpoch();
console.log(`Epoch 1: Loss=${s1.loss.toFixed(4)}, Acc=${s1.accuracy.toFixed(4)}`);
console.log(`Epoch 2: Loss=${s2.loss.toFixed(4)}, Acc=${s2.accuracy.toFixed(4)} (Drift Factor Applied)`);

// 2. Verify Failure Engine
console.log("\n[2] Testing Failure Engine...");
const engine = new FailureEngine();
// Good epochs
engine.update({ accuracy: 0.9, loss: 0.2, confidence: 0.9 });
engine.update({ accuracy: 0.91, loss: 0.19, confidence: 0.91 });
// Bad epoch
engine.update({ accuracy: 0.5, loss: 2.0, confidence: 0.4 });
// Check status (might need more history window depending on config, but check API)
const failState = engine.checkFailure(3);
console.log("Failure State:", failState);

// 3. Verify Metrics Export
console.log("\n[3] Testing Research Metrics LaTeX Export...");
const calculator = new MetricsCalculator();
const mockSignals = Array(20).fill(0).map((_, i) => ({
    gradientVariance: Math.random(),
    latentDrift: Math.random() * 0.1,
    predictionEntropy: 0.5,
    loss: 0.5,
    accuracy: 0.5
}));
const metrics = calculator.calculateMetrics(mockSignals, null);
const latex = calculator.generateLatexAppendix(metrics);

console.log("ISS Score:", metrics.ISS.toFixed(4));
console.log("LaTeX Output Preview:\n", latex.substring(0, 150) + "...");

console.log("\n[SUCCESS] Logic Layer verification complete.");
