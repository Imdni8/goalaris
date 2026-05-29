import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, it, expect } from 'vitest';
import ProgressOverviewWidgetView from './progress-overview-widget-view';

const baseProps = {
  totalGoals: 6,
  overallCompletionPercentage: 64,
  totalTasks: 50,
  completedTasks: 32,
  totalActions: 128,
  last7DaysActions: 12,
  activeBlockerCount: 2,
  heatmapData: [],
  goalsNeedingAttention: [
    { id: 'g1', title: 'Ship design system', completed: 2, total: 10, percentage: 20 },
  ],
};

describe('ProgressOverviewWidgetView', () => {
  it('renders all stat cards and the attention section', () => {
    render(<ProgressOverviewWidgetView {...baseProps} />);
    expect(screen.getByText('Total Goals')).toBeInTheDocument();
    expect(screen.getByText('Tasks Complete')).toBeInTheDocument();
    expect(screen.getByText('Active Blockers')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Goals Needing Attention' })).toBeInTheDocument();
    expect(screen.getByText('Ship design system')).toBeInTheDocument();
  });

  it('hides the attention section when no goals need attention', () => {
    render(<ProgressOverviewWidgetView {...baseProps} goalsNeedingAttention={[]} />);
    expect(screen.queryByRole('heading', { name: 'Goals Needing Attention' })).not.toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<ProgressOverviewWidgetView {...baseProps} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
