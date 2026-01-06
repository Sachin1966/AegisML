
import torch
import os
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms
import requests
import json
from datetime import datetime
import numpy as np
from .signals import calculate_research_metrics 
from .architectures import SimpleCNN, SimpleMLP, VisionTransformer, TabularMLP

# Configuration
API_URL = "http://localhost:8000"

# Synthetic Fraud Dataset
class FraudDataset(torch.utils.data.Dataset):
    def __init__(self, num_samples=2000, num_features=30):
        self.num_samples = num_samples
        # Simulate imbalanced fraud data
        self.X = torch.randn(num_samples, num_features)
        # 5% fraud (1), 95% normal (0)
        prob = torch.rand(num_samples)
        self.y = (prob > 0.95).long()
        
    def __len__(self):
        return self.num_samples

    def __getitem__(self, idx):
        return self.X[idx], self.y[idx]

def train(experiment_id: str, epochs: int, learning_rate: float, dataset_name: str = 'mnist', model_name: str = 'simple_cnn', failure_simulation: str = 'none'):
    try:
        print(f"Starting {model_name} on {dataset_name} (ID: {experiment_id}, Epochs: {epochs}, LR: {learning_rate})")
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        # --- Data Loading ---
        os.makedirs('./datasets', exist_ok=True)
        dataset_name_clean = dataset_name.lower().replace(' ', '_')
        
        if dataset_name_clean == 'cifar10':
            transform = transforms.Compose([
                transforms.ToTensor(),
                transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))
            ])
            full_dataset = datasets.CIFAR10('./datasets', train=True, download=True, transform=transform)
            # FAST MODE: Use only 2000 samples
            indices = torch.randperm(len(full_dataset))[:2000]
            dataset = torch.utils.data.Subset(full_dataset, indices)
            input_channels = 3
            input_dim = 32 * 32 * 3
            num_classes = 10
            img_size = 32
            
        elif dataset_name_clean == 'fraud_detection':
            dataset = FraudDataset(num_samples=2000, num_features=30)
            input_channels = 1 
            input_dim = 30
            num_classes = 2
            img_size = 0 # Not an image
            
        else:
            # Default to MNIST
            transform = transforms.Compose([transforms.ToTensor(), transforms.Normalize((0.1307,), (0.3081,))])
            full_dataset = datasets.MNIST('./datasets', train=True, download=True, transform=transform)
            # FAST MODE
            indices = torch.randperm(len(full_dataset))[:2000]
            dataset = torch.utils.data.Subset(full_dataset, indices)
            input_channels = 1
            input_dim = 28 * 28
            num_classes = 10
            img_size = 28

        # --- Failure Simulation (Validation) ---
        if failure_simulation == 'data_corruption':
            print("injecting severe label noise (Failure Simulation Active)")
            # In a subset wrapper, we might need a custom dataset to corrupt y
            # Simple approach: Create a new dataset with corrupted labels
            try:
               X = []
               y = []
               loader = torch.utils.data.DataLoader(dataset, batch_size=len(dataset))
               data_full, target_full = next(iter(loader))
               
               # Random shuffle of 50% of labels
               perm = torch.randperm(len(target_full))
               threshold = int(len(target_full) * 0.5)
               target_full[:threshold] = target_full[perm[:threshold]]
               
               dataset = torch.utils.data.TensorDataset(data_full, target_full)
            except Exception as e:
                print(f"Failed to inject noise: {e}")

        train_loader = torch.utils.data.DataLoader(dataset, batch_size=64, shuffle=True)
        
        # --- Model Selection ---
        print(f"Initializing {model_name}...")
        if model_name == 'mlp':
            model = SimpleMLP(input_dim=input_dim, num_classes=num_classes).to(device)
        elif model_name == 'vit':
            if img_size == 0: raise ValueError("ViT cannot run on tabular data")
            model = VisionTransformer(in_channels=input_channels, img_size=img_size, num_classes=num_classes).to(device)
        elif model_name == 'tabular_mlp':
            if img_size > 0: print("Warning: Tabular MLP running on Flattened Image Data")
            model = TabularMLP(input_dim=input_dim, num_classes=num_classes).to(device)
        else:
            # Default to CNN
            if img_size == 0: raise ValueError("CNN needs image data")
            model = SimpleCNN(in_channels=input_channels, num_classes=num_classes).to(device)

        optimizer = optim.Adam(model.parameters(), lr=learning_rate)
        loss_func = nn.CrossEntropyLoss()

        print(f"Starting Training on {device}...")
        
        prev_weights = None
        for epoch in range(1, epochs + 1):
            # Check for Stop Signal
            import sqlite3
            try:
                conn = sqlite3.connect('sami.db')
                cursor = conn.cursor()
                cursor.execute("SELECT status FROM experiments WHERE id=?", (experiment_id,))
                row = cursor.fetchone()
                if row and row[0] == 'stopped':
                    print(f"Training stopped by user command for {experiment_id}")
                    conn.close()
                    break
                conn.close()
            except Exception as e:
                pass

            model.train()
            for batch_idx, (data, target) in enumerate(train_loader):
                data, target = data.to(device), target.to(device)
                optimizer.zero_grad()
                output = model(data)
                loss = loss_func(output, target)
                loss.backward()
                optimizer.step()
                
                if batch_idx % 100 == 0:
                    print(f"Epoch {epoch} [{batch_idx}/{len(train_loader)}]\tLoss: {loss.item():.6f}")

            # End of Epoch: Extract research signals
            signal_result = calculate_research_metrics(model, device, train_loader, loss_func, prev_weights)
            
            if signal_result:
                signals = signal_result['metrics']
                prev_weights = signal_result['current_weights']
                
                signals['epoch'] = epoch
                signals['experiment_id'] = experiment_id
                
                # Post signals to backend
                try:
                    json_signals = {k: float(v) if isinstance(v, (np.float32, np.float64)) else v for k,v in signals.items()}
                    requests.post(f"{API_URL}/signals", json=json_signals)
                except Exception as e:
                    print(f"Warning: Could not log signals: {e}")

        # Save Trained Model
        os.makedirs('models', exist_ok=True)
        model_path = f"models/{experiment_id}.pt"
        torch.save(model.state_dict(), model_path)
        print(f"Model saved to {model_path}")

        # --- Compute & Save Reference Statistics for Shadow Mode ---
        print("Computing reference statistics for Shadow Mode...")
        model.eval()
        ref_entropies = []
        ref_grad_norms = []
        
        # Use a subset of data for baseline (first 100 samples)
        baseline_loader = torch.utils.data.DataLoader(dataset, batch_size=1, shuffle=True)
        
        for i, (data, target) in enumerate(baseline_loader):
            if i >= 100: break
            data, target = data.to(device), target.to(device)
            
            # Zero grad mainly to be safe, though we accumulate for stats
            model.zero_grad()
            
            output = model(data)
            probs = torch.nn.functional.softmax(output, dim=1)
            entropy = -torch.sum(probs * torch.log(probs + 1e-10), dim=1).item()
            ref_entropies.append(entropy)
            
            # Compute Gradient Norm regarding the *predicted* class (self-supervised stability for baseline)
            # OR target class. For Reference, we use Target class (Ground Truth stability).
            loss = loss_func(output, target)
            loss.backward()
            
            total_norm = 0.0
            for p in model.parameters():
                if p.grad is not None:
                    param_norm = p.grad.data.norm(2)
                    total_norm += param_norm.item() ** 2
            total_norm = total_norm ** 0.5
            ref_grad_norms.append(total_norm)

        ref_stats = {
            "entropy_mean": float(np.mean(ref_entropies)),
            "entropy_std": float(np.std(ref_entropies)),
            "grad_norm_mean": float(np.mean(ref_grad_norms)),
            "grad_norm_std": float(np.std(ref_grad_norms)),
            "dataset": dataset_name,
            "model": model_name,
            "timestamp": datetime.now().isoformat()
        }
        
        ref_path = f"models/{experiment_id}_ref.json"
        with open(ref_path, "w") as f:
            json.dump(ref_stats, f, indent=4)
        print(f"Reference statistics saved to {ref_path}")

        # Update Status to Completed
        try:
             import sqlite3
             conn = sqlite3.connect('sami.db')
             cursor = conn.cursor()
             cursor.execute("UPDATE experiments SET status='completed' WHERE id=?", (experiment_id,))
             conn.commit()
             conn.close()
        except:
             pass

    except Exception as e:
        import traceback
        print(f"CRITICAL ERROR IN TRAINING LOOP: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    train("test_exp", 5, 0.001)
