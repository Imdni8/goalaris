import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, it, expect, vi } from 'vitest';
import GoalListCard from './goal-list-card';

const goal = {
  id: 'g1',
  title: 'Ship the design system',
  description: 'Establish tokens, Storybook, and conventions.',
  status: 'active',
  time_bound: '2026-06-30',
  progress_pct: 45,
  velocity_state: 'STEADY' as const,
};

describe('GoalListCard', () => {
  it('renders title, description, and target date', () => {
    render(
      <GoalListCard
        goal={goal}
        selected={false}
        selectMode={false}
        onToggleSelect={() => {}}
        query=""
      />
    );
    expect(screen.getByRole('heading', { name: /Ship the design system/ })).toBeInTheDocument();
    expect(screen.getByText(/Establish tokens/)).toBeInTheDocument();
    expect(screen.getByText(/Target ·/)).toBeInTheDocument();
  });

  it('toggles select when clicked in selectMode', () => {
    const onToggle = vi.fn();
    render(
      <GoalListCard
        goal={goal}
        selected={false}
        selectMode={true}
        onToggleSelect={onToggle}
        query=""
      />
    );
    screen.getByRole('button').click();
    expect(onToggle).toHaveBeenCalledWith('g1');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <GoalListCard
        goal={goal}
        selected={false}
        selectMode={false}
        onToggleSelect={() => {}}
        query=""
      />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
