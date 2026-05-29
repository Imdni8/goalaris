import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Label } from './label';
import docs from '../../../docs/components/label.md?raw';

const meta: Meta<typeof Label> = {
  title: 'Atoms/Label',
  component: Label,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: { component: docs },
    },
  },
  argTypes: {
    children: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof Label>;

export const Default: Story = {
  args: { children: 'Goal title', htmlFor: 'goal-title' },
};

export const WithRequiredMarker: Story = {
  render: () => (
    <Label htmlFor="email">
      Email <span className="text-destructive">*</span>
    </Label>
  ),
};
