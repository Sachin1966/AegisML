import torch
import torch.nn.functional as F
import numpy as np

class ProductionMonitor:
    """
    AegisML Production Monitor
    
    Strictly label-free monitoring using:
    1. Prediction Entropy (Uncertainty)
    2. Gradient Sensitivity (Stability) - using Pseudo-Labels
    3. Latent Representation Drift
    """
    
    def __init__(self, device='cpu'):
        self.device = device
        
    def compute_entropy(self, logits: torch.Tensor) -> float:
        """
        Computes predictive entropy from raw logits.
        High entropy = High uncertainty.
        """
        probs = F.softmax(logits, dim=1)
        # Add epsilon to avoid log(0)
        entropy = -torch.sum(probs * torch.log(probs + 1e-10), dim=1)
        return entropy.mean().item()

    def compute_sensitivity(self, model: torch.nn.Module, inputs: torch.Tensor, logits: torch.Tensor) -> float:
        """
        Computes gradient sensitivity using Pseudo-Labels.
        Lower stability = Higher pseudo-label gradient norm.
        """
        # 1. Get Pseudo-Label (Model's own prediction)
        probs = F.softmax(logits, dim=1)
        pseudo_label = torch.argmax(probs, dim=1)
        
        # 2. Compute Loss against Pseudo-Label
        # We want to see how "steep" the loss surface is even if the prediction is wrong
        # If the model is confident but unstable, this gradient will be high
        loss = F.cross_entropy(logits, pseudo_label)
        
        # 3. Backward Pass (Strictly for monitoring, does not update weights)
        model.zero_grad()
        loss.backward(retain_graph=True)
        
        # 4. Compute Gradient Norm
        total_norm = 0.0
        for p in model.parameters():
            if p.grad is not None:
                param_norm = p.grad.data.norm(2)
                total_norm += param_norm.item() ** 2
        total_norm = total_norm ** 0.5
        
        # Cleanup
        model.zero_grad()
        
        return float(total_norm)

    def check_activation_health(self, activations: torch.Tensor) -> float:
        """
        Returns ratio of dead neurons (output = 0).
        """
        if activations is None:
            return 0.0
        
        # Assuming activations is [Batch, Features]
        dead_count = (activations.abs() < 1e-6).sum().item()
        total_count = activations.numel()
        return dead_count / total_count if total_count > 0 else 0.0
