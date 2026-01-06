import torch
import torch.nn as nn
import os
import sys

# Define SimpleCNN matching backend/ml/architectures.py
class SimpleCNN(nn.Module):
    def __init__(self, in_channels=1, num_classes=10):
        super(SimpleCNN, self).__init__()
        self.conv1 = nn.Conv2d(in_channels, 32, kernel_size=3)
        self.fc1 = nn.Linear(32 * 26 * 26, 128) # Approximation
        # Let's check architectures.py if needed, but for dummy loading this might fail on size mismatch
        # Safest is to just save a state_dict that matches the key names expected, 
        # OR just rely on 'strict=False' if we could, but we can't change backend easily for that.
        # Better: Import the actual class if possible.

# Let's try to import from backend
sys.path.append(os.getcwd())
from backend.ml.architectures import SimpleCNN

def create_model(exp_id):
    model = SimpleCNN(in_channels=1, num_classes=10)
    path = f"backend/ml/models/{exp_id}.pt"
    os.makedirs("backend/ml/models", exist_ok=True)
    torch.save(model.state_dict(), path)
    print(f"Created {path}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        create_model(sys.argv[1])
    else:
        print("Usage: python create_dummy_model.py <exp_id>")
