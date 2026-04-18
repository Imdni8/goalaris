'use client';

import { useState } from 'react';
import { Edit2, Paperclip } from 'lucide-react';
import { ensureGoalStatus } from '@/lib/utils/null-safe';
import SmartCriteriaModal from './smart-criteria-modal';
import GoalEditModal from './goal-edit-modal';

interface GoalSmartCardProps {
  goal: {
    id: string;
    title: string;
    status: string | null;
    goal_number: number | null;
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
  const goalNumber = goal.goal_number ? String(goal.goal_number).padStart(2, '0') : null;

  const handleCardClick = () => {
    setShowSmartModal(true);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowEditModal(true);
  };

  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSmartModal(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
  };

  // Status chip styling
  const chipStyles = {
    active: { bg: 'bg-[#d8ecdf]', text: 'text-[#2f7a54]', dot: 'bg-[#2f7a54]' },
    completed: { bg: 'bg-[#d8ecdf]', text: 'text-[#2f7a54]', dot: 'bg-[#2f7a54]' },
    archived: { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-500' },
  };

  const styles = chipStyles[goalStatus as keyof typeof chipStyles] || chipStyles.active;

  return (
    <>
      {/* Goal Card */}
      <div
        role="button"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onClick={handleCardClick}
        className="group rounded-lg border border-[#e4e6ea] bg-white p-[14px] cursor-pointer transition-all duration-[140ms] hover:border-[#cfd3d9] hover:shadow-[0_2px_0_rgba(10,10,10,0.02),0_8px_24px_-12px_rgba(10,10,10,0.15)]"
      >
        {/* Header row: Goal number + Edit button */}
        <div className="flex items-center justify-between mb-[12px]">
          <span className="text-[10.5px] font-semibold tracking-[0.1em] text-[#8a909a] uppercase">
            {goalNumber ? `Goal ${goalNumber}` : 'Goal'}
          </span>
          <button
            onClick={handleEditClick}
            aria-label="Edit goal"
            className="p-1 rounded-[6px] text-gray-600 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-opacity duration-[120ms] hover:bg-[#f2f3f5] active:bg-[#e8eaed] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          >
            <Edit2 size={14} strokeWidth={1.5} />
          </button>
        </div>

        {/* Title */}
        <h2 className="text-[15.5px] font-bold leading-[1.22] text-[#1a1d21] mb-[12px] line-clamp-none" style={{ textWrap: 'balance' }}>
          {goal.title}
        </h2>

        {/* Meta row: Status chip + Details link */}
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center gap-1 px-[10px] py-[6px] rounded-full text-[11.5px] font-medium ${styles.bg} ${styles.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
            <span className="capitalize">{goalStatus}</span>
          </span>
          <button
            onClick={handleDetailsClick}
            className="text-[13px] text-[#4a5058] hover:text-[#1a1d21] font-medium transition-colors"
          >
            Details ›
          </button>
        </div>
      </div>

      {/* Attachments Card */}
      <div className="rounded-lg border border-[#e4e6ea] bg-white px-[12px] py-[10px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Paperclip size={16} className="text-[#4a5058]" />
            <span className="text-[13px] font-medium text-[#1a1d21]">Attachments</span>
          </div>
          <span className="text-[10.5px] text-[#8a909a] bg-[#f3f4f6] px-2 py-1 rounded-full">
            Coming soon
          </span>
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
