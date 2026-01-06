from enum import Enum
import numpy as np

class RiskLevel(str, Enum):
    STABLE = "Stable"
    WARNING = "Warning"
    PRE_FAILURE = "Pre-Failure Risk"

class FailureAnticipationEngine:
    """
    AegisML Pre-Failure Anticipation Engine (FAI)
    
    Combines multivariate signals to predict failure BEFORE accuracy drops.
    """
    
    def __init__(self):
        pass
        
    def assess_risk(self, metrics: dict, violations: list) -> dict:
        """
        Compute Risk Level and Causal Trace.
        
        metrics: current values
        violations: list of keys that exceeded adaptive thresholds
        """
        risk = RiskLevel.STABLE
        trace = []
        
        # Extract signals
        entropy = metrics.get('entropy', 0)
        grad_norm = metrics.get('gradient_norm', 0)
        drift = metrics.get('drift', 0)
        
        # Logic Hierarchy
        
        # 1. High Risk: Structural Instability
        # If Gradient Norm is exploding implies the model is very sensitive to small changes
        if 'gradient_norm' in violations:
            risk = RiskLevel.PRE_FAILURE
            trace.append("Sensitivity Spike")
            
        # 2. Medium Risk: Unfamiliar Data (Drift)
        if 'drift' in violations:
            if risk == RiskLevel.STABLE: 
                risk = RiskLevel.WARNING
            trace.append("Distribution Drift")
            
        # 3. Compound Risk: Drift + Uncertainty
        if 'drift' in violations and 'entropy' in violations:
            risk = RiskLevel.PRE_FAILURE
            trace.append("Confidence Collapse")
            
        # Formatting Trace
        if not trace:
            explanation = "Signals within adaptive bounds."
        else:
            explanation = " \u2192 ".join(trace) # Arrow symbol
            
        # Calculate a normalized numeric FAI score (0.0 - 1.0)
        # Heuristic combination
        fai_score = 0.0
        if risk == RiskLevel.STABLE:
            fai_score = 0.1 * (entropy + drift) # Low baseline
        elif risk == RiskLevel.WARNING:
            fai_score = 0.5 + (0.1 * len(violations))
        elif risk == RiskLevel.PRE_FAILURE:
            fai_score = 0.8 + (0.05 * len(violations))
            
        return {
            "risk_level": risk.value,
            "fai_score": min(fai_score, 1.0),
            "causal_trace": explanation
        }
