
export const generateLatexReport = (
    config: any,
    metrics: any,
    signals: any[],
    causalData: any
): string => {
    const timestamp = new Date().toISOString().split('T')[0];
    const finalSignal = signals.length > 0 ? signals[signals.length - 1] : null;

    // Safe extraction of metrics
    const finalAccuracy = finalSignal ? (finalSignal.accuracy * 100).toFixed(2) : "0.00";
    const finalLoss = finalSignal ? finalSignal.loss_curvature.toFixed(4) : "0.0000";

    // Values for FAI Calculation
    const drift = finalSignal?.latent_drift || 0;
    const entropy = finalSignal?.prediction_entropy || 0;
    const variance = finalSignal?.gradient_variance || 0;

    // Calculate FAI terms for display (Revised Formula: Alpha*Drift + Beta*Var + Gamma*Entropy)
    // weights: alpha=0.4, beta=0.4, gamma=0.2
    const termDrift = (drift * 0.4).toFixed(4);
    const termVar = (variance * 0.4).toFixed(4);
    const termEnt = (entropy * 0.2).toFixed(4);
    const faiScore = ((drift * 0.4) + (variance * 0.4) + (entropy * 0.2)).toFixed(4);

    return `
\\documentclass{article}
\\usepackage{graphicx}
\\usepackage{amsmath}
\\usepackage{booktabs}
\\usepackage{geometry}
\\usepackage{xcolor}
\\geometry{a4paper, margin=1in}

\\title{AegisML: Automated Introspection \\& Mathematical Analysis}
\\author{AegisML Inspector}
\\date{${timestamp}}

\\begin{document}

\\maketitle

\\section*{Abstract}
This technical report documents the internal introspection metrics derived from the experimental run "${config.experimentName}". It presents the mathematical formulation of the Failure Anticipation Index (FAI) and Internal Stability Score (ISS), providing a step-by-step breakdown of how these metrics are computed from raw internal signals (gradients, latent embeddings, and predictive distributions).

\\section{Experimental Configuration \\& Context}
The experiment was conducted to analyze internal stability dynamics. Note that low accuracy figures (e.g., on MNIST) may be intentional to study instability regimes, optimization roughness, or failure modes.

\\begin{table}[h]
\\centering
\\begin{tabular}{ll}
\\toprule
\\textbf{Hyperparameter} & \\textbf{Value} \\\\
\\midrule
Dataset & ${config.dataset || "N/A"} \\\\
Model Architecture & ${config.modelArchitecture || "N/A"} \\\\
Total Epochs & ${config.epochs} \\\\
Final Accuracy & \\textbf{${finalAccuracy}\\%} \\\\
Optimization Loss & ${finalLoss} (Curvature Proxy) \\\\
\\bottomrule
\\end{tabular}
\\caption{Experimental configuration and final performance derived metrics.}
\\end{table}

\\section{Mathematical Formulation of Metrics}

\\subsection{1. Failure Anticipation Index (FAI)}
\\textbf{Definition:} The FAI is an unnormalized risk signal designed to quantify the system's proximity to an unstable regime. It is defined as a weighted linear combination of three internal indicators: Latent Drift, Gradient Variance, and Predictive Entropy.

\\subsubsection*{Theoretical Formula}
\\[ FAI = \\alpha \\cdot \\text{Drift} + \\beta \\cdot \\text{Var}(\\nabla) + \\gamma \\cdot H(p) \\]
Where standard weights are $\\alpha=0.4, \\beta=0.4, \\gamma=0.2$.

\\subsubsection*{Step-by-Step Computational Breakdown}
Based on the final epoch (${finalSignal?.epoch || 0}) signals:

\\begin{enumerate}
    \\item \\textbf{Latent Drift ($d$)}: ${drift.toFixed(4)}
    \\\\ Measures the Euclidean displacement of weights or embeddings between epochs.
    \\[ \\text{Term}_d = ${drift.toFixed(4)} \\times 0.4 = \\mathbf{${termDrift}} \\]
    
    \\item \\textbf{Gradient Variance ($\\sigma^2$)}: ${variance.toFixed(4)}
    \\\\ Proxies the ruggedness of the local optimization landscape.
    \\[ \\text{Term}_v = ${variance.toFixed(4)} \\times 0.4 = \\mathbf{${termVar}} \\]
    
    \\item \\textbf{Predictive Entropy ($H$)}: ${entropy.toFixed(4)}
    \\\\ Measures the uncertainty of the predictive distribution (Shannon Entropy).
    \\[ \\text{Term}_h = ${entropy.toFixed(4)} \\times 0.2 = \\mathbf{${termEnt}} \\]
    
    \\item \\textbf{Final Aggregation}:
    \\[ FAI = ${termDrift} + ${termVar} + ${termEnt} = \\mathbf{${faiScore}} \\]
\\end{enumerate}

\\subsection{2. Internal Stability Score (ISS)}
\\textbf{Definition:} A bounded metric (0 to 1) representing the smoothness of the learning trajectory. It is defined as the inverse of the accumulated gradient variance.

\\subsubsection*{Calculation}
\\[ ISS = \\frac{1}{1 + \\text{Var}(\\nabla \\mathcal{L})} = \\frac{1}{1 + ${variance.toFixed(4)}} = \\mathbf{${(1 / (1 + variance)).toFixed(4)}} \\]

\\subsection{3. Causal Correlation Analysis}
Causal structure among internal signals is inferred using the PC-Algorithm (Peter-Clark). 
Significant links are defined by a Pearson correlation coefficient $|r| > 0.3$ (indicating medium-to-large effect size).

\\begin{itemize}
    \\item \\textbf{Identified Links}: ${causalData?.links?.length || 0}
    \\item \\textbf{Top Association}: ${causalData?.links?.length > 0 ? causalData.links[0].source + " $\\rightarrow$ " + causalData.links[0].target : "None satisfying significance criteria."}
\\end{itemize}

\\section{Conclusion}
The computed Failure Anticipation Index of \\textbf{${faiScore}} suggests the model is in a \\textbf{${metrics?.faiScore?.level || "Unknown"}} risk state. 
${Number(faiScore) > 0.5 ? "The elevated values in drift and entropy warrant intervention." : "The metrics indicate a uniform and stable optimization trajectory."}

\\end{document}
`;
};
