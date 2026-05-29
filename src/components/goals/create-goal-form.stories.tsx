import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import CreateGoalForm from './create-goal-form';

const meta: Meta<typeof CreateGoalForm> = {
  title: 'Organisms/CreateGoalForm',
  component: CreateGoalForm,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof CreateGoalForm>;

export const Default: Story = {};
