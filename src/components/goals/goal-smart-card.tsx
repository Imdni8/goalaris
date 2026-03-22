'use client';

import { useState } from 'react';
import { ChevronDown, Edit2 } from 'lucide-react';
import { ensureGoalStatus } from '@/lib/utils/null-safe';
import SmartCriteriaModal from './smart-criteria-modal';
import GoalEditModal from './goal-edit-modal';

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
  const [showSmartModal, setShowSmartModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const goalStatus = ensureGoalStatus(goal.status);

  const hasSmart = goal.specific || goal.measurable || goal.achievable || goal.relevant || goal.time_bound;

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Header with title and action buttons */}
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">{goal.title}</h2>

          {/* Action buttons - show on hover, tertiary style */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setShowEditModal(true)}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title="Edit goal"
            >
              <Edit2 size={18} />
            </button>
            <button
              onClick={() => setShowSmartModal(true)}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            >
              Details
            </button>
          </div>
        </div>

        {/* Status badge */}
        <div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800 capitalize">
            {goalStatus}
          </span>
        </div>
      </div>

      {/* Attachments section - separate box */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Attachments</span>
          <span className="text-xs text-gray-400">Coming soon</span>
        </div>
      </div>

      {/* Modals */}
      {showSmartModal && (
        <SmartCriteriaModal goal={goal} onClose={() => setShowSmartModal(false)} />
      )}
      {showEditModal && (
        <GoalEditModal goal={goal} onClose={() => setShowEditModal(false)} />
      )}
    </>
  );
}
