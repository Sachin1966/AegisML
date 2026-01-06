import numpy as np
from collections import deque

class AdaptivePolicy:
    """
    AegisML Self-Adaptive Policy Engine
    
    Replaces static thresholds with dynamic ones based on historical behavior.
    Learns 'normal' ranges for Entropy, Drift, etc.
    """
    
    def __init__(self, window_size=50, sensitivity_sigma=3.0):
        self.window_size = window_size
        self.sigma = sensitivity_sigma
        
        # History buffers
        self.history = {
            "entropy": deque(maxlen=window_size),
            "gradient_norm": deque(maxlen=window_size),
            "drift": deque(maxlen=window_size)
        }
        
        # Default baselines (will be overwritten by real data)
        self.stats = {
            "entropy": {"mean": 0.5, "std": 0.1},
            "gradient_norm": {"mean": 1.0, "std": 0.2},
            "drift": {"mean": 0.0, "std": 0.05}
        }
        
    def update(self, metrics: dict):
        """
        Update internal history with new live metrics.
        metrics = {"entropy": 0.4, "gradient_norm": 1.2, ...}
        """
        for key, value in metrics.items():
            if key in self.history:
                self.history[key].append(value)
                
        # Update statistics if we have enough data
        for key in self.history:
            if len(self.history[key]) > 5:
                data = np.array(self.history[key])
                self.stats[key]["mean"] = float(np.mean(data))
                self.stats[key]["std"] = float(np.std(data)) + 1e-6 # Avoid div zero

    def get_thresholds(self) -> dict:
        """
        Returns dynamic upper bounds for metrics.
        """
        thresholds = {}
        for key, stat in self.stats.items():
            # Upper Limit = Mean + Sigma * Std
            thresholds[key] = stat["mean"] + (self.sigma * stat["std"])
        return thresholds
    
    def check_violation(self, metrics: dict) -> list:
        """
        Returns list of metrics that exceeded adaptive thresholds.
        """
        thresholds = self.get_thresholds()
        violations = []
        for key, value in metrics.items():
            if key in thresholds:
                if value > thresholds[key]:
                    violations.append(key)
        return violations
