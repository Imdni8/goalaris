import CreateGoalForm from '@/components/goals/create-goal-form';

export default function NewGoalPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-display">Create New Goal</h1>
        <p className="mt-2 text-gray-600">
          Define a SMART goal to track your annual progress and career development
        </p>
      </div>

      <div className="card">
        <CreateGoalForm />
      </div>
    </div>
  );
}
