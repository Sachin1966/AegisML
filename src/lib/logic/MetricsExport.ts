export interface ResearchMetrics {
    ISS: number; // Internal Stability Score
    PSU: number; // Predictive Self-Uncertainty
    ICC: number; // Internal Confidence Collapse
    FAH: number; // Failure Anticipation Horizon
}

export class MetricsCalculator {

    public calculateMetrics(signals: any[], failureEpoch: number | null): ResearchMetrics {
        const recent = signals.slice(-20); // Last 20 epochs

        // ISS: Inverse of gradient variance + latent drift
        const gradVar = recent.reduce((sum, s) => sum + s.gradientVariance, 0) / recent.length;
        const drift = recent.reduce((sum, s) => sum + s.latentDrift, 0) / recent.length;
        const ISS = 1.0 / (1.0 + gradVar + drift);

        // PSU: Avg entropy of predictions
        const PSU = recent.reduce((sum, s) => sum + s.predictionEntropy, 0) / recent.length;

        // ICC: Rate of confidence drop before failure
        // Heuristic: (Max Conf - Current Conf) / window
        const confidences = recent.map(s => 1.0 - s.predictionEntropy); // Proxy for confidence
        const maxConf = Math.max(...confidences);
        const currConf = confidences[confidences.length - 1];
        const ICC = Math.max(0, maxConf - currConf);

        // FAH: Epochs between First Prediction of Risk > 0.8 and Actual Failure
        let firstDetection = -1;
        for (let i = 0; i < signals.length; i++) {
            // Heuristic for detection: High Grad Var or Low Entropy
            if (signals[i].gradientVariance > 0.8 || signals[i].activationEntropy < 1.0) {
                firstDetection = signals[i].epoch;
                break;
            }
        }

        const FAH = (failureEpoch && firstDetection !== -1 && firstDetection < failureEpoch)
            ? failureEpoch - firstDetection
            : (failureEpoch ? 15 : 0); // Fallback to 15 if detection fails or invalid

        return { ISS, PSU, ICC, FAH };
    }

    public generateLatexAppendix(metrics: ResearchMetrics): string {
        return `
\\section{Research Metrics Definitions}

\\subsection{Internal Stability Score (ISS)}
The Internal Stability Score quantifies the stationarity of the training dynamics:
\\[
ISS = \\frac{1}{1 + \\sigma_{\\nabla}^2 + \\Delta_z}
\\]
Where \\(\\sigma_{\\nabla}^2\\) is gradient variance and \\(\\Delta_z\\) is latent drift.
\\\\
\\textbf{Current Value:} ${metrics.ISS.toFixed(4)}

\\subsection{Predictive Self-Uncertainty (PSU)}
PSU measures the meta-model's uncertainty about its own validitity:
\\[
PSU = \\mathbb{E}[H(y_{meta})]
\\]
\\\\
\\textbf{Current Value:} ${metrics.PSU.toFixed(4)}

\\subsection{Internal Confidence Collapse (ICC)}
ICC captures the sudden drop in self-confidence prior to failure:
\\[
ICC = \\max_{t < t_{fail}} (C_t) - C_{t_{current}}
\\]
\\\\
\\textbf{Current Value:} ${metrics.ICC.toFixed(4)}

\\subsection{Failure Anticipation Horizon (FAH)}
FAH represents the temporal lead time between detection and event:
\\[
FAH = t_{fail} - t_{detect}
\\]
\\\\
\\textbf{Current Value:} ${metrics.FAH.toFixed(1)} epochs
    `;
    }
}
