
import { generateEpochSignals, generateMetrics } from './lib/mockData';

console.log("Starting reproduction...");
const start = Date.now();

try {
    console.log("Generating signals...");
    const signals = generateEpochSignals(100, true);
    console.log(`Generated ${signals.length} signals.`);

    console.log("Generating metrics...");
    const metrics = generateMetrics(signals, true);
    console.log("Metrics generated:", metrics);

} catch (error) {
    console.error("Error:", error);
}

const end = Date.now();
console.log(`Finished in ${end - start}ms`);
