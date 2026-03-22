'use client';

import { X } from 'lucide-react';

interface SmartCriteriaModalProps {
  goal: {
    id: string;
    title: string;
    specific: string | null;
    measurable: string | null;
    achievable: string | null;
    relevant: string | null;
    time_bound: string | null;
  };
  onClose: () => void;
}

export default function SmartCriteriaModal({ goal, onClose }: SmartCriteriaModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">SMART Criteria</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 px-6 py-6">
          {goal.specific && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Specific</h3>
              <p className="mt-2 text-gray-900">{goal.specific}</p>
            </div>
          )}

          {goal.measurable && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Measurable</h3>
              <p className="mt-2 whitespace-pre-line text-gray-900">{goal.measurable}</p>
            </div>
          )}

          {goal.achievable && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Achievable</h3>
              <p className="mt-2 text-gray-900">{goal.achievable}</p>
            </div>
          )}

          {goal.relevant && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Relevant</h3>
              <p className="mt-2 text-gray-900">{goal.relevant}</p>
            </div>
          )}

          {goal.time_bound && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Time Bound</h3>
              <p className="mt-2 text-gray-900">
                Target Date:{' '}
                {new Date(goal.time_bound).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
