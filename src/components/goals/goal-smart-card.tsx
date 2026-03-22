'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { ensureGoalStatus } from '@/lib/utils/null-safe';

interface GoalSmartCardProps {
  goal: {
    id: string;
    title: string;
    status: string | null;
    description: string | null;
    specific: string | null;
    measurable: string | null;
    achievable: string | null;
    relevant: string | null;
    time_bound: string | null;
  };
}

export default function GoalSmartCard({ goal }: GoalSmartCardProps) {
  const [isSmartExpanded, setIsSmartExpanded] = useState(false);
  const goalStatus = ensureGoalStatus(goal.status);

  const hasSmart = goal.specific || goal.measurable || goal.achievable || goal.relevant || goal.time_bound;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">{goal.title}</h2>
          </div>
        </div>

        {/* Status badge */}
        <div className="flex gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800 capitalize">
            {goalStatus}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Link
            href={`/dashboard/goals/${goal.id}/edit`}
            className="flex-1 rounded border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Edit
          </Link>
          <button className="flex-1 rounded border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50">
            Details
          </button>
        </div>
      </div>

      {/* SMART criteria (collapsible) */}
      {hasSmart && (
        <div className="border-t border-gray-200 pt-4">
          <button
            onClick={() => setIsSmartExpanded(!isSmartExpanded)}
            className="flex w-full items-center gap-2 rounded p-2 hover:bg-gray-50"
          >
            <ChevronDown
              size={16}
              className={`text-gray-600 transition-transform ${isSmartExpanded ? 'rotate-180' : ''}`}
            />
            <span className="text-sm font-medium text-gray-900">SMART Criteria</span>
          </button>

          {isSmartExpanded && (
            <div className="mt-3 space-y-3 px-4">
              {goal.specific && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase">Specific</div>
                  <p className="mt-1 text-sm text-gray-700">{goal.specific}</p>
                </div>
              )}
              {goal.measurable && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase">Measurable</div>
                  <p className="mt-1 text-sm text-gray-700 whitespace-pre-line">{goal.measurable}</p>
                </div>
              )}
              {goal.achievable && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase">Achievable</div>
                  <p className="mt-1 text-sm text-gray-700">{goal.achievable}</p>
                </div>
              )}
              {goal.relevant && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase">Relevant</div>
                  <p className="mt-1 text-sm text-gray-700">{goal.relevant}</p>
                </div>
              )}
              {goal.time_bound && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase">Time Bound</div>
                  <p className="mt-1 text-sm text-gray-700">{goal.time_bound}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Attachments placeholder */}
      <div className="border-t border-gray-200 pt-4">
        <button className="flex w-full items-center justify-between gap-2 rounded p-2 text-gray-400 hover:text-gray-500">
          <span className="text-sm font-medium">Attachments</span>
          <span className="text-xs">Coming soon</span>
        </button>
      </div>
    </div>
  );
}
