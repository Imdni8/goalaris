import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ArrowRight, Plus, Save, Settings } from 'lucide-react';
import { Button } from './button';
import docs from '../../../docs/components/button.md?raw';

const meta: Meta<typeof Button> = {
  title: 'Atoms/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: { component: docs },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary', 'ghost', 'destructive'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
    },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
    loadingLabel: { control: 'text' },
    children: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { variant: 'primary', children: 'Save goal' },
};

export const Secondary: Story = {
  args: { variant: 'secondary', children: 'View details' },
};

export const Tertiary: Story = {
  args: { variant: 'tertiary', children: 'Cancel' },
};

export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Edit' },
};

export const Destructive: Story = {
  args: { variant: 'destructive', children: 'Delete' },
};

export const Small: Story = {
  args: { size: 'sm', children: 'Small' },
};

export const Large: Story = {
  args: { size: 'lg', children: 'Large' },
};

export const Disabled: Story = {
  args: { disabled: true, children: 'Disabled' },
};

export const WithLeftIcon: Story = {
  args: { leftIcon: <Save />, children: 'Save goal' },
};

export const WithRightIcon: Story = {
  args: { rightIcon: <ArrowRight />, children: 'Next step' },
};

export const IconOnly: Story = {
  args: {
    size: 'icon',
    variant: 'ghost',
    children: <Settings />,
    'aria-label': 'Settings',
  },
};

export const Loading: Story = {
  args: {
    loading: true,
    loadingLabel: 'Checking out',
    children: 'Checkout',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="tertiary">Tertiary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon" aria-label="Add">
        <Plus />
      </Button>
    </div>
  ),
};

export const IconOnlyAllVariants: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Button size="icon" variant="primary" aria-label="Add">
        <Plus />
      </Button>
      <Button size="icon" variant="secondary" aria-label="Add">
        <Plus />
      </Button>
      <Button size="icon" variant="tertiary" aria-label="Add">
        <Plus />
      </Button>
      <Button size="icon" variant="ghost" aria-label="Settings">
        <Settings />
      </Button>
      <Button size="icon" variant="destructive" aria-label="Remove">
        <Plus />
      </Button>
    </div>
  ),
};
