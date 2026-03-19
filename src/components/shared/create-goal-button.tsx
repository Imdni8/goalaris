'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function CreateGoalButton() {
  const router = useRouter();

  return (
    <Button
      className="bg-blue-600 hover:bg-blue-700 text-white"
      onClick={() => router.push('/dashboard/goals/new-ai')}
    >
      + Create new goal
    </Button>
  );
}
