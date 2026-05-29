import React from 'react';
import { cn } from '@/lib/utils';
import { Label } from './label';

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Label text. Required so every control has an accessible name. */
  label: React.ReactNode;
  /** Mark the field as required — adds a visual asterisk and aria-required on the control. */
  required?: boolean;
  /** Optional helper text shown below the control. */
  helper?: React.ReactNode;
  /** Error message — when set, overrides helper and applies destructive styling to the control. */
  error?: React.ReactNode;
  /**
   * Render-prop for the control. The id passed in must be forwarded to the
   * underlying form element so the label and helper/error stay associated.
   */
  children: (controlProps: {
    id: string;
    'aria-describedby'?: string;
    'aria-invalid'?: boolean;
    'aria-required'?: boolean;
  }) => React.ReactNode;
  /** Override the generated id (default: React.useId). */
  id?: string;
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, label, required, helper, error, children, id, ...props }, ref) => {
    const reactId = React.useId();
    const controlId = id ?? `field-${reactId}`;
    const helperId = `${controlId}-helper`;
    const errorId = `${controlId}-error`;
    const describedBy = error ? errorId : helper ? helperId : undefined;

    return (
      <div ref={ref} className={cn('space-y-1', className)} {...props}>
        <Label htmlFor={controlId}>
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </Label>
        {children({
          id: controlId,
          'aria-describedby': describedBy,
          'aria-invalid': error ? true : undefined,
          'aria-required': required ? true : undefined,
        })}
        {error ? (
          <p id={errorId} className="text-caption text-destructive">
            {error}
          </p>
        ) : helper ? (
          <p id={helperId} className="text-caption">
            {helper}
          </p>
        ) : null}
      </div>
    );
  }
);
FormField.displayName = 'FormField';

export { FormField };
