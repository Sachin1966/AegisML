export class FailureEngine {
  private config: {
    accDegradationThresh: number; // e.g., 0.10 drop
    lossIncreaseThresh: number;   // e.g., 0.50 increase
    confidenceCollapseThresh: number; // e.g., < 0.60
    windowSize: number;           // e.g., 5 epochs
  };

  private history: { accuracy: number; loss: number; confidence: number }[] = [];
  private baselineAccuracy: number = 0;
  private baselineLoss: number = 0;

  constructor(config = {
    accDegradationThresh: 0.15,
    lossIncreaseThresh: 0.5,
    confidenceCollapseThresh: 0.5,
    windowSize: 5
  }) {
    this.config = config;
  }

  public update(epochData: { accuracy: number; loss: number; confidence: number }) {
    this.history.push(epochData);
    
    // Update baselines using simple moving average of first few epochs
    if (this.history.length < 10) {
      this.baselineAccuracy = Math.max(this.baselineAccuracy, epochData.accuracy);
      this.baselineLoss = this.baselineLoss === 0 ? epochData.loss : Math.min(this.baselineLoss, epochData.loss);
    }
  }

  public checkFailure(currentEpoch: number): { 
    isFailure: boolean; 
    failureType: string | null; 
    failureDuration: number;
  } {
    if (this.history.length < this.config.windowSize) {
      return { isFailure: false, failureType: null, failureDuration: 0 };
    }

    const window = this.history.slice(-this.config.windowSize);
    
    // Rule 1: Sustained Accuracy Degradation
    const avgAcc = window.reduce((a, b) => a + b.accuracy, 0) / window.length;
    if (this.baselineAccuracy - avgAcc > this.config.accDegradationThresh) {
      return { 
        isFailure: true, 
        failureType: 'ACCURACY_DEGRADATION', 
        failureDuration: this.calculateDuration('ACCURACY_DEGRADATION') 
      };
    }

    // Rule 2: Sustained Loss Increase (Divergence)
    const avgLoss = window.reduce((a, b) => a + b.loss, 0) / window.length;
    if (avgLoss - this.baselineLoss > this.config.lossIncreaseThresh) {
      return { 
        isFailure: true, 
        failureType: 'LOSS_DIVERGENCE', 
        failureDuration: this.calculateDuration('LOSS_DIVERGENCE')
      };
    }

    // Rule 3: Confidence Collapse
    const avgConf = window.reduce((a, b) => a + b.confidence, 0) / window.length;
    if (avgConf < this.config.confidenceCollapseThresh) {
      return { 
        isFailure: true, 
        failureType: 'CONFIDENCE_COLLAPSE', 
        failureDuration: this.calculateDuration('CONFIDENCE_COLLAPSE')
      };
    }

    return { isFailure: false, failureType: null, failureDuration: 0 };
  }

  private calculateDuration(type: string): number {
    // Simplified duration calculation: count how many consecutive recent epochs satisfy the condition
    // In a real localized backend, this would be more stateful.
    let count = 0;
    for (let i = this.history.length - 1; i >= 0; i--) {
      const data = this.history[i];
      let match = false;
      if (type === 'ACCURACY_DEGRADATION') match = (this.baselineAccuracy - data.accuracy > this.config.accDegradationThresh);
      else if (type === 'LOSS_DIVERGENCE') match = (data.loss - this.baselineLoss > this.config.lossIncreaseThresh);
      else if (type === 'CONFIDENCE_COLLAPSE') match = (data.confidence < this.config.confidenceCollapseThresh);
      
      if (match) count++;
      else break;
    }
    return count;
  }
}
