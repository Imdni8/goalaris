import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { ConfirmDialog } from './confirm-dialog';
import { Button } from './button';

const meta: Meta<typeof ConfirmDialog> = {
  title: 'Molecules/ConfirmDialog',
  component: ConfirmDialog,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof ConfirmDialog>;

function Demo(props: { variant?: 'primary' | 'destructive' }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={props.variant} onClick={() => setOpen(true)}>
        {props.variant === 'destructive' ? 'Delete goal' : 'Confirm action'}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        variant={props.variant}
        title={props.variant === 'destructive' ? 'Delete goal' : 'Confirm action'}
        description={
          props.variant === 'destructive'
            ? 'This cannot be undone. All associated tasks and logs will also be deleted.'
            : 'Are you sure you want to proceed?'
        }
        confirmLabel={props.variant === 'destructive' ? 'Delete' : 'Confirm'}
        onConfirm={() => setOpen(false)}
      />
    </>
  );
}

export const Default: Story = { render: () => <Demo /> };
export const Destructive: Story = { render: () => <Demo variant="destructive" /> };

export const Open: Story = {
  args: {
    open: true,
    variant: 'destructive',
    title: 'Delete goal',
    description: 'This cannot be undone.',
    confirmLabel: 'Delete',
    onConfirm: () => {},
  },
};
