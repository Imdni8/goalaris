'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

export default function AiGoalForm() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'input' | 'review'>('input');

  const [rawGoalText, setRawGoalText] = useState('');
  const [generatedGoal, setGeneratedGoal] = useState<any>(null);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/ai/generate-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawGoalText }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to generate goal');
        return;
      }

      setGeneratedGoal(data.smartGoal);
      setStep('review');
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!generatedGoal) return;

    setError(null);
    setLoading(true);

    try {
      // Get authenticated user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('You must be logged in to save goals');
        return;
      }

      const { error: insertError } = await supabase.from('goals').insert([
        {
          user_id: user.id,
          title: generatedGoal.title,
          description: generatedGoal.description || null,
          specific: generatedGoal.specific || null,
          measurable: generatedGoal.measurable || null,
          achievable: generatedGoal.achievable || null,
          relevant: generatedGoal.relevant || null,
          time_bound: generatedGoal.time_bound || null,
          status: 'active',
          ai_suggested: true,
        },
      ]);

      if (insertError) {
        setError(insertError.message);
        return;
      }

      router.push('/dashboard/goals');
      router.refresh();
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (step === 'input') {
    return (
      <form onSubmit={handleGenerate} className="space-y-6">
        {error && <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Describe your goal <span className="text-red-500">*</span>
          </label>
          <p className="mt-1 text-sm text-gray-500">
            Tell us what you want to achieve. Be as specific or general as you like - AI will help
            structure it into a SMART goal.
          </p>
          <textarea
            value={rawGoalText}
            onChange={(e) => setRawGoalText(e.target.value)}
            required
            rows={6}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
            placeholder="Example: I want to improve my leadership skills and become a better manager for my team"
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Generating...' : 'Generate SMART Goal with AI'}
          </Button>
        </div>
      </form>
    );
  }

  // Review step
  return (
    <div className="space-y-6">
      {error && <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>}

      <div className="rounded-lg bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">✨</div>
          <div>
            <h3 className="font-semibold text-blue-900">AI-Generated SMART Goal</h3>
            <p className="text-sm text-blue-700">
              Review and edit as needed, then save to your goals.
            </p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Goal Title</label>
        <input
          type="text"
          value={generatedGoal?.title || ''}
          onChange={(e) => setGeneratedGoal({ ...generatedGoal, title: e.target.value })}
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={generatedGoal?.description || ''}
          onChange={(e) => setGeneratedGoal({ ...generatedGoal, description: e.target.value })}
          rows={3}
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h3 className="mb-4 font-semibold text-gray-900">SMART Criteria</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Specific - What exactly will you accomplish?
            </label>
            <textarea
              value={generatedGoal?.specific || ''}
              onChange={(e) => setGeneratedGoal({ ...generatedGoal, specific: e.target.value })}
              rows={2}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Measurable - How will you measure success?
            </label>
            <textarea
              value={generatedGoal?.measurable || ''}
              onChange={(e) => setGeneratedGoal({ ...generatedGoal, measurable: e.target.value })}
              rows={2}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Achievable - Why is this goal realistic?
            </label>
            <textarea
              value={generatedGoal?.achievable || ''}
              onChange={(e) => setGeneratedGoal({ ...generatedGoal, achievable: e.target.value })}
              rows={2}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Relevant - How does this align with your role/career?
            </label>
            <textarea
              value={generatedGoal?.relevant || ''}
              onChange={(e) => setGeneratedGoal({ ...generatedGoal, relevant: e.target.value })}
              rows={2}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Time-bound - Target completion date
            </label>
            <input
              type="text"
              value={generatedGoal?.time_bound || ''}
              onChange={(e) => setGeneratedGoal({ ...generatedGoal, time_bound: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="e.g., Q4 2024, December 31, 2024"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep('input')}
          disabled={loading}
        >
          Back
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save Goal'}
        </Button>
      </div>
    </div>
  );
}
