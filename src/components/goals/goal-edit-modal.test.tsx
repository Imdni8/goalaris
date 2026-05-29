import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, it, expect, vi } from 'vitest';
import GoalEditModal from './goal-edit-modal';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      update: () => ({ eq: () => Promise.resolve({ error: null }) }),
      delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
    }),
  }),
}));

const sampleGoal = {
  id: 'goal-1',
  title: 'Ship the design system',
  description: 'Tokens, stories, tests.',
  specific: 'Migrate every component.',
  measurable: 'Lint clean + story + test.',
  achievable: 'Two weeks.',
  relevant: 'Velocity and consistency.',
  time_bound: '2026-06-30',
};

describe('GoalEditModal', () => {
  it('renders title and form fields', () => {
    render(<GoalEditModal goal={sampleGoal} onClose={() => {}} />);
    expect(screen.getByRole('heading', { name: 'Edit Goal' })).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toHaveValue('Ship the design system');
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<GoalEditModal goal={sampleGoal} onClose={() => {}} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
