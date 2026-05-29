import ActivityHeatmap from '@/components/shared/activity-heatmap';
import Link from 'next/link';

export interface GoalNeedingAttention {
  id: string;
  title: string;
  completed: number;
  total: number;
  percentage: number;
}

export interface ProgressOverviewWidgetViewProps {
  totalGoals: number;
  overallCompletionPercentage: number;
  totalTasks: number;
  completedTasks: number;
  totalActions: number;
  last7DaysActions: number;
  activeBlockerCount: number;
  heatmapData: Array<{ date: string; count: number }>;
  goalsNeedingAttention: GoalNeedingAttention[];
}

const percentageTextClass = (p: number) =>
  p < 30 ? 'text-destructive' : p < 60 ? 'text-warning' : 'text-success';

const percentageBarClass = (p: number) =>
  p < 30 ? 'bg-destructive' : p < 60 ? 'bg-warning' : 'bg-success';

export default function ProgressOverviewWidgetView({
  totalGoals,
  overallCompletionPercentage,
  totalTasks,
  completedTasks,
  totalActions,
  last7DaysActions,
  activeBlockerCount,
  heatmapData,
  goalsNeedingAttention,
}: ProgressOverviewWidgetViewProps) {
  return (
    <div className="space-y-6">
      {/* Overall Progress Stats */}
      <div className="card">
        <h2 className="mb-4 text-heading">Overall Progress</h2>

        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-primary/10 p-4 text-center">
            <div className="text-3xl font-bold text-primary">{totalGoals}</div>
            <div className="mt-1 text-label text-muted-foreground">Total Goals</div>
          </div>
          <div className="rounded-lg bg-success/10 p-4 text-center">
            <div className="text-3xl font-bold text-success">{overallCompletionPercentage}%</div>
            <div className="mt-1 text-label text-muted-foreground">Tasks Complete</div>
          </div>
          <div className="rounded-lg bg-muted p-4 text-center">
            <div className="text-3xl font-bold text-foreground">{last7DaysActions}</div>
            <div className="mt-1 text-label text-muted-foreground">Recent Actions</div>
            <div className="mt-0.5 text-caption">(Last 7 Days)</div>
          </div>
          <div className="rounded-lg bg-destructive/10 p-4 text-center">
            <div className="text-3xl font-bold text-destructive">{activeBlockerCount}</div>
            <div className="mt-1 text-label text-muted-foreground">Active Blockers</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="mb-2 flex justify-between text-label text-muted-foreground">
            <span>Overall Task Completion</span>
            <span>{completedTasks} / {totalTasks} tasks</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-primary to-success transition-all duration-300"
              style={{ width: `${overallCompletionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Activity Heatmap */}
      <div className="card">
        <h2 className="mb-4 text-heading">Activity Overview</h2>
        <p className="mb-4 text-label text-muted-foreground">
          {totalActions} total actions logged this year
        </p>
        <ActivityHeatmap data={heatmapData} />
      </div>

      {/* Goals Needing Attention */}
      {goalsNeedingAttention.length > 0 && (
        <div className="card">
          <h2 className="mb-4 text-heading">Goals Needing Attention</h2>
          <div className="space-y-3">
            {goalsNeedingAttention.map(goal => (
              <Link key={goal.id} href={`/dashboard/goals/${goal.id}`}>
                <div className="cursor-pointer rounded-lg bg-muted p-3 transition-colors hover:bg-muted/70">
                  <div className="mb-2 flex items-start justify-between">
                    <h3 className="text-label text-foreground">{goal.title}</h3>
                    <span className={`text-label font-semibold ${percentageTextClass(goal.percentage)}`}>
                      {goal.percentage}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-border">
                      <div
                        className={`h-2 rounded-full ${percentageBarClass(goal.percentage)}`}
                        style={{ width: `${goal.percentage}%` }}
                      />
                    </div>
                    <span className="text-caption">
                      {goal.completed}/{goal.total}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
