import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Badge } from './badge';
import docs from '../../../docs/components/badge.md?raw';

const meta: Meta<typeof Badge> = {
  title: 'Atoms/Badge',
  component: Badge,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: { component: docs },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'primary', 'success', 'warning', 'destructive'],
    },
    size: { control: 'select', options: ['sm', 'default'] },
    shape: { control: 'select', options: ['pill', 'marker'] },
    children: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = { args: { children: 'Active' } };
export const Primary: Story = { args: { variant: 'primary', children: 'In progress' } };
export const Success: Story = { args: { variant: 'success', children: 'Completed' } };
export const Warning: Story = { args: { variant: 'warning', children: 'Lagging' } };
export const Destructive: Story = { args: { variant: 'destructive', children: 'Blocked' } };

export const MarkerEmoji: Story = {
  name: 'Marker · emoji-only',
  args: { variant: 'primary', shape: 'marker', children: '🧘', 'aria-hidden': true },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge>Active</Badge>
      <Badge variant="primary">In progress</Badge>
      <Badge variant="success">Completed</Badge>
      <Badge variant="warning">Lagging</Badge>
      <Badge variant="destructive">Blocked</Badge>
    </div>
  ),
};

export const AllMarkers: Story = {
  name: 'Marker · all variants over a colored surface',
  render: () => (
    <div className="rounded-lg bg-primary p-6">
      <div className="flex items-center gap-3">
        <Badge shape="marker" variant="primary" aria-hidden>🧘</Badge>
        <Badge shape="marker" variant="success" aria-hidden>🚀</Badge>
        <Badge shape="marker" variant="warning" aria-hidden>⏳</Badge>
        <Badge shape="marker" variant="destructive" aria-hidden>🏃</Badge>
      </div>
    </div>
  ),
};
