import { useState } from "react";
import { History, Play, Download, Trash2, Eye, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { generateExperiments, Experiment } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function ExperimentHistory() {
  const [experiments] = useState<Experiment[]>(() => generateExperiments());
  const [selectedExp, setSelectedExp] = useState<Experiment | null>(null);

  const getStatusVariant = (status: Experiment['status']) => {
    switch (status) {
      case 'running': return 'running';
      case 'completed': return 'healthy';
      case 'failed': return 'critical';
      case 'stopped': return 'stopped';
    }
  };

  return (
    <div className="flex flex-col">
      <PageHeader 
        title="Experiment History"
        description="View, export, and re-run past experiments"
        icon={History}
        badge={`${experiments.length} experiments`}
      />

      <div className="grid gap-6 p-6 lg:grid-cols-3">
        {/* Experiment List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">All Experiments</h3>
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-3 w-3" />
              Refresh
            </Button>
          </div>

          <div className="space-y-3">
            {experiments.map((exp) => (
              <Card 
                key={exp.id}
                className={cn(
                  "cursor-pointer border p-4 transition-all hover:border-primary/50",
                  selectedExp?.id === exp.id && "border-primary bg-primary/5"
                )}
                onClick={() => setSelectedExp(exp)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-muted-foreground">{exp.id}</span>
                      <StatusIndicator 
                        status={getStatusVariant(exp.status)} 
                        pulse={exp.status === 'running'}
                      />
                    </div>
                    <h4 className="mt-1 text-sm font-medium text-foreground">{exp.name}</h4>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {exp.dataset}
                      </span>
                      <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {exp.model}
                      </span>
                      <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {exp.currentEpoch}/{exp.epochs} epochs
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground">
                      {format(exp.createdAt, 'MMM d, HH:mm')}
                    </span>
                  </div>
                </div>

                {/* Progress bar for running experiments */}
                {exp.status === 'running' && (
                  <div className="mt-3">
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div 
                        className="h-full bg-primary transition-all"
                        style={{ width: `${(exp.currentEpoch / exp.epochs) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Metrics summary */}
                <div className="mt-3 grid grid-cols-4 gap-2">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">ISS</p>
                    <p className={cn(
                      "font-mono text-xs",
                      exp.metrics.iss < 0.5 ? "text-destructive" : "text-foreground"
                    )}>
                      {exp.metrics.iss.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">PSU</p>
                    <p className={cn(
                      "font-mono text-xs",
                      exp.metrics.psu > 0.5 ? "text-destructive" : "text-foreground"
                    )}>
                      {exp.metrics.psu.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">FAH</p>
                    <p className="font-mono text-xs text-foreground">
                      {exp.metrics.fah}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">Fail %</p>
                    <p className={cn(
                      "font-mono text-xs",
                      exp.metrics.failureProbability > 0.7 ? "text-destructive" : "text-foreground"
                    )}>
                      {(exp.metrics.failureProbability * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="space-y-4">
          {selectedExp ? (
            <>
              <Card className="p-4">
                <h3 className="mb-4 text-sm font-semibold text-foreground">Experiment Details</h3>
                
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-muted-foreground">ID</span>
                    <p className="font-mono text-sm text-foreground">{selectedExp.id}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Name</span>
                    <p className="text-sm text-foreground">{selectedExp.name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs text-muted-foreground">Dataset</span>
                      <p className="text-sm text-foreground">{selectedExp.dataset}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Model</span>
                      <p className="text-sm text-foreground">{selectedExp.model}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs text-muted-foreground">Epochs</span>
                      <p className="text-sm text-foreground">{selectedExp.currentEpoch} / {selectedExp.epochs}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Status</span>
                      <p className="text-sm text-foreground capitalize">{selectedExp.status}</p>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Created</span>
                    <p className="text-sm text-foreground">
                      {format(selectedExp.createdAt, 'PPpp')}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="mb-4 text-sm font-semibold text-foreground">Final Metrics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-muted/50 p-3">
                    <span className="text-xs text-muted-foreground">ISS</span>
                    <p className="font-mono text-lg font-bold text-foreground">
                      {selectedExp.metrics.iss.toFixed(3)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <span className="text-xs text-muted-foreground">PSU</span>
                    <p className="font-mono text-lg font-bold text-foreground">
                      {selectedExp.metrics.psu.toFixed(3)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <span className="text-xs text-muted-foreground">ICC</span>
                    <p className="font-mono text-lg font-bold text-foreground">
                      {selectedExp.metrics.icc.toFixed(3)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <span className="text-xs text-muted-foreground">FAH</span>
                    <p className="font-mono text-lg font-bold text-foreground">
                      {selectedExp.metrics.fah} epochs
                    </p>
                  </div>
                </div>
              </Card>

              <div className="flex flex-col gap-2">
                <Button className="w-full gap-2">
                  <Play className="h-4 w-4" />
                  Re-run Experiment
                </Button>
                <Button variant="outline" className="w-full gap-2">
                  <Eye className="h-4 w-4" />
                  View Full Analysis
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export PNG
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                </div>
                <Button variant="ghost" className="w-full gap-2 text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </>
          ) : (
            <Card className="flex h-64 items-center justify-center p-4">
              <p className="text-sm text-muted-foreground">
                Select an experiment to view details
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
