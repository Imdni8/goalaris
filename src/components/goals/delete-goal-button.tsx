'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

export default function DeleteGoalButton({ goalId }: { goalId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleDelete() {
    setLoading(true);

    try {
      const { error } = await supabase.from('goals').delete().eq('id', goalId);

      if (error) {
        alert('Failed to delete goal: ' + error.message);
        return;
      }

      router.push('/dashboard/goals');
    } catch (err) {
      alert('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (showConfirm) {
    return (
      <div className="flex gap-2">
        <Button
          variant="tertiary"
          size="sm"
          onClick={() => setShowConfirm(false)}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={loading}
        >
          {loading ? 'Deleting...' : 'Confirm Delete'}
        </Button>
      </div>
    );
  }

  return (
    <Button variant="destructive" onClick={() => setShowConfirm(true)}>
      Delete
    </Button>
  );
}
