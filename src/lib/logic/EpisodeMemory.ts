
export interface Episode {
    id: string;
    timestamp: number;
    failureType: string; // 'gradient_explosion' | 'collapse' | 'drift' | 'none'
    signalSnapshot: any;
    outcome: 'recovered' | 'failed';
}

export class EpisodeMemory {
    private episodes: Episode[] = [];

    constructor() {
        // Seed with some "past experience"
        this.episodes.push({
            id: 'mem-001',
            timestamp: Date.now() - 1000000,
            failureType: 'gradient_explosion',
            signalSnapshot: { gradientNorm: 2.5, activationEntropy: 0.4 },
            outcome: 'failed'
        });
        this.episodes.push({
            id: 'mem-002',
            timestamp: Date.now() - 500000,
            failureType: 'collapse',
            signalSnapshot: { gradientNorm: 0.5, activationEntropy: 0.1 },
            outcome: 'failed'
        });
    }

    public addEpisode(episode: Episode) {
        this.episodes.push(episode);
        if (this.episodes.length > 100) this.episodes.shift(); // Fixed size memory
    }

    public findSimilar(currentSignal: any): { episode: Episode, similarity: number, metric: string }[] {
        const TIME_SCALE = 1000 * 60 * 60 * 24; // 1 day decay scale
        const now = Date.now();

        // Simple Euclidean distance on key metrics with Time Decay
        return this.episodes.map(episode => {
            const dist = Math.sqrt(
                Math.pow(episode.signalSnapshot.gradientNorm - currentSignal.gradientNorm, 2) +
                Math.pow(episode.signalSnapshot.activationEntropy - currentSignal.activationEntropy, 2)
            );

            // Time decay: Older memories are slightly less relevant
            const age = now - episode.timestamp;
            const decay = Math.exp(-age / TIME_SCALE);

            // Convert distance to similarity (0-1)
            // Sim = 1 / (1 + dist) * (0.8 + 0.2 * decay) -> minimal 20% penalty for very old memories
            const rawSim = 1 / (1 + dist);
            const similarity = rawSim * (0.9 + 0.1 * decay);

            return { episode, similarity, metric: 'Weighted Euclidean' };
        })
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 3); // Top 3
    }
}
