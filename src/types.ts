export type TaskStatus = 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED' | 'REVISED';

export type TaskType = 
  | 'DECONSTRUCT_GOAL'
  | 'GENERATE_CODE'
  | 'GENERATE_REGRESSION_TEST'
  | 'EXECUTE_STATIC_ANALYSIS'
  | 'SECURITY_REVIEW'
  | 'DEPLOY_CANARY';

export interface SubtaskNode {
  id: string;
  type: TaskType;
  title: string;
  description: string;
  dependencies: string[];
  status: TaskStatus;
  outputPayload?: string;
  error?: string;
  executionDurationMs?: number;
}

export interface ExecutionGraph {
  goalId: string;
  prompt: string;
  nodes: Map<string, SubtaskNode>;
  executionOrder: string[];
  createdAt: number;
  completedAt?: number;
}

export interface SecurityReviewResult {
  approved: boolean;
  score: number; // 0 - 100
  interventionFlagged: boolean;
  violations: Array<{
    ruleId: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    remediation: string;
  }>;
}

export interface VerificationResult {
  passed: boolean;
  testsRun: number;
  testsPassed: number;
  invariantsChecked: number;
  invariantsPassed: number;
  diagnostics: string[];
}

export interface ForgeTelemetry {
  totalTokensUsed: number;
  preDebitBudgetCap: number;
  budgetBreached: boolean;
  circuitTripped: boolean;
  interventionsHandled: number;
  totalExecutionTimeMs: number;
  savingsVsCommercialFrontierPercent: number;
}
