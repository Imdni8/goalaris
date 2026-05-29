import { render, screen, waitFor } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, it, expect, vi } from 'vitest';
import ConversationalGoalForm from './conversational-goal-form';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), back: vi.fn() }),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: () => Promise.resolve({ data: { user: { id: 'u1' } } }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { career_goal: null }, error: null }),
        }),
      }),
    }),
  }),
}));

describe('ConversationalGoalForm', () => {
  it('renders the chat input and send button', async () => {
    render(<ConversationalGoalForm />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Tell me more about your goal/)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<ConversationalGoalForm />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Tell me more about your goal/)).toBeInTheDocument();
    });
    expect(await axe(container)).toHaveNoViolations();
  });
});
