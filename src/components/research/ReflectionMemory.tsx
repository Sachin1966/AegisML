
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface ReflectionMemoryProps {
    data: any[]; // List of similar episodes
}

export function ReflectionMemory({ data }: ReflectionMemoryProps) {
    if (!data || data.length === 0) return null;

    const topMatch = data[0];
    const confidence = Math.round(topMatch.similarity * 100);

    return (
        <Card className="p-4 bg-background/50 border-primary/20 backdrop-blur mt-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-mono text-sm text-primary flex items-center gap-2">
                    <span>🧠 Self-Reflection Memory</span>
                </h3>
                <Badge variant="outline" className="text-[10px] bg-primary/5 border-primary/20">
                    Metric: {topMatch?.metric || 'Euclidean'} (Decay enabled)
                </Badge>
            </div>

            <div className="flex gap-4">
                {/* Main Insight */}
                <div className="flex-1 bg-muted/20 p-3 rounded-md border border-muted/50">
                    <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Current State Analysis</div>
                    <div className="text-sm font-medium mb-2">
                        {confidence > 80 ?
                            <span className="text-red-400">High confidence pattern match detected.</span> :
                            <span className="text-green-500">Novel/Safe state (Low historical familiarity).</span>
                        }
                    </div>
                    {confidence > 80 && (
                        <div className="text-xs text-red-400/80 bg-red-950/20 p-2 rounded border border-red-500/20">
                            Warning: Signals resemble previous failure episode <span className="font-mono text-red-300">{topMatch.episode.id}</span>
                            which resulted in <span className="font-bold">{topMatch.episode.failureType}</span>.
                        </div>
                    )}
                </div>

                {/* History List */}
                <div className="w-[300px]">
                    <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2 flex justify-between">
                        <span>Recall Trace</span>
                        <span>Sim Score</span>
                    </div>
                    <ScrollArea className="h-[100px] pr-2">
                        <div className="space-y-2">
                            {data.map((item, i) => (
                                <div key={i} className="flex items-center justify-between text-xs p-2 bg-background/80 rounded border border-border/50">
                                    <div>
                                        <div className="font-mono text-[10px] text-muted-foreground">{item.episode.id}</div>
                                        <div className="font-medium">{item.episode.failureType}</div>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-0.5">
                                        <Badge variant={item.similarity > 0.8 ? "destructive" : "secondary"} className="text-[9px] h-4">
                                            {item.similarity > 0.8 ? 'Confirmed' : item.similarity < 0.5 ? 'Weak Match' : 'Possible'}
                                        </Badge>
                                        <span className="text-[9px] font-mono text-muted-foreground">
                                            {(item.similarity * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </div>
        </Card>
    );
}
