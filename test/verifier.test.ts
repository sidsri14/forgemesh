import { describe, it, expect } from 'vitest';
import { ForgeVerifierAgent } from '../src/verifier.js';
import { ForgeCoderAgent } from '../src/coder.js';

describe('ForgeVerifierAgent Invariant Suite', () => {
  const verifier = new ForgeVerifierAgent();
  const coder = new ForgeCoderAgent();

  it('verifies initial code generation passes unit tests and core invariants', () => {
    const artifacts = coder.generate('Build rate limiter');
    const result = verifier.verify(artifacts);

    expect(result.testsRun).toBe(3);
    expect(result.testsPassed).toBe(3);
    expect(result.invariantsChecked).toBe(3);
    expect(result.invariantsPassed).toBeGreaterThanOrEqual(2);
    expect(result.passed).toBe(true);
  });

  it('fails gracefully when artifacts are missing', () => {
    const result = verifier.verify([]);
    expect(result.passed).toBe(false);
    expect(result.diagnostics).toContain('Missing implementation or test suite artifact');
  });

  it('verifies eviction guard present in version 2 patched artifact', () => {
    const patchedArtifacts = coder.generate('Build rate limiter', ['Implement eviction']);
    const result = verifier.verify(patchedArtifacts);

    expect(result.invariantsPassed).toBe(3);
    expect(result.diagnostics.some(d => d.includes('Stale key eviction guard verified'))).toBe(true);
  });
});
