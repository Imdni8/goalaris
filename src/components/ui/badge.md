A badge is a small label that classifies the thing next to it — a status, a count, a category. It's read at a glance and never interactive.

Keep the text short (one or two words) and make sure the variant carries meaning, not decoration.

> **Source:** [`src/components/ui/badge.tsx`](../../src/components/ui/badge.tsx) · **Storybook:** Atoms / Badge

## When to use

- Show the status of an item ("In progress", "Completed", "Blocked").
- Tag a record with a category ("Personal", "Work").
- Mark a milestone or velocity indicator on a progress bar (use `shape="marker"`).

**When not to use**

- Triggering an action → use [Button](./button.md).
- Long-form metadata → use plain text in the row.
- A pure decorative dot → use a styled `<span>` with a token, not a Badge.

## Best practices

**Do**

- Use the `variant` that matches semantic meaning, not just color preference: `success` for done, `warning` for at-risk, `destructive` for blocked.
- Use sentence case ("In progress", not "IN PROGRESS").
- Place the badge directly beside the noun it describes — same row, same vertical center.

**Don't**

- Don't put more than one badge on the same item unless they convey orthogonal facts (status + category).
- Don't use the `destructive` variant for normal status — reserve it for genuinely blocked / failed states.
- Don't wrap a Badge in a `<button>` to make it clickable. If it's an action, use [Button](./button.md) instead.

## Variants

Pick by what the badge *means*, not by what color you want.

| Variant       | Use for                                                          | Per row |
| ------------- | ---------------------------------------------------------------- | ------- |
| `default`     | Neutral tag with no semantic weight (category, type)             | 0–many  |
| `primary`     | Brand-tinted accent, in-progress or active states                | 0–1     |
| `success`     | Successful, completed, healthy states                            | 0–1     |
| `warning`     | At-risk, lagging, attention-needed states                        | 0–1     |
| `destructive` | Blocked, failed, error states                                    | 0–1     |

**Guidance**

- Status variants are mutually exclusive — an item is `success` *or* `warning`, never both.
- If you find yourself wanting a sixth variant, audit whether the existing five really don't fit. New colors fragment the system.

## Sizes

| Size      | Padding / type | Use for                                              |
| --------- | -------------- | ---------------------------------------------------- |
| `sm`      | Tight, xs text | Inside table cells, dense list rows                  |
| `default` | Standard, xs text | Page-level status, card headers                   |

Both sizes use the same `xs` type scale — `sm` only reduces horizontal padding.

## Shapes

| Shape    | Behavior                                                                                                                          |
| -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `pill`   | Default. Translucent background tinted to the variant. Sits on neutral surfaces.                                                  |
| `marker` | Opaque chip with a colored border. Use when the badge sits *on top of* another colored surface (e.g. an emoji marker on a Progress bar) so the variant color doesn't bleed through. |

## States

Badge has no interactive states. The variant determines all visual appearance.

## Accessibility

- Renders as `<span>` — not focusable, not announced as a control.
- Color is reinforced by the label text, so the meaning survives for screen readers and users with color-vision differences. Never rely on color alone to convey status.
- Emoji-only markers (`shape="marker"` with an emoji child) are decorative — add `aria-hidden` so the emoji isn't double-announced and pair them with an accessible label elsewhere in the row.

## API

```tsx
import { Badge } from '@/components/ui';

<Badge>Personal</Badge>
<Badge variant="success">Completed</Badge>
<Badge variant="warning">Lagging</Badge>
<Badge size="sm" variant="primary">In progress</Badge>
<Badge shape="marker" variant="primary" aria-hidden>🧘</Badge>
```

| Prop      | Type                                                                | Default     |
| --------- | ------------------------------------------------------------------- | ----------- |
| `variant` | `'default' \| 'primary' \| 'success' \| 'warning' \| 'destructive'` | `'default'` |
| `size`    | `'sm' \| 'default'`                                                 | `'default'` |
| `shape`   | `'pill' \| 'marker'`                                                | `'pill'`    |
| …rest     | All native `<span>` attributes                                      | —           |

## Related

- [Progress](./progress.md) — marker badges are designed to sit on top of progress fills.
- [Button](./button.md) — for anything interactive; badges never are.
