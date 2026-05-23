import { createClient } from '@/lib/supabase/server';
import { ConversationList } from '@/components/coach/conversation-list';
import { ChatWindow } from '@/components/coach/chat-window';
import { redirect } from 'next/navigation';
import { MessageCircle } from 'lucide-react';

export default async function CoachPage({
  searchParams,
}: {
  searchParams: { conversation?: string };
}) {
  const supabase = await createClient();

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const conversationId = searchParams.conversation;

  // If no conversation selected, show empty state
  if (!conversationId) {
    return (
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <div className="w-80 flex-shrink-0">
          <ConversationList />
        </div>

        {/* Empty State */}
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md px-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-heading mb-2">
              Welcome to Your Career Coach
            </h2>
            <p className="text-gray-600 mb-6">
              Get personalized coaching on your goals, overcome blockers, and generate
              compelling self-assessments for your performance reviews.
            </p>
            <div className="text-left bg-white border border-gray-200 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-gray-900">You can ask me to:</p>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Review your progress and suggest next steps</li>
                <li>Help you overcome blockers on your tasks</li>
                <li>Generate a self-assessment for your review</li>
                <li>Provide coaching on goal prioritization</li>
              </ul>
            </div>
            <p className="text-sm text-gray-500 mt-6">
              Start a new conversation from the sidebar to get started.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Fetch conversation details and messages (reject in-goal threads here)
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .is('goal_id', null)
    .single();

  if (convError || !conversation) {
    redirect('/dashboard/coach');
  }

  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0">
        <ConversationList activeConversationId={conversationId} />
      </div>

      {/* Chat Window */}
      <div className="flex-1 bg-white">
        <ChatWindow
          conversationId={conversationId}
          initialMessages={messages || []}
        />
      </div>
    </div>
  );
}
