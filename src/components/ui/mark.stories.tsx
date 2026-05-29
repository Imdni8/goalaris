import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Mark, highlightMatches } from './mark';
import docs from '../../../docs/components/mark.md?raw';

const meta: Meta<typeof Mark> = {
  title: 'Atoms/Mark',
  component: Mark,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: { component: docs },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Mark>;

export const Default: Story = {
  render: () => (
    <p className="text-body">
      The quick brown <Mark>fox</Mark> jumps over the lazy dog.
    </p>
  ),
};

export const HighlightMatchesHelper: Story = {
  name: 'highlightMatches() helper',
  render: () => (
    <p className="text-body">
      {highlightMatches(
        'Ship the design system to unblock new feature work.',
        'design'
      )}
    </p>
  ),
};
