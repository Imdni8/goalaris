/**
 * Utility functions for handling nullable database fields safely in React components
 */

/** Convert nullable string to empty string for inputs */
export const safeString = (value: string | null | undefined): string => {
  return value ?? '';
};

/** Convert nullable string to default value for selects */
export const safeSelect = <T extends string>(
  value: string | null | undefined,
  defaultValue: T
): T | string => {
  return value ?? defaultValue;
};

/** Type guard to ensure non-null task status */
export const ensureTaskStatus = (
  status: string | null | undefined
): 'todo' | 'in_progress' | 'blocked' | 'completed' => {
  if (!status || !['todo', 'in_progress', 'blocked', 'completed'].includes(status)) {
    return 'todo';
  }
  return status as 'todo' | 'in_progress' | 'blocked' | 'completed';
};

/** Type guard to ensure non-null goal status */
export const ensureGoalStatus = (
  status: string | null | undefined
): 'active' | 'completed' | 'archived' => {
  if (!status || !['active', 'completed', 'archived'].includes(status)) {
    return 'active';
  }
  return status as 'active' | 'completed' | 'archived';
};

/** Type for new monthly task statuses (Phase 3) */
export type NewTaskStatus = 'pending' | 'done' | 'dropped';

/** Type for any task status (legacy + new) */
export type AnyTaskStatus = 'todo' | 'in_progress' | 'blocked' | 'completed' | NewTaskStatus;

/** Convert nullable task status to a valid status (supports both legacy and new statuses) */
export const ensureAnyTaskStatus = (
  status: string | null | undefined
): AnyTaskStatus => {
  const validStatuses: AnyTaskStatus[] = ['todo', 'in_progress', 'blocked', 'completed', 'pending', 'done', 'dropped'];
  if (status && validStatuses.includes(status as AnyTaskStatus)) {
    return status as AnyTaskStatus;
  }
  return 'pending';
};
