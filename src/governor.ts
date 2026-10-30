import { ForgeTelemetry } from './types.js';

export class ForgeCircuitGovernor {
  private budgetCap: number;
  private currentSpend: number = 0;
  private failureCount: number = 0;
  private circuitOpen: boolean = false;
  private failureThreshold: number;

  constructor(budgetCap: number = 25000, failureThreshold: number = 3) {
    this.budgetCap = budgetCap;
    this.failureThreshold = failureThreshold;
  }

  public reserveQuota(estimatedTokens: number): boolean {
    if (this.circuitOpen) {
      return false;
    }
    if (this.currentSpend + estimatedTokens > this.budgetCap) {
      return false; // Budget ceiling breached: atomic safe block
    }
    this.currentSpend += estimatedTokens;
    return true;
  }

  public recordSuccess(): void {
    this.failureCount = 0;
    this.circuitOpen = false;
  }

  public recordFailure(): void {
    this.failureCount++;
    if (this.failureCount >= this.failureThreshold) {
      this.circuitOpen = true; // Trip circuit breaker
    }
  }

  public isCircuitTripped(): boolean {
    return this.circuitOpen;
  }

  public getTelemetry(totalDurationMs: number, interventionsHandled: number): ForgeTelemetry {
    // Frontier commercial rate: $0.003 in / $0.015 out per 1k ($0.018/1k total)
    // ForgeMesh local/optimized rate: ~$0.0015/1k total
    const frontierCost = (this.currentSpend / 1000) * 0.018;
    const forgeCost = (this.currentSpend / 1000) * 0.0015;
    const savings = frontierCost > 0 ? ((frontierCost - forgeCost) / frontierCost) * 100 : 0;

    return {
      totalTokensUsed: this.currentSpend,
      preDebitBudgetCap: this.budgetCap,
      budgetBreached: this.currentSpend >= this.budgetCap,
      circuitTripped: this.circuitOpen,
      interventionsHandled,
      totalExecutionTimeMs: totalDurationMs,
      savingsVsCommercialFrontierPercent: Math.round(savings * 10) / 10,
    };
  }
}
