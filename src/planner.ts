import { ExecutionGraph, SubtaskNode, TaskType } from './types.js';

export class ForgePlannerAgent {
  public plan(goalId: string, prompt: string): ExecutionGraph {
    const nodes = new Map<string, SubtaskNode>();

    // 1. Goal deconstruction
    const planNode: SubtaskNode = {
      id: 'task-plan',
      type: 'DECONSTRUCT_GOAL',
      title: 'Analyze Goal & Deconstruct Architecture',
      description: `Break down: "${prompt}" into formal requirements, constraints, and contracts.`,
      dependencies: [],
      status: 'PENDING',
    };
    nodes.set(planNode.id, planNode);

    // 2. Code generation
    const codeNode: SubtaskNode = {
      id: 'task-code',
      type: 'GENERATE_CODE',
      title: 'Deterministic Code Synthesis',
      description: 'Implement typed interface, error handlers, and core state transitions.',
      dependencies: ['task-plan'],
      status: 'PENDING',
    };
    nodes.set(codeNode.id, codeNode);

    // 3. Regression test generation
    const testGenNode: SubtaskNode = {
      id: 'task-test-gen',
      type: 'GENERATE_REGRESSION_TEST',
      title: 'Automated Regression & Invariant Tests',
      description: 'Synthesize deterministic edge cases, boundary assertions, and failure modes.',
      dependencies: ['task-code'],
      status: 'PENDING',
    };
    nodes.set(testGenNode.id, testGenNode);

    // 4. Verification & Static Analysis
    const verifyNode: SubtaskNode = {
      id: 'task-verify',
      type: 'EXECUTE_STATIC_ANALYSIS',
      title: 'Runtime Invariant Verification',
      description: 'Execute test suites against mocked environment and verify zero leaks.',
      dependencies: ['task-test-gen'],
      status: 'PENDING',
    };
    nodes.set(verifyNode.id, verifyNode);

    // 5. Security & Invariant Review
    const reviewNode: SubtaskNode = {
      id: 'task-review',
      type: 'SECURITY_REVIEW',
      title: 'Adversarial Security & OWASP Audit',
      description: 'Inspect diff for hardcoded secrets, injection vectors, and contract invariants.',
      dependencies: ['task-verify'],
      status: 'PENDING',
    };
    nodes.set(reviewNode.id, reviewNode);

    // 6. Canary / Delivery
    const deployNode: SubtaskNode = {
      id: 'task-deploy',
      type: 'DEPLOY_CANARY',
      title: 'Deliver Verified Artifact & Generate HUD Telemetry',
      description: 'Bundle verified artifacts into release build and export state metrics.',
      dependencies: ['task-review'],
      status: 'PENDING',
    };
    nodes.set(deployNode.id, deployNode);

    const executionOrder = this.topologicalSort(nodes);

    return {
      goalId,
      prompt,
      nodes,
      executionOrder,
      createdAt: Date.now(),
    };
  }

  public topologicalSort(nodes: Map<string, SubtaskNode>): string[] {
    const inDegree = new Map<string, number>();
    const adjList = new Map<string, string[]>();

    for (const [id] of nodes) {
      inDegree.set(id, 0);
      adjList.set(id, []);
    }

    for (const [id, node] of nodes) {
      for (const dep of node.dependencies) {
        if (!nodes.has(dep)) {
          throw new Error(`Missing dependency ${dep} for node ${id}`);
        }
        adjList.get(dep)!.push(id);
        inDegree.set(id, inDegree.get(id)! + 1);
      }
    }

    const queue: string[] = [];
    for (const [id, deg] of inDegree) {
      if (deg === 0) queue.push(id);
    }

    const order: string[] = [];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      order.push(curr);

      for (const neighbor of adjList.get(curr)!) {
        const newDeg = inDegree.get(neighbor)! - 1;
        inDegree.set(neighbor, newDeg);
        if (newDeg === 0) {
          queue.push(neighbor);
        }
      }
    }

    if (order.length !== nodes.size) {
      throw new Error('Cyclic dependency detected in execution graph');
    }

    return order;
  }
}
