import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Progress } from './progress';
import { Badge } from './badge';
import docs from '../../../docs/components/progress.md?raw';

const meta: Meta<typeof Progress> = {
  title: 'Atoms/Progress',
  component: Progress,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: { component: docs },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 100 } },
    tone: { control: 'select', options: ['primary', 'success', 'warning', 'destructive'] },
  },
};

export default meta;
type Story = StoryObj<typeof Progress>;

export const Default: Story = { args: { value: 45 } };
export const Success: Story = { args: { value: 80, tone: 'success' } };
export const Lagging: Story = { args: { value: 22, tone: 'destructive' } };

export const WithMarker: Story = {
  name: 'With emoji marker',
  args: {
    value: 45,
    tone: 'primary',
    marker: (
      <Badge shape="marker" variant="primary" aria-hidden>
        🧘
      </Badge>
    ),
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="space-y-4">
      <Progress
        value={20}
        tone="destructive"
        marker={<Badge shape="marker" variant="destructive" aria-hidden>🏃</Badge>}
      />
      <Progress
        value={50}
        tone="primary"
        marker={<Badge shape="marker" variant="primary" aria-hidden>🧘</Badge>}
      />
      <Progress
        value={85}
        tone="success"
        marker={<Badge shape="marker" variant="success" aria-hidden>🚀</Badge>}
      />
    </div>
  ),
};
