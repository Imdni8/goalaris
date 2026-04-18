'use client';

import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ConversationalGoalForm from '@/components/goals/conversational-goal-form';

export default function NewAiGoalPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Review Goal</h1>
          <p className="mt-2 text-gray-600">
            Review your AI-generated SMART goal, make any edits you'd like, then save it to your goals.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="flex-shrink-0"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      <div className="card">
        <ConversationalGoalForm />
      </div>
    </div>
  );
}
