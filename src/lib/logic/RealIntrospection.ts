
import { InternalSignal, Experiment } from "@/lib/api";
import { IntrospectionModel } from "./IntrospectionModel";

const model = new IntrospectionModel();

// Helper to calculate correlation
function calculateCorrelation(x: number[], y: number[]) {
    const n = x.length;
    if (n === 0) return 0;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
}

export function getRealCausalAnalysis(signals: InternalSignal[]) {
    if (signals.length < 2) return { nodes: [], edges: [] };

    // Extract time series
    const grads = signals.map(s => s.gradient_norm);
    const lossCurv = signals.map(s => s.loss_curvature);
    const entropy = signals.map(s => s.prediction_entropy);
    const drift = signals.map(s => s.latent_drift);

    // Calculate real correlations
    const links = [
        { source: 'Gradient', target: 'Loss Curv', val: calculateCorrelation(grads, lossCurv) },
        { source: 'Gradient', target: 'Entropy', val: calculateCorrelation(grads, entropy) },
        { source: 'Loss Curv', target: 'Drift', val: calculateCorrelation(lossCurv, drift) },
        { source: 'Entropy', target: 'Drift', val: calculateCorrelation(entropy, drift) },
    ];

    // Build Graph Format
    return {
        nodes: [
            { id: 'Gradient', label: 'Gradient Norm', type: 'source' },
            { id: 'Loss Curv', label: 'Loss Curvature', type: 'internal' },
            { id: 'Entropy', label: 'Pred Entropy', type: 'internal' },
            { id: 'Drift', label: 'Latent Drift', type: 'target' },
        ],
        links: links.map(l => ({
            source: l.source,
            target: l.target,
            strength: Math.abs(l.val),
            type: l.val > 0 ? 'positive' : 'negative'
        })).filter(e => e.strength > 0.05) // Filter noise
    };
}

// Helper adapter to match IntrospectionModel interface
function normalizeSignal(s: InternalSignal) {
    return {
        gradientNorm: s.gradient_norm,
        activationEntropy: s.prediction_entropy, // mapped proxy
        latentDrift: s.latent_drift,
        confidenceDispersion: 0.1, // Default if missing from API
        gradientVariance: s.gradient_variance,
        lossCurvature: s.loss_curvature
    };
}

export function getRealCounterfactuals(currentSignal: InternalSignal | undefined, config: any) {
    if (!currentSignal) return [];

    const normalized = normalizeSignal(currentSignal);
    const baseRisk = model.predictFailureRisk(normalized).score;

    // Perturbations
    const scenarios = [
        { name: "Lower Learning Rate", modify: (s: any) => ({ ...s, gradientNorm: s.gradientNorm * 0.5 }) },
        { name: "Increase Batch Size", modify: (s: any) => ({ ...s, gradientVariance: s.gradientVariance * 0.8 }) },
        { name: "High Noise Injection", modify: (s: any) => ({ ...s, activationEntropy: s.activationEntropy * 1.5 }) },
    ];

    return scenarios.map(scen => {
        const perturbed = scen.modify({ ...normalized });
        const newRisk = model.predictFailureRisk(perturbed).score;
        const delta = ((baseRisk - newRisk) / (baseRisk || 1)) * 100;

        return {
            scenario: scen.name,
            impact: delta > 0 ? "Improvement" : "Degradation",
            confidence: Math.abs(delta).toFixed(1) + "%",
            riskScore: newRisk
        };
    });
}

export function getRealActiveInterventions(currentSignal: InternalSignal | undefined) {
    if (!currentSignal) return [];

    const interventions = [];

    // Intervention 1: Gradient Clipping (Triggered by high gradient norm)
    if (currentSignal.gradient_norm > 1.0) {
        interventions.push({
            id: 'int_grad_clip',
            action: "Clip Gradients",
            targetMetric: "Gradient Norm",
            expectedGain: Math.min(0.8, (currentSignal.gradient_norm - 1.0) * 0.5), // Proportional gain
            risk: 0.1,
            cost: "Low",
            confidence: 0.95
        });
    }

    // Intervention 2: Augment Minority Class (Triggered by high latent drift or entropy)
    if (currentSignal.prediction_entropy > 0.5 || currentSignal.latent_drift > 0.1) {
        // Safe math: Ensure confidence is never NaN
        const conf = Math.max(0, Math.min(1, 1.0 - currentSignal.prediction_entropy));

        interventions.push({
            id: 'int_augment',
            action: "Augment Minority Class",
            targetMetric: "Latent Drift",
            expectedGain: Math.min(0.6, currentSignal.latent_drift * 2),
            risk: 0.2,
            cost: "High",
            confidence: !isNaN(conf) ? conf : 0.5
        });
    }

    // Intervention 3: Reduce Learning Rate (Triggered by high loss curvature)
    if (currentSignal.loss_curvature > 0.1) {
        interventions.push({
            id: 'int_lr_decay',
            action: "Reduce Learning Rate",
            targetMetric: "Loss Curvature",
            expectedGain: Math.min(0.9, currentSignal.loss_curvature * 3),
            risk: 0.05,
            cost: "Low",
            confidence: 0.85
        });
    }

    // Always provide a fallback "Monitor" intervention if system is stable, so UI isn't empty
    if (interventions.length === 0) {
        interventions.push({
            id: 'int_monitor',
            action: "Continue Monitoring",
            targetMetric: "System Stability",
            expectedGain: 0.0, // No gain needed
            risk: 0.0,
            cost: "Low",
            confidence: 1.0
        });
    }

    // Sort by expected gain
    return interventions.sort((a, b) => b.expectedGain - a.expectedGain);
}

export function getRealAdvancedMetrics(currentSignal: InternalSignal | undefined) {
    if (!currentSignal) return null;

    // Real Metrics Derivation
    const entropy = currentSignal.prediction_entropy;
    const drift = currentSignal.latent_drift;
    const gradVar = currentSignal.gradient_variance;

    // FAI (Failure Anticipation Index) ~ Weighted combination of instability metrics
    const faiRaw = (drift * 0.4) + (gradVar * 0.4) + ((1 - entropy) * 0.2);

    let level = 'Low';
    if (faiRaw > 0.8) level = 'Critical';
    else if (faiRaw > 0.5) level = 'Elevated';
    else if (faiRaw > 0.3) level = 'Emerging';

    return {
        awarenessConfidence: Math.max(0, 1.0 - (gradVar * 2)), // High variance = Low confidence
        transferScore: Math.max(0, 1.0 - drift), // High drift = Low transferability
        faiScore: {
            score: faiRaw,
            level: level,
            confidenceLower: Math.max(0, faiRaw - 0.1),
            confidenceUpper: Math.min(1, faiRaw + 0.1)
        }
    };
}
