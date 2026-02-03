'use client';

import { useMemo } from 'react';

interface DailyActivity {
  date: string; // YYYY-MM-DD
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

interface ActivityHeatmapData {
  days: DailyActivity[];
  totalDays: number;
  activeDays: number;
  maxDailyCount: number;
  streakCurrent: number;
  streakLongest: number;
}

interface Props {
  heatmap: ActivityHeatmapData;
  className?: string;
}

// Heatmap colors (Base blue theme)
const LEVEL_COLORS = [
  'bg-slate-800/50',      // 0 - no activity
  'bg-blue-500/30',       // 1 - low
  'bg-blue-500/50',       // 2 - medium-low
  'bg-blue-500/70',       // 3 - medium-high
  'bg-blue-500',          // 4 - high
];

export default function ActivityHeatmap({ heatmap, className = '' }: Props) {
  // Get last 84 days (12 weeks) for display
  const displayDays = useMemo(() => {
    const today = new Date();
    const days: DailyActivity[] = [];

    // Create a map for quick lookup
    const dayMap = new Map<string, DailyActivity>();
    heatmap.days.forEach(d => dayMap.set(d.date, d));

    // Generate last 84 days
    for (let i = 83; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const existing = dayMap.get(dateStr);
      days.push(existing || { date: dateStr, count: 0, level: 0 });
    }

    return days;
  }, [heatmap.days]);

  // Organize into weeks (columns) and days (rows)
  const weeks = useMemo(() => {
    const result: DailyActivity[][] = [];
    for (let week = 0; week < 12; week++) {
      result.push(displayDays.slice(week * 7, (week + 1) * 7));
    }
    return result;
  }, [displayDays]);

  // Day labels
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={`bg-white/5 rounded-xl p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-500" />
          <span className="text-xs text-gray-400 uppercase tracking-wide">Base Activity (12 weeks)</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          {heatmap.streakCurrent > 0 && (
            <span className="flex items-center gap-1">
              <span className="text-orange-400">🔥</span>
              {heatmap.streakCurrent} day streak
            </span>
          )}
          <span>{heatmap.activeDays} active days</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="flex justify-center gap-1">
        {/* Day labels (hidden on mobile) */}
        <div className="hidden sm:flex flex-col gap-[3px] pr-2 pt-0">
          {dayLabels.map((label, idx) => (
            <div
              key={label}
              className="h-[18px] text-[9px] text-gray-500 leading-[18px]"
              style={{ visibility: idx % 2 === 1 ? 'visible' : 'hidden' }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Grid - larger cells that span more width */}
        <div className="flex gap-1 flex-1 justify-center">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="flex flex-col gap-[3px]">
              {week.map((day) => (
                <div
                  key={day.date}
                  className={`w-[18px] h-[18px] rounded-sm ${LEVEL_COLORS[day.level]} transition-colors hover:ring-1 hover:ring-white/30`}
                  title={`${day.date}: ${day.count} transaction${day.count !== 1 ? 's' : ''}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 mt-3 text-[10px] text-gray-500">
        <span>Less</span>
        {LEVEL_COLORS.map((color, idx) => (
          <div key={idx} className={`w-[14px] h-[14px] rounded-sm ${color}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
