import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import ProgressOverviewWidgetView from './progress-overview-widget-view';

const meta: Meta<typeof ProgressOverviewWidgetView> = {
  title: 'Organisms/ProgressOverviewWidget',
  component: ProgressOverviewWidgetView,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof ProgressOverviewWidgetView>;

const sampleHeatmap = Array.from({ length: 40 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - i * 5);
  return { date: d.toISOString().split('T')[0], count: (i % 4) + 1 };
});

export const Populated: Story = {
  args: {
    totalGoals: 6,
    overallCompletionPercentage: 64,
    totalTasks: 50,
    completedTasks: 32,
    totalActions: 128,
    last7DaysActions: 12,
    activeBlockerCount: 2,
    heatmapData: sampleHeatmap,
    goalsNeedingAttention: [
      { id: 'g1', title: 'Ship design system', completed: 2, total: 10, percentage: 20 },
      { id: 'g2', title: 'Onboarding revamp', completed: 5, total: 12, percentage: 42 },
      { id: 'g3', title: 'Coach check-in flow', completed: 7, total: 10, percentage: 70 },
    ],
  },
};

export const Empty: Story = {
  args: {
    totalGoals: 0,
    overallCompletionPercentage: 0,
    totalTasks: 0,
    completedTasks: 0,
    totalActions: 0,
    last7DaysActions: 0,
    activeBlockerCount: 0,
    heatmapData: [],
    goalsNeedingAttention: [],
  },
};

export const AllGreen: Story = {
  args: {
    totalGoals: 4,
    overallCompletionPercentage: 95,
    totalTasks: 40,
    completedTasks: 38,
    totalActions: 200,
    last7DaysActions: 25,
    activeBlockerCount: 0,
    heatmapData: sampleHeatmap,
    goalsNeedingAttention: [
      { id: 'g1', title: 'Quarterly OKRs', completed: 9, total: 10, percentage: 90 },
    ],
  },
};
