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
