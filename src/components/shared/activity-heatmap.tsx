'use client';

/**
 * Activity Heatmap Component
 * GitHub-style contribution graph showing user activity over time
 */

interface ActivityDay {
  date: string; // YYYY-MM-DD format
  count: number;
}

interface ActivityHeatmapProps {
  data: ActivityDay[];
  weeks?: number; // Number of weeks to show (default: 12)
}

export default function ActivityHeatmap({ data, weeks = 12 }: ActivityHeatmapProps) {
  // Calculate the date range
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - (weeks * 7));

  // Generate all dates in the range
  const dateMap = new Map<string, number>();
  data.forEach(d => {
    dateMap.set(d.date, d.count);
  });

  // Build grid data (grouped by weeks)
  const grid: { date: Date; count: number }[][] = [];
  let currentWeek: { date: Date; count: number }[] = [];

  const currentDate = new Date(startDate);

  // Start from the first Sunday before or on startDate
  const dayOfWeek = currentDate.getDay();
  currentDate.setDate(currentDate.getDate() - dayOfWeek);

  while (currentDate <= today) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const count = dateMap.get(dateStr) || 0;

    currentWeek.push({
      date: new Date(currentDate),
      count,
    });

    // If we've completed a week (Sunday to Saturday)
    if (currentWeek.length === 7) {
      grid.push(currentWeek);
      currentWeek = [];
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Push remaining days if any
  if (currentWeek.length > 0) {
    grid.push(currentWeek);
  }

  // Get color based on activity count
  const getColor = (count: number): string => {
    if (count === 0) return 'bg-gray-100';
    if (count <= 2) return 'bg-green-200';
    if (count <= 5) return 'bg-green-400';
    return 'bg-green-600';
  };

  // Format date for tooltip
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get month labels for header
  const getMonthLabels = (): { month: string; weekIndex: number }[] => {
    const labels: { month: string; weekIndex: number }[] = [];
    let lastMonth = -1;

    grid.forEach((week, weekIndex) => {
      const firstDay = week[0];
      if (firstDay) {
        const month = firstDay.date.getMonth();
        if (month !== lastMonth) {
          labels.push({
            month: firstDay.date.toLocaleDateString('en-US', { month: 'short' }),
            weekIndex,
          });
          lastMonth = month;
        }
      }
    });

    return labels;
  };

  const monthLabels = getMonthLabels();
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="w-full overflow-x-auto">
      <div className="inline-block min-w-full">
        {/* Month labels */}
        <div className="flex mb-2">
          <div className="w-10" /> {/* Spacer for day labels */}
          <div className="flex-1 flex gap-[3px] relative" style={{ minWidth: `${grid.length * 15}px` }}>
            {monthLabels.map((label, idx) => (
              <div
                key={idx}
                className="absolute text-xs text-gray-600 font-medium"
                style={{ left: `${label.weekIndex * 15}px` }}
              >
                {label.month}
              </div>
            ))}
          </div>
        </div>

        {/* Heatmap grid */}
        <div className="flex gap-[3px] mt-6">
          {/* Day labels */}
          <div className="flex flex-col gap-[3px]">
            {dayLabels.map((day, idx) => (
              <div key={day} className="w-10 h-[11px] flex items-center">
                {idx % 2 === 1 && (
                  <span className="text-xs text-gray-500">{day.slice(0, 1)}</span>
                )}
              </div>
            ))}
          </div>

          {/* Grid cells */}
          <div className="flex gap-[3px]">
            {grid.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-[3px]">
                {week.map((day, dayIdx) => {
                  const isToday = day.date.toDateString() === today.toDateString();
                  const isFuture = day.date > today;

                  return (
                    <div
                      key={dayIdx}
                      className={`
                        w-[11px] h-[11px] rounded-sm
                        ${isFuture ? 'bg-transparent' : getColor(day.count)}
                        ${isToday ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
                        hover:ring-2 hover:ring-gray-400 cursor-pointer
                        transition-all duration-150
                      `}
                      title={`${formatDate(day.date)}: ${day.count} ${day.count === 1 ? 'action' : 'actions'}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-4 text-xs text-gray-600">
          <span>Less</span>
          <div className="flex gap-[3px]">
            <div className="w-[11px] h-[11px] bg-gray-100 rounded-sm" />
            <div className="w-[11px] h-[11px] bg-green-200 rounded-sm" />
            <div className="w-[11px] h-[11px] bg-green-400 rounded-sm" />
            <div className="w-[11px] h-[11px] bg-green-600 rounded-sm" />
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
