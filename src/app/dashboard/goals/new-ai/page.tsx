import AiGoalForm from '@/components/goals/ai-goal-form';

export default function NewAiGoalPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create Goal with AI</h1>
        <p className="mt-2 text-gray-600">
          Describe your goal in your own words, and AI will help structure it into a complete SMART
          goal
        </p>
      </div>

      <div className="card">
        <AiGoalForm />
      </div>
    </div>
  );
}
