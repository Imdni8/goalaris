/**
 * Task Progress Chart Component
 * Displays visual progress bar and completion statistics for a goal's tasks
 */

interface TaskProgressChartProps {
  totalTasks: number;
  completedTasks: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function TaskProgressChart({
  totalTasks,
  completedTasks,
  size = 'md',
  showLabel = true,
}: TaskProgressChartProps) {
  // Calculate completion percentage
  const completionPercentage = totalTasks > 0
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

  // Determine color based on completion percentage
  const getProgressColor = (percentage: number) => {
    if (percentage >= 70) return 'bg-green-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Determine background color for the bar
  const getBackgroundColor = (percentage: number) => {
    if (percentage >= 70) return 'bg-green-100';
    if (percentage >= 40) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  // Size configurations
  const sizeConfig = {
    sm: {
      height: 'h-1.5',
      text: 'text-xs',
      gap: 'gap-1.5',
    },
    md: {
      height: 'h-2',
      text: 'text-sm',
      gap: 'gap-2',
    },
    lg: {
      height: 'h-3',
      text: 'text-base',
      gap: 'gap-3',
    },
  };

  const config = sizeConfig[size];
  const progressColor = getProgressColor(completionPercentage);
  const backgroundColor = getBackgroundColor(completionPercentage);

  return (
    <div className={`flex items-center ${config.gap} w-full`}>
      {/* Progress Bar */}
      <div className={`flex-1 ${backgroundColor} rounded-full overflow-hidden ${config.height}`}>
        <div
          className={`${progressColor} ${config.height} rounded-full transition-all duration-300`}
          style={{ width: `${completionPercentage}%` }}
        />
      </div>

      {/* Label */}
      {showLabel && (
        <div className={`flex items-center gap-2 ${config.text} font-medium text-gray-700`}>
          <span>{completionPercentage}%</span>
          <span className="text-gray-500">
            ({completedTasks}/{totalTasks})
          </span>
        </div>
      )}
    </div>
  );
}
