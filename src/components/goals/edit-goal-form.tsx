'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Database } from '@/lib/db/types';
import RefinableSmartField from './refinable-smart-field';

type Goal = Database['public']['Tables']['goals']['Row'];

export default function EditGoalForm({ goal }: { goal: Goal }) {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: goal.title,
    description: goal.description || '',
    specific: goal.specific || '',
    measurable: goal.measurable || '',
    achievable: goal.achievable || '',
    relevant: goal.relevant || '',
    time_bound: goal.time_bound || '',
    status: goal.status || 'active',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: updateError } = await supabase
        .from('goals')
        .update({
          title: formData.title,
          description: formData.description || null,
          specific: formData.specific || null,
          measurable: formData.measurable || null,
          achievable: formData.achievable || null,
          relevant: formData.relevant || null,
          time_bound: formData.time_bound || null,
          status: formData.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', goal.id);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      router.push(`/dashboard/goals/${goal.id}`);
      router.refresh();
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
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Status</label>
        <select
          value={formData.status}
          onChange={(e) => handleChange('status', e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
        >
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h3 className="mb-4 font-semibold text-gray-900">SMART Criteria</h3>
        <div className="space-y-4">
          <RefinableSmartField
            label="Specific - What exactly will you accomplish?"
            value={formData.specific}
            onChange={(value) => handleChange('specific', value)}
            elementName="specific"
            goalTitle={formData.title}
            goalDescription={formData.description}
            rows={2}
          />

          <RefinableSmartField
            label="Measurable - How will you measure success?"
            value={formData.measurable}
            onChange={(value) => handleChange('measurable', value)}
            elementName="measurable"
            goalTitle={formData.title}
            goalDescription={formData.description}
            rows={2}
          />

          <RefinableSmartField
            label="Achievable - Why is this goal realistic?"
            value={formData.achievable}
            onChange={(value) => handleChange('achievable', value)}
            elementName="achievable"
            goalTitle={formData.title}
            goalDescription={formData.description}
            rows={2}
          />

          <RefinableSmartField
            label="Relevant - How does this align with your role/career?"
            value={formData.relevant}
            onChange={(value) => handleChange('relevant', value)}
            elementName="relevant"
            goalTitle={formData.title}
            goalDescription={formData.description}
            rows={2}
          />

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

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="tertiary"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
