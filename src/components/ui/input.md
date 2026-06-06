An input collects a single line of text from the user. It's the most common form control — keep it boring and predictable.

Always pair it with a [Label](./label.md), and wrap both in a [FormField](./form-field.md) when you need helper text or validation.

> **Source:** [`src/components/ui/input.tsx`](../../src/components/ui/input.tsx) · **Storybook:** Atoms / Input

## When to use

- Collect short, free-form text (name, email, search query).
- Capture a number, password, or URL — use the matching `type` so mobile keyboards and browser autofill work.
- Single-line search field inside a toolbar or list.

**When not to use**

- Multi-line text (descriptions, notes) → use a `<Textarea>`.
- Picking one of a known set of values → use a select or radio group.
- A toggle or boolean → use [Checkbox](./checkbox.md) or a switch.

## Best practices

**Do**

- Set `type` to match the data (`email`, `password`, `number`, `search`, `url`). Mobile keyboards and validation depend on it.
- Use the placeholder for a *format hint*, not the field name (the [Label](./label.md) carries the name).
- Pair with a [Label](./label.md) via `htmlFor`/`id`, and use [FormField](./form-field.md) for inputs that need helper or error text.

**Don't**

- Don't use placeholder text as the only label. It disappears on focus and fails accessibility checks.
- Don't disable the field to hide validation problems. Let the user type and surface the error.
- Don't set custom heights or padding — the input is sized to align with [Button](./button.md) and other form controls. Overriding breaks alignment.

## States

| State    | Behavior                                                       |
| -------- | -------------------------------------------------------------- |
| Default  | `border-input` border, `bg-surface` background.                |
| Focus    | 2px ring (`ring-ring`) with 2px offset — never remove.         |
| Disabled | 50% opacity, `cursor-not-allowed`.                             |
| Invalid  | The Input itself doesn't render an error state — wrap in [FormField](./form-field.md) which sets `aria-invalid` and shows the error message. |

## Accessibility

- Renders as a native `<input>` — focus, keyboard, and autofill come for free.
- Always associate a `<Label htmlFor>` with the input's `id`. A placeholder is not a label.
- For error states, prefer [FormField](./form-field.md) so `aria-invalid` and `aria-describedby` wire up automatically.
- Don't remove the focus ring. If it conflicts with a parent container, fix the container.

## API

```tsx
import { Input, Label } from '@/components/ui';

<div className="flex flex-col gap-1.5">
  <Label htmlFor="email">Email address</Label>
  <Input id="email" type="email" placeholder="you@example.com" />
</div>

<Input type="search" placeholder="Search goals…" />
<Input type="password" placeholder="Password" />
<Input disabled value="Read-only value" />
```

| Prop          | Type                                                                                                                                | Default  |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `type`        | `'text' \| 'email' \| 'password' \| 'number' \| 'search' \| 'url' \| ...` — any native HTML input type                              | `'text'` |
| `placeholder` | `string` — format hint, not a label                                                                                                  | —        |
| `disabled`    | `boolean`                                                                                                                            | `false`  |
| …rest         | All native `<input>` attributes (`value`, `defaultValue`, `onChange`, `name`, etc.)                                                  | —        |

## Related

- [Label](./label.md) — required partner for every Input.
- [FormField](./form-field.md) — wraps Label + Input + helper/error text into one unit.
- [Checkbox](./checkbox.md) — for boolean inputs instead of free text.
