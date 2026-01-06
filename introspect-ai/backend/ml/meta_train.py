
import pandas as pd
import numpy as np
import xgboost as xgb
from sqlalchemy import create_engine
import os
import pickle
from datetime import datetime

# Database Connection
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://sami:sami_password@localhost:5432/sami_db")
engine = create_engine(SQLALCHEMY_DATABASE_URL)

def train_meta_model():
    print("Fetching historical training signals...")
    # Fetch all signals from DB
    query = """
    SELECT 
        s.gradient_norm, s.gradient_variance, s.loss_curvature, 
        s.prediction_entropy, s.dead_neuron_ratio, s.latent_drift,
        e.status
    FROM internal_signals s
    JOIN experiments e ON s.experiment_id = e.id
    WHERE e.status IN ('completed', 'failed')
    """
    try:
        df = pd.read_sql(query, engine)
    except Exception as e:
        print(f"Database error: {e}")
        return

    if df.empty:
        print("Not enough data to train meta-model.")
        return

    print(f"Training on {len(df)} signal snapshots...")
    
    # Feature Engineering
    features = ['gradient_norm', 'gradient_variance', 'loss_curvature', 
                'prediction_entropy', 'dead_neuron_ratio', 'latent_drift']
    
    X = df[features]
    
    # Label Generation (Self-Supervised)
    # If the experiment eventually FAILED, we label early signals as "Pre-Failure" (1)
    # If completed successfully, "Healthy" (0)
    # This assumes 'status' reflects the ground truth of the run outcome.
    y = df['status'].apply(lambda x: 1 if x == 'failed' else 0)
    
    # Train XGBoost Classifier
    model = xgb.XGBClassifier(use_label_encoder=False, eval_metric='logloss')
    model.fit(X, y)
    
    # Save Model
    os.makedirs('models', exist_ok=True)
    with open('models/meta_predictor.pkl', 'wb') as f:
        pickle.dump(model, f)
        
    print("Meta-Model trained and saved to models/meta_predictor.pkl")
    
    # Feature Importance Analysis (Research Output)
    importance = dict(zip(features, model.feature_importances_))
    print("Feature Importance identified by Self-Awareness:", importance)

if __name__ == "__main__":
    train_meta_model()
