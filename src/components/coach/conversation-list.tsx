import { createClient } from '@/lib/supabase/server';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NewConversationButton } from './new-conversation-button';
import { ConversationListItem } from './conversation-list-item';

export async function ConversationList({ activeConversationId }: { activeConversationId?: string }) {
  const supabase = await createClient();

  // Fetch all conversations for the user
  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, title, created_at, updated_at')
    .order('updated_at', { ascending: false });

  return (
    <div className="flex flex-col h-full border-r border-gray-200 bg-gray-50">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Coach</h2>
        <NewConversationButton />
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {conversations && conversations.length > 0 ? (
            conversations.map((conv) => (
              <ConversationListItem
                key={conv.id}
                conversation={conv}
                isActive={activeConversationId === conv.id}
              />
            ))
          ) : (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-500">No conversations yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Start a new conversation to get coaching
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
