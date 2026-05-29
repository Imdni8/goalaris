import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import GoalListCard from './goal-list-card';

const meta: Meta<typeof GoalListCard> = {
  title: 'Organisms/GoalListCard',
  component: GoalListCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof GoalListCard>;

const baseGoal = {
  id: 'g1',
  title: 'Ship the design system',
  description: 'Establish tokens, Storybook, and conventions so new features ship with consistent UI.',
  status: 'active',
  time_bound: '2026-06-30',
  progress_pct: 45,
  velocity_state: 'STEADY' as const,
};

export const Steady: Story = {
  args: {
    goal: baseGoal,
    selected: false,
    selectMode: false,
    onToggleSelect: () => {},
    query: '',
  },
};

export const Ahead: Story = {
  args: { ...Steady.args!, goal: { ...baseGoal, progress_pct: 80, velocity_state: 'AHEAD' } },
};

export const Lagging: Story = {
  args: { ...Steady.args!, goal: { ...baseGoal, progress_pct: 18, velocity_state: 'LAGGING' } },
};

export const Zero: Story = {
  args: { ...Steady.args!, goal: { ...baseGoal, progress_pct: 0, velocity_state: 'ZERO' } },
};

export const Selected: Story = {
  args: { ...Steady.args!, selectMode: true, selected: true },
};

export const WithHighlight: Story = {
  args: { ...Steady.args!, query: 'design' },
};
