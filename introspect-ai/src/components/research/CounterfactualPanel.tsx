
import { Card } from "@/components/ui/card";

interface CounterfactualPanelProps {
    data: { parameter: string, values: number[], variance: number[] }[];
}

export function CounterfactualPanel({ data }: CounterfactualPanelProps) {
    if (!data || data.length === 0) return null;

    return (

        <Card className="p-4 bg-background/50 border-primary/20 backdrop-blur mt-4 border-dashed">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-mono text-sm text-primary flex items-center gap-2">
                    <span>🔬 Hyperparameter Sensitivity</span>
                </h3>
                <div className="flex gap-2">
                    <span className="text-[10px] bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded border border-blue-500/20">
                        Gradient Variance Projection
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {data.map((scenario) => {
                    // Safety check for hot-reload state mismatch
                    const variances = scenario.variance || [];
                    if (variances.length === 0) return null;

                    // Normalize height for visualization relative to max variance in this specific scenario group
                    const maxVar = Math.max(...variances, 0.001);

                    return (
                        <div key={scenario.parameter} className="bg-muted/10 p-3 rounded-md border border-muted/50">
                            <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2 text-center">
                                Effect of {scenario.parameter}
                            </div>

                            {/* Fixed CSS: Added h-full and justify-end to wrapper so % height works */}
                            <div className="h-32 flex items-end justify-between gap-1 px-4">
                                {variances.map((val, i) => {
                                    const heightPerc = (val / maxVar) * 80 + 10; // Scale to 10-90%
                                    return (
                                        <div key={i} className="flex flex-col items-center gap-1 w-full h-full justify-end group">
                                            <div className="relative w-full flex flex-col justify-end items-center h-full">

                                                {/* Main Bar */}
                                                <div
                                                    className="w-full bg-blue-500/40 hover:bg-blue-400/60 transition-all rounded-t z-10 relative"
                                                    style={{
                                                        height: `${heightPerc}%`
                                                    }}
                                                >
                                                    {/* Tooltip on hover */}
                                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[9px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-sm border border-border z-50">
                                                        Proj. Var: {val.toFixed(4)}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="text-[9px] text-muted-foreground whitespace-nowrap mt-1">
                                                {scenario.values[i]}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                            <div className="mt-2 text-[10px] text-center text-muted-foreground">
                                Projected Gradient Variance ({scenario.parameter === 'Batch Size' ? 'Var ∝ 1/B' : 'Var ∝ η²'})
                            </div>
                        </div>
                    )
                })}
            </div>
            <div className="mt-4 p-2 bg-muted/20 rounded text-[10px] font-mono text-muted-foreground border-l-2 border-primary">
                <span className="text-primary font-bold">Physics Identity:</span> Projections derived from SGD Scaling Laws ($\sigma^2 \propto \eta / B$). Not simulated.
            </div>
        </Card>
    );
}
