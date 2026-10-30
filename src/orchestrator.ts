import { ForgePlannerAgent } from './planner.js';
import { ForgeCoderAgent, GeneratedArtifact } from './coder.js';
import { ForgeVerifierAgent } from './verifier.js';
import { ForgeSecurityReviewerAgent } from './reviewer.js';
import { ForgeCircuitGovernor } from './governor.js';
import { ExecutionGraph, ForgeTelemetry, SecurityReviewResult, VerificationResult } from './types.js';

export interface OrchestrationRunResult {
  goalId: string;
  success: boolean;
  graph: ExecutionGraph;
  artifacts: GeneratedArtifact[];
  verification: VerificationResult;
  securityReview: SecurityReviewResult;
  telemetry: ForgeTelemetry;
  executionLogs: string[];
}

export class ForgeMeshOrchestrator {
  private planner: ForgePlannerAgent;
  private coder: ForgeCoderAgent;
  private verifier: ForgeVerifierAgent;
  private reviewer: ForgeSecurityReviewerAgent;
  private governor: ForgeCircuitGovernor;

  constructor(budgetCap: number = 25000) {
    this.planner = new ForgePlannerAgent();
    this.coder = new ForgeCoderAgent();
    this.verifier = new ForgeVerifierAgent();
    this.reviewer = new ForgeSecurityReviewerAgent();
    this.governor = new ForgeCircuitGovernor(budgetCap);
  }

  public async run(goalId: string, prompt: string): Promise<OrchestrationRunResult> {
    const startTime = Date.now();
    const logs: string[] = [];
    logs.push(`[${new Date().toISOString()}] Initiating ForgeMesh Orchestrator for goal: ${goalId}`);

    // Step 1: Pre-debit quota check for planning
    if (!this.governor.reserveQuota(500)) {
      throw new Error('Budget cap exceeded or circuit breaker tripped during initialization');
    }

    // Step 2: Planning & DAG Generation
    logs.push(`[${new Date().toISOString()}] Invoking ForgePlannerAgent...`);
    const graph = this.planner.plan(goalId, prompt);
    graph.nodes.get('task-plan')!.status = 'PASSED';
    logs.push(`[${new Date().toISOString()}] DAG planned: ${graph.executionOrder.length} nodes scheduled.`);

    // Step 3: Initial Code & Test Generation
    if (!this.governor.reserveQuota(1800)) {
      throw new Error('Budget cap exceeded during code generation phase');
    }
    logs.push(`[${new Date().toISOString()}] Invoking ForgeCoderAgent (initial synthesis v1)...`);
    let artifacts = this.coder.generate(prompt);
    graph.nodes.get('task-code')!.status = 'PASSED';
    graph.nodes.get('task-test-gen')!.status = 'PASSED';

    // Step 4: Verification Phase
    logs.push(`[${new Date().toISOString()}] Invoking ForgeVerifierAgent (suite execution)...`);
    let verification = this.verifier.verify(artifacts);
    graph.nodes.get('task-verify')!.status = verification.passed ? 'PASSED' : 'FAILED';
    for (const d of verification.diagnostics) {
      logs.push(`  -> [Verifier] ${d}`);
    }

    // Step 5: Security Review & Invariant Audit
    logs.push(`[${new Date().toISOString()}] Invoking ForgeSecurityReviewerAgent (adversarial review)...`);
    let securityReview = this.reviewer.review(artifacts);
    let interventionsHandled = 0;

    // Self-Healing Loop if intervention flagged
    if (securityReview.interventionFlagged) {
      interventionsHandled++;
      logs.push(`  -> [Reviewer INTERVENTION] Violations detected (Score: ${securityReview.score}/100):`);
      for (const v of securityReview.violations) {
        logs.push(`     [${v.severity}] ${v.ruleId}: ${v.description}`);
      }
      logs.push(`[${new Date().toISOString()}] Triggering autonomous self-healing patch loop (ForgeCoderAgent v2)...`);
      
      const remediationNotes = securityReview.violations.map(v => v.remediation);
      this.governor.reserveQuota(1200);
      artifacts = this.coder.generate(prompt, remediationNotes);

      // Re-verify patched artifacts
      verification = this.verifier.verify(artifacts);
      securityReview = this.reviewer.review(artifacts);
      logs.push(`[${new Date().toISOString()}] Re-audit complete. New Security Score: ${securityReview.score}/100. Approved: ${securityReview.approved}`);
    }

    graph.nodes.get('task-review')!.status = securityReview.approved ? 'PASSED' : 'FAILED';
    graph.nodes.get('task-deploy')!.status = (verification.passed && securityReview.approved) ? 'PASSED' : 'FAILED';
    graph.completedAt = Date.now();

    const duration = Date.now() - startTime;
    this.governor.recordSuccess();
    const telemetry = this.governor.getTelemetry(duration, interventionsHandled);

    logs.push(`[${new Date().toISOString()}] ForgeMesh run completed in ${duration}ms. Success: ${securityReview.approved && verification.passed}`);

    return {
      goalId,
      success: securityReview.approved && verification.passed,
      graph,
      artifacts,
      verification,
      securityReview,
      telemetry,
      executionLogs: logs,
    };
  }
}
