export type TestStatus = 'pending' | 'running' | 'passed' | 'failed' | 'cancelled';
export type Environment = 'dev' | 'staging' | 'prod' | 'map';

export interface TestRun {
  id: string;
  tags: string[];
  environment: Environment;
  status: TestStatus;
  startedAt: string;
  completedAt?: string;
  results: TestScenarioResult[];
  logs: string[];
}

export interface TestScenarioResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration?: number;
  error?: string;
  screenshot?: string;
}

export interface ScheduledRun {
  id: string;
  name: string;
  tags: string[];
  environment: Environment;
  cronExpression: string;
  nextRun: string;
  enabled: boolean;
}

export interface AvailableFeature {
  name: string;
  tags: string[];
  path: string;
}
