
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class Experiment(Base):
    __tablename__ = "experiments"

    id = Column(String, primary_key=True, index=True) # UUID
    name = Column(String, index=True)
    status = Column(String, default="created") # created, running, completed, failed
    created_at = Column(DateTime, default=datetime.utcnow)
    dataset_name = Column(String)
    model_name = Column(String)
    epochs = Column(Integer)
    learning_rate = Column(Float)
    batch_size = Column(Integer)
    seed = Column(Integer)
    failure_simulation = Column(String)
    current_epoch = Column(Integer, default=0)
    
    # Research Metrics (stored as JSON for flexibility or specific columns)
    metrics = Column(JSON, default={}) 
    
    signals = relationship("InternalSignal", back_populates="experiment")

class InternalSignal(Base):
    __tablename__ = "internal_signals"

    id = Column(Integer, primary_key=True, index=True)
    experiment_id = Column(String, ForeignKey("experiments.id"))
    epoch = Column(Integer)
    
    # Research Signals
    gradient_norm = Column(Float)
    gradient_variance = Column(Float)
    loss_curvature = Column(Float)
    ev_centrality = Column(Float) # Eigenvector Centrality
    
    # Latent Space
    latent_drift = Column(Float)
    prediction_entropy = Column(Float) # Renamed from activation_entropy to match API
    dead_neuron_ratio = Column(Float)
    accuracy = Column(Float, default=0.0)
    
    # Meta-Cognition
    confidence_score = Column(Float)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    experiment = relationship("Experiment", back_populates="signals")

class ProductionTelemetry(Base):
    __tablename__ = "production_telemetry"

    id = Column(Integer, primary_key=True, index=True)
    deployment_id = Column(String, index=True)  # e.g. "prod-v1"
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Inference Stats
    latency_ms = Column(Float)
    status_code = Column(Integer)

    # Drift Signals (Real inputs)
    input_drift_metric = Column(Float)  # PSI or similar
    confidence_score = Column(Float)

    # Shadow Model Introspection
    shadow_signals = Column(JSON)  # Store entropy/grad_norm from shadow pass
    
    # AegisML Intelligence
    failure_risk = Column(String, default="Stable")
    adaptive_thresholds = Column(JSON, default={})
    causal_trace = Column(String, default="")
