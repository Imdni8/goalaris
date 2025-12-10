'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

export default function CreateGoalForm() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    specific: '',
    measurable: '',
    achievable: '',
    relevant: '',
    time_bound: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('You must be logged in to create a goal');
        return;
      }

      const { data, error: insertError } = await supabase
        .from('goals')
        .insert([
          {
            user_id: user.id,
            title: formData.title,
            description: formData.description || null,
            specific: formData.specific || null,
            measurable: formData.measurable || null,
            achievable: formData.achievable || null,
            relevant: formData.relevant || null,
            time_bound: formData.time_bound || null,
            status: 'active',
            ai_suggested: false,
          },
        ])
        .select()
        .single();

      if (insertError) {
        setError(insertError.message);
        return;
      }

      // Track goal creation
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName: 'goal_created',
          properties: { type: 'manual' },
        }),
      });

      // Redirect to the new goal's detail page
      router.push(`/dashboard/goals/${data.id}`);
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>}

      {/* Goal Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Goal Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          required
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
          placeholder="e.g., Improve team collaboration and productivity"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
          placeholder="Brief overview of what you want to achieve"
        />
      </div>

      {/* SMART Criteria */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h3 className="mb-4 font-semibold text-gray-900">SMART Criteria</h3>
        <div className="space-y-4">
          {/* Specific */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Specific - What exactly will you accomplish?
            </label>
            <textarea
              value={formData.specific}
              onChange={(e) => handleChange('specific', e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="Be clear and precise about what you want to achieve"
            />
          </div>

          {/* Measurable */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Measurable - How will you measure success?
            </label>
            <textarea
              value={formData.measurable}
              onChange={(e) => handleChange('measurable', e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="Define metrics or indicators of success"
            />
          </div>

          {/* Achievable */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Achievable - Why is this goal realistic?
            </label>
            <textarea
              value={formData.achievable}
              onChange={(e) => handleChange('achievable', e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="Explain why this goal is attainable with available resources"
            />
          </div>

          {/* Relevant */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Relevant - How does this align with your role/career?
            </label>
            <textarea
              value={formData.relevant}
              onChange={(e) => handleChange('relevant', e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="Connect this goal to your career development"
            />
          </div>

          {/* Time-bound */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Time-bound - Target completion date
            </label>
            <input
              type="date"
              value={formData.time_bound}
              onChange={(e) => handleChange('time_bound', e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
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
          {loading ? 'Creating...' : 'Create Goal'}
        </Button>
      </div>
    </form>
  );
}
