import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import ConversationalGoalForm from './conversational-goal-form';

const meta: Meta<typeof ConversationalGoalForm> = {
  title: 'Organisms/ConversationalGoalForm',
  component: ConversationalGoalForm,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof ConversationalGoalForm>;

export const Default: Story = {};
