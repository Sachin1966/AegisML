import requests
import uuid
import os

API_URL = "http://127.0.0.1:8000"

def setup_env():
    # 1. Create a Dummy Experiment
    exp_id = str(uuid.uuid4())
    print(f"Creating experiment {exp_id}...")
    
    payload = {
        "id": exp_id,
        "name": "AegisML-Pilot-01",
        "dataset_name": "mnist",
        "model_name": "simple_cnn",
        "epochs": 5,
        "learning_rate": 0.01,
        "batch_size": 32,
        "seed": 42,
        "failure_simulation": "none"
    }
    
    try:
        res = requests.post(f"{API_URL}/experiments", json=payload)
        res.raise_for_status()
        print("Experiment created.")
    except Exception as e:
        print(f"Failed to create experiment: {e}")
        return

    # 2. Ensure Model Exists (Mocking the file if needed)
    # The backend looks for backend/ml/models/{id}.pt
    # We will just copy an existing model or create a dummy file if strict checking isn't there
    # But wait, the backend triggers 'load_state_dict', so it must be a valid state dict.
    # We should probably train it quickly or assume one exists.
    # Actually, main.py mocks training if imports fail, but deployment tries to load real weights.
    # Let's try to 'Train' it for 1 epoch to generate the file.
    
    print("Triggering training (background)...")
    res = requests.post(f"{API_URL}/train/{exp_id}")
    if res.status_code == 200:
        print("Training started. Waiting 10s for model file generation...")
        import time
        time.sleep(15) 
    else:
        print(f"Training failed: {res.text}")
        return

    # 3. Deploy
    print("Deploying model...")
    res = requests.post(f"{API_URL}/production/deploy/{exp_id}")
    if res.status_code == 200:
        print("Model Deployed Successfully!")
        print(res.json())
    else:
        print(f"Deployment failed: {res.text}")

if __name__ == "__main__":
    setup_env()
