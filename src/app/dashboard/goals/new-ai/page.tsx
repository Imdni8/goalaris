import ConversationalGoalForm from '@/components/goals/conversational-goal-form';

export default function NewAiGoalPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create Goal with AI</h1>
        <p className="mt-2 text-gray-600">
          Let&apos;s co-create a SMART goal together. I&apos;ll ask you some clarifying questions to help
          structure the perfect goal for you.
        </p>
      </div>

      <div className="card">
        <ConversationalGoalForm />
      </div>
    </div>
  );
}
