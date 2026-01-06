
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, FileText } from "lucide-react";

interface TheoryOverlayProps {
    onClose: () => void;
}

export function TheoryOverlay({ onClose }: TheoryOverlayProps) {
    return (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-4xl h-[80vh] overflow-y-auto p-6 bg-card border-primary shadow-2xl relative">
                <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>

                <div className="mb-8">
                    <h2 className="text-2xl font-bold font-mono flex items-center gap-2">
                        <FileText className="h-6 w-6 text-primary" />
                        Theoretical Foundations
                    </h2>
                    <p className="text-muted-foreground mt-2">
                        Mathematical formulation of the Self-Awareness metrics implemented in AegisML.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Internal Stability Score (ISS) */}
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold border-b pb-1">1. Internal Stability Score (ISS)</h3>
                        <div className="bg-muted/30 p-4 rounded font-mono text-xs leading-relaxed overflow-x-auto">
                            ISS = 1 / (1 + E_l [ Var_t ( || ∇_l L_t ||_2 ) ])
                            <br /><br />
                            <span className="text-muted-foreground">
                                Where l is the layer index, t is the temporal window. Assumes gradient norm variance proxies optimization landscape ruggedness.
                            </span>
                        </div>
                    </div>

                    {/* Predictive Self-Uncertainty (PSU) */}
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold border-b pb-1">2. Predictive Self-Uncertainty (PSU)</h3>
                        <div className="bg-muted/30 p-4 rounded font-mono text-xs leading-relaxed overflow-x-auto">
                            PSU = E_t [ H( p(y_t | x_t) ) ] + Var_t ( || h_t || )
                            <br /><br />
                            <span className="text-muted-foreground">
                                Combines standard predictive entropy H(p) with the variance of the latent embedding norm ||h_t|| to capture both data and model uncertainty.
                            </span>
                        </div>
                    </div>

                    {/* Internal Confidence Collapse (ICC) */}
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold border-b pb-1">3. Internal Confidence Collapse (ICC)</h3>
                        <div className="bg-muted/30 p-4 rounded font-mono text-xs leading-relaxed overflow-x-auto">
                            ICC = D_KL( p(y_t) || p(y_&#123;t-k&#125;) )
                            <br /><br />
                            <span className="text-muted-foreground">
                                Measures temporal distributional shift using Kullback-Leibler divergence over a smoothing window k.
                            </span>
                        </div>
                    </div>

                    {/* Counterfactual Stability */}
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold border-b pb-1">4. Counterfactual Stability</h3>
                        <div className="bg-muted/30 p-4 rounded font-mono text-xs leading-relaxed overflow-x-auto">
                            Risk(θ') = E[ L | do(θ = θ'), H_t ]
                            <br /><br />
                            <span className="text-muted-foreground">
                                Estimated counterfactually using intervention calculus on the optimization trajectory. No synthetic data is introduced.
                            </span>
                        </div>
                    </div>

                    {/* Assumptions */}
                    <div className="col-span-1 md:col-span-2 space-y-2 mt-4">
                        <h3 className="text-lg font-semibold border-b pb-1">Assumptions</h3>
                        <p className="text-sm text-muted-foreground">
                            1. Internal dynamics (gradient variance, latent drift) precede observable accuracy collapse.<br />
                            2. Internal signals follow a causal DAG structure.<br />
                            3. No ground-truth labels are required at inference time for stability estimation.
                        </p>
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <Button onClick={() => {
                        const latexContent = `
\\documentclass{article}
\\usepackage{amsmath}
\\usepackage{geometry}
\\geometry{a4paper, margin=1in}

\\title{AegisML: Theoretical Foundations Reference}
\\author{AegisML Inspector}
\\date{\\today}

\\begin{document}
\\maketitle

\\section{Introduction}
This document outlines the mathematical formulation of the Self-Awareness metrics implemented in AegisML.

\\section{1. Internal Stability Score (ISS)}
\\textbf{Definition:} Inverse of the gradient variance proxy for landscape ruggedness.
\\[ ISS = \\frac{1}{1 + E_l [ Var_t ( || \\nabla_l \\mathcal{L}_t ||_2 ) ]} \\]
\\textit{Where $l$ is the layer index and $t$ is the temporal window.}

\\section{2. Predictive Self-Uncertainty (PSU)}
\\textbf{Definition:} Combines standard predictive entropy $H(p)$ with the variance of the latent embedding norm $||h_t||$.
\\[ PSU = E_t [ H( p(y_t | x_t) ) ] + Var_t ( || h_t || ) \\]

\\section{3. Internal Confidence Collapse (ICC)}
\\textbf{Definition:} Measures temporal distributional shift using KL divergence.
\\[ ICC = D_{KL}( p(y_t) || p(y_{t-k}) ) \\]

\\section{4. Counterfactual Stability}
\\textbf{Definition:} Estimated risk using intervention calculus on the optimization trajectory.
\\[ Risk(\\theta') = E[ \\mathcal{L} \\mid do(\\theta = \\theta'), H_t ] \\]

\\section{Assumptions}
\\begin{enumerate}
    \\item Internal dynamics (gradient variance, latent drift) precede observable accuracy collapse.
    \\item Internal signals follow a causal DAG structure.
    \\item No ground-truth labels are required at inference time for stability estimation.
\\end{enumerate}

\\end{document}
`;
                        const blob = new Blob([latexContent], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'sami_theory_reference.tex';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                    }} variant="outline" className="gap-2">
                        Export as LaTeX
                    </Button>
                </div>
            </Card>
        </div>
    );
}
