
import numpy as np
import torch
import torch

def calculate_research_metrics(model, device, data_loader, loss_func, prev_weights=None):
    """
    Extracts research-grade internal signals from the model.
    """
    model.eval()
    gradients = []
    
    # Gradient Norm & Variance
    try:
        data, target = next(iter(data_loader))
    except StopIteration:
        # Handle case where loader is empty or finished
        return None
        
    data, target = data.to(device), target.to(device)
    
    # Zero grad
    model.zero_grad()
    output = model(data)
    loss = loss_func(output, target)
    loss.backward()
    
    total_norm = 0.0
    for p in model.parameters():
        if p.grad is not None:
            param_norm = p.grad.data.norm(2)
            total_norm += param_norm.item() ** 2
    total_norm = total_norm ** 0.5
    
    # Gradient Variance (Real Calculation)
    all_grads = [p.grad.view(-1) for p in model.parameters() if p.grad is not None]
    if all_grads:
        all_grads_concat = torch.cat(all_grads)
        grad_variance = torch.var(all_grads_concat).item()
    else:
        grad_variance = 0.0

    # Loss Curvature
    loss_curvature = total_norm / (loss.item() + 1e-6)

    # Entropy (Prediction Confidence)
    probs = torch.nn.functional.softmax(output, dim=1)
    entropy = -torch.sum(probs * torch.log(probs + 1e-10), dim=1).mean().item()
    
    # Dead Neurons
    if all_grads:
        dead_neuron_ratio = (all_grads_concat.abs() < 1e-5).float().mean().item()
    else:
        dead_neuron_ratio = 0.0
    
    # Latent Drift (Real Calculation)
    # Euclidean distance between current weights and previous epoch weights
    latent_drift = 0.0
    current_weights_flat = torch.cat([p.data.view(-1) for p in model.parameters()])
    
    if prev_weights is not None:
        # Ensure prev_weights is on same device
        if prev_weights.device != device:
            prev_weights = prev_weights.to(device)
        latent_drift = torch.dist(current_weights_flat, prev_weights).item()
        
    # Accuracy
    pred = output.argmax(dim=1, keepdim=True)
    correct = pred.eq(target.view_as(pred)).sum().item()
    accuracy = correct / len(target)

    # Return current weights for next iteration state
    return {
        "metrics": {
            "gradient_norm": total_norm,
            "gradient_variance": grad_variance,
            "loss_curvature": loss_curvature,
            "prediction_entropy": entropy,
            "dead_neuron_ratio": dead_neuron_ratio,
            "latent_drift": latent_drift,
            "ev_centrality": (
                model.fc2.weight.norm().item() if hasattr(model, 'fc2') else
                model.classifier.weight.norm().item() if hasattr(model, 'classifier') and hasattr(model.classifier, 'weight') else
                model.head.weight.norm().item() if hasattr(model, 'head') and hasattr(model.head, 'weight') else
                model.layers[-1].linear.weight.norm().item() if hasattr(model, 'layers') and hasattr(model.layers[-1], 'linear') else
                0.0
            ),
            "accuracy": accuracy
        },
        "current_weights": current_weights_flat.detach().clone() # Detach to prevent graph retention
    }
