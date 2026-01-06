
import { useEffect, useRef } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CausalGraphViewProps {
    data: any; // CausalGraph structure
}

export function CausalGraphView({ data }: CausalGraphViewProps) {
    if (!data) return null;

    const nodes = Array.isArray(data.nodes) ? data.nodes : [];
    const links = Array.isArray(data.links) ? data.links : Array.isArray(data.edges) ? data.edges : [];

    // We categorize nodes by type for 3-layer layout: Root -> Mediator -> Outcome
    const roots = nodes.filter((n: any) => n.type === 'root');
    const mediators = nodes.filter((n: any) => n.type === 'mediator');
    const outcomes = nodes.filter((n: any) => n.type === 'outcome');

    // Calculate Met-Confidence Score
    const avgConfidence = links.reduce((acc: number, link: any) => acc + (link.confidence || 0), 0) / (links.length || 1);

    // Helper to get coordinates (assuming fixed layout for simplicity)
    const getNodePos = (id: string) => {
        const rIdx = roots.findIndex((n: any) => n.id === id);
        if (rIdx >= 0) return { x: 50, y: 40 + rIdx * 50 }; // Left column (50px offset)

        const mIdx = mediators.findIndex((n: any) => n.id === id);
        if (mIdx >= 0) return { x: 250, y: 40 + mIdx * 50 }; // Center column

        const oIdx = outcomes.findIndex((n: any) => n.id === id);
        if (oIdx >= 0) return { x: 450, y: 80 }; // Right column

        return { x: 0, y: 0 };
    };

    return (
        <Card className="p-4 bg-black/40 border-primary/20 backdrop-blur w-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-mono text-sm text-primary flex items-center gap-2">
                    Causal Failure Map (PC-A)
                </h3>
                <div className="flex gap-2">
                    <Badge variant="outline" className={avgConfidence > 0.8 ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"}>
                        {avgConfidence > 0.8 ? 'Verified' : 'Inferred'} ({Math.round(avgConfidence * 100)}%)
                    </Badge>
                </div>
            </div>

            <div className="relative h-[240px] w-full text-xs">

                {/* Visual Connections Layer */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                    <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
                        </marker>
                    </defs>
                    {links.map((link: any, i: number) => {
                        const start = getNodePos(link.source);
                        const end = getNodePos(link.target);
                        // Adjust for card width/height somewhat or better yet, use absolute coords relative to container
                        // Since we are using flex/grid for nodes, precise SVG mapping is tricky in React without refs.
                        // Hack: We hardcode column positions in SVG to match the flex columns.
                        // Left Col Center: ~15% width, Center: ~50%, Right: ~85%

                        // We will use simpler "Ref-based" logic in a real app, but here we can approximate
                        // or just draw the lines assuming the containers are aligned. 

                        // Let's use the explicit coords defined in getNodePos and position the node divs ABSOLUTELY.
                        return (
                            <g key={i}>
                                <line
                                    x1={start.x + 50} y1={start.y + 20}
                                    x2={end.x + 50} y2={end.y + 20}
                                    stroke="#64748b"
                                    strokeWidth={Math.max(1, (link.weight || 0.5) * 3)}
                                    opacity={link.confidence}
                                    markerEnd="url(#arrowhead)"
                                />
                                <text x={(start.x + end.x) / 2 + 50} y={(start.y + end.y) / 2 + 10} fill="#94a3b8" fontSize="9">
                                    {link.weight?.toFixed(2)}
                                </text>
                            </g>
                        );
                    })}
                </svg>

                {/* Nodes rendered Absolutely to match svg coords */}
                {roots.map((n: any, i: number) => (
                    <div key={n.id} className="absolute w-24 p-2 bg-background/80 border border-muted rounded shadow-sm text-center z-10"
                        style={{ left: 50, top: 40 + i * 50 }}>
                        <div className="font-semibold">{n.label}</div>
                        <div className="text-[9px] text-muted-foreground">Root Cause</div>
                    </div>
                ))}

                {mediators.map((n: any, i: number) => (
                    <div key={n.id} className="absolute w-28 p-2 bg-background/80 border border-muted rounded shadow-sm text-center z-10"
                        style={{ left: 250, top: 40 + i * 50 }}>
                        <div className="font-semibold">{n.label}</div>
                        <div className="h-0.5 bg-muted mt-1 w-full"><div className="h-full bg-yellow-500" style={{ width: `${n.value * 100}%` }}></div></div>
                    </div>
                ))}

                {outcomes.map((n: any, i: number) => (
                    <div key={n.id} className="absolute w-24 p-2 bg-red-950/30 border border-red-500/50 rounded shadow-sm text-center z-10"
                        style={{ left: 450, top: 80 }}>
                        <div className="font-semibold text-red-200">{n.label}</div>
                        <div className="text-xl font-bold text-red-500">{Math.round(n.value * 100)}%</div>
                    </div>
                ))}
            </div>

            <div className="mt-4 p-2 bg-muted/10 border border-dashed border-muted/30 rounded text-[10px] text-muted-foreground flex gap-4">
                <div>
                    <span className="font-bold text-primary">Assumption Disclosure:</span>
                    <ul className="list-disc pl-3 mt-1 space-y-0.5">
                        <li>Links inferred via PC-Algorithm (p &lt; 0.05).</li>
                        <li>Arrow width indicating effect size.</li>
                        <li>Transparency: {Math.round(avgConfidence * 100)}% structural certainty.</li>
                    </ul>
                </div>
            </div>
        </Card >
    );
}
