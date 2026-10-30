import { describe, it, expect } from 'vitest';
import { ForgeMeshOrchestrator } from '../src/orchestrator.js';

describe('ForgeMeshOrchestrator End-to-End Suite', () => {
  it('executes full self-healing workflow and produces verified output', async () => {
    const orchestrator = new ForgeMeshOrchestrator(30000);
    const result = await orchestrator.run('goal-test-01', 'Build distributed rate limiter');

    expect(result.success).toBe(true);
    expect(result.graph.nodes.size).toBe(6);
    expect(result.graph.nodes.get('task-deploy')!.status).toBe('PASSED');
    expect(result.securityReview.approved).toBe(true);
    expect(result.securityReview.score).toBe(100);
    expect(result.telemetry.interventionsHandled).toBe(1);
    expect(result.telemetry.budgetBreached).toBe(false);
    expect(result.telemetry.savingsVsCommercialFrontierPercent).toBeGreaterThan(80);
  });

  it('enforces circuit breaker and pre-debit budget limits', async () => {
    // Insufficient budget
    const tightOrchestrator = new ForgeMeshOrchestrator(100);
    await expect(tightOrchestrator.run('goal-tight-02', 'Task')).rejects.toThrow('Budget cap exceeded');
  });
});
