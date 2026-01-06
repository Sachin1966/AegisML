
export interface CausalNode {
    id: string;
    label: string;
    value: number; // Normalized signal value 0-1
    type: 'root' | 'mediator' | 'outcome';
}

export interface CausalLink {
    source: string;
    target: string;
    weight: number; // Correlation/Causation strength -1 to 1
    lag: number; // Time lag in epochs
    confidence: number; // 0-1
}

export interface CausalGraph {
    nodes: CausalNode[];
    links: CausalLink[];
}

export class CausalEngine {
    // Simulates PC-Algorithm for causal discovery on streaming metrics

    public discoverCausalStructure(signals: any, isFailing: boolean): CausalGraph {
        const nodes: CausalNode[] = [
            { id: 'grad_var', label: 'Gradient Variance', value: signals.gradientVariance, type: 'root' },
            { id: 'loss_curve', label: 'Loss Curvature', value: signals.lossCurvature, type: 'root' },
            { id: 'dead_neurons', label: 'Dead Neurons', value: signals.deadNeuronRatio, type: 'mediator' },
            { id: 'act_entropy', label: 'Activation Entropy', value: signals.activationEntropy, type: 'mediator' },
            { id: 'latent_drift', label: 'Latent Drift', value: signals.latentDrift, type: 'mediator' },
            { id: 'conf_disp', label: 'Confidence Dispersion', value: signals.confidenceDispersion, type: 'mediator' },
            { id: 'failure_risk', label: 'Failure Risk', value: 0, type: 'outcome' }, // Value populated by model
        ];

        // Simulated causal links based on signal dynamics
        const links: CausalLink[] = [];

        // 1. Optimization Instability -> Representation Collapse
        if (signals.lossCurvature > 1.0) {
            links.push({ source: 'loss_curve', target: 'grad_var', weight: 0.8, lag: 0, confidence: 0.95 });
            links.push({ source: 'grad_var', target: 'dead_neurons', weight: 0.6, lag: 2, confidence: 0.85 });
        }

        // 2. Dead Neurons -> Entropy Drop
        if (signals.deadNeuronRatio > 0.1) {
            links.push({ source: 'dead_neurons', target: 'act_entropy', weight: -0.9, lag: 1, confidence: 0.92 });
        }

        // 3. Entropy Drop + Drift -> Failure
        if (signals.activationEntropy < 1.0 || isFailing) {
            links.push({ source: 'act_entropy', target: 'failure_risk', weight: -0.85, lag: 0, confidence: 0.9 });
        }

        if (signals.latentDrift > 0.4) {
            links.push({ source: 'latent_drift', target: 'failure_risk', weight: 0.75, lag: 5, confidence: 0.7 });
            // Feedback loop
            links.push({ source: 'latent_drift', target: 'act_entropy', weight: -0.5, lag: 1, confidence: 0.6 });
        }

        // Default structure if healthy
        if (!isFailing && links.length === 0) {
            links.push({ source: 'loss_curve', target: 'grad_var', weight: 0.2, lag: 0, confidence: 0.4 });
            links.push({ source: 'grad_var', target: 'act_entropy', weight: 0.1, lag: 1, confidence: 0.3 });
        }

        return { nodes, links };
    }
}
