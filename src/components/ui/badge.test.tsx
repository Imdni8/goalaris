import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, it, expect } from 'vitest';
import { Badge } from './badge';

describe('Badge', () => {
  it('renders its children', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('applies variant classes', () => {
    render(<Badge variant="success">Done</Badge>);
    expect(screen.getByText('Done').className).toMatch(/text-success/);
  });

  it('marker shape uses an opaque surface background', () => {
    render(
      <Badge shape="marker" variant="primary" data-testid="marker">
        🧘
      </Badge>
    );
    expect(screen.getByTestId('marker').className).toMatch(/bg-surface/);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Badge>Active</Badge>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
