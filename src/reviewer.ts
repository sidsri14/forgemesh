import { SecurityReviewResult } from './types.js';
import { GeneratedArtifact } from './coder.js';

export class ForgeSecurityReviewerAgent {
  public review(artifacts: GeneratedArtifact[]): SecurityReviewResult {
    const violations: SecurityReviewResult['violations'] = [];
    const impl = artifacts.find(a => !a.isTest);

    if (!impl) {
      return {
        approved: false,
        score: 0,
        interventionFlagged: true,
        violations: [{
          ruleId: 'SEC-000',
          severity: 'CRITICAL',
          description: 'No implementation artifact provided for security audit',
          remediation: 'Provide source code artifact for static audit.',
        }],
      };
    }

    // Check 1: Hardcoded credentials / secret tokens
    const secretPattern = /(api[_-]?key|secret|token|password)\s*[:=]\s*["'][a-zA-Z0-9_\-]{8,}["']/i;
    if (secretPattern.test(impl.code)) {
      violations.push({
        ruleId: 'SEC-001',
        severity: 'CRITICAL',
        description: 'Hardcoded secret or credential detected in source code',
        remediation: 'Extract credentials into environment variables or secret vaults.',
      });
    }

    // Check 2: Unbounded memory allocation / Denial of Service
    if (!impl.code.includes('cleanupStaleClients') && impl.version < 2) {
      violations.push({
        ruleId: 'SEC-002',
        severity: 'HIGH',
        description: 'Unbounded Map growth: Memory leak vulnerability under high client throughput',
        remediation: 'Implement periodic stale client eviction policy (cleanupStaleClients).',
      });
    }

    // Check 3: Prototype pollution / injection
    if (impl.code.includes('__proto__') || impl.code.includes('eval(')) {
      violations.push({
        ruleId: 'SEC-003',
        severity: 'CRITICAL',
        description: 'Dangerous code execution primitive or prototype pollution vector',
        remediation: 'Eliminate dynamic eval and use strict property validation.',
      });
    }

    const interventionFlagged = violations.some(v => v.severity === 'CRITICAL' || v.severity === 'HIGH');
    let score = 100;
    for (const v of violations) {
      if (v.severity === 'CRITICAL') score -= 50;
      else if (v.severity === 'HIGH') score -= 30;
      else if (v.severity === 'MEDIUM') score -= 15;
      else score -= 5;
    }
    score = Math.max(0, score);
    const approved = !interventionFlagged && score >= 80;

    return {
      approved,
      score,
      interventionFlagged,
      violations,
    };
  }
}
