
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ResearchMetricsPanelProps {
    data: {
        awarenessConfidence: number;
        transferScore: number;
        faiScore: {
            score: number;
            level: string;
            confidenceLower: number;
            confidenceUpper: number;
        };
    };
}

export function ResearchMetricsPanel({ data }: ResearchMetricsPanelProps) {
    if (!data) return (
        <Card className="p-4 bg-background/50 border-primary/20 backdrop-blur mt-4 animate-pulse">
            <div className="h-4 w-32 bg-muted rounded mb-4"></div>
            <div className="grid grid-cols-3 gap-4">
                <div className="h-24 bg-muted rounded"></div>
                <div className="h-24 bg-muted rounded"></div>
                <div className="h-24 bg-muted rounded"></div>
            </div>
        </Card>
    );

    return (
        <Card className="p-4 bg-background/50 border-primary/20 backdrop-blur mt-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-mono text-sm text-primary flex items-center gap-2">
                    <span>📐 Formal Verification Indices</span>
                </h3>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {/* Feature 5: Uncertainty of Awareness */}
                <div className="bg-muted/20 p-3 rounded border border-muted/50 text-center">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Meta-Confidence</div>
                    <div className="text-2xl font-bold">{Math.round(data.awarenessConfidence * 100)}%</div>
                    <Badge variant="outline" className="text-[9px] mt-1">2nd Order Uncertainty</Badge>
                </div>

                {/* Feature 6: Transfer Score */}
                <div className="bg-muted/20 p-3 rounded border border-muted/50 text-center">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Transfer Score</div>
                    <div className="text-2xl font-bold">{data.transferScore === undefined || data.transferScore === null ? '--' : data.transferScore.toFixed(2)}</div>
                    <Badge variant="outline" className="text-[9px] mt-1">OOD Generalized</Badge>
                </div>

                {/* Feature 7: FAI */}
                <div className="bg-muted/20 p-3 rounded border border-muted/50 text-center flex flex-col items-center justify-center">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">FAI Index</div>
                    <div className="text-2xl font-bold text-primary">{data.faiScore.score === 0 ? '--' : data.faiScore.score.toFixed(2)}</div>
                    <Badge
                        variant="outline"
                        className={
                            data.faiScore.score === 0 ? 'bg-muted text-muted-foreground border-muted' :
                                data.faiScore.level === 'Critical' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                    data.faiScore.level === 'Elevated' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                                        data.faiScore.level === 'Emerging' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                            'bg-green-500/10 text-green-500 border-green-500/20'
                        }
                    >
                        {data.faiScore.score === 0 ? 'System Ready' : `${data.faiScore.level} Risk`}
                    </Badge>
                    <div className="text-[8px] text-muted-foreground mt-1">
                        CI: [{data.faiScore.confidenceLower.toFixed(2)} - {data.faiScore.confidenceUpper.toFixed(2)}]
                    </div>
                </div>
            </div>
        </Card>
    );
}
