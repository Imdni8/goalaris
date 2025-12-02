/**
 * Context analyzer for AI coaching
 * Computes health metrics and insights from user data
 */

interface Goal {
  id: string;
  title: string;
  description?: string;
  status: string;
  time_bound?: string;
  tasks?: Task[];
}

interface Task {
  id: string;
  title: string;
  status: string;
  goal_id: string;
  blocker_description?: string;
}

interface ActionLog {
  id: string;
  title: string;
  description?: string;
  status?: string;
  blocker_description?: string;
  blocker_status?: string;
  created_at: string;
  task_id: string;
  tasks?: Array<{
    title: string;
    goal_id: string;
  }>;
}

export interface HealthMetrics {
  goalsNeedingAttention: Array<{
    goal: string;
    reason: string;
    urgency: 'high' | 'medium' | 'low';
  }>;
  chronicBlockers: Array<{
    task: string;
    blockedSince: string;
    duration: string;
    durationDays: number;
  }>;
  blockerPatterns: {
    recurringThemes: Array<{
      theme: string;
      count: number;
      examples: string[];
    }>;
    recentlyResolved: Array<{
      task: string;
      blockedDuration: number;
      resolvedAt: string;
    }>;
  };
  progressVelocity: 'increasing' | 'steady' | 'decreasing';
  recentActivity: {
    last7Days: number;
    previous7Days: number;
    trend: string;
  };
  upcomingDeadlines: Array<{
    goal: string;
    daysUntil: number;
    targetDate: string;
  }>;
}

/**
 * Compute health metrics from user data
 */
export function computeHealthMetrics(
  goals: Goal[],
  actionLogs: ActionLog[]
): HealthMetrics {
  const now = new Date();

  // 1. Goals needing attention (no progress in >14 days)
  const goalsNeedingAttention = goals
    .filter((goal) => goal.status === 'active')
    .map((goal) => {
      // Find most recent action log for this goal
      const goalLogs = actionLogs.filter(
        (log) => log.tasks && log.tasks.length > 0 && log.tasks[0]?.goal_id === goal.id
      );

      if (goalLogs.length === 0) {
        return {
          goal: goal.title,
          reason: 'No progress logged yet',
          urgency: 'medium' as const,
          daysSinceLastLog: 999,
        };
      }

      const lastLog = goalLogs.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];

      const daysSinceLastLog = Math.floor(
        (now.getTime() - new Date(lastLog.created_at).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      return {
        goal: goal.title,
        daysSinceLastLog,
        reason: `No progress in ${daysSinceLastLog} days`,
        urgency:
          daysSinceLastLog > 21
            ? ('high' as const)
            : daysSinceLastLog > 14
            ? ('medium' as const)
            : ('low' as const),
      };
    })
    .filter((g) => g.daysSinceLastLog > 14)
    .map(({ daysSinceLastLog, ...rest }) => rest);

  // 2. Chronic blockers (blocked for >7 days)
  const blockerLogs = actionLogs.filter(
    (log) =>
      log.blocker_description &&
      log.blocker_status === 'active' &&
      log.status === 'blocked'
  );

  const chronicBlockers = blockerLogs
    .map((log) => {
      const daysSince = Math.floor(
        (now.getTime() - new Date(log.created_at).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      return {
        task: (log.tasks && log.tasks.length > 0 ? log.tasks[0]?.title : undefined) || log.title,
        blockedSince: log.created_at,
        duration: `${daysSince} days`,
        durationDays: daysSince,
      };
    })
    .filter((b) => b.durationDays > 7)
    .sort((a, b) => b.durationDays - a.durationDays);

  // 2b. Blocker pattern analysis
  const allBlockers = actionLogs.filter((log) => log.blocker_description);

  // Find recurring themes in blocker descriptions
  const blockerThemes: { [key: string]: string[] } = {};
  const themeKeywords = [
    'waiting', 'feedback', 'review', 'approval', 'stakeholder',
    'dependency', 'resource', 'access', 'permission', 'technical',
    'design', 'requirement', 'clarification', 'meeting', 'decision'
  ];

  allBlockers.forEach((log) => {
    const description = (log.blocker_description || '').toLowerCase();
    themeKeywords.forEach((keyword) => {
      if (description.includes(keyword)) {
        if (!blockerThemes[keyword]) {
          blockerThemes[keyword] = [];
        }
        const taskName = (log.tasks && log.tasks.length > 0 ? log.tasks[0]?.title : undefined) || log.title;
        blockerThemes[keyword].push(taskName);
      }
    });
  });

  const recurringThemes = Object.entries(blockerThemes)
    .filter(([_, tasks]) => tasks.length >= 2) // Recurring if appears 2+ times
    .map(([theme, tasks]) => ({
      theme: theme.charAt(0).toUpperCase() + theme.slice(1),
      count: tasks.length,
      examples: [...new Set(tasks)].slice(0, 3), // Unique tasks, max 3 examples
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3); // Top 3 themes

  // Find recently resolved blockers (resolved in last 30 days)
  const resolvedBlockers = actionLogs.filter(
    (log) => log.blocker_description && log.blocker_status === 'resolved'
  );

  const recentlyResolved = resolvedBlockers
    .map((log) => {
      const taskName = (log.tasks && log.tasks.length > 0 ? log.tasks[0]?.title : undefined) || log.title;

      // Find when it was first blocked (look for earlier log with same task_id and active blocker)
      const firstBlockedLog = actionLogs
        .filter((l) =>
          l.task_id === log.task_id &&
          l.blocker_status === 'active' &&
          new Date(l.created_at) < new Date(log.created_at)
        )
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];

      let blockedDuration = 0;
      if (firstBlockedLog) {
        blockedDuration = Math.floor(
          (new Date(log.created_at).getTime() - new Date(firstBlockedLog.created_at).getTime()) /
            (1000 * 60 * 60 * 24)
        );
      }

      return {
        task: taskName,
        blockedDuration,
        resolvedAt: log.created_at,
      };
    })
    .filter((b) => b.blockedDuration > 0)
    .sort((a, b) => new Date(b.resolvedAt).getTime() - new Date(a.resolvedAt).getTime())
    .slice(0, 3); // Most recent 3

  const blockerPatterns = {
    recurringThemes,
    recentlyResolved,
  };

  // 3. Progress velocity (comparing last 7 days vs previous 7 days)
  const last7Days = actionLogs.filter((log) => {
    const daysDiff = Math.floor(
      (now.getTime() - new Date(log.created_at).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return daysDiff <= 7;
  }).length;

  const previous7Days = actionLogs.filter((log) => {
    const daysDiff = Math.floor(
      (now.getTime() - new Date(log.created_at).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return daysDiff > 7 && daysDiff <= 14;
  }).length;

  let progressVelocity: 'increasing' | 'steady' | 'decreasing';
  let trend: string;

  if (last7Days > previous7Days * 1.2) {
    progressVelocity = 'increasing';
    trend = 'up';
  } else if (last7Days < previous7Days * 0.8) {
    progressVelocity = 'decreasing';
    trend = 'down';
  } else {
    progressVelocity = 'steady';
    trend = 'steady';
  }

  // 4. Upcoming deadlines (goals due in <14 days)
  const upcomingDeadlines = goals
    .filter((goal) => goal.time_bound && goal.status === 'active')
    .map((goal) => {
      const targetDate = new Date(goal.time_bound!);
      const daysUntil = Math.floor(
        (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        goal: goal.title,
        daysUntil,
        targetDate: goal.time_bound!,
      };
    })
    .filter((d) => d.daysUntil > 0 && d.daysUntil <= 14)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  return {
    goalsNeedingAttention,
    chronicBlockers,
    blockerPatterns,
    progressVelocity,
    recentActivity: {
      last7Days,
      previous7Days,
      trend,
    },
    upcomingDeadlines,
  };
}
