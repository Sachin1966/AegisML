import torch
import torch.nn as nn
import torch.nn.functional as F

# --- 1. Simple CNN (Existing) ---
class SimpleCNN(nn.Module):
    def __init__(self, in_channels=1, num_classes=10):
        super(SimpleCNN, self).__init__()
        self.conv1 = nn.Conv2d(in_channels, 32, 3, 1)
        self.conv2 = nn.Conv2d(32, 64, 3, 1)
        self.fc1 = nn.Linear(9216 if in_channels==1 else 12544, 128) # Calculated for 28x28(MNIST) vs 32x32(CIFAR) -> Pool 12x12
        # Note: The original train.py had hardcoded 9216. We need to be careful with pooling.
        # Original: adaptive_max_pool2d(x, (12, 12)) -> 64 * 12 * 12 = 9216.
        # This works for any input size thanks to adaptive pool!
        self.fc1 = nn.Linear(9216, 128) 
        self.fc2 = nn.Linear(128, num_classes)

    def forward(self, x):
        x = self.conv1(x)
        x = F.relu(x)
        x = self.conv2(x)
        x = F.relu(x)
        x = F.adaptive_max_pool2d(x, (12, 12))
        x = torch.flatten(x, 1)
        x = self.fc1(x)
        x = F.relu(x)
        x = self.fc2(x)
        return x

# --- 2. Simple MLP (Fully Connected) ---
class SimpleMLP(nn.Module):
    def __init__(self, input_dim=784, hidden_dim=256, num_classes=10):
        super(SimpleMLP, self).__init__()
        self.flatten = nn.Flatten()
        self.fc1 = nn.Linear(input_dim, hidden_dim)
        self.fc2 = nn.Linear(hidden_dim, hidden_dim)
        self.fc3 = nn.Linear(hidden_dim, num_classes)

    def forward(self, x):
        x = self.flatten(x)
        x = F.relu(self.fc1(x))
        x = F.relu(self.fc2(x))
        x = self.fc3(x)
        return x

# --- 3. Vision Transformer (ViT-Small Custom) ---
# Simplified implementation for demonstration
class VisionTransformer(nn.Module):
    def __init__(self, in_channels=1, img_size=28, patch_size=7, num_classes=10, dim=64, depth=4, heads=4, mlp_dim=128):
        super(VisionTransformer, self).__init__()
        assert img_size % patch_size == 0, "Image dimensions must be divisible by the patch size."
        num_patches = (img_size // patch_size) ** 2
        patch_dim = in_channels * patch_size ** 2

        self.patch_size = patch_size
        self.dim = dim

        self.patch_to_embedding = nn.Linear(patch_dim, dim)
        self.pos_embedding = nn.Parameter(torch.randn(1, num_patches + 1, dim))
        self.cls_token = nn.Parameter(torch.randn(1, 1, dim))
        
        encoder_layer = nn.TransformerEncoderLayer(d_model=dim, nhead=heads, dim_feedforward=mlp_dim, batch_first=True)
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=depth)

        self.to_cls_token = nn.Identity()

        self.mlp_head = nn.Sequential(
            nn.LayerNorm(dim),
            nn.Linear(dim, num_classes)
        )

        # Hook storage for Attention Entropy (Future)
        self.last_attention = None

    def forward(self, img):
        # img: (B, C, H, W)
        p = self.patch_size
        
        # Patchify
        # (B, C, H, W) -> (B, C, H/p, p, W/p, p) -> (B, N, P*P*C)
        x = img.unfold(2, p, p).unfold(3, p, p).permute(0, 2, 3, 1, 4, 5).contiguous().view(img.shape[0], -1, p*p*img.shape[1])
        
        x = self.patch_to_embedding(x)
        b, n, _ = x.shape

        cls_tokens = self.cls_token.expand(b, -1, -1)
        x = torch.cat((cls_tokens, x), dim=1)
        x += self.pos_embedding[:, :(n + 1)]

        x = self.transformer(x)

        x = x[:, 0]
        return self.mlp_head(x)

# --- 4. Tabular MLP ---
class TabularMLP(nn.Module):
    def __init__(self, input_dim=30, num_classes=2):
        super(TabularMLP, self).__init__()
        self.model = nn.Sequential(
            nn.Linear(input_dim, 64),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.Linear(64, 32),
            nn.BatchNorm1d(32),
            nn.ReLU(),
            nn.Linear(32, num_classes)
        )

    def forward(self, x):
        # x is already flat for tabular
        return self.model(x)
