import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, it, expect } from 'vitest';
import { Progress } from './progress';

describe('Progress', () => {
  it('exposes ARIA progressbar with the clamped value', () => {
    render(<Progress value={42} aria-label="Loading" />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '42');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });

  it('clamps values outside 0–100', () => {
    const { rerender } = render(<Progress value={150} aria-label="Loading" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    rerender(<Progress value={-20} aria-label="Loading" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('renders the marker above the fill (z-10)', () => {
    render(
      <Progress
        value={50}
        aria-label="Loading"
        marker={<span data-testid="m">🧘</span>}
      />
    );
    const marker = screen.getByTestId('m').parentElement;
    expect(marker?.className).toMatch(/z-10/);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Progress value={42} aria-label="Loading" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
