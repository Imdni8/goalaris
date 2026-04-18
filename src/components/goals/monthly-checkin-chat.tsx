'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Loader, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Avatar } from '@/components/ui/avatar';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface GeneratedTask {
  title: string;
  description?: string;
  due_date?: string | null;
  estimated_duration?: string;
}

interface MonthlyCheckinChatProps {
  goalId: string;
  newMonth: string;
  previousMonth: string;
  onTasksGenerated: (tasks: any[]) => void;
  onClose: () => void;
}

type Step = 'conversation' | 'review' | 'approved';

export function MonthlyCheckinChat({
  goalId,
  newMonth,
  previousMonth,
  onTasksGenerated,
  onClose,
}: MonthlyCheckinChatProps) {
  const [step, setStep] = useState<Step>('conversation');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReadyToGenerate, setIsReadyToGenerate] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState<GeneratedTask[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-start with initial message on mount
  useEffect(() => {
    const startCheckIn = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/ai/monthly-checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            goalId,
            previousMonth,
            newMonth,
            conversationHistory: [],
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to start check-in');
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let aiResponse = '';
        const tempAiMsg: Message = { role: 'assistant', content: '' };
        setMessages([tempAiMsg]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          aiResponse += chunk;

          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last && last.role === 'assistant') {
              return [...prev.slice(0, -1), { ...last, content: aiResponse }];
            }
            return prev;
          });
        }

        if (aiResponse.includes('<READY_TO_GENERATE>')) {
          setIsReadyToGenerate(true);
          const cleanedResponse = aiResponse.replace('<READY_TO_GENERATE>', '').trim();
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last && last.role === 'assistant') {
              return [...prev.slice(0, -1), { ...last, content: cleanedResponse }];
            }
            return prev;
          });
        }
      } catch (error) {
        console.error('Failed to start check-in:', error);
        setMessages([
          {
            role: 'assistant',
            content: 'Error starting check-in. Please try again.',
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    startCheckIn();
  }, [goalId, previousMonth, newMonth]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);

    try {
      const response = await fetch('/api/ai/monthly-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId,
          previousMonth,
          newMonth,
          conversationHistory: messages,
          userMessage,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let aiResponse = '';
      const tempAiMsg: Message = { role: 'assistant', content: '' };
      setMessages((prev) => [...prev, tempAiMsg]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        aiResponse += chunk;

        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === 'assistant') {
            return [...prev.slice(0, -1), { ...last, content: aiResponse }];
          }
          return prev;
        });
      }

      if (aiResponse.includes('<READY_TO_GENERATE>')) {
        setIsReadyToGenerate(true);
        const cleanedResponse = aiResponse.replace('<READY_TO_GENERATE>', '').trim();
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === 'assistant') {
            return [...prev.slice(0, -1), { ...last, content: cleanedResponse }];
          }
          return prev;
        });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Error: Failed to get response. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateTasks = async () => {
    setIsGenerating(true);
    try {
      console.log('[MonthlyCheckinChat] Calling resolve-and-generate...');
      const response = await fetch('/api/tasks/resolve-and-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId,
          newMonth,
          conversationHistory: messages,
        }),
      });

      console.log('[MonthlyCheckinChat] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[MonthlyCheckinChat] Error response:', errorText);
        throw new Error('Failed to generate tasks');
      }

      const data = await response.json();
      console.log('[MonthlyCheckinChat] Generated tasks:', data);

      if (data.tasks && data.tasks.length > 0) {
        setGeneratedTasks(
          data.tasks.map((task: any) => ({
            title: task.title,
            description: task.description,
            due_date: task.due_date,
            estimated_duration: task.estimated_duration,
          }))
        );
        setStep('review');
      } else {
        throw new Error('No tasks generated');
      }
    } catch (error) {
      console.error('Failed to generate tasks:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error generating tasks: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        },
      ]);
      setIsReadyToGenerate(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApproveAndSave = () => {
    setStep('approved');
    onTasksGenerated(generatedTasks);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Conversation Step
  if (step === 'conversation') {
    return (
      <div className="flex flex-col h-full bg-white">
        {/* Messages area */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4 max-w-2xl mx-auto">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <Avatar className="w-8 h-8 bg-blue-600 text-white flex items-center justify-center text-sm flex-shrink-0">
                    AI
                  </Avatar>
                )}

                <div
                  className={`flex flex-col gap-2 max-w-xl ${
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
                </div>

                {msg.role === 'user' && (
                  <Avatar className="w-8 h-8 bg-gray-600 text-white flex items-center justify-center text-sm flex-shrink-0">
                    U
                  </Avatar>
                )}
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex gap-3">
                <Avatar className="w-8 h-8 bg-blue-600 text-white flex items-center justify-center text-sm flex-shrink-0">
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

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input area */}
        <div className="border-t border-gray-200 p-4 space-y-3">
          {isReadyToGenerate && (
            <button
              type="button"
              onClick={handleGenerateTasks}
              disabled={isGenerating}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Generating Tasks...
                </>
              ) : (
                `Generate Tasks for ${new Date(newMonth + '-01').toLocaleDateString(
                  'en-US',
                  { month: 'long', year: 'numeric' }
                )}`
              )}
            </button>
          )}

          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tell me more about your priorities or type any thoughts..."
              className="flex-1 min-h-[60px] max-h-[200px]"
              disabled={isLoading || isGenerating}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || isLoading || isGenerating}
              className="h-[60px] w-[60px] flex-shrink-0 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg flex items-center justify-center transition-colors"
              title="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Review Step
  if (step === 'review') {
    return (
      <div className="flex flex-col h-full bg-white p-4 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Review Generated Tasks for {new Date(newMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>

        <ScrollArea className="flex-1">
          <div className="space-y-3 pr-4">
            {generatedTasks.map((task, idx) => (
              <div
                key={idx}
                className="border border-gray-200 rounded-lg p-3 bg-gray-50"
              >
                <p className="font-medium text-gray-900">{task.title}</p>
                {task.description && (
                  <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                )}
                {task.due_date && (
                  <p className="text-xs text-gray-500 mt-1">
                    Due: {new Date(task.due_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="border-t border-gray-200 pt-4 space-y-2">
          <button
            type="button"
            onClick={handleApproveAndSave}
            disabled={isGenerating}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Approve & Save
          </button>
          <button
            type="button"
            onClick={() => setStep('conversation')}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Back to Check-in
          </button>
        </div>
      </div>
    );
  }

  // Approved Step
  return (
    <div className="flex flex-col h-full bg-white items-center justify-center p-4">
      <Check className="w-12 h-12 text-green-600 mb-4" />
      <p className="text-lg font-semibold text-gray-900">Tasks Saved!</p>
      <p className="text-gray-600 text-center mt-2">
        Your tasks for {new Date(newMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} have been generated and saved.
      </p>
    </div>
  );
}
