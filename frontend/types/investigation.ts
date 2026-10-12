export interface EvidenceItem {
  id?: string;
  type: string;
  source: string;
  file?: string;
  line?: number;
  line_start?: number;
  line_end?: number;
  description: string;
  snippet?: string;
  verified?: boolean;
  unverified_reason?: string;
}

export interface Hypothesis {
  id: string;
  title: string;
  description: string;
  confidence: number;
  evidence: EvidenceItem[];
  evidence_ids?: string[];
  predictions: string[];
  validation_tests?: string[];
  tests: string[];
  contradictions?: string[];
  status: "supported" | "needs_validation" | "untested" | "rejected" | "unverified";
}

export interface CausalStep {
  step: number;
  component: string;
  action: string;
}

export interface RootCause {
  summary: string;
  description?: string;
  primary_hypothesis_id: string;
  supporting_evidence_ids?: string[];
  contradicting_evidence_ids?: string[];
  causal_chain: CausalStep[];
  status?: string;
}

export interface InvestigationResult {
  hypotheses: Hypothesis[];
  root_cause?: RootCause;
}

export interface ReproductionPlan {
  scenario: string;
  steps: string[];
  expected: string;
  actual: string;
  test_command: string;
  success_condition: string;
}

export interface ReproductionAttempt {
  attempt_number: number;
  exit_code: number;
  passed: boolean;
  duration_ms: number;
  stdout: string;
  stderr: string;
}

export interface ReproductionResult {
  status: "NOT_STARTED" | "PREPARING" | "DEPENDENCIES_FAILED" | "TEST_GENERATION_FAILED" | "RUNNING" | "REPRODUCED" | "NOT_REPRODUCED" | "INCONCLUSIVE" | "TIMEOUT" | "FAILED" | "UNSUPPORTED_PROJECT";
  attempts: number;
  failures: number;
  success_rate: number;
  expected?: string;
  actual?: string;
  exit_code?: number;
  duration_ms: number;
  stdout?: string;
  stderr?: string;
  evidence_ids?: string[];
  plan?: ReproductionPlan;
  environment_info?: Record<string, any>;
  detailed_attempts?: ReproductionAttempt[];
  unsupported_reason?: string;
}

export interface StageStatus {
  status: "running" | "completed" | "failed" | "pending";
  detail: string;
  duration?: number;
  timestamp?: number;
}

export interface ActivityEvent {
  timestamp: number;
  message: string;
  type: string;
  stage: string;
}

export interface InvestigationRecord {
  id: string;
  repository_url: string;
  bug_report: string;
  mode: string;
  state: "QUEUED" | "ANALYZING" | "COLLECTING_EVIDENCE" | "GENERATING_HYPOTHESES" | "TESTING_HYPOTHESES" | "ROOT_CAUSE_FOUND" | "REPRODUCING" | "GENERATING_FIX" | "VERIFYING" | "COMPLETED" | "FAILED";
  created_at: number;
  updated_at: number;
  error_message?: string;
  repository_info: {
    name?: string;
    language?: string;
    framework?: string;
    file_count?: number;
    directory_tree?: string[];
    relevant_files?: { path: string; reason: string }[];
    dependencies?: string[];
  };
  evidence_report: {
    total_items?: number;
    evidence_by_type?: Record<string, number>;
    items?: EvidenceItem[];
  };
  investigation_result?: InvestigationResult;
  reproduction_result?: ReproductionResult;
  stages_log: Record<string, StageStatus>;
  activity_events?: ActivityEvent[];
}
