import { describe, it, expect } from 'vitest';
import { ForgePlannerAgent } from '../src/planner.js';

describe('ForgePlannerAgent DAG Planning Suite', () => {
  const planner = new ForgePlannerAgent();

  it('generates a complete DAG with all 6 required lifecycle phases', () => {
    const graph = planner.plan('goal-001', 'Build API rate limiter');
    expect(graph.goalId).toBe('goal-001');
    expect(graph.nodes.size).toBe(6);
    expect(graph.nodes.has('task-plan')).toBe(true);
    expect(graph.nodes.has('task-code')).toBe(true);
    expect(graph.nodes.has('task-test-gen')).toBe(true);
    expect(graph.nodes.has('task-verify')).toBe(true);
    expect(graph.nodes.has('task-review')).toBe(true);
    expect(graph.nodes.has('task-deploy')).toBe(true);
  });

  it('produces a valid topological sort with dependencies respected', () => {
    const graph = planner.plan('goal-002', 'Deploy self-healing worker');
    const order = graph.executionOrder;

    expect(order.indexOf('task-plan')).toBeLessThan(order.indexOf('task-code'));
    expect(order.indexOf('task-code')).toBeLessThan(order.indexOf('task-test-gen'));
    expect(order.indexOf('task-test-gen')).toBeLessThan(order.indexOf('task-verify'));
    expect(order.indexOf('task-verify')).toBeLessThan(order.indexOf('task-review'));
    expect(order.indexOf('task-review')).toBeLessThan(order.indexOf('task-deploy'));
  });

  it('detects cyclic dependencies and throws error', () => {
    const nodes = new Map<any, any>();
    nodes.set('node-a', { id: 'node-a', dependencies: ['node-b'] });
    nodes.set('node-b', { id: 'node-b', dependencies: ['node-a'] });

    expect(() => planner.topologicalSort(nodes)).toThrow('Cyclic dependency detected');
  });
});
