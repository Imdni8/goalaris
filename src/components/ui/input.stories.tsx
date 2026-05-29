import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Input } from './input';
import docs from '../../../docs/components/input.md?raw';

const meta: Meta<typeof Input> = {
  title: 'Atoms/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: { component: docs },
    },
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'search'],
    },
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: { placeholder: 'Enter text...' },
};

export const Email: Story = {
  args: { type: 'email', placeholder: 'you@example.com' },
};

export const Password: Story = {
  args: { type: 'password', placeholder: 'Password' },
};

export const Disabled: Story = {
  args: { placeholder: 'Disabled', disabled: true },
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5 w-72">
      <label htmlFor="email" className="text-label text-foreground">
        Email address
      </label>
      <Input id="email" type="email" placeholder="you@example.com" />
      <p className="text-caption">We&apos;ll never share your email.</p>
    </div>
  ),
};
