'use client';

import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Sparkles, ChevronUp, ChevronDown, ChevronLeft, History, Send, Trash2, Loader2, Loader, Check, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  metadata?: { tagged_tasks?: TaggedTask[] } | null;
  // Ephemeral, client-only. Parsed from `<OPTIONS: a | b | c>` token in the
  // streamed response. Not persisted in the DB and not restored on resume.
  suggested_options?: string[];
}

interface ThreadSummary {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaggedTask {
  id: string;
  title: string;
}

export interface InGoalCoachWidgetHandle {
  open: (entryPoint?: 'pill' | 'task_sparkle') => void;
}

interface GeneratedTask {
  title: string;
  description?: string;
  due_date?: string | null;
  estimated_duration?: string;
}

interface ProposedChange {
  type: 'add' | 'edit' | 'delete' | 'break_down';
  taskId?: string;
  title?: string;
  description?: string | null;
  due_date?: string | null;
  subtasks?: Array<{
    title: string;
    description?: string | null;
    due_date?: string | null;
  }>;
  originalTitle?: string;
  originalDescription?: string | null;
  originalDueDate?: string | null;
}

export interface CheckInMode {
  newMonth: string;
  previousMonth: string;
}

interface InGoalCoachWidgetProps {
  goalId: string;
  goalTitle: string;
  taggedTasks: TaggedTask[];
  onTaggedTasksChange: (tasks: TaggedTask[]) => void;
  checkInMode?: CheckInMode | null;
  onCheckInClose?: () => void;
  onTasksGenerated?: () => void | Promise<void>;
}

type Mode = 'collapsed' | 'chat' | 'history';
type CheckInStep = 'conversation' | 'review' | 'approved';
type ModifyStep = 'conversation' | 'review';

function formatMonthLabel(month: string): string {
  return new Date(`${month}-01`).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export const InGoalCoachWidget = forwardRef<InGoalCoachWidgetHandle, InGoalCoachWidgetProps>(
  function InGoalCoachWidget({
    goalId,
    goalTitle,
    taggedTasks,
    onTaggedTasksChange,
    checkInMode,
    onCheckInClose,
    onTasksGenerated,
  }, ref) {
  const [mode, setMode] = useState<Mode>('collapsed');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [isLoadingThreads, setIsLoadingThreads] = useState(false);
  const [expandedTagsByMsg, setExpandedTagsByMsg] = useState<Set<string>>(new Set());
  const [checkInStep, setCheckInStep] = useState<CheckInStep>('conversation');
  const [isReadyToGenerate, setIsReadyToGenerate] = useState(false);
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState<GeneratedTask[]>([]);
  const [modifyStep, setModifyStep] = useState<ModifyStep>('conversation');
  const [isReadyToApply, setIsReadyToApply] = useState(false);
  const [proposedChanges, setProposedChanges] = useState<ProposedChange[] | null>(null);
  const [isPreviewingChanges, setIsPreviewingChanges] = useState(false);
  const [isApplyingChanges, setIsApplyingChanges] = useState(false);
  const [reviewRefineInput, setReviewRefineInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastEntryPointRef = useRef<'pill' | 'task_sparkle'>('pill');
  const checkInStartedRef = useRef<string | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  const isInCheckIn = !!checkInMode;

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const toggleMsgTags = (msgId: string) => {
    setExpandedTagsByMsg((prev) => {
      const next = new Set(prev);
      if (next.has(msgId)) next.delete(msgId);
      else next.add(msgId);
      return next;
    });
  };

  useImperativeHandle(ref, () => ({
    open: (entryPoint = 'task_sparkle') => {
      lastEntryPointRef.current = entryPoint;
      setMode('chat');
    },
  }), []);

  // Fire goal_coach_opened once per transition from collapsed → expanded
  const wasCollapsedRef = useRef(true);
  useEffect(() => {
    if (wasCollapsedRef.current && mode !== 'collapsed') {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName: 'goal_coach_opened',
          properties: { goal_id: goalId, entry_point: lastEntryPointRef.current },
        }),
      }).catch(() => {});
    }
    wasCollapsedRef.current = mode === 'collapsed';
  }, [mode, goalId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const ensureConversation = useCallback(async (): Promise<string | null> => {
    if (conversationId) return conversationId;
    const res = await fetch('/api/goal-coach/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal_id: goalId }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    setConversationId(json.conversation.id);
    return json.conversation.id;
  }, [conversationId, goalId]);

  const handleOpen = () => {
    lastEntryPointRef.current = 'pill';
    setMode('chat');
  };

  const handleCollapse = () => {
    setMode('collapsed');
  };

  const handleNewThread = () => {
    setConversationId(null);
    setMessages([]);
    onTaggedTasksChange([]);
    setMode('chat');
    setIsReadyToApply(false);
    setProposedChanges(null);
    setModifyStep('conversation');
  };

  const removeTag = (taskId: string) => {
    onTaggedTasksChange(taggedTasks.filter((t) => t.id !== taskId));
  };

  const handleOpenHistory = async () => {
    setMode('history');
    setIsLoadingThreads(true);
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: 'goal_coach_history_opened',
        properties: { goal_id: goalId },
      }),
    }).catch(() => {});
    try {
      const res = await fetch(`/api/goal-coach/conversations?goal_id=${goalId}`);
      if (res.ok) {
        const json = await res.json();
        setThreads(json.conversations || []);
      }
    } finally {
      setIsLoadingThreads(false);
    }
  };

  const handleLoadThread = async (threadId: string) => {
    setIsStreaming(true);
    try {
      const res = await fetch(`/api/coach/conversations/${threadId}`);
      if (!res.ok) return;
      const json = await res.json();
      const loaded: ChatMessage[] = (json.messages || []).map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        created_at: m.created_at,
        metadata: m.metadata ?? null,
      }));
      setConversationId(threadId);
      setMessages(loaded);
      setMode('chat');
      setIsReadyToApply(false);
      setProposedChanges(null);
      setModifyStep('conversation');

      const lastMsg = loaded[loaded.length - 1];
      const daysSince = lastMsg
        ? Math.floor((Date.now() - new Date(lastMsg.created_at).getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName: 'goal_coach_thread_resumed',
          properties: { goal_id: goalId, conversation_id: threadId, days_since_last_message: daysSince },
        }),
      }).catch(() => {});
    } finally {
      setIsStreaming(false);
    }
  };

  const handleDeleteThread = async (threadId: string) => {
    if (!confirm('Delete this conversation?')) return;
    const res = await fetch(`/api/coach/conversations/${threadId}/delete`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setThreads((prev) => prev.filter((t) => t.id !== threadId));
      if (conversationId === threadId) {
        setConversationId(null);
        setMessages([]);
      }
    }
  };

  // ----- Monthly check-in flow -----

  const streamCheckInResponse = useCallback(
    async (
      convId: string,
      history: Array<{ role: 'user' | 'assistant'; content: string }>,
      userMessage?: string
    ) => {
      if (!checkInMode) return;
      setIsStreaming(true);
      const tempAiId = `tmp-a-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: tempAiId,
          role: 'assistant',
          content: '',
          created_at: new Date().toISOString(),
        },
      ]);

      try {
        const res = await fetch('/api/ai/monthly-checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            goalId,
            previousMonth: checkInMode.previousMonth,
            newMonth: checkInMode.newMonth,
            conversationHistory: history,
            userMessage,
            conversationId: convId,
          }),
        });

        if (!res.ok) {
          throw new Error(`Check-in request failed: ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error('No stream');
        const decoder = new TextDecoder();
        let acc = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          // While streaming, hide the bubble text once the readiness marker
          // appears so the user doesn't read a wrap-up message that we're
          // about to navigate away from.
          const display = acc.includes('<READY_TO_GENERATE>')
            ? ''
            : acc;
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last && last.role === 'assistant') {
              next[next.length - 1] = { ...last, content: display };
            }
            return next;
          });
        }

        if (acc.includes('<READY_TO_GENERATE>')) {
          setIsReadyToGenerate(true);
          // Drop the assistant placeholder entirely — the loader bubble
          // morphs to "Generating tasks..." via the isGeneratingTasks branch
          // below, then the screen swaps to the review step.
          setMessages((prev) => prev.filter((m) => m.id !== tempAiId));
        }
      } catch (err) {
        console.error('[InGoalCoachWidget] check-in stream error:', err);
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last && last.role === 'assistant') {
            next[next.length - 1] = {
              ...last,
              content: 'Sorry — something went wrong. Please try again.',
            };
          }
          return next;
        });
      } finally {
        setIsStreaming(false);
      }
    },
    [checkInMode, goalId]
  );

  // Auto-start the check-in when checkInMode becomes set. Track the
  // most recent (previousMonth → newMonth) pair we started for so that
  // re-renders or strict-mode double-fires don't kick off two greetings.
  useEffect(() => {
    if (!checkInMode) {
      checkInStartedRef.current = null;
      return;
    }
    const key = `${checkInMode.previousMonth}->${checkInMode.newMonth}`;
    if (checkInStartedRef.current === key) return;
    checkInStartedRef.current = key;

    setMode('chat');
    setMessages([]);
    setInput('');
    setConversationId(null);
    setIsReadyToGenerate(false);
    setIsGeneratingTasks(false);
    setGeneratedTasks([]);
    setCheckInStep('conversation');
    onTaggedTasksChange([]);

    (async () => {
      const title = `Monthly Check-in: ${formatMonthLabel(checkInMode.newMonth)}`;
      try {
        const res = await fetch('/api/goal-coach/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goal_id: goalId, title }),
        });
        if (!res.ok) {
          alert('Could not start check-in. Please try again.');
          return;
        }
        const json = await res.json();
        const convId = json.conversation.id;
        setConversationId(convId);
        await streamCheckInResponse(convId, []);
      } catch (err) {
        console.error('[InGoalCoachWidget] check-in start failed:', err);
        alert('Could not start check-in. Please try again.');
      }
    })();
  }, [checkInMode, goalId, onTaggedTasksChange, streamCheckInResponse]);

  const handleSendCheckIn = async () => {
    if (!input.trim() || isStreaming || !conversationId || !checkInMode) return;
    const text = input.trim();
    setInput('');

    const history = messages
      .filter((m) => m.content)
      .map((m) => ({ role: m.role, content: m.content }));

    const tempUserId = `tmp-u-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: tempUserId,
        role: 'user',
        content: text,
        created_at: new Date().toISOString(),
      },
    ]);

    await streamCheckInResponse(conversationId, history, text);
  };

  const handleGenerateTasks = async () => {
    if (!checkInMode || isGeneratingTasks) return;
    setIsGeneratingTasks(true);
    setIsReadyToGenerate(false);
    try {
      const history = messagesRef.current
        .filter((m) => m.content)
        .map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/tasks/resolve-and-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId,
          newMonth: checkInMode.newMonth,
          conversationHistory: history,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to generate tasks');
      }

      const data = await res.json();
      if (data.tasks && data.tasks.length > 0) {
        setGeneratedTasks(
          data.tasks.map((task: any) => ({
            title: task.title,
            description: task.description,
            due_date: task.due_date,
            estimated_duration: task.estimated_duration,
          }))
        );
        setCheckInStep('review');
      } else {
        throw new Error('No tasks generated');
      }
    } catch (err) {
      console.error('[InGoalCoachWidget] generate tasks failed:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `tmp-err-${Date.now()}`,
          role: 'assistant',
          content: `Error generating tasks: ${
            err instanceof Error ? err.message : 'Unknown error'
          }. Please try again.`,
          created_at: new Date().toISOString(),
        },
      ]);
      setIsReadyToGenerate(false);
    } finally {
      setIsGeneratingTasks(false);
    }
  };

  const handleSendFromReview = async () => {
    if (
      !reviewRefineInput.trim() ||
      isStreaming ||
      isGeneratingTasks ||
      !conversationId ||
      !checkInMode
    ) {
      return;
    }
    const text = reviewRefineInput.trim();
    setReviewRefineInput('');
    setCheckInStep('conversation');
    setIsReadyToGenerate(false);
    setGeneratedTasks([]);

    const history = messagesRef.current
      .filter((m) => m.content)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [
      ...prev,
      {
        id: `tmp-u-${Date.now()}`,
        role: 'user',
        content: text,
        created_at: new Date().toISOString(),
      },
    ]);

    await streamCheckInResponse(conversationId, history, text);
  };

  const resetCheckInState = () => {
    setMessages([]);
    setConversationId(null);
    setIsReadyToGenerate(false);
    setIsGeneratingTasks(false);
    setGeneratedTasks([]);
    setCheckInStep('conversation');
    setReviewRefineInput('');
    checkInStartedRef.current = null;
  };

  const handleApproveCheckIn = async () => {
    setCheckInStep('approved');
    try {
      await onTasksGenerated?.();
    } finally {
      resetCheckInState();
      onCheckInClose?.();
      setMode('collapsed');
    }
  };

  const handleCloseCheckIn = () => {
    resetCheckInState();
    onCheckInClose?.();
    setMode('collapsed');
  };

  useEffect(() => {
    if (
      isInCheckIn &&
      isReadyToGenerate &&
      checkInStep === 'conversation' &&
      !isGeneratingTasks &&
      !isStreaming
    ) {
      handleGenerateTasks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReadyToGenerate, isInCheckIn, checkInStep, isGeneratingTasks, isStreaming]);

  // ----- Regular coach send -----

  const sendMessage = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || isStreaming) return;
    setIsStreaming(true);

    // A new user turn invalidates any prior "ready to apply" state — the
    // conversation has moved on, so the AI should re-emit the signal if
    // the new message still leads to a concrete change set.
    setIsReadyToApply(false);
    setProposedChanges(null);

    // Snapshot tagged tasks for this message, then clear the input chips.
    const taggedSnapshot = taggedTasks;
    const taggedIdsSnapshot = taggedSnapshot.map((t) => t.id);
    onTaggedTasksChange([]);

    // Render the user bubble + thinking indicator immediately so there's
    // no perceived gap while the conversation gets created on the server.
    const tempUserId = `tmp-u-${Date.now()}`;
    const tempAiId = `tmp-a-${Date.now()}`;
    const tempUser: ChatMessage = {
      id: tempUserId,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
      metadata: taggedSnapshot.length > 0 ? { tagged_tasks: taggedSnapshot } : null,
    };
    const tempAi: ChatMessage = {
      id: tempAiId,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUser, tempAi]);

    const convId = await ensureConversation();
    if (!convId) {
      setIsStreaming(false);
      setMessages((prev) => prev.filter((m) => m.id !== tempUserId && m.id !== tempAiId));
      setInput(text);
      onTaggedTasksChange(taggedSnapshot);
      alert('Could not start conversation. Please try again.');
      return;
    }

    let acc = '';
    let streamErrored = false;

    try {
      const res = await fetch('/api/ai/goal-coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal_id: goalId,
          conversation_id: convId,
          user_message: text,
          tagged_task_ids: taggedIdsSnapshot,
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Chat request failed: ${res.status} ${errBody}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No stream');
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last && last.role === 'assistant') {
            next[next.length - 1] = { ...last, content: acc };
          }
          return next;
        });
      }
    } catch (err) {
      console.error('[InGoalCoachWidget] send error:', err);
      streamErrored = true;
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.role === 'assistant') {
          next[next.length - 1] = { ...last, content: 'Sorry — something went wrong. Please try again.' };
        }
        return next;
      });
    } finally {
      setIsStreaming(false);
    }

    // Post-stream signal parsing. Do this AFTER setIsStreaming(false) so the
    // auto-preview call below isn't blocked by the streaming guard.
    if (!streamErrored) {
      let cleaned = acc;

      // Tolerate minor model variations like `<READY TO APPLY>`,
      // `<ready_to_apply>`, or stray whitespace.
      const readyTokenRe = /<\s*READY[\s_-]*TO[\s_-]*APPLY\s*>/gi;
      const hasReadyToApply = readyTokenRe.test(cleaned);
      if (hasReadyToApply) {
        cleaned = cleaned.replace(readyTokenRe, '');
      }

      let suggestedOptions: string[] | undefined;
      const optionsMatch = cleaned.match(/<OPTIONS:\s*([^>]+)>/);
      if (optionsMatch) {
        const parsed = optionsMatch[1]
          .split('|')
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 4);
        if (parsed.length > 0) suggestedOptions = parsed;
        cleaned = cleaned.replace(optionsMatch[0], '');
      }

      cleaned = cleaned.trim();

      if (hasReadyToApply || suggestedOptions) {
        // Replace the assistant placeholder with cleaned text + parsed options.
        // If both are empty, drop the bubble entirely (otherwise it renders
        // as a stuck "Thinking..." indicator forever).
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last && last.role === 'assistant' && last.id === tempAiId) {
            if (cleaned || (suggestedOptions && suggestedOptions.length > 0)) {
              next[next.length - 1] = {
                ...last,
                content: cleaned,
                suggested_options: suggestedOptions,
              };
            } else {
              next.pop();
            }
          }
          return next;
        });
      }

      if (hasReadyToApply) {
        setIsReadyToApply(true);

        // Build history manually — `messages` in this closure pre-dates this
        // turn's setMessages calls, so we reconstruct from scratch using `text`
        // (this turn's user message) and `cleaned` (this turn's assistant reply).
        const historyForPreview = messages
          .filter((m) => m.content)
          .map((m) => ({ role: m.role, content: m.content }));
        historyForPreview.push({ role: 'user', content: text });
        if (cleaned) {
          historyForPreview.push({ role: 'assistant', content: cleaned });
        }

        runPreview(historyForPreview);
      }
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    await sendMessage(text);
  };

  const handleChipClick = (option: string) => {
    if (isStreaming || isPreviewingChanges) return;

    // Fast-path for commit chips ("Apply", "Confirm", etc.): bypass the LLM
    // round-trip and go straight to the review panel. Gemini 2.5 Flash Lite
    // is unreliable about emitting `<READY_TO_APPLY>`, so we drive the
    // transition from the chip click directly — the proposal is already in
    // conversation history for the preview extractor to read.
    const isCommitChip = /^(apply|confirm|proceed|go ahead|do it)$/i.test(
      option.trim()
    );
    if (isCommitChip && !isInCheckIn) {
      void handleCommitChipClick(option);
      return;
    }

    sendMessage(option);
  };

  const handleCommitChipClick = async (option: string) => {
    // Render the user's chip click locally so the transcript shows it.
    const tempUserId = `tmp-u-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: tempUserId,
        role: 'user',
        content: option,
        created_at: new Date().toISOString(),
      },
    ]);

    const history = messagesRef.current
      .filter((m) => m.content)
      .map((m) => ({ role: m.role, content: m.content }));
    history.push({ role: 'user', content: option });

    setIsReadyToApply(true);
    await runPreview(history);
  };

  const runPreview = async (
    history: Array<{ role: string; content: string }>
  ): Promise<void> => {
    if (isPreviewingChanges) return;
    setIsPreviewingChanges(true);
    try {
      const res = await fetch('/api/tasks/preview-coach-changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalId, conversationHistory: history }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `Preview failed: ${res.status}`);
      }
      const data = await res.json();
      const changes: ProposedChange[] = data.changes || [];
      if (changes.length === 0) {
        setMessages((prev) => [
          ...prev,
          {
            id: `tmp-noop-${Date.now()}`,
            role: 'assistant',
            content:
              "I couldn't pin down concrete task changes from our conversation. Could you confirm which specific changes you'd like — e.g., 'yes, drop task X and break task Y into 3 subtasks'?",
            created_at: new Date().toISOString(),
          },
        ]);
        setIsReadyToApply(false);
        return;
      }
      setProposedChanges(changes);
      setModifyStep('review');
    } catch (err) {
      console.error('[InGoalCoachWidget] preview failed:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `tmp-err-${Date.now()}`,
          role: 'assistant',
          content: 'Could not preview changes. Please try again.',
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsPreviewingChanges(false);
    }
  };

  const handlePreviewChanges = async () => {
    if (isPreviewingChanges || isStreaming) return;
    // If we've already extracted changes (e.g., user clicked "Back to
    // conversation" from the review step), just jump back to review without
    // re-running the LLM extraction.
    if (proposedChanges && proposedChanges.length > 0) {
      setModifyStep('review');
      return;
    }
    const history = messages
      .filter((m) => m.content)
      .map((m) => ({ role: m.role, content: m.content }));
    await runPreview(history);
  };

  const handleApplyChanges = async () => {
    if (!proposedChanges || isApplyingChanges) return;
    setIsApplyingChanges(true);
    try {
      const res = await fetch('/api/tasks/apply-coach-changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalId, changes: proposedChanges }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `Apply failed: ${res.status}`);
      }
      const data = await res.json();

      const summaryParts = [
        data.added > 0 ? `${data.added} added` : null,
        data.edited > 0 ? `${data.edited} edited` : null,
        data.deleted > 0 ? `${data.deleted} dropped` : null,
        data.brokenDown > 0 ? `${data.brokenDown} broken down` : null,
      ].filter(Boolean);
      const summary = summaryParts.length > 0 ? summaryParts.join(', ') : 'no changes applied';

      setProposedChanges(null);
      setIsReadyToApply(false);
      setModifyStep('conversation');
      setMessages((prev) => [
        ...prev,
        {
          id: `tmp-applied-${Date.now()}`,
          role: 'assistant',
          content: `✅ Done — ${summary}.`,
          created_at: new Date().toISOString(),
        },
      ]);

      await onTasksGenerated?.();
    } catch (err) {
      console.error('[InGoalCoachWidget] apply failed:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `tmp-err-${Date.now()}`,
          role: 'assistant',
          content: `Could not apply changes: ${
            err instanceof Error ? err.message : 'Unknown error'
          }. Please try again.`,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsApplyingChanges(false);
    }
  };

  const handleBackToModifyConversation = () => {
    setModifyStep('conversation');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isInCheckIn) {
        handleSendCheckIn();
      } else {
        handleSend();
      }
    }
  };

  if (mode === 'collapsed' && !isInCheckIn) {
    return (
      <button
        onClick={handleOpen}
        className="fixed bottom-6 left-[max(2.5rem,calc(50vw-36.5rem))] sm:left-[max(3rem,calc(50vw-36.5rem))] lg:left-[max(3.5rem,calc(50vw-36.5rem))] z-40 flex items-center gap-2 rounded-full bg-blue-600 px-4 py-3 text-white shadow-lg hover:bg-blue-700 transition-colors"
        aria-label="Open coach"
      >
        <Sparkles className="w-4 h-4" />
        <span className="text-sm font-medium">Coach</span>
        <ChevronUp className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 left-[max(2.5rem,calc(50vw-36.5rem))] sm:left-[max(3rem,calc(50vw-36.5rem))] lg:left-[max(3.5rem,calc(50vw-36.5rem))] z-40 w-[360px] h-[520px] bg-white rounded-2xl shadow-xl flex flex-col border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-gray-200 bg-blue-600 text-white">
        {isInCheckIn ? (
          <div className="flex items-center gap-2 px-1 min-w-0">
            <Sparkles className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium truncate">Monthly Check-in</span>
          </div>
        ) : mode === 'history' ? (
          <div className="flex items-center gap-1 min-w-0">
            <button
              onClick={() => setMode('chat')}
              className="p-1 rounded hover:bg-blue-700 transition-colors flex-shrink-0"
              aria-label="Back"
              title="Back"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium truncate">Past conversation</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-1">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Coach</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          {!isInCheckIn && mode === 'chat' && (
            <button
              onClick={handleOpenHistory}
              className="p-1 rounded hover:bg-blue-700 transition-colors"
              aria-label="Past conversations"
              title="Past conversations"
            >
              <History className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={isInCheckIn ? handleCloseCheckIn : handleCollapse}
            className="p-1 rounded hover:bg-blue-700 transition-colors"
            aria-label={isInCheckIn ? 'Close check-in' : 'Collapse'}
          >
            {isInCheckIn ? <X className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Body */}
      {isInCheckIn && checkInStep === 'review' ? (
        <div className="flex-1 min-h-0 flex flex-col p-4 gap-3">
          <p className="text-sm font-semibold text-gray-900">
            Review tasks for {formatMonthLabel(checkInMode!.newMonth)}
          </p>
          <div className="flex-1 overflow-y-auto pr-1 space-y-2">
            {generatedTasks.map((task, idx) => (
              <div
                key={idx}
                className="border border-gray-200 rounded-lg p-3 bg-gray-50"
              >
                <p className="text-sm font-medium text-gray-900">{task.title}</p>
                {task.description && (
                  <p className="text-xs text-gray-600 mt-1">{task.description}</p>
                )}
                {task.due_date && (
                  <p className="text-xs text-gray-500 mt-1">
                    Due:{' '}
                    {new Date(task.due_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 pt-3 space-y-2">
            <button
              type="button"
              onClick={handleApproveCheckIn}
              disabled={isStreaming || isGeneratingTasks}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Approve & Save
            </button>
            <div className="flex items-end gap-2">
              <textarea
                value={reviewRefineInput}
                onChange={(e) => setReviewRefineInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendFromReview();
                  }
                }}
                placeholder="Want changes? Tell me here..."
                rows={1}
                className="flex-1 resize-y rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[38px] max-h-[88px]"
                disabled={isStreaming || isGeneratingTasks}
              />
              <button
                type="button"
                onClick={handleSendFromReview}
                disabled={!reviewRefineInput.trim() || isStreaming || isGeneratingTasks}
                className="rounded-md bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:bg-gray-300"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : isInCheckIn && checkInStep === 'approved' ? (
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <Check className="w-10 h-10 text-green-600 mb-3" />
          <p className="text-sm font-semibold text-gray-900">Tasks Saved</p>
          <p className="text-xs text-gray-600 mt-1">
            Tasks for {formatMonthLabel(checkInMode!.newMonth)} have been generated.
          </p>
        </div>
      ) : !isInCheckIn && mode === 'chat' && modifyStep === 'review' && proposedChanges ? (
        <div className="flex-1 min-h-0 flex flex-col p-4 gap-3">
          <p className="text-sm font-semibold text-gray-900">Review proposed changes</p>
          <div className="flex-1 overflow-y-auto pr-1 space-y-3">
            <ChangeList changes={proposedChanges} />
          </div>
          <div className="border-t border-gray-200 pt-3 space-y-2">
            <button
              type="button"
              onClick={handleApplyChanges}
              disabled={isApplyingChanges}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isApplyingChanges ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Apply changes
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleBackToModifyConversation}
              disabled={isApplyingChanges}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-2 px-4 rounded-lg transition-colors text-sm"
            >
              Back to conversation
            </button>
          </div>
        </div>
      ) : mode === 'chat' ? (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center px-6">
                {isInCheckIn ? (
                  <div className="flex items-center gap-1" aria-label="Coach is preparing your check-in">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-700 font-medium mb-1">
                      Ask a question or need assistance with a task?
                    </p>
                    <p className="text-xs text-gray-500">
                      I have full context on <span className="font-medium">{goalTitle}</span>.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              messages.map((msg, idx) => {
                const msgTags = msg.role === 'user' ? msg.metadata?.tagged_tasks || [] : [];
                const isExpanded = expandedTagsByMsg.has(msg.id);
                const isLastMessage = idx === messages.length - 1;
                const showChips =
                  msg.role === 'assistant' &&
                  isLastMessage &&
                  !isStreaming &&
                  Array.isArray(msg.suggested_options) &&
                  msg.suggested_options.length > 0;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    {msgTags.length === 1 && (
                      <div className="max-w-[85%] mb-1 w-full flex justify-end">
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-blue-200 bg-blue-50 text-blue-900 text-xs max-w-full">
                          <Sparkles className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{msgTags[0].title}</span>
                        </div>
                      </div>
                    )}
                    {msgTags.length > 1 && (
                      <div className="max-w-[85%] mb-1 w-full flex flex-col items-end">
                        <button
                          type="button"
                          onClick={() => toggleMsgTags(msg.id)}
                          className="flex items-center justify-between gap-2 w-full px-2 py-1 rounded-md border border-blue-200 bg-blue-50 text-blue-700 text-xs hover:bg-blue-100"
                        >
                          <span className="font-medium">{msgTags.length} tasks</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                        {isExpanded && (
                          <div className="flex flex-col gap-1 mt-1 w-full">
                            {msgTags.map((t) => (
                              <div
                                key={t.id}
                                className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-blue-200 bg-white text-blue-900 text-xs"
                              >
                                <Sparkles className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{t.title}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : msg.content ? (
                        <div className="prose prose-sm max-w-none prose-headings:mt-1 prose-headings:mb-1 prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="flex flex-col items-start gap-1.5" aria-label="Coach is thinking">
                          <div className="flex items-center gap-1 py-0.5">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                          </div>
                          <span className="text-xs text-gray-500">Thinking...</span>
                        </div>
                      )}
                    </div>
                    {showChips && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5 max-w-[85%]">
                        {msg.suggested_options!.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleChipClick(opt)}
                            disabled={isStreaming}
                            className="px-3 py-1 text-xs font-medium rounded-full border border-blue-300 bg-white text-blue-700 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors max-w-full truncate"
                            title={opt}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            {isInCheckIn && (isReadyToGenerate || isGeneratingTasks) && (
              <div className="flex flex-col items-start">
                <div className="max-w-[85%] rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-900">
                  <div className="flex flex-col items-start gap-1.5" aria-label="Generating tasks">
                    <div className="flex items-center gap-1 py-0.5">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                    <span className="text-xs text-gray-500">Generating tasks...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="border-t border-gray-200 p-3 space-y-2">
            {!isInCheckIn && taggedTasks.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {taggedTasks.map((t) => (
                  <span
                    key={t.id}
                    className="inline-flex items-center gap-1 max-w-full rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs text-blue-900"
                  >
                    <Sparkles className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate max-w-[220px]">{t.title}</span>
                    <button
                      onClick={() => removeTag(t.id)}
                      className="text-blue-500 hover:text-blue-700 flex-shrink-0"
                      aria-label={`Remove ${t.title}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {!isInCheckIn && isReadyToApply && (
              <button
                type="button"
                onClick={handlePreviewChanges}
                disabled={isPreviewingChanges || isStreaming}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
              >
                {isPreviewingChanges ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Preparing review...
                  </>
                ) : (
                  'Review changes'
                )}
              </button>
            )}
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isInCheckIn
                    ? 'Tell me more about your priorities or type any thoughts...'
                    : taggedTasks.length > 0
                    ? 'Ask about the tagged task(s)...'
                    : 'Message coach...'
                }
                rows={1}
                className="flex-1 resize-y rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[38px] max-h-[88px]"
                disabled={isStreaming || isGeneratingTasks}
              />
              <button
                onClick={isInCheckIn ? handleSendCheckIn : handleSend}
                disabled={!input.trim() || isStreaming || isGeneratingTasks}
                className="rounded-md bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:bg-gray-300"
                aria-label="Send"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="p-3 border-b border-gray-100">
            <button
              onClick={handleNewThread}
              className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium py-2"
            >
              + New conversation
            </button>
          </div>
          {isLoadingThreads ? (
            <div className="p-6 flex justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : threads.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">
              No past conversations yet.
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {threads.map((t) => (
                <li key={t.id} className="group flex items-start gap-2 px-4 py-3 hover:bg-gray-50">
                  <button
                    onClick={() => handleLoadThread(t.id)}
                    className="flex-1 text-left min-w-0"
                  >
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {t.title || 'Untitled'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatRelative(t.updated_at)}
                    </p>
                  </button>
                  <button
                    onClick={() => handleDeleteThread(t.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-opacity p-1"
                    aria-label="Delete conversation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
});

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function formatDueDate(d?: string | null): string | null {
  if (!d) return null;
  return new Date(`${d}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function ChangeList({ changes }: { changes: ProposedChange[] }) {
  const adds = changes.filter((c) => c.type === 'add');
  const edits = changes.filter((c) => c.type === 'edit');
  const deletes = changes.filter((c) => c.type === 'delete');
  const breakDowns = changes.filter((c) => c.type === 'break_down');

  return (
    <div className="space-y-3">
      {adds.length > 0 && (
        <section>
          <p className="text-xs font-semibold uppercase tracking-wide text-green-700 mb-1">
            Add ({adds.length})
          </p>
          <ul className="space-y-2">
            {adds.map((c, i) => (
              <li
                key={`add-${i}`}
                className="border border-green-200 bg-green-50 rounded-lg p-2.5"
              >
                <p className="text-sm font-medium text-gray-900">{c.title}</p>
                {c.description && (
                  <p className="text-xs text-gray-600 mt-0.5">{c.description}</p>
                )}
                {c.due_date && (
                  <p className="text-xs text-gray-500 mt-0.5">Due {formatDueDate(c.due_date)}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {edits.length > 0 && (
        <section>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 mb-1">
            Edit ({edits.length})
          </p>
          <ul className="space-y-2">
            {edits.map((c, i) => (
              <li
                key={`edit-${i}`}
                className="border border-blue-200 bg-blue-50 rounded-lg p-2.5"
              >
                <p className="text-sm font-medium text-gray-900">
                  {c.originalTitle || '(unknown task)'}
                </p>
                <ul className="mt-1 space-y-0.5 text-xs text-gray-700">
                  {c.title !== undefined && c.title !== c.originalTitle && (
                    <li>
                      <span className="text-gray-500">Title:</span> {c.title}
                    </li>
                  )}
                  {c.description !== undefined &&
                    c.description !== c.originalDescription && (
                      <li>
                        <span className="text-gray-500">Description:</span>{' '}
                        {c.description || '(cleared)'}
                      </li>
                    )}
                  {c.due_date !== undefined && c.due_date !== c.originalDueDate && (
                    <li>
                      <span className="text-gray-500">Due:</span>{' '}
                      {formatDueDate(c.originalDueDate) || '—'} →{' '}
                      {formatDueDate(c.due_date) || '—'}
                    </li>
                  )}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      )}

      {deletes.length > 0 && (
        <section>
          <p className="text-xs font-semibold uppercase tracking-wide text-red-700 mb-1">
            Drop ({deletes.length})
          </p>
          <ul className="space-y-2">
            {deletes.map((c, i) => (
              <li
                key={`del-${i}`}
                className="border border-red-200 bg-red-50 rounded-lg p-2.5"
              >
                <p className="text-sm font-medium text-gray-900 line-through decoration-red-400">
                  {c.originalTitle || '(unknown task)'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Marked as dropped (preserved for audit)
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {breakDowns.length > 0 && (
        <section>
          <p className="text-xs font-semibold uppercase tracking-wide text-purple-700 mb-1">
            Break down ({breakDowns.length})
          </p>
          <ul className="space-y-2">
            {breakDowns.map((c, i) => (
              <li
                key={`bd-${i}`}
                className="border border-purple-200 bg-purple-50 rounded-lg p-2.5"
              >
                <p className="text-sm font-medium text-gray-900 line-through decoration-purple-400">
                  {c.originalTitle || '(unknown task)'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 mb-1.5">
                  Replaced by {c.subtasks?.length || 0} subtasks:
                </p>
                <ul className="space-y-1 pl-2 border-l-2 border-purple-300">
                  {(c.subtasks || []).map((s, j) => (
                    <li key={`bd-${i}-s-${j}`} className="text-xs">
                      <p className="font-medium text-gray-900">• {s.title}</p>
                      {s.description && (
                        <p className="text-gray-600 ml-2">{s.description}</p>
                      )}
                      {s.due_date && (
                        <p className="text-gray-500 ml-2">Due {formatDueDate(s.due_date)}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
