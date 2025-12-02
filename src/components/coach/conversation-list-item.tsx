'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface ConversationListItemProps {
  conversation: {
    id: string;
    title: string | null;
    updated_at: string;
  };
  isActive: boolean;
}

export function ConversationListItem({ conversation, isActive }: ConversationListItemProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this conversation?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/coach/conversations/${conversation.id}/delete`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete conversation');
      }

      // Redirect to coach page without conversation
      router.push('/dashboard/coach');
      router.refresh();
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('Failed to delete conversation. Please try again.');
      setIsDeleting(false);
    }
  };

  return (
    <Link
      href={`/dashboard/coach?conversation=${conversation.id}`}
      className={`group block p-3 rounded-md transition-colors ${
        isActive
          ? 'bg-blue-50 border border-blue-200'
          : 'hover:bg-gray-100'
      }`}
    >
      <div className="flex items-start gap-2">
        <MessageCircle className="w-4 h-4 mt-0.5 text-gray-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {conversation.title || 'New Conversation'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {new Date(conversation.updated_at).toLocaleDateString()}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting}
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="w-3.5 h-3.5 text-red-500" />
        </Button>
      </div>
    </Link>
  );
}
