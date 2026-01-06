import requests
import json
import time

API_URL = "http://localhost:8000"

def test_signal_logging():
    # 1. Create a dummy experiment
    exp_id = f"test_exp_{int(time.time())}"
    exp_data = {
        "id": exp_id,
        "name": "Integration Test",
        "dataset_name": "mnist",
        "model_name": "simple_cnn",
        "epochs": 5,
        "learning_rate": 0.001,
        "batch_size": 32,
        "seed": 42,
        "failure_simulation": "none"
    }
    
    print(f"Creating experiment {exp_id}...")
    try:
        r = requests.post(f"{API_URL}/experiments", json=exp_data)
        if r.status_code != 200:
            print(f"Failed to create experiment: {r.text}")
            return
    except Exception as e:
        print(f"Connection failed: {e}")
        return

    # 2. Log a dummy signal with ALL fields
    signal_data = {
        "epoch": 1,
        "experiment_id": exp_id,
        "gradient_norm": 0.5,
        "gradient_variance": 0.1,
        "loss_curvature": 0.2,
        "prediction_entropy": 1.5, # The problematic column
        "dead_neuron_ratio": 0.0,
        "latent_drift": 0.05
    }
    
    print("Logging signal...")
    try:
        r = requests.post(f"{API_URL}/signals", json=signal_data)
        print(f"Status Code: {r.status_code}")
        print(f"Response: {r.text}")
        
        if r.status_code == 200:
            print("SUCCESS: Signal logged with prediction_entropy.")
        else:
            print("FAILURE: Could not log signal.")
    except Exception as e:
        print(f"Signal logging failed: {e}")

if __name__ == "__main__":
    test_signal_logging()
