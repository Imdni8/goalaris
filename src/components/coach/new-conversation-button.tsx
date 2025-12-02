'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function NewConversationButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleNewConversation = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/coach/conversations', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }

      const { conversation } = await response.json();

      // Navigate to the new conversation
      router.push(`/dashboard/coach?conversation=${conversation.id}`);
      router.refresh();
    } catch (error) {
      console.error('Error creating conversation:', error);
      alert('Failed to create conversation');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleNewConversation}
      disabled={isLoading}
      className="w-full"
      size="sm"
    >
      <Plus className="w-4 h-4 mr-2" />
      {isLoading ? 'Creating...' : 'New Conversation'}
    </Button>
  );
}
