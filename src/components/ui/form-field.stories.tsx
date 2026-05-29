import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { FormField } from './form-field';
import { Input } from './input';

const meta: Meta<typeof FormField> = {
  title: 'Molecules/FormField',
  component: FormField,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FormField>;

export const Default: Story = {
  args: {
    label: 'Goal title',
    children: (p) => <Input placeholder="e.g. Ship the design system" {...p} />,
  },
};

export const WithHelper: Story = {
  args: {
    label: 'Email',
    helper: "We'll never share your email.",
    children: (p) => <Input type="email" {...p} />,
  },
};

export const WithError: Story = {
  args: {
    label: 'Email',
    error: 'Enter a valid email address.',
    children: (p) => <Input type="email" defaultValue="not-an-email" {...p} />,
  },
};

export const Required: Story = {
  args: {
    label: 'Goal title',
    required: true,
    children: (p) => <Input {...p} />,
  },
};
