A checkbox toggles a single boolean — on or off. Use it when each option is independent of the others.

Always pair a checkbox with a visible label so the click target and the meaning line up.

> **Source:** [`src/components/ui/checkbox.tsx`](../../src/components/ui/checkbox.tsx) · **Storybook:** Atoms / Checkbox

## When to use

- Opt-in / opt-out of a single setting ("Email me weekly summaries").
- Select zero or more items from a list of independent options.
- Represent a partially-selected parent when some children are checked (use `indeterminate`).

**When not to use**

- Picking exactly one of several mutually-exclusive options → use a radio group.
- Triggering an immediate action with no "save" step → use a switch (visual cue that the change takes effect immediately).
- A boolean that the user is *required* to accept before submitting → still a checkbox, but pair it with form validation, not a disabled submit button.

## Best practices

**Do**

- Always provide a `<Label htmlFor>` matched to the checkbox `id`. The label is the click target as much as the box.
- Write labels as positive statements ("Notify me when a goal is overdue") not negatives ("Don't notify me…"). Double negatives are hard to parse.
- Group related checkboxes with a [`FormField`](./form-field.md) legend so the relationship is obvious.

**Don't**

- Don't use a checkbox to flip a setting that takes effect instantly — that's a switch.
- Don't hide the label by relying on placeholder text or visual alignment alone.
- Don't disable the checkbox to communicate a problem — show the validation message and let the user click.

## States

| State          | Behavior                                                                                       |
| -------------- | ---------------------------------------------------------------------------------------------- |
| Unchecked      | Empty box with `border-input`.                                                                 |
| Checked        | Filled with `text-primary` checkmark.                                                          |
| Indeterminate  | Dash mark — set via the `indeterminate` prop. Reflects "some children checked".                |
| Focus          | 2px ring (`ring-ring`) — never remove.                                                         |
| Disabled       | 50% opacity, `cursor-not-allowed`. Use sparingly and never to hide a problem.                  |

The `indeterminate` state is purely visual — the underlying input is still `checked` or `unchecked`. Use it for parent rows in nested lists where partial selection is meaningful.

## Accessibility

- Renders as a real `<input type="checkbox">` — keyboard activation (Space), focus, and `change` events come for free.
- The associated `<label htmlFor="…">` must reference the checkbox `id`. Without it, the click target is just the 16×16 box and screen readers won't read the label.
- The focus ring is part of the design; never override `focus:ring-*`.
- For grouped checkboxes, wrap them in a `<fieldset>` with a `<legend>` (or use [FormField](./form-field.md)) so the group is announced as one unit.

## API

```tsx
import { Checkbox, Label } from '@/components/ui';

<div className="flex items-center gap-2">
  <Checkbox id="terms" />
  <Label htmlFor="terms" className="cursor-pointer">
    I agree to the terms
  </Label>
</div>

<Checkbox id="overdue" defaultChecked />
<Checkbox id="parent" indeterminate />
<Checkbox id="archived" disabled />
```

| Prop            | Type                                                | Default |
| --------------- | --------------------------------------------------- | ------- |
| `indeterminate` | `boolean` — show the dash mark                      | `false` |
| `checked`       | `boolean` — controlled checked state                | —       |
| `defaultChecked`| `boolean` — uncontrolled initial state              | —       |
| `disabled`      | `boolean`                                           | `false` |
| `id`            | `string` — required to associate a `<label>`        | —       |
| …rest           | All native `<input>` attributes except `type`       | —       |

## Related

- [Label](./label.md) — the required partner for every checkbox.
- [FormField](./form-field.md) — for grouping checkboxes with a shared legend and helper text.
