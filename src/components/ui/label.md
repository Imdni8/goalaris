A label names a form control. It's the text the user reads to know what to type, and the click target that focuses the control.

Every form control needs a label — never rely on placeholder text or visual proximity alone.

> **Source:** [`src/components/ui/label.tsx`](../../src/components/ui/label.tsx) · **Storybook:** Atoms / Label

## When to use

- Name a single form control ([Input](./input.md), [Checkbox](./checkbox.md), textarea, select).
- Mark a field as required by appending an asterisk styled with `text-destructive`.
- Used implicitly inside [FormField](./form-field.md), which handles labeling and helper text together.

**When not to use**

- Heading a section that isn't a single form control → use a heading (`<h2>` etc.) with `text-heading`.
- Adding helper text below a field → use the helper slot in [FormField](./form-field.md), not a second label.
- Standalone text on a page → use a paragraph (`text-body`) or caption (`text-caption`).

## Best practices

**Do**

- Always pair with a control using `htmlFor={id}` matched to the control's `id`. Clicking the label should focus or toggle the control.
- Use sentence case ("Email address", not "Email Address").
- Keep labels short (1–3 words). Move clarifications into helper text.

**Don't**

- Don't use a label to deliver instructions ("Enter your email here…"). Instructions go in helper text.
- Don't visually hide the label to "save space". If the control truly doesn't need a visible label (e.g. a search icon-only field), use `aria-label` on the control instead — but the label/control pattern is almost always clearer.
- Don't restyle the label per-use. It uses the `text-label` token; if you need a different size, the surrounding pattern is probably wrong.

## Accessibility

- Renders as a native `<label>` — clicking it focuses (or toggles) the associated control automatically when `htmlFor` is set.
- Required-field markers (`*`) are visual; they should be reinforced by `aria-required` or a "required" word elsewhere — color/symbol alone isn't enough.
- Don't put interactive elements inside a label other than the control it's labeling.

## API

```tsx
import { Label, Input } from '@/components/ui';

<Label htmlFor="goal-title">Goal title</Label>
<Input id="goal-title" />

<Label htmlFor="email">
  Email <span className="text-destructive">*</span>
</Label>
<Input id="email" type="email" aria-required />
```

| Prop      | Type                                                  | Default |
| --------- | ----------------------------------------------------- | ------- |
| `htmlFor` | `string` — the `id` of the control being labeled      | —       |
| …rest     | All native `<label>` attributes                       | —       |

## Related

- [Input](./input.md), [Checkbox](./checkbox.md) — the controls a Label points to.
- [FormField](./form-field.md) — wraps Label + control + helper/error text so labeling is handled for you.
