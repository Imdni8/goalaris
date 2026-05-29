import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import GoalEditModal from './goal-edit-modal';

const meta: Meta<typeof GoalEditModal> = {
  title: 'Organisms/GoalEditModal',
  component: GoalEditModal,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof GoalEditModal>;

const sampleGoal = {
  id: 'goal-1',
  title: 'Ship the design system',
  description: 'Establish tokens, Storybook, and conventions so new features ship with consistent UI.',
  specific: 'Migrate every component to semantic tokens and add a story + test per file.',
  measurable: '100% of components pass `npx next lint` and have a Storybook story.',
  achievable: 'Two weeks of focused work, one component per touch.',
  relevant: 'Unblocks product velocity and design consistency.',
  time_bound: '2026-06-30',
};

export const Default: Story = {
  args: {
    goal: sampleGoal,
    onClose: () => {},
  },
};

export const Empty: Story = {
  args: {
    goal: {
      id: 'goal-2',
      title: 'New goal',
      description: null,
      specific: null,
      measurable: null,
      achievable: null,
      relevant: null,
      time_bound: null,
    },
    onClose: () => {},
  },
};
