'use client';

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { LEVEL_SCALE_MAX } from '@/lib/ai/agents/diagnosis/types';

export interface SpiderAxis {
  label: string;
  /** assessed current level, or null when evidence was insufficient */
  current: number | null;
  target: number;
  insufficient: boolean;
}

/**
 * Readiness radar: target vs current level per competency axis.
 *
 * Insufficient axes are NOT plotted as a fabricated number — `current` is null
 * there, leaving a deliberate gap (connectNulls is off), and they're called out
 * beneath the chart so the honesty of the diagnosis is visible.
 */
export function SpiderChart({ axes }: { axes: SpiderAxis[] }) {
  const data = axes.map((a) => ({
    label: a.label,
    current: a.current,
    target: a.target,
  }));

  const insufficient = axes.filter((a) => a.insufficient).map((a) => a.label);

  return (
    <div className="w-full">
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="72%">
            <PolarGrid stroke="rgb(var(--border))" />
            <PolarAngleAxis
              dataKey="label"
              tick={{ fill: 'rgb(var(--muted-foreground))', fontSize: 12 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, LEVEL_SCALE_MAX]}
              tick={{ fill: 'rgb(var(--muted-foreground))', fontSize: 10 }}
            />
            <Radar
              name="Target"
              dataKey="target"
              stroke="rgb(var(--muted-foreground))"
              fill="rgb(var(--muted-foreground))"
              fillOpacity={0.1}
            />
            <Radar
              name="Current"
              dataKey="current"
              stroke="rgb(var(--primary))"
              fill="rgb(var(--primary))"
              fillOpacity={0.3}
              connectNulls={false}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {insufficient.length > 0 && (
        <p className="mt-2 text-caption text-muted-foreground">
          Not enough evidence to place:{' '}
          <span className="text-foreground">{insufficient.join(', ')}</span>. The coach left
          these blank rather than guess.
        </p>
      )}
    </div>
  );
}
