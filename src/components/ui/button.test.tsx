import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, it, expect } from 'vitest';
import { Button } from './button';

describe('Button', () => {
  it('renders without crashing', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('forwards disabled state', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders a leftIcon before the label', () => {
    render(
      <Button leftIcon={<svg data-testid="icon" />}>Save</Button>
    );
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button.firstChild).toBe(screen.getByTestId('icon'));
  });

  it('renders a rightIcon after the label', () => {
    render(
      <Button rightIcon={<svg data-testid="icon" />}>Next</Button>
    );
    const button = screen.getByRole('button', { name: 'Next' });
    expect(button.lastChild).toBe(screen.getByTestId('icon'));
  });

  it('renders icon-only with accessible label', () => {
    render(
      <Button size="icon" aria-label="Settings">
        <svg />
      </Button>
    );
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
  });

  it('disables clicks and sets aria-busy when loading', () => {
    render(<Button loading>Checkout</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('swaps the label for loadingLabel when loading', () => {
    render(
      <Button loading loadingLabel="Checking out">
        Checkout
      </Button>
    );
    expect(screen.getByRole('button')).toHaveTextContent('Checking out');
    expect(screen.queryByText('Checkout')).not.toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Button>Click me</Button>);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no accessibility violations when disabled', async () => {
    const { container } = render(<Button disabled>Click me</Button>);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no accessibility violations for icon-only button', async () => {
    const { container } = render(
      <Button size="icon" aria-label="Settings">
        <svg />
      </Button>
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no accessibility violations when loading', async () => {
    const { container } = render(
      <Button loading loadingLabel="Checking out">
        Checkout
      </Button>
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
