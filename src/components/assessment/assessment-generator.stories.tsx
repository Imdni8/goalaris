import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import AssessmentGenerator from './assessment-generator';

const meta: Meta<typeof AssessmentGenerator> = {
  title: 'Organisms/AssessmentGenerator',
  component: AssessmentGenerator,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof AssessmentGenerator>;

const sampleGoals = [
  { id: 'g1', title: 'Ship the design system', status: 'active', created_at: '2026-01-01', actionLogCount: 12 },
  { id: 'g2', title: 'Onboarding revamp', status: 'active', created_at: '2026-02-01', actionLogCount: 4 },
  { id: 'g3', title: 'Refactor coach API', status: 'completed', created_at: '2026-03-01', actionLogCount: 0 },
];

const sampleSaved = [
  { id: 'a1', title: 'Q1 Self-Assessment', status: 'final', created_at: '2026-03-31', updated_at: '2026-03-31' },
  { id: 'a2', title: 'Draft for review', status: 'draft', created_at: '2026-04-15', updated_at: '2026-04-20' },
];

export const Default: Story = {
  args: {
    goals: sampleGoals,
    savedAssessments: sampleSaved,
    userId: 'u1',
  },
};

export const NoGoals: Story = {
  args: {
    goals: [],
    savedAssessments: [],
    userId: 'u1',
  },
};
