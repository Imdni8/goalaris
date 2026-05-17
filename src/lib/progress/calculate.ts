import type {
  MonthWeight,
  ProgressTask,
  VelocityInput,
  VelocityResult,
  VelocityState,
} from './types';

export const AHEAD_THRESHOLD = 1.15;
export const STEADY_THRESHOLD = 0.85;

export const DONE_STATUSES = new Set(['done', 'completed']);
export const DROPPED_STATUSES = new Set(['dropped']);

export function isDone(status: string | null | undefined): boolean {
  return DONE_STATUSES.has((status ?? '').toLowerCase());
}

export function isDropped(status: string | null | undefined): boolean {
  return DROPPED_STATUSES.has((status ?? '').toLowerCase());
}

export function calculateProgressPct(tasks: ProgressTask[]): number {
  let sum = 0;
  for (const t of tasks) {
    if (isDone(t.status)) sum += Number(t.task_value ?? 0);
  }
  if (sum < 0) sum = 0;
  if (sum > 100) sum = 100;
  return Math.round(sum);
}

export function getMonthWeight(
  monthWeights: MonthWeight[] | null | undefined,
  month: string
): number {
  if (!monthWeights) return 0;
  const entry = monthWeights.find((w) => w.month === month);
  return entry ? Number(entry.weight) : 0;
}

export function getDaysInMonth(month: string): number {
  const [y, m] = month.split('-').map(Number);
  if (!y || !m) return 30;
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function getDaysElapsed(month: string, today: Date): number {
  const [y, m] = month.split('-').map(Number);
  if (!y || !m) return 0;
  const todayY = today.getUTCFullYear();
  const todayM = today.getUTCMonth() + 1;
  if (todayY < y || (todayY === y && todayM < m)) return 0;
  if (todayY > y || (todayY === y && todayM > m)) return getDaysInMonth(month);
  return today.getUTCDate();
}

export function calculateVelocity(input: VelocityInput): VelocityResult {
  const { tasks, currentMonth, monthWeight, today } = input;

  const daysInMonth = getDaysInMonth(currentMonth);
  const daysElapsed = getDaysElapsed(currentMonth, today);
  const daysRemaining = Math.max(0, daysInMonth - daysElapsed);

  const monthTasks = tasks.filter(
    (t) => t.month === currentMonth && !isDropped(t.status)
  );
  const completedTasks = monthTasks.filter((t) => isDone(t.status));

  const actualProgress = completedTasks.reduce(
    (sum, t) => sum + Number(t.task_value ?? 0),
    0
  );
  const expectedProgress = (daysElapsed / Math.max(1, daysInMonth)) * monthWeight;

  if (completedTasks.length === 0 || expectedProgress <= 0) {
    return {
      state: 'ZERO',
      paceRatio: null,
      expectedProgress,
      actualProgress,
      tasksCompletedThisMonth: completedTasks.length,
      tasksTotalThisMonth: monthTasks.length,
      daysElapsed,
      daysInMonth,
      daysRemaining,
    };
  }

  const paceRatio = actualProgress / expectedProgress;
  let state: VelocityState;
  if (paceRatio >= AHEAD_THRESHOLD) state = 'AHEAD';
  else if (paceRatio >= STEADY_THRESHOLD) state = 'STEADY';
  else state = 'LAGGING';

  return {
    state,
    paceRatio,
    expectedProgress,
    actualProgress,
    tasksCompletedThisMonth: completedTasks.length,
    tasksTotalThisMonth: monthTasks.length,
    daysElapsed,
    daysInMonth,
    daysRemaining,
  };
}

export function buildInitialMonthWeights(
  startDate: Date,
  endDate: Date
): MonthWeight[] {
  let startY = startDate.getUTCFullYear();
  let startM = startDate.getUTCMonth() + 1;
  const endY = endDate.getUTCFullYear();
  const endM = endDate.getUTCMonth() + 1;

  let totalMonths = (endY - startY) * 12 + (endM - startM) + 1;
  if (totalMonths < 1) totalMonths = 1;

  const weight = Number((100 / totalMonths).toFixed(4));
  const result: MonthWeight[] = [];
  for (let i = 0; i < totalMonths; i++) {
    const month = `${String(startY).padStart(4, '0')}-${String(startM).padStart(2, '0')}`;
    result.push({ month, weight });
    startM++;
    if (startM > 12) {
      startM = 1;
      startY++;
    }
  }
  return result;
}

export function redistributeMonthWeights(args: {
  monthWeights: MonthWeight[];
  progressSoFar: number;
  completedMonths: string[];
  newMonth: string;
}): { monthWeights: MonthWeight[]; newMonthWeight: number } {
  const { monthWeights, progressSoFar, completedMonths, newMonth } = args;

  const completedSet = new Set(completedMonths);
  const hasNewMonth = monthWeights.some((w) => w.month === newMonth);
  const next: MonthWeight[] = hasNewMonth
    ? monthWeights.map((w) => ({ ...w }))
    : [...monthWeights.map((w) => ({ ...w })), { month: newMonth, weight: 0 }];

  const remainingWeight = Math.max(0, 100 - progressSoFar);
  const remainingMonths = next.filter((w) => !completedSet.has(w.month));
  const denom = Math.max(1, remainingMonths.length);
  const newMonthWeight = Number((remainingWeight / denom).toFixed(4));

  for (const entry of next) {
    if (!completedSet.has(entry.month)) {
      entry.weight = newMonthWeight;
    }
  }

  return { monthWeights: next, newMonthWeight };
}
