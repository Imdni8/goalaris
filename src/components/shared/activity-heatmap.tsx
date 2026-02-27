'use client';

/**
 * Activity Heatmap Component
 * Year-view contribution graph showing user activity over 12 months
 * Matches Figma design: clean, compact layout without day labels
 */

interface ActivityDay {
  date: string; // YYYY-MM-DD format
  count: number;
}

interface ActivityHeatmapProps {
  data: ActivityDay[];
}

export default function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  const today = new Date();
  const currentYear = today.getFullYear();

  // Generate date map from data
  const dateMap = new Map<string, number>();
  data.forEach(d => {
    dateMap.set(d.date, d.count);
  });

  // Build grid data by month (12 months × 7 days × ~4-5 weeks)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Create grid: each month contains weeks (columns) with days (rows)
  const monthlyGrids = months.map((monthName, monthIndex) => {
    const firstDay = new Date(currentYear, monthIndex, 1);
    const lastDay = new Date(currentYear, monthIndex + 1, 0);

    // Start from Monday of the week containing the 1st
    const startDate = new Date(firstDay);
    const dayOfWeek = startDate.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(startDate.getDate() - daysToMonday);

    // Build weeks for this month
    const weeks: { date: Date; count: number; inMonth: boolean }[][] = [];
    let currentWeek: { date: Date; count: number; inMonth: boolean }[] = [];
    const currentDate = new Date(startDate);

    // Continue until we've passed the last day of the month
    while (currentDate <= lastDay || currentWeek.length > 0) {
      if (currentWeek.length < 7) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const count = dateMap.get(dateStr) || 0;
        const inMonth = currentDate.getMonth() === monthIndex;

        currentWeek.push({
          date: new Date(currentDate),
          count,
          inMonth,
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];

        // Stop if we've passed the last day
        if (currentDate > lastDay) break;
      }
    }

    return { monthName, weeks };
  });

  // Get color based on activity count
  const getColor = (count: number, inMonth: boolean, isFuture: boolean): string => {
    if (isFuture || !inMonth) return 'bg-gray-50';
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

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex gap-2">
        {/* Month columns with headers */}
        {monthlyGrids.map((monthGrid, monthIdx) => (
          <div key={monthIdx} className="flex flex-1 min-w-0 flex-col gap-2">
            {/* Month header */}
            <div className="text-xs text-gray-600 font-medium h-5">
              {monthGrid.monthName}
            </div>

            {/* Week columns for this month */}
            <div className="flex justify-between">
              {monthGrid.weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-[3px]">
                  {week.map((day, dayIdx) => {
                    const isToday = day.date.toDateString() === today.toDateString();
                    const isFuture = day.date > today;

                    return (
                      <div
                        key={dayIdx}
                        className={`
                          size-[10px] rounded-sm
                          ${getColor(day.count, day.inMonth, isFuture)}
                          ${isToday ? 'ring-2 ring-blue-500' : ''}
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
        ))}
      </div>
    </div>
  );
}
