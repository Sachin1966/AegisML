
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlayCircle } from "lucide-react";

interface Intervention {
    id: string;
    action: string;
    targetMetric: string;
    expectedGain: number; // Stability gain 0-1
    risk: number; // Risk of making things worse
    cost: 'Low' | 'Medium' | 'High';
    confidence: number;
}

interface InterventionAdvisorProps {
    data: Intervention[];
}

export function InterventionAdvisor({ data }: InterventionAdvisorProps) {
    if (!data || data.length === 0) return null;

    return (
        <Card className="p-4 bg-background/50 border-primary/20 backdrop-blur mt-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-mono text-sm text-primary flex items-center gap-2">
                    <span>🛡️ Autonomous Intervention Advisor</span>
                </h3>
            </div>

            <div className="space-y-3">
                {data.map((int, i) => (
                    <div key={int.id} className="flex items-center justify-between p-3 bg-muted/20 rounded border border-muted/50">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm">{int.action}</span>
                                {i === 0 && <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/20">Recommended ({Math.round(int.confidence * 100)}% Conf)</Badge>}
                            </div>
                            <div className="flex gap-2 text-xs text-muted-foreground">
                                <span>Target: {int.targetMetric}</span>
                                <span className="text-muted-foreground/50">|</span>
                                <span>Cost: <span className={int.cost === 'High' ? 'text-red-400' : 'text-blue-400'}>{int.cost}</span></span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <div className="text-sm font-bold text-green-400">+{Math.round(int.expectedGain * 100)}%</div>
                                <div className="text-[10px] text-muted-foreground">Stability Gain</div>
                            </div>
                            <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                                <PlayCircle className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-4 p-2 bg-muted/20 rounded text-[10px] font-mono text-muted-foreground">
                <span className="text-primary">&gt;</span> Action Plan:
                Top intervention (Reduce LR) is highly likely to stabilize Gradient Variance curve.
            </div>
        </Card>
    );
}
