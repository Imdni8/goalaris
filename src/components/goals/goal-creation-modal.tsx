'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import RefinableSmartField from './refinable-smart-field';

interface Message {
  id: string;
  from: 'coach' | 'user';
  text: string;
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
  name?: string;
  jobTitle?: string;
  team?: string;
  company?: string;
  careerGoal?: string;
  keySkills?: string[];
}

type ConversationStep = 'entry' | 'timeline' | 'stakeholders' | 'success' | 'draft';

const CONVERSATION_STEPS: Record<ConversationStep, { coachMsg?: string; options: Array<{ id: string; label: string; icon?: string }>; multiSelect?: boolean }> = {
  entry: {
    options: [
      { id: 'suggest', label: 'Suggest goals for me', icon: '💡' },
    ],
  },
  timeline: {
    coachMsg: 'Great pick. What timeline are you working with?',
    options: [
      { id: 'q1', label: 'This quarter (Q1)' },
      { id: 'h1', label: 'Spread across H1' },
      { id: 'full_year', label: 'Full year goal' },
    ],
    multiSelect: false,
  },
  stakeholders: {
    coachMsg: 'Got it. Who do you need buy-in from to make this happen?',
    options: [
      { id: 'manager', label: 'My direct manager' },
      { id: 'cross_func', label: 'Cross-functional leads (PM, Eng)' },
      { id: 'skip_level', label: 'Skip-level / Director' },
    ],
    multiSelect: false,
  },
  success: {
    coachMsg: 'Last one — how will you know this goal succeeded? What does "done well" look like?',
    options: [
      { id: 'ship', label: 'Feature shipped to production' },
      { id: 'feedback', label: 'Positive stakeholder feedback' },
      { id: 'metrics', label: 'Measurable impact on team metrics' },
    ],
    multiSelect: true,
  },
  draft: {
    options: [],
  },
};

interface GoalSuggestion {
  id: string;
  title: string;
  description: string;
}

interface InputAreaProps {
  step: ConversationStep | null;
  isShowingSuggestions: boolean;
  isDone: boolean;
  onOptionSelect: (optionId: string) => void;
  onTextSend: (text: string) => void;
  selectedMultiOptions?: string[];
  onMultiSelectSubmit?: () => void;
  multiSelectMode?: 'select' | 'text';
  onModeChange?: (mode: 'select' | 'text') => void;
}

const CoachAvatar = ({ size = 30 }: { size?: number }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontWeight: 700,
      fontSize: size * 0.4,
      flexShrink: 0,
    }}
  >
    G
  </div>
);

const TypingDots = () => (
  <div style={{ display: 'flex', gap: 4, padding: '4px 0' }}>
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: '#c4a88a',
          animation: `bounce 1.2s infinite ${i * 0.15}s`,
        }}
      />
    ))}
  </div>
);

const GoalSuggestionCards = ({ suggestions, onSelect }: { suggestions: GoalSuggestion[]; onSelect: (suggestion: GoalSuggestion) => void }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginLeft: 38, marginBottom: 8 }}>
    {suggestions.map((goal, i) => (
      <button
        key={goal.id}
        onClick={() => onSelect(goal)}
        style={{
          padding: '14px 16px',
          background: '#fff',
          border: '1.5px solid #e8ddd0',
          borderRadius: 12,
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'all 0.2s ease',
          fontFamily: 'inherit',
          animation: `slideUp 0.3s cubic-bezier(0.16,1,0.3,1) ${i * 0.06}s both`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#2563eb';
          e.currentTarget.style.background = '#fffaf6';
          e.currentTarget.style.transform = 'translateX(3px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#e8ddd0';
          e.currentTarget.style.background = '#fff';
          e.currentTarget.style.transform = 'translateX(0)';
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 13, color: '#3d2e1f', marginBottom: 3 }}>
          {goal.title}
        </div>
        <div style={{ fontSize: 12, color: '#8a7a6a', lineHeight: 1.4 }}>
          {goal.description}
        </div>
      </button>
    ))}
  </div>
);

const MessageBubble = ({ from, text }: { from: 'coach' | 'user'; text: string }) => {
  const isCoach = from === 'coach';
  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
        justifyContent: isCoach ? 'flex-start' : 'flex-end',
        marginBottom: 8,
        animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      {isCoach && <CoachAvatar size={28} />}
      <div
        style={{
          maxWidth: '82%',
          padding: '10px 15px',
          borderRadius: 16,
          background: isCoach ? '#faf5ef' : '#2563eb',
          color: isCoach ? '#3d2e1f' : '#fff',
          fontSize: 13.5,
          lineHeight: 1.55,
          borderBottomLeftRadius: isCoach ? 4 : 16,
          borderBottomRightRadius: isCoach ? 16 : 4,
        }}
      >
        {text}
      </div>
    </div>
  );
};

const InputArea = ({
  step,
  isShowingSuggestions,
  isDone,
  onOptionSelect,
  onTextSend,
  selectedMultiOptions = [],
  onMultiSelectSubmit,
  multiSelectMode = 'select',
  onModeChange,
}: InputAreaProps) => {
  const [isActive, setIsActive] = useState(false);
  const [textVal, setTextVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step) {
      setIsActive(false);
      setTextVal('');
    }
  }, [step]);

  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive]);

  const handleSend = () => {
    if (textVal.trim()) {
      onTextSend(textVal.trim());
      setTextVal('');
      setIsActive(false);
    }
  };

  const isMultiSelectStep = step && CONVERSATION_STEPS[step as ConversationStep]?.multiSelect;

  if (!step) {
    if (isShowingSuggestions) {
      return (
        <div style={{ fontSize: 12, color: '#8a7a6a', textAlign: 'center', padding: 6 }}>
          Pick a goal above, or type your own
        </div>
      );
    }
    if (isDone) {
      return (
        <div style={{ fontSize: 12, color: '#8a7a6a', textAlign: 'center', padding: 6 }}>
          Review your goal draft above ↑
        </div>
      );
    }
    return (
      <div style={{ fontSize: 13, fontWeight: 500, textAlign: 'center', padding: 10, animation: 'pulse-text 1.5s ease-in-out infinite', color: '#b0a090' }}>
        Coach is thinking...
      </div>
    );
  }

  // Entry step - resting state
  if (step === 'entry' && !isActive) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, animation: 'fadeIn 0.3s ease' }}>
        <button
          onClick={() => setIsActive(true)}
          style={{
            padding: '12px 16px',
            background: '#fff',
            border: '1.5px solid #e8ddd0',
            borderRadius: 10,
            cursor: 'text',
            textAlign: 'left',
            fontSize: 13.5,
            color: '#b0a090',
            fontFamily: 'inherit',
            transition: 'all 0.18s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#d0c4b4';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e8ddd0';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Describe your goal...
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '2px 0' }}>
          <div style={{ flex: 1, height: 1, background: '#e8ddd0' }} />
          <span style={{ fontSize: 11, color: '#b0a090', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.8 }}>
            or
          </span>
          <div style={{ flex: 1, height: 1, background: '#e8ddd0' }} />
        </div>

        <button
          onClick={() => onOptionSelect('suggest')}
          style={{
            padding: '12px 16px',
            background: '#fff',
            border: '1.5px solid #e8ddd0',
            borderRadius: 10,
            cursor: 'pointer',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 13,
            fontWeight: 600,
            color: '#3d2e1f',
            fontFamily: 'inherit',
            transition: 'all 0.18s ease',
            animation: 'slideUp 0.25s cubic-bezier(0.16,1,0.3,1) 0.06s both',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#2563eb';
            e.currentTarget.style.background = '#fffaf6';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(224,122,79,0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e8ddd0';
            e.currentTarget.style.background = '#fff';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <span>💡</span>
          Suggest goals for me
        </button>
      </div>
    );
  }

  // Active text input
  if (isActive) {
    return (
      <div style={{ display: 'flex', gap: 8, animation: 'fadeIn 0.3s ease' }}>
        <button
          onClick={() => setIsActive(false)}
          style={{
            width: 38,
            height: 42,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#faf5ef',
            border: '1.5px solid #e8ddd0',
            borderRadius: 10,
            cursor: 'pointer',
            color: '#8a7a6a',
            fontSize: 16,
            fontFamily: 'inherit',
            flexShrink: 0,
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#2563eb';
            e.currentTarget.style.color = '#2563eb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e8ddd0';
            e.currentTarget.style.color = '#8a7a6a';
          }}
        >
          ←
        </button>
        <input
          ref={inputRef}
          value={textVal}
          onChange={(e) => setTextVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
          placeholder="Describe your goal..."
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 10,
            border: '1.5px solid #2563eb',
            outline: 'none',
            fontSize: 13.5,
            fontFamily: 'inherit',
            color: '#3d2e1f',
            background: '#fff',
            boxShadow: '0 0 0 3px rgba(224,122,79,0.1)',
          }}
        />
        <button
          onClick={handleSend}
          style={{
            padding: '10px 18px',
            background: textVal.trim() ? '#2563eb' : '#e8ddd0',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            cursor: textVal.trim() ? 'pointer' : 'default',
            fontWeight: 600,
            fontSize: 13,
            fontFamily: 'inherit',
            transition: 'all 0.2s',
          }}
        >
          Send
        </button>
      </div>
    );
  }

  // Options mode
  if (step && step !== 'entry') {
    const stepConfig = CONVERSATION_STEPS[step];
    const isMultiSelectSuccess = stepConfig.multiSelect && step === 'success';

    // For multi-select success in select mode: show options + submit button
    if (isMultiSelectSuccess && multiSelectMode === 'select') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, animation: 'fadeIn 0.3s ease' }}>
          {/* Show selected chips */}
          {selectedMultiOptions.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
              {selectedMultiOptions.map((optId) => {
                const opt = stepConfig.options.find((o) => o.id === optId);
                if (!opt) return null;
                return (
                  <div
                    key={optId}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 12px',
                      background: '#e0e7ff',
                      borderRadius: 16,
                      fontSize: 12,
                      fontWeight: 500,
                      color: '#2563eb',
                    }}
                  >
                    {opt.label}
                    <button
                      onClick={() => onOptionSelect(optId)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#2563eb',
                        fontSize: 16,
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        fontFamily: 'inherit',
                      }}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Options buttons */}
          {stepConfig.options.map((opt, i) => {
            const isSelected = selectedMultiOptions.includes(opt.id);
            return (
              <button
                key={opt.id}
                onClick={() => onOptionSelect(opt.id)}
                style={{
                  padding: '11px 16px',
                  background: isSelected ? '#e0e7ff' : '#fff',
                  border: isSelected ? '1.5px solid #2563eb' : '1.5px solid #e8ddd0',
                  borderRadius: 10,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: 13,
                  fontWeight: 600,
                  color: isSelected ? '#2563eb' : '#3d2e1f',
                  fontFamily: 'inherit',
                  transition: 'all 0.18s ease',
                  animation: `slideUp 0.35s cubic-bezier(0.16,1,0.3,1) ${i * 0.12}s both`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#2563eb';
                  e.currentTarget.style.background = isSelected ? '#e0e7ff' : '#fffaf6';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = isSelected ? '#2563eb' : '#e8ddd0';
                  e.currentTarget.style.background = isSelected ? '#e0e7ff' : '#fff';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {opt.label}
              </button>
            );
          })}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            {selectedMultiOptions.length > 0 && (
              <button
                onClick={onMultiSelectSubmit}
                style={{
                  flex: 1,
                  padding: '11px 16px',
                  background: '#2563eb',
                  border: '1.5px solid #2563eb',
                  borderRadius: 10,
                  cursor: 'pointer',
                  textAlign: 'center',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#fff',
                  fontFamily: 'inherit',
                  transition: 'all 0.18s ease',
                  animation: `slideUp 0.25s cubic-bezier(0.16,1,0.3,1) ${stepConfig.options.length * 0.04}s both`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#1d4ed8';
                  e.currentTarget.style.borderColor = '#1d4ed8';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#2563eb';
                  e.currentTarget.style.borderColor = '#2563eb';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Continue
              </button>
            )}

            <button
              onClick={() => onModeChange?.('text')}
              style={{
                flex: selectedMultiOptions.length > 0 ? 0.8 : 1,
                padding: '11px 16px',
                background: 'transparent',
                border: '1.5px dashed #d9cfc2',
                borderRadius: 10,
                cursor: 'pointer',
                textAlign: 'center',
                fontSize: 13,
                fontWeight: 500,
                color: '#8a7a6a',
                fontFamily: 'inherit',
                transition: 'all 0.18s ease',
                animation: `slideUp 0.25s cubic-bezier(0.16,1,0.3,1) ${stepConfig.options.length * 0.04}s both`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#c4a88a';
                e.currentTarget.style.background = '#faf7f3';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#d9cfc2';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {selectedMultiOptions.length > 0 ? 'Add custom' : 'Type my own'}
            </button>
          </div>
        </div>
      );
    }

    // For multi-select success in text mode: show text input
    if (isMultiSelectSuccess && multiSelectMode === 'text' && isActive) {
      return (
        <div style={{ display: 'flex', gap: 8, animation: 'fadeIn 0.3s ease' }}>
          <button
            onClick={() => onModeChange?.('select')}
            style={{
              width: 38,
              height: 42,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#faf5ef',
              border: '1.5px solid #e8ddd0',
              borderRadius: 10,
              cursor: 'pointer',
              color: '#8a7a6a',
              fontSize: 16,
              fontFamily: 'inherit',
              flexShrink: 0,
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#2563eb';
              e.currentTarget.style.color = '#2563eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e8ddd0';
              e.currentTarget.style.color = '#8a7a6a';
            }}
          >
            ←
          </button>
          <input
            ref={inputRef}
            value={textVal}
            onChange={(e) => setTextVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder="Add custom criteria..."
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 10,
              border: '1.5px solid #2563eb',
              outline: 'none',
              fontSize: 13.5,
              fontFamily: 'inherit',
              color: '#3d2e1f',
              background: '#fff',
              boxShadow: '0 0 0 3px rgba(37,99,235,0.1)',
            }}
          />
          <button
            onClick={handleSend}
            style={{
              padding: '10px 18px',
              background: textVal.trim() ? '#2563eb' : '#e8ddd0',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              cursor: textVal.trim() ? 'pointer' : 'default',
              fontWeight: 600,
              fontSize: 13,
              fontFamily: 'inherit',
              transition: 'all 0.2s',
            }}
          >
            Add
          </button>
        </div>
      );
    }

    // Default single-select mode
    const showTextOption = !stepConfig.multiSelect;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, animation: 'fadeIn 0.3s ease' }}>
        {stepConfig.options.map((opt, i) => (
          <button
            key={opt.id}
            onClick={() => onOptionSelect(opt.id)}
            style={{
              padding: '11px 16px',
              background: '#fff',
              border: '1.5px solid #e8ddd0',
              borderRadius: 10,
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: 13,
              fontWeight: 600,
              color: '#3d2e1f',
              fontFamily: 'inherit',
              transition: 'all 0.18s ease',
              animation: `slideUp 0.35s cubic-bezier(0.16,1,0.3,1) ${i * 0.12}s both`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#2563eb';
              e.currentTarget.style.background = '#fffaf6';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e8ddd0';
              e.currentTarget.style.background = '#fff';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {opt.label}
          </button>
        ))}
        {showTextOption && (
          <button
            onClick={() => setIsActive(true)}
            style={{
              padding: '11px 16px',
              background: 'transparent',
              border: '1.5px dashed #d9cfc2',
              borderRadius: 10,
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: 13,
              fontWeight: 500,
              color: '#8a7a6a',
              fontFamily: 'inherit',
              transition: 'all 0.18s ease',
              animation: `slideUp 0.25s cubic-bezier(0.16,1,0.3,1) ${stepConfig.options.length * 0.04}s both`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#c4a88a';
              e.currentTarget.style.background = '#faf7f3';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#d9cfc2';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            Type my own answer
          </button>
        )}
      </div>
    );
  }

  return null;
};

interface GoalCreationModalProps {
  open: boolean;
  onClose: () => void;
  userProfile: UserProfile;
}

export default function GoalCreationModal({ open, onClose, userProfile }: GoalCreationModalProps) {
  const router = useRouter();
  const supabase = createClient();

  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState<ConversationStep>('entry');
  const [isCoachTyping, setIsCoachTyping] = useState(false);
  const [goalDraft, setGoalDraft] = useState<GoalDraft | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<GoalSuggestion[]>([]);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedMultiOptions, setSelectedMultiOptions] = useState<string[]>([]);
  const [multiSelectMode, setMultiSelectMode] = useState<'select' | 'text'>('select');
  const [refinementText, setRefinementText] = useState('');

  // Track conversation answers
  const [conversationAnswers, setConversationAnswers] = useState({
    goalTitle: '',
    timeline: '',
    stakeholders: '',
    successCriteria: [] as string[],
  });

  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 50);
    }
  }, [messages, isCoachTyping, showSuggestions, isDone]);

  const resetModal = () => {
    setMessages([]);
    setCurrentStep('entry');
    setIsCoachTyping(false);
    setGoalDraft(null);
    setShowSuggestions(false);
    setIsDone(false);
    setError(null);
    setSelectedMultiOptions([]);
    setMultiSelectMode('select');
    setRefinementText('');
    setConversationAnswers({
      goalTitle: '',
      timeline: '',
      stakeholders: '',
      successCriteria: [] as string[],
    });
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const addCoachMessage = (text: string, callback?: () => void) => {
    setIsCoachTyping(true);
    setCurrentStep(null as any);
    setTimeout(() => {
      setIsCoachTyping(false);
      setMessages((prev) => [...prev, { id: Date.now().toString(), from: 'coach', text }]);
      callback?.();
    }, 700);
  };

  const addUserMessage = (text: string) => {
    setMessages((prev) => [...prev, { id: Date.now().toString(), from: 'user', text }]);
  };

  const advanceStep = (nextStep: ConversationStep) => {
    const stepConfig = CONVERSATION_STEPS[nextStep];
    if (stepConfig.coachMsg) {
      addCoachMessage(stepConfig.coachMsg, () => {
        setCurrentStep(nextStep);
      });
    } else {
      setCurrentStep(nextStep);
    }
  };

  const handleOptionSelect = async (optionId: string) => {
    if (currentStep === 'entry' && optionId === 'suggest') {
      addUserMessage('Suggest goals for me');
      addCoachMessage(
        `Since you're aiming to ${userProfile.careerGoal?.toLowerCase() || 'advance your career'}, here are some directions that could build your case:`,
        async () => {
          try {
            const response = await fetch('/api/ai/suggest-goals', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                careerGoal: userProfile.careerGoal,
                jobTitle: userProfile.jobTitle,
                company: userProfile.company,
              }),
            });

            if (!response.ok) {
              const data = await response.json();
              setError(data.error || 'Failed to generate goal suggestions');
              return;
            }

            const data = await response.json();
            const suggestionsList = (data.suggestions || []).map((s: any, idx: number) => ({
              id: `suggestion-${idx}`,
              title: s.title,
              description: s.description,
            }));
            setSuggestions(suggestionsList);
            setShowSuggestions(true);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch suggestions');
          }
        }
      );
      return;
    }

    // Get the option label
    const stepConfig = CONVERSATION_STEPS[currentStep as ConversationStep];
    const option = stepConfig.options.find((o) => o.id === optionId);
    if (!option) return;

    // Handle multi-select for success criteria
    if (currentStep === 'success' && stepConfig.multiSelect) {
      const isSelected = selectedMultiOptions.includes(optionId);
      if (isSelected) {
        // Deselect
        setSelectedMultiOptions((prev) => prev.filter((id) => id !== optionId));
        setConversationAnswers((prev) => ({
          ...prev,
          successCriteria: prev.successCriteria.filter((label) => label !== option.label),
        }));
      } else {
        // Select - only add user message on first selection
        const wasEmpty = selectedMultiOptions.length === 0;
        setSelectedMultiOptions((prev) => [...prev, optionId]);
        setConversationAnswers((prev) => ({
          ...prev,
          successCriteria: [...prev.successCriteria, option.label],
        }));
        if (wasEmpty) {
          addUserMessage(option.label);
        }
      }
      return;
    }

    // Single-select flow
    if (currentStep === 'timeline') {
      setConversationAnswers((prev) => ({ ...prev, timeline: option.label }));
      addUserMessage(option.label);
    } else if (currentStep === 'stakeholders') {
      setConversationAnswers((prev) => ({ ...prev, stakeholders: option.label }));
      addUserMessage(option.label);
    }

    // Advance to next step
    const steps: ConversationStep[] = ['entry', 'timeline', 'stakeholders', 'success', 'draft'];
    const currentIdx = steps.indexOf(currentStep as ConversationStep);
    const nextIdx = currentIdx + 1;

    if (nextIdx >= steps.length) {
      await generateGoalDraft();
    } else {
      advanceStep(steps[nextIdx]);
    }
  };

  const handleSuggestionSelect = (suggestion: GoalSuggestion) => {
    setShowSuggestions(false);
    setConversationAnswers((prev) => ({ ...prev, goalTitle: suggestion.title }));
    addUserMessage(suggestion.title);
    addCoachMessage('Love it — let me ask a few things to make this SMART and trackable.', () => {
      advanceStep('timeline');
    });
  };

  const handleMultiSelectSubmit = async () => {
    // Show the selections as user message
    if (selectedMultiOptions.length > 0) {
      // Add remaining selected options to message (if more than first)
      const stepConfig = CONVERSATION_STEPS['success'];
      const selectedLabels = selectedMultiOptions
        .map((id) => stepConfig.options.find((o) => o.id === id)?.label)
        .filter(Boolean);

      // If there are multiple selections, show them
      if (selectedLabels.length > 1) {
        const additionalLabels = selectedLabels.slice(1);
        additionalLabels.forEach((label) => {
          if (label) addUserMessage(label);
        });
      }
    }

    // Generate the goal draft
    await generateGoalDraft();
  };

  const handleTextSend = async (text: string) => {
    if (currentStep === 'entry') {
      addUserMessage(text);
      setConversationAnswers((prev) => ({ ...prev, goalTitle: text }));
      addCoachMessage('Love it — let me ask a few things to make this SMART and trackable.', () => {
        advanceStep('timeline');
      });
    } else if (currentStep === 'success' && multiSelectMode === 'text') {
      // Multi-select: add free text answer and generate draft
      addUserMessage(text);
      setConversationAnswers((prev) => ({
        ...prev,
        successCriteria: [...prev.successCriteria, text],
      }));
      await generateGoalDraft();
    } else {
      addUserMessage(text);
      const steps: ConversationStep[] = ['entry', 'timeline', 'stakeholders', 'success', 'draft'];
      const currentIdx = steps.indexOf(currentStep as ConversationStep);
      const nextIdx = currentIdx + 1;

      if (nextIdx >= steps.length) {
        await generateGoalDraft();
      } else {
        advanceStep(steps[nextIdx]);
      }
    }
  };

  const generateGoalDraft = async () => {
    setIsLoading(true);
    setCurrentStep(null as any); // Show "Coach is thinking..." state

    try {
      const response = await fetch('/api/ai/generate-goal-from-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(conversationAnswers),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to generate goal draft');
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      setGoalDraft(data.smartGoal);

      addCoachMessage("Perfect — here's your goal draft. I've woven in your choices. Take a look:", () => {
        setIsDone(true);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate goal draft');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefinement = async () => {
    if (!refinementText.trim() || !goalDraft) return;

    // Show user feedback message
    addUserMessage(refinementText);

    // Show coach is thinking
    setIsLoading(true);
    const feedbackText = refinementText;
    setRefinementText('');
    setCurrentStep(null as any);

    try {
      // Call refinement API to actually improve the goal draft
      const response = await fetch('/api/ai/refine-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalDraft,
          refinementFeedback: feedbackText,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to refine goal');
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      setGoalDraft(data.smartGoal);

      addCoachMessage("Done! I've refined your goal based on your feedback. Take another look:", () => {
        setIsLoading(false);
        setCurrentStep('draft' as any);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process refinement');
      setIsLoading(false);
    }
  };

  const handleApproveGoal = async () => {
    if (!goalDraft) return;

    try {
      setIsLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setError('You must be logged in');
        return;
      }

      const { data: insertedData, error: insertError } = await supabase
        .from('goals')
        .insert([
          {
            user_id: userData.user.id,
            title: goalDraft.title,
            description: goalDraft.description,
            specific: goalDraft.specific,
            measurable: goalDraft.measurable,
            achievable: goalDraft.achievable,
            relevant: goalDraft.relevant,
            time_bound: goalDraft.time_bound,
            status: 'active',
            ai_suggested: true,
          },
        ])
        .select();

      if (insertError) {
        setError(insertError.message);
        setIsLoading(false);
        return;
      }

      const goalId = insertedData?.[0]?.id;

      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventName: 'goal_created', properties: { type: 'ai_modal' } }),
      }).catch(console.error);

      handleClose();
      if (goalId) {
        router.push(`/dashboard/goals/${goalId}`);
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save goal');
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
        @keyframes backdropIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.94) translateY(16px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes pulse-text {
          0%, 100% { opacity: 1; color: #b0a090; transform: scale(1); }
          50% { opacity: 0.4; color: #2563eb; transform: scale(1.02); }
        }
      `}</style>

      <div
        onClick={handleClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          background: 'rgba(61,46,31,0.22)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'backdropIn 0.25s ease',
          fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: 520,
            maxHeight: '82vh',
            background: '#fff',
            borderRadius: 20,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 24px 80px rgba(61,46,31,0.18), 0 2px 8px rgba(61,46,31,0.06)',
            animation: 'modalIn 0.35s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #ece5dc',
              background: 'linear-gradient(135deg, #fffcf9 0%, #fff5ed 100%)',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CoachAvatar size={30} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#3d2e1f' }}>Goal Coach</div>
                <div style={{ fontSize: 11, color: '#8a7a6a' }}>Let&apos;s shape your next goal</div>
              </div>
            </div>
            <button
              onClick={handleClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 20,
                color: '#8a7a6a',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                transition: 'background 0.15s',
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f3ede5')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflow: 'auto',
              padding: 20,
              minHeight: 200,
            }}
          >
            <MessageBubble
              from="coach"
              text={`Hey ${userProfile.name || 'there'}! You're aiming to ${userProfile.careerGoal?.toLowerCase() || 'advance your career'} — let's build a goal that gets you closer.`}
            />

            {messages.map((msg) => (
              <MessageBubble key={msg.id} from={msg.from} text={msg.text} />
            ))}

            {isCoachTyping && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8, animation: 'slideUp 0.3s ease' }}>
                <CoachAvatar size={28} />
                <div style={{ padding: '10px 15px', borderRadius: 16, borderBottomLeftRadius: 4, background: '#faf5ef' }}>
                  <TypingDots />
                </div>
              </div>
            )}

            {showSuggestions && suggestions.length > 0 && (
              <GoalSuggestionCards
                suggestions={suggestions}
                onSelect={handleSuggestionSelect}
              />
            )}

            {error && (
              <div style={{ padding: 12, borderRadius: 8, background: '#fee2e2', color: '#dc2626', fontSize: 12 }}>
                {error}
              </div>
            )}

            {isDone && goalDraft && (
              <div
                style={{
                  margin: '8px 0 8px 38px',
                  padding: 18,
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, #fffaf6 0%, #fff5ed 100%)',
                  border: '1.5px solid #e8ddd0',
                  animation: 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)',
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 }}>
                  Draft Goal
                </div>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: '#3d2e1f', marginBottom: 6 }}>
                  {goalDraft.title}
                </div>
                <div style={{ fontSize: 12.5, color: '#6b5d4f', lineHeight: 1.5, marginBottom: 12 }}>
                  {goalDraft.description}
                </div>
                <Button
                  onClick={handleApproveGoal}
                  style={{ width: '100%', marginBottom: 12 }}
                >
                  Approve & Generate Tasks
                </Button>

                {/* Refinement field */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#8a7a6a' }}>
                    Refine the draft (optional)
                  </label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="text"
                      value={refinementText}
                      onChange={(e) => setRefinementText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && refinementText.trim()) {
                          handleRefinement();
                        }
                      }}
                      placeholder="e.g., make it more specific, adjust timeline..."
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: '1.5px solid #e8ddd0',
                        outline: 'none',
                        fontSize: 12.5,
                        fontFamily: 'inherit',
                        color: '#3d2e1f',
                        background: '#fff',
                        transition: 'all 0.15s ease',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#2563eb';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#e8ddd0';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                    <button
                      onClick={handleRefinement}
                      disabled={!refinementText.trim()}
                      style={{
                        padding: '10px 14px',
                        background: refinementText.trim() ? '#2563eb' : '#e8ddd0',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 10,
                        cursor: refinementText.trim() ? 'pointer' : 'default',
                        fontWeight: 600,
                        fontSize: 12,
                        fontFamily: 'inherit',
                        transition: 'all 0.2s',
                        minWidth: 50,
                      }}
                      onMouseEnter={(e) => {
                        if (refinementText.trim()) {
                          e.currentTarget.style.background = '#1d4ed8';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.2)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = refinementText.trim() ? '#2563eb' : '#e8ddd0';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          {!isDone && (
            <div
              style={{
                padding: 14,
                borderTop: '1px solid #ece5dc',
                background: '#faf7f3',
                flexShrink: 0,
              }}
            >
              <InputArea
                step={showSuggestions ? null : currentStep}
                isShowingSuggestions={showSuggestions}
                isDone={isDone}
                onOptionSelect={handleOptionSelect}
                onTextSend={handleTextSend}
                selectedMultiOptions={selectedMultiOptions}
                onMultiSelectSubmit={handleMultiSelectSubmit}
                multiSelectMode={multiSelectMode}
                onModeChange={setMultiSelectMode}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
