import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, it, expect } from 'vitest';
import { FormField } from './form-field';
import { Input } from './input';

describe('FormField', () => {
  it('associates label with the control via htmlFor/id', () => {
    render(
      <FormField label="Email">
        {(p) => <Input type="email" {...p} />}
      </FormField>
    );
    const input = screen.getByLabelText('Email');
    expect(input).toBeInTheDocument();
  });

  it('renders helper text with aria-describedby', () => {
    render(
      <FormField label="Email" helper="We won't share it.">
        {(p) => <Input {...p} />}
      </FormField>
    );
    const input = screen.getByLabelText('Email');
    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(screen.getByText(/We won't share it/).id).toBe(describedBy);
  });

  it('renders error and marks the control aria-invalid', () => {
    render(
      <FormField label="Email" error="Bad email">
        {(p) => <Input {...p} />}
      </FormField>
    );
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Bad email')).toBeInTheDocument();
  });

  it('marks required fields with asterisk and aria-required', () => {
    render(
      <FormField label="Email" required>
        {(p) => <Input {...p} />}
      </FormField>
    );
    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toHaveAttribute('aria-required', 'true');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <FormField label="Email" helper="Helper">
        {(p) => <Input {...p} />}
      </FormField>
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
