import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, it, expect } from 'vitest';
import { Checkbox } from './checkbox';

describe('Checkbox', () => {
  it('renders as an input[type="checkbox"]', () => {
    render(<Checkbox aria-label="Agree" />);
    const cb = screen.getByRole('checkbox');
    expect(cb).toBeInTheDocument();
    expect(cb).toHaveAttribute('type', 'checkbox');
  });

  it('honors the disabled prop', () => {
    render(<Checkbox aria-label="X" disabled />);
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  it('sets indeterminate state on the underlying input', () => {
    render(<Checkbox aria-label="X" indeterminate />);
    expect((screen.getByRole('checkbox') as HTMLInputElement).indeterminate).toBe(true);
  });

  it('has no accessibility violations when labeled', async () => {
    const { container } = render(
      <>
        <label htmlFor="cb">Agree</label>
        <Checkbox id="cb" />
      </>
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
