import { ForgeMeshOrchestrator } from './orchestrator.js';

async function main() {
  console.log('================================================================');
  console.log('   ForgeMesh: Autonomous Multi-Agent DevOps & Self-Healing Engine');
  console.log('   WCC Forge 48 — Track: Agentic AI & Autonomous Systems');
  console.log('   Builder: Siddharth Srivastava (@sidsri14)');
  console.log('================================================================\n');

  const orchestrator = new ForgeMeshOrchestrator(30000);
  const goal = 'Build a high-performance distributed rate limiter with strict regression tests, memory leak containment, and OWASP security audit.';

  const result = await orchestrator.run('goal-wcc-001', goal);

  console.log('\n--- EXECUTION LOGS ---');
  for (const log of result.executionLogs) {
    console.log(log);
  }

  console.log('\n--- VERIFICATION EVIDENCE ---');
  console.log(`Tests Run: ${result.verification.testsRun}`);
  console.log(`Tests Passed: ${result.verification.testsPassed}`);
  console.log(`Invariants Checked: ${result.verification.invariantsChecked}`);
  console.log(`Invariants Passed: ${result.verification.invariantsPassed}`);
  console.log(`Security Score: ${result.securityReview.score}/100 (Approved: ${result.securityReview.approved})`);

  console.log('\n--- RUNTIME TELEMETRY ---');
  console.log(`Tokens Consumed: ${result.telemetry.totalTokensUsed}`);
  console.log(`Interventions Handled: ${result.telemetry.interventionsHandled}`);
  console.log(`Total Runtime: ${result.telemetry.totalExecutionTimeMs}ms`);
  console.log(`Capital Savings vs Commercial Frontier API: ${result.telemetry.savingsVsCommercialFrontierPercent}%`);

  console.log('\n--- ARTIFACTS PRODUCED ---');
  for (const art of result.artifacts) {
    console.log(`[${art.filePath}] Version ${art.version} (Length: ${art.code.length} bytes)`);
  }
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
