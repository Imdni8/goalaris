'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import RefinableSmartField from './refinable-smart-field';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface GoalDraft {
  title: string;
  description: string;
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  time_bound: string;
}

interface UserProfile {
  jobTitle?: string;
  team?: string;
  company?: string;
  careerGoal?: string;
  keySkills?: string[];
}

type Step = 'chat' | 'review' | 'approved';

export default function ConversationalGoalForm() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [goalDraft, setGoalDraft] = useState<GoalDraft | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Fetch user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('job_title, team, company, career_goal, key_skills')
          .eq('id', userData.user.id)
          .single();

        if (profile) {
          setUserProfile({
            jobTitle: profile.job_title || undefined,
            team: profile.team || undefined,
            company: profile.company || undefined,
            careerGoal: profile.career_goal || undefined,
            keySkills: profile.key_skills || undefined,
          });
        }

        // Start conversation with initial greeting
        const initialMessage: Message = {
          role: 'assistant',
          content:
            profile?.career_goal
              ? `Great! I see you're aiming to ${profile.career_goal}. Let's create a SMART goal aligned with that. What area do you want to focus on this quarter?`
              : "I'm here to help you create a SMART goal through conversation. What goal would you like to work on?",
        };
        setMessages([initialMessage]);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      }
    };

    fetchProfile();
  }, [supabase]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Parse goal draft from assistant response
  const extractGoalDraft = (text: string): GoalDraft | null => {
    const match = text.match(/<goal_draft>([\s\S]*?)<\/goal_draft>/);
    if (match) {
      try {
        const jsonStr = match[1].trim();
        const draft = JSON.parse(jsonStr);
        return draft;
      } catch (e) {
        console.error('Failed to parse goal draft:', e);
        return null;
      }
    }
    return null;
  };

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!userInput.trim() || loading) return;

    setError(null);

    // Add user message to chat
    const newMessage: Message = { role: 'user', content: userInput };
    setMessages((prev) => [...prev, newMessage]);
    setUserInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/goal-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationHistory: messages,
          userMessage: userInput,
          userProfile,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to get AI response');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let assistantContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        assistantContent += text;

        // Update message in real-time (optional, for streaming UI)
        setMessages((prev) => {
          const updated = [...prev];
          const lastMsg = updated[updated.length - 1];
          if (lastMsg?.role === 'assistant') {
            updated[updated.length - 1] = {
              ...lastMsg,
              content: assistantContent,
            };
          } else {
            updated.push({ role: 'assistant', content: assistantContent });
          }
          return updated;
        });
      }

      // Check if response contains a goal draft
      const draft = extractGoalDraft(assistantContent);
      if (draft) {
        setGoalDraft(draft);
        setStep('review');
      }

      // Final message without goal_draft tags for display
      const cleanContent = assistantContent.replace(/<goal_draft>[\s\S]*?<\/goal_draft>/, '').trim();
      if (cleanContent && !messages.some((m) => m.content === cleanContent && m.role === 'assistant')) {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: cleanContent };
          return updated;
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get AI response');
      // Remove the user message if there was an error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  async function handleApproveGoal() {
    if (!goalDraft) return;

    setError(null);
    setLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setError('You must be logged in');
        return;
      }

      // Compute the next goal_number for this user
      const { count } = await supabase
        .from('goals')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userData.user.id);
      const goalNumber = (count ?? 0) + 1;

      const { data: insertedGoal, error: insertError } = await supabase.from('goals').insert([
        {
          user_id: userData.user.id,
          title: goalDraft.title,
          description: goalDraft.description || null,
          specific: goalDraft.specific || null,
          measurable: goalDraft.measurable || null,
          achievable: goalDraft.achievable || null,
          relevant: goalDraft.relevant || null,
          time_bound: goalDraft.time_bound || null,
          status: 'active',
          ai_suggested: true,
          goal_number: goalNumber,
        },
      ]).select('id').single();

      if (insertError) {
        setError(insertError.message);
        return;
      }

      if (!insertedGoal) {
        setError('Failed to save goal');
        return;
      }

      const newGoalId = insertedGoal.id;

      // Track event
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName: 'goal_created',
          properties: { type: 'ai_conversational' },
        }),
      }).catch(console.error);

      // Auto-generate tasks for the current month (wait for completion)
      const currentMonth = new Date().toISOString().slice(0, 7);
      try {
        await fetch('/api/ai/generate-tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goalId: newGoalId, month: currentMonth }),
        });
      } catch (err) {
        console.error('Task generation failed:', err);
        // Don't block navigation if task generation fails
      }

      setStep('approved');
      router.push(`/dashboard/goals/${newGoalId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save goal');
    } finally {
      setLoading(false);
    }
  }

  // Chat step
  if (step === 'chat') {
    return (
      <div className="flex flex-col h-[600px] space-y-4">
        {error && <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>}

        {/* Messages container */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4"
        >
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-sm rounded-lg px-4 py-2 ${
                  msg.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}
              >
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input form */}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Tell me more about your goal..."
            disabled={loading}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
          />
          <Button type="submit" disabled={loading || !userInput.trim()}>
            {loading ? 'Sending...' : 'Send'}
          </Button>
        </form>

        {goalDraft && (
          <div className="flex justify-center">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep('review')}
              className="text-blue-600 hover:text-blue-700"
            >
              Back to review
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Review step
  if (step === 'review' && goalDraft) {
    return (
      <div className="space-y-6">
        {error && <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>}

        <div className="rounded-lg bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">✨</div>
            <div>
              <h3 className="font-semibold text-blue-900">AI-Generated SMART Goal</h3>
              <p className="text-sm text-blue-700">Review and edit as needed, then save to your goals.</p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Goal Title</label>
          <input
            type="text"
            value={goalDraft.title}
            onChange={(e) => setGoalDraft({ ...goalDraft, title: e.target.value })}
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={goalDraft.description}
            onChange={(e) => setGoalDraft({ ...goalDraft, description: e.target.value })}
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none overflow-hidden resize-none"
            style={{ minHeight: '60px', maxHeight: '400px' }}
          />
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="mb-4 font-semibold text-gray-900">SMART Criteria</h3>
          <div className="space-y-4">
            <RefinableSmartField
              label="Specific - What exactly will you accomplish?"
              value={goalDraft.specific}
              onChange={(value) => setGoalDraft({ ...goalDraft, specific: value })}
              elementName="specific"
              goalTitle={goalDraft.title}
              goalDescription={goalDraft.description}
              rows={2}
            />

            <RefinableSmartField
              label="Measurable - How will you measure success?"
              value={goalDraft.measurable}
              onChange={(value) => setGoalDraft({ ...goalDraft, measurable: value })}
              elementName="measurable"
              goalTitle={goalDraft.title}
              goalDescription={goalDraft.description}
              rows={2}
            />

            <RefinableSmartField
              label="Achievable - Why is this goal realistic?"
              value={goalDraft.achievable}
              onChange={(value) => setGoalDraft({ ...goalDraft, achievable: value })}
              elementName="achievable"
              goalTitle={goalDraft.title}
              goalDescription={goalDraft.description}
              rows={2}
            />

            <RefinableSmartField
              label="Relevant - How does this align with your role/career?"
              value={goalDraft.relevant}
              onChange={(value) => setGoalDraft({ ...goalDraft, relevant: value })}
              elementName="relevant"
              goalTitle={goalDraft.title}
              goalDescription={goalDraft.description}
              rows={2}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Time-bound - Target completion date
              </label>
              <input
                type="text"
                value={goalDraft.time_bound}
                onChange={(e) => setGoalDraft({ ...goalDraft, time_bound: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                placeholder="e.g., Q4 2024, December 31, 2024"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep('chat')}
            disabled={loading}
          >
            Back to Chat
          </Button>
          <Button onClick={handleApproveGoal} disabled={loading}>
            {loading ? 'Saving...' : 'Save Goal'}
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
