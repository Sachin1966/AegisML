export type DatasetType = 'GAUSSIAN' | 'SPIRAL' | 'XOR';

export class SyntheticGenerator {
    private type: DatasetType;
    private noiseLevel: number;
    private driftFactor: number;
    private currentEpoch: number = 0;

    constructor(type: DatasetType = 'GAUSSIAN', noiseLevel = 0.1, driftFactor = 0.0) {
        this.type = type;
        this.noiseLevel = noiseLevel;
        this.driftFactor = driftFactor;
    }

    // Simulates one epoch of training on this synthetic dataset
    // Returns "true" ground truth metrics (what the model SHOULD see)
    public nextEpoch(): {
        accuracy: number;
        loss: number;
        interClassSeparation: number;
        latentDrift: number;
    } {
        this.currentEpoch++;

        // Base difficulty depends on dataset type
        let baseSeparability = 1.0;
        if (this.type === 'SPIRAL') baseSeparability = 0.7;
        if (this.type === 'XOR') baseSeparability = 0.5;

        // Drift makes the problem harder over time
        const driftPenalty = this.driftFactor * this.currentEpoch * 0.05;

        // Learning progress (asymptotic)
        const learningCurve = 1 - Math.exp(-0.1 * this.currentEpoch);

        // Calculate synthetic metrics
        const trueSeparability = Math.max(0, baseSeparability * learningCurve - driftPenalty - this.noiseLevel);
        const accuracy = Math.min(0.99, 0.5 + 0.5 * trueSeparability);
        const loss = Math.max(0.1, 2.0 * (1 - trueSeparability) + driftPenalty);

        // Internal signals specific to synthetic data
        const latentDrift = driftPenalty * 5 + Math.random() * 0.05; // High drift if driftFactor is high

        return {
            accuracy,
            loss,
            interClassSeparation: trueSeparability,
            latentDrift
        };
    }
}
