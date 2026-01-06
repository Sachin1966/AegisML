
import axios from 'axios';

const API_URL = 'http://localhost:8000';
axios.defaults.withCredentials = false;

export interface Experiment {
    id: string;
    name: string;
    dataset_name: string;
    model_name: string;
    status: string;
    epochs: number;
    current_epoch: number;
    learning_rate?: number;
    batch_size?: number;
    failure_simulation?: string;
    seed?: number;
    created_at?: string;
}

export interface InternalSignal {
    id: number;
    experiment_id: string;
    epoch: number;
    gradient_norm: number;
    gradient_variance: number;
    loss_curvature: number;
    prediction_entropy: number;
    dead_neuron_ratio: number;
    latent_drift: number;
    ev_centrality?: number;
    accuracy?: number;
}

export interface ProductionTelemetry {
    id: number;
    deployment_id: string;
    timestamp: string;
    latency_ms: number;
    status_code: number;
    input_drift_metric: number;
    confidence_score: number;
    shadow_signals: {
        entropy: number;
        gradient_norm: number;
        layer_variance: number;
    };
    // AegisML
    failure_risk: string;
    adaptive_thresholds: Record<string, number>;
    causal_trace: string;
}

export interface ProductionMetrics {
    rps: number;
    avg_latency: number | null;
    p95_latency: number | null;
    window_seconds: number;
}

export interface CloudStatus {
    provider: string;
    region: string;
    status: string;
    uptime: string;
    active_nodes: number;
    requests_per_minute: number;
}

export const api = {
    // Health Check
    checkHealth: async () => {
        try {
            const res = await axios.get(`${API_URL}/health`);
            return res.data;
        } catch (error) {
            return { status: 'offline' };
        }
    },

    // Experiments
    getExperiments: async (): Promise<Experiment[]> => {
        const res = await axios.get(`${API_URL}/experiments`);
        return res.data;
    },

    createExperiment: async (data: Partial<Experiment>) => {
        const res = await axios.post(`${API_URL}/experiments`, data);
        return res.data;
    },

    startTraining: async (experimentId: string) => {
        const res = await axios.post(`${API_URL}/train/${experimentId}`);
        return res.data;
    },

    stopTraining: async (experimentId: string) => {
        const res = await axios.post(`${API_URL}/train/${experimentId}/stop`);
        return res.data;
    },

    // Signals
    getSignals: async (experimentId: string): Promise<InternalSignal[]> => {
        const res = await axios.get(`${API_URL}/experiments/${experimentId}/signals`);
        return res.data;
    },

    predictFailure: async (signal: InternalSignal) => {
        const res = await axios.post(`${API_URL}/predict/failure`, signal);
        return res.data;
    },

    deleteExperiment: async (experimentId: string) => {
        const res = await axios.delete(`${API_URL}/experiments/${experimentId}`);
        return res.data;
    },

    // Production Monitoring
    getProductionTelemetry: async (limit: number = 100): Promise<ProductionTelemetry[]> => {
        const res = await axios.get(`${API_URL}/production/telemetry?limit=${limit}`);
        return res.data;
    },

    getCloudStatus: async (): Promise<CloudStatus> => {
        const res = await axios.get(`${API_URL}/production/status`);
        return res.data;
    },

    deployModel: async (experimentId: string) => {
        const res = await axios.post(`${API_URL}/production/deploy/${experimentId}`);
        return res.data;
    },

    toggleShadowMode: async (enable: boolean) => {
        const res = await axios.post(`${API_URL}/production/shadow?enable=${enable}`);
        return res.data;
    },

    clearTelemetry: async () => {
        const res = await axios.post(`${API_URL}/production/clear`);
        return res.data;
    },

    getProductionMetrics: async (windowDetails: number = 10) => {
        const res = await axios.get(`${API_URL}/production/metrics?window_seconds=${windowDetails}`);
        return res.data;
    },

    chatWithAssistant: async (message: string, file?: File) => {
        const formData = new FormData();
        formData.append("message", message);
        if (file) {
            formData.append("file", file);
        }
        const res = await axios.post(`${API_URL}/assistant/chat`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            }
        });
        return res.data;
    }
};
