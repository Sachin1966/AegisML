
import { CausalGraph } from './CausalEngine';

export interface Intervention {
    id: string;
    action: string;
    targetMetric: string;
    expectedGain: number; // Stability gain 0-1
    risk: number; // Risk of making things worse
    cost: 'Low' | 'Medium' | 'High'; // Computational or time cost
    confidence: number; // Confidence in this recommendation
}

export class InterventionAdvisor {

    public advise(riskScore: number, causalGraph: CausalGraph): Intervention[] {
        if (riskScore < 0.3) return [];

        const interventions: Intervention[] = [];

        // Check Causal Graph Root Causes
        const rootCauses = causalGraph.nodes.filter(n => n.type === 'root' && n.value > 0.6); // High value roots

        for (const root of rootCauses) {
            if (root.id === 'grad_var') {
                interventions.push({
                    id: 'int-01',
                    action: 'Reduce Learning Rate (0.5x)',
                    targetMetric: 'Gradient Variance',
                    expectedGain: 0.4,
                    risk: 0.1,
                    cost: 'Low',
                    confidence: 0.85
                });
                interventions.push({
                    id: 'int-02',
                    action: 'Increase Batch Size (2x)',
                    targetMetric: 'Gradient Variance',
                    expectedGain: 0.3,
                    risk: 0.2,
                    cost: 'Medium', // higher memory
                    confidence: 0.75
                });
            }
            if (root.id === 'loss_curve') {
                interventions.push({
                    id: 'int-03',
                    action: 'Enable Gradient Clipping',
                    targetMetric: 'Loss Curvature',
                    expectedGain: 0.5,
                    risk: 0.05,
                    cost: 'Low',
                    confidence: 0.92
                });
            }
        }

        // Generic interventions if risk is high but no specific root cause obvious
        if (interventions.length === 0 && riskScore > 0.7) {
            interventions.push({
                id: 'int-99',
                action: 'Early Stop & Rollback',
                targetMetric: 'Overall Risk',
                expectedGain: 0.9,
                risk: 0.0,
                cost: 'High', // Process interruption
                confidence: 0.99
            });
        }

        return interventions.sort((a, b) => b.expectedGain - a.expectedGain);
    }
}
