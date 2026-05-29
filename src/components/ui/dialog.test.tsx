import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, it, expect } from 'vitest';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './dialog';

function OpenDialog() {
  return (
    <Dialog defaultOpen>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit goal</DialogTitle>
          <DialogDescription>Update the details.</DialogDescription>
        </DialogHeader>
        <p>Body</p>
      </DialogContent>
    </Dialog>
  );
}

describe('Dialog', () => {
  it('renders content with an accessible dialog role when open', () => {
    render(<OpenDialog />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Edit goal')).toBeInTheDocument();
  });

  it('exposes a close button', () => {
    render(<OpenDialog />);
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<OpenDialog />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
