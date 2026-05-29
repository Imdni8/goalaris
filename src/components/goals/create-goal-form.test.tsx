import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, it, expect, vi } from 'vitest';
import CreateGoalForm from './create-goal-form';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { getUser: () => Promise.resolve({ data: { user: { id: 'u1' } } }) },
    from: () => ({
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: { id: 'g1' }, error: null }),
        }),
      }),
    }),
  }),
}));

describe('CreateGoalForm', () => {
  it('renders all SMART criteria fields and actions', () => {
    render(<CreateGoalForm />);
    expect(screen.getByPlaceholderText(/Improve team collaboration/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'SMART Criteria' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Goal' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<CreateGoalForm />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
