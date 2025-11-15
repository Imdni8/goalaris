import { Calendar } from 'lucide-react';

type TaskCardProps = {
  task: {
    id: string;
    title: string;
    description?: string | null;
    status: string;
    goal_id: string;
  };
  goalTitle: string;
  dueDate?: string | null;
  daysUntilDue?: number | null;
};

export default function TaskCard({ task, goalTitle, dueDate, daysUntilDue }: TaskCardProps) {
  // Truncate goal title to ~40 characters
  const truncatedGoalTitle = goalTitle.length > 40
    ? `${goalTitle.substring(0, 40)}...`
    : goalTitle;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md cursor-grab active:cursor-grabbing">
      <h3 className="mb-2 font-semibold text-gray-900">{task.title}</h3>

      <p className="mb-3 text-sm text-gray-600">
        Goal: {truncatedGoalTitle}
      </p>

      {dueDate && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{new Date(dueDate).toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}</span>
          </div>

          {daysUntilDue !== null && daysUntilDue !== undefined && (
            <span className={`text-xs ${
              daysUntilDue < 0
                ? 'text-red-600 font-medium'
                : daysUntilDue <= 7
                  ? 'text-orange-600'
                  : 'text-gray-500'
            }`}>
              {daysUntilDue < 0
                ? `Overdue by ${Math.abs(daysUntilDue)} days`
                : `Due in ${daysUntilDue} days`}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
