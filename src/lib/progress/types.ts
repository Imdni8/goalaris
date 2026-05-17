export type VelocityState = 'ZERO' | 'AHEAD' | 'STEADY' | 'LAGGING';

export interface MonthWeight {
  month: string;
  weight: number;
}

export interface ProgressTask {
  status: string | null;
  task_value: number | null;
  month?: string | null;
  completed_at?: string | null;
}

export interface VelocityInput {
  tasks: ProgressTask[];
  currentMonth: string;
  monthWeight: number;
  today: Date;
}

export interface VelocityResult {
  state: VelocityState;
  paceRatio: number | null;
  expectedProgress: number;
  actualProgress: number;
  tasksCompletedThisMonth: number;
  tasksTotalThisMonth: number;
  daysElapsed: number;
  daysInMonth: number;
  daysRemaining: number;
}
