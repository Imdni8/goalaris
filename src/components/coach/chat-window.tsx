'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import { Send, Copy, Check, Target, X } from 'lucide-react';
import { Tables } from '@/lib/db/types';
import { createClient } from '@/lib/supabase/client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Message = Tables<'messages'>;

interface Goal {
  id: string;
  title: string;
}

interface ChatWindowProps {
  conversationId: string;
  initialMessages: Message[];
}

export function ChatWindow({ conversationId, initialMessages }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showGoalSelector, setShowGoalSelector] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync messages when conversation changes
  useEffect(() => {
    setMessages(initialMessages);
    setInput('');
    setSelectedGoalId(null);
    setShowGoalSelector(false);
  }, [conversationId, initialMessages]);

  // Fetch user's goals
  useEffect(() => {
    const fetchGoals = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('goals')
        .select('id, title')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (data) {
        setGoals(data);
      }
    };
    fetchGoals();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    console.log('[ChatWindow] Sending message:', userMessage);
    console.log('[ChatWindow] Selected goal ID:', selectedGoalId);

    // Optimistically add user message
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      // Send message to API with streaming
      console.log('[ChatWindow] Fetching /api/coach/send-message...');
      const response = await fetch('/api/coach/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          message: userMessage,
          goalId: selectedGoalId, // Include selected goal for context
        }),
      });

      console.log('[ChatWindow] Response status:', response.status);
      console.log('[ChatWindow] Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let aiResponse = '';
      let chunkCount = 0;

      // Add temporary AI message that will be updated with streamed content
      const tempAiMsg: Message = {
        id: `temp-ai-${Date.now()}`,
        conversation_id: conversationId,
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, tempAiMsg]);
      console.log('[ChatWindow] Added temp AI message, starting to read stream...');

      // Read stream
      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            console.log('[ChatWindow] Stream done. Total chunks:', chunkCount, 'Total length:', aiResponse.length);
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          chunkCount++;
          aiResponse += chunk;

          console.log(`[ChatWindow] Chunk ${chunkCount}: "${chunk.substring(0, 50)}..." (${chunk.length} chars)`);
          console.log(`[ChatWindow] Accumulated response length: ${aiResponse.length}`);

          // Update AI message with accumulated response (immutably)
          setMessages((prev) => {
            const newMessages = [...prev];
            const lastIndex = newMessages.length - 1;
            if (lastIndex >= 0 && newMessages[lastIndex].role === 'assistant') {
              newMessages[lastIndex] = {
                ...newMessages[lastIndex],
                content: aiResponse,
              };
            }
            return newMessages;
          });
        }
      } catch (streamError) {
        console.error('[ChatWindow] Streaming error:', streamError);
        // Update message with error
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastIndex = newMessages.length - 1;
          if (lastIndex >= 0 && newMessages[lastIndex].role === 'assistant') {
            newMessages[lastIndex] = {
              ...newMessages[lastIndex],
              content: aiResponse || 'Error: Failed to receive response from AI',
            };
          }
          return newMessages;
        });
      }

      setIsLoading(false);

      // Messages are already updated via streaming - no reload needed
    } catch (error) {
      console.error('[ChatWindow] Error sending message:', error);
      setIsLoading(false);
      alert('Failed to send message. Please try again.');
    }
  };

  const handleCopy = async (content: string, msgId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(msgId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <Avatar className="w-8 h-8 bg-blue-600 text-white flex items-center justify-center text-sm">
                  AI
                </Avatar>
              )}

              <div
                className={`flex flex-col gap-2 max-w-[80%] ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`p-3 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div className="text-sm prose prose-sm max-w-none prose-headings:mt-2 prose-headings:mb-1 prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>

                {msg.role === 'assistant' && msg.content && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(msg.content, msg.id)}
                    className="h-7 px-2 text-xs"
                  >
                    {copiedId === msg.id ? (
                      <>
                        <Check className="w-3 h-3 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                )}
              </div>

              {msg.role === 'user' && (
                <Avatar className="w-8 h-8 bg-gray-600 text-white flex items-center justify-center text-sm">
                  U
                </Avatar>
              )}
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex gap-3">
              <Avatar className="w-8 h-8 bg-blue-600 text-white flex items-center justify-center text-sm">
                AI
              </Avatar>
              <div className="bg-gray-100 p-3 rounded-lg">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        <div className="max-w-3xl mx-auto space-y-3">
          {/* Goal Selector */}
          {selectedGoalId ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <Target className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Discussing: {goals.find((g) => g.id === selectedGoalId)?.title}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedGoalId(null)}
                className="ml-auto h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGoalSelector(!showGoalSelector)}
                className="flex items-center gap-2"
              >
                <Target className="w-4 h-4" />
                Focus on Goal
              </Button>
              {showGoalSelector && (
                <div className="flex-1 flex gap-2 overflow-x-auto">
                  {goals.map((goal) => (
                    <Button
                      key={goal.id}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedGoalId(goal.id);
                        setShowGoalSelector(false);
                      }}
                      className="whitespace-nowrap"
                    >
                      {goal.title}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                selectedGoalId
                  ? `Ask about ${goals.find((g) => g.id === selectedGoalId)?.title}...`
                  : 'Ask for coaching or request a self-assessment...'
              }
              className="flex-1 min-h-[60px] max-h-[200px]"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-[60px] w-[60px] flex-shrink-0"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
