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

  const inputClass =
    'mt-1 w-full rounded-lg border border-input bg-surface px-4 py-2 text-foreground focus:border-ring focus:outline-none';
  const labelClass = 'block text-label text-foreground';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 text-destructive">{error}</div>
      )}

      {/* Goal Title */}
      <div>
        <label htmlFor="goal-title" className={labelClass}>
          Goal Title <span className="text-destructive">*</span>
        </label>
        <input
          id="goal-title"
          type="text"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          required
          className={inputClass}
          placeholder="e.g., Improve team collaboration and productivity"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="goal-description" className={labelClass}>Description</label>
        <textarea
          id="goal-description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={3}
          className={inputClass}
          placeholder="Brief overview of what you want to achieve"
        />
      </div>

      {/* SMART Criteria */}
      <div className="rounded-lg border border-border bg-muted p-4">
        <h3 className="mb-4 text-title">SMART Criteria</h3>
        <div className="space-y-4">
          {/* Specific */}
          <div>
            <label htmlFor="goal-specific" className={labelClass}>
              Specific - What exactly will you accomplish?
            </label>
            <textarea
              id="goal-specific"
              value={formData.specific}
              onChange={(e) => handleChange('specific', e.target.value)}
              rows={2}
              className={inputClass}
              placeholder="Be clear and precise about what you want to achieve"
            />
          </div>

          {/* Measurable */}
          <div>
            <label htmlFor="goal-measurable" className={labelClass}>
              Measurable - How will you measure success?
            </label>
            <textarea
              id="goal-measurable"
              value={formData.measurable}
              onChange={(e) => handleChange('measurable', e.target.value)}
              rows={2}
              className={inputClass}
              placeholder="Define metrics or indicators of success"
            />
          </div>

          {/* Achievable */}
          <div>
            <label htmlFor="goal-achievable" className={labelClass}>
              Achievable - Why is this goal realistic?
            </label>
            <textarea
              id="goal-achievable"
              value={formData.achievable}
              onChange={(e) => handleChange('achievable', e.target.value)}
              rows={2}
              className={inputClass}
              placeholder="Explain why this goal is attainable with available resources"
            />
          </div>

          {/* Relevant */}
          <div>
            <label htmlFor="goal-relevant" className={labelClass}>
              Relevant - How does this align with your role/career?
            </label>
            <textarea
              id="goal-relevant"
              value={formData.relevant}
              onChange={(e) => handleChange('relevant', e.target.value)}
              rows={2}
              className={inputClass}
              placeholder="Connect this goal to your career development"
            />
          </div>

          {/* Time-bound */}
          <div>
            <label htmlFor="goal-time-bound" className={labelClass}>
              Time-bound - Target completion date
            </label>
            <input
              id="goal-time-bound"
              type="date"
              value={formData.time_bound}
              onChange={(e) => handleChange('time_bound', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
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
          {loading ? 'Creating...' : 'Create Goal'}
        </Button>
      </div>
    </form>
  );
}
