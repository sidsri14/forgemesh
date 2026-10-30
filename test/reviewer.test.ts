import { describe, it, expect } from 'vitest';
import { ForgeSecurityReviewerAgent } from '../src/reviewer.js';
import { ForgeCoderAgent } from '../src/coder.js';

describe('ForgeSecurityReviewerAgent Adversarial Suite', () => {
  const reviewer = new ForgeSecurityReviewerAgent();
  const coder = new ForgeCoderAgent();

  it('detects missing cleanup in version 1 and flags intervention', () => {
    const artifacts = coder.generate('Build rate limiter');
    const review = reviewer.review(artifacts);

    expect(review.interventionFlagged).toBe(true);
    expect(review.approved).toBe(false);
    expect(review.score).toBe(70);
    expect(review.violations.some(v => v.ruleId === 'SEC-002')).toBe(true);
  });

  it('approves version 2 after self-healing patch remediation', () => {
    const patched = coder.generate('Build rate limiter', ['Implement cleanupStaleClients']);
    const review = reviewer.review(patched);

    expect(review.interventionFlagged).toBe(false);
    expect(review.approved).toBe(true);
    expect(review.score).toBe(100);
    expect(review.violations.length).toBe(0);
  });

  it('flags critical violation on hardcoded API key', () => {
    const maliciousArtifacts = [{
      filePath: 'src/leaky.ts',
      code: 'const apiKey = "sk-live-1234567890abcdef";',
      isTest: false,
      version: 1,
    }];

    const review = reviewer.review(maliciousArtifacts);
    expect(review.approved).toBe(false);
    expect(review.violations.some(v => v.ruleId === 'SEC-001')).toBe(true);
  });
});
