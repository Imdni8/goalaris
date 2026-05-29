import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, it, expect, vi } from 'vitest';
import AssessmentGenerator from './assessment-generator';

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
    }),
  }),
}));

const goals = [
  { id: 'g1', title: 'Ship the design system', status: 'active', created_at: '2026-01-01', actionLogCount: 12 },
  { id: 'g2', title: 'Refactor coach API', status: 'completed', created_at: '2026-03-01', actionLogCount: 0 },
];

describe('AssessmentGenerator', () => {
  it('renders the configuration heading and goal list', () => {
    render(<AssessmentGenerator goals={goals} savedAssessments={[]} userId="u1" />);
    expect(screen.getByRole('heading', { name: 'Configuration' })).toBeInTheDocument();
    expect(screen.getByText('Ship the design system')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generate Assessment' })).toBeInTheDocument();
  });

  it('shows empty state when no goals', () => {
    render(<AssessmentGenerator goals={[]} savedAssessments={[]} userId="u1" />);
    expect(screen.getByText(/No goals found/)).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <AssessmentGenerator goals={goals} savedAssessments={[]} userId="u1" />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
