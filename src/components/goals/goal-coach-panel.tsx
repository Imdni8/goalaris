'use client';

import { X } from 'lucide-react';
import { MonthlyCheckinChat } from './monthly-checkin-chat';

interface GoalCoachPanelProps {
  open: boolean;
  onClose: () => void;
  goalId: string;
  goalTitle?: string;
  checkInMode?: {
    newMonth: string;
    previousMonth: string;
  } | null;
  onTasksGenerated: (tasks: any[]) => void;
}

export function GoalCoachPanel({
  open,
  onClose,
  goalId,
  goalTitle = 'Goal',
  checkInMode,
  onTasksGenerated,
}: GoalCoachPanelProps) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Slide-in panel */}
      <div
        className={`fixed inset-y-0 right-0 w-96 bg-white shadow-xl z-50 flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 truncate">
            {checkInMode ? 'Monthly Check-in' : 'Coach'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {checkInMode ? (
            <MonthlyCheckinChat
              goalId={goalId}
              newMonth={checkInMode.newMonth}
              previousMonth={checkInMode.previousMonth}
              onTasksGenerated={onTasksGenerated}
              onClose={onClose}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>Open a check-in to get started</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
