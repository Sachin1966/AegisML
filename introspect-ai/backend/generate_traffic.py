
import os
import requests
import time
import random
import torch
from torchvision import datasets, transforms
from io import BytesIO

# Configuration
API_URL = "http://127.0.0.1:8000"
DATASET_PATH = "./datasets"

def get_random_image(dataset_name='mnist'):
    """Fetches a random image from the local dataset."""
    if 'cifar' in dataset_name:
        dataset = datasets.CIFAR10(DATASET_PATH, train=False, download=True)
    else:
        dataset = datasets.MNIST(DATASET_PATH, train=False, download=True)
        
    idx = random.randint(0, len(dataset) - 1)
    img, label = dataset[idx]
    return img, label

def apply_drift(img):
    """Applies random transformations to simulate data drift."""
    drift_type = random.choice(['none', 'noise', 'rotate', 'blur'])
    
    if drift_type == 'noise':
        # Add Gaussian noise
        import numpy as np
        img_np = np.array(img)
        noise = np.random.normal(0, 50, img_np.shape).astype('uint8')
        img_np = np.clip(img_np + noise, 0, 255)
        from PIL import Image
        return Image.fromarray(img_np)
        
    elif drift_type == 'rotate':
        return img.rotate(random.randint(10, 90))
        
    elif drift_type == 'blur':
        from PIL import ImageFilter
        return img.filter(ImageFilter.GaussianBlur(radius=2))
        
    return img

import argparse

def main():
    parser = argparse.ArgumentParser(description="Generate real traffic for AegisML Models")
    parser.add_argument("--mode", type=str, choices=["normal", "drift"], default="normal", help="Traffic mode: normal or drift (controlled perturbation)")
    args = parser.parse_args()
    
    print(f"Starting Traffic Generator in {args.mode.upper()} mode...")
    print(f"Target: {API_URL}/predict")
    
    while True:
        try:
            # 1. Pick a dataset (alternating or random)
            ds = 'mnist' if random.random() > 0.5 else 'cifar'
            
            # 2. Get Image
            img, label = get_random_image(ds)
            
            # 3. Apply Drift (Controlled Validation)
            is_drift = False
            if args.mode == "drift":
                # In drift mode, we consistently apply drift to validate detection
                # We apply it to 80% of traffic to make it obvious
                if random.random() < 0.8:
                    img = apply_drift(img)
                    is_drift = True
            
            # 4. Convert to Bytes
            buf = BytesIO()
            img.save(buf, format="PNG")
            buf.seek(0)
            
            # 5. Send Request
            start = time.time()
            response = requests.post(f"{API_URL}/predict", files={"file": ("image.png", buf, "image/png")})
            
            if response.status_code == 200:
                data = response.json()
                print(f"[{'PERTURBED' if is_drift else 'NORMAL'}] Class: {data['class']} | Conf: {data['confidence']:.2f} | Latency: {data['latency']:.0f}ms")
            else:
                print(f"Error: {response.status_code} - {response.text}")
                
        except requests.exceptions.ConnectionError:
            print("Connection refused. Backend might be restarting...")
            time.sleep(2)
        except Exception as e:
            print(f"Traffic Error: {e}")
            time.sleep(1)
            
        # 1-2 requests per second for readable logs
        time.sleep(random.uniform(0.5, 1.0))

if __name__ == "__main__":
    # Ensure datasets exist
    os.makedirs(DATASET_PATH, exist_ok=True)
    main()
