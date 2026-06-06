A button initiates an action. It's the most common way a person tells the product to do something.

Keep the label a verb, keep it short, and make sure only one button per view carries the primary action.

> **Source:** [`src/components/ui/button.tsx`](../../src/components/ui/button.tsx) · **Storybook:** Atoms / Button

## When to use

- Trigger an action ("Save goal", "Create task", "Delete").
- Confirm or dismiss a dialog.
- Submit a form.

**When not to use**

- Navigating between pages → use a link.
- Toggling on/off state → use [Checkbox](./checkbox.md) or a switch.
- Picking one of several options → use a segmented control or [Radio](./radio.md).

## Best practices

**Do**

- Write labels as verbs: "Save changes", "Add task", "Sign in".
- Use sentence case ("Add task", not "Add Task" or "ADD TASK").
- Place the primary action on the right in dialogs; on the left in forms with a single column.
- Match button width to label width; only stretch to full-width on mobile or single-column forms.

**Don't**

- Don't use "OK", "Submit", or "Click here" — say what the action does.
- Don't put more than one `destructive` button on screen at once.
- Don't use icon-only buttons for unfamiliar actions. If a user can't guess the icon, add a label or tooltip.
- Don't disable a button without a way for the user to find out why.

## Variants

Pick the variant that matches the action's weight in the current view — not its weight in the product.

Variants are ordered by emphasis — `primary` is loudest, `ghost` is quietest. `destructive` is semantic (intent), not a rank.

| Variant       | Emphasis | Use for                                                     | Per view |
| ------------- | -------- | ----------------------------------------------------------- | -------- |
| `primary`     | Highest  | The main action — what most people are here to do           | 1        |
| `secondary`   | High     | A supporting action of equal importance to the primary      | 0–1      |
| `tertiary`    | Medium   | Neutral action that needs a visible boundary (Cancel, Back) | 0–many   |
| `ghost`       | Lowest   | Low-emphasis action inside dense UI (toolbars, list rows)   | 0–many   |
| `destructive` | —        | Irreversible or data-losing action (Delete, Remove)         | 0–1      |

**Guidance**

- One `primary` per view. If two actions feel equally primary, one of them isn't.
- `destructive` pairs with a confirmation step — never let a single click delete user data. Use [`ConfirmDialog`](./confirm-dialog.md).
- `ghost` should still meet contrast on hover; avoid placing two ghosts directly adjacent.
- `size="icon"` works with any variant — pick by emphasis the same way you would for a labeled button. Always supply `aria-label`.

## Sizes

| Size      | Height | Use for                                              |
| --------- | ------ | ---------------------------------------------------- |
| `sm`      | 36px   | Inside tables, list rows, toolbars, compact cards    |
| `default` | 40px   | The default — forms, dialogs, page-level actions     |
| `lg`      | 44px   | Hero/marketing surfaces, empty-state primary actions |
| `icon`    | 40×40  | Icon-only — requires `aria-label`                    |

Don't mix sizes in the same action group. A `Cancel` next to a `Save` should match.

## States

| State    | Behavior                                                                                                                                                                           |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default  | Resting appearance                                                                                                                                                                 |
| Hover    | Background darkens by ~10% (`bg-primary/90` etc.)                                                                                                                                  |
| Focus    | 2px ring (`ring-ring`) with 2px offset — never remove                                                                                                                              |
| Disabled | 50% opacity, pointer events off — use sparingly                                                                                                                                    |
| Loading  | Set `loading`; spinner replaces `leftIcon`, label swaps to `loadingLabel`. Clicks are disabled and `aria-busy` is set. Full opacity is kept so it doesn't read as merely disabled. |

**Disabled vs. error.** Don't disable a button to hide a problem. If the form is invalid, let the user click and surface the error — disabling teaches nothing.

## Accessibility

- Always renders as `<button>` — keyboard activation (Enter/Space) and focus come for free.
- Icon-only buttons require `aria-label`.
- The focus ring is part of the design; never override `focus-visible:ring-*`.
- Loading buttons should set `aria-busy="true"` and keep their accessible name stable.
- Minimum target size 40×40 — `sm` (36px) is acceptable inside data-dense contexts (tables, toolbars) where a parent row provides a larger hit area.

## API

```tsx
import { Button } from '@/components/ui';
import { Save, ArrowRight } from 'lucide-react';

<Button variant="primary" onClick={save}>Save goal</Button>
<Button leftIcon={<Save />}>Save goal</Button>
<Button rightIcon={<ArrowRight />}>Next step</Button>
<Button size="icon" variant="ghost" aria-label="Settings"><Settings /></Button>
<Button loading loadingLabel="Checking out">Checkout</Button>
```

| Prop           | Type                                                                 | Default     |
| -------------- | -------------------------------------------------------------------- | ----------- |
| `variant`      | `'primary' \| 'secondary' \| 'tertiary' \| 'ghost' \| 'destructive'` | `'primary'` |
| `size`         | `'sm' \| 'default' \| 'lg' \| 'icon'`                                | `'default'` |
| `leftIcon`     | `ReactNode` — sized to 16×16 automatically                           | —           |
| `rightIcon`    | `ReactNode` — sized to 16×16 automatically                           | —           |
| `loading`      | `boolean` — shows spinner, disables clicks, sets `aria-busy`         | `false`     |
| `loadingLabel` | `ReactNode` — label shown in place of children while loading         | —           |
| `disabled`     | `boolean`                                                            | `false`     |
| …rest          | All native `<button>` attributes                                     | —           |

## Related

- [ConfirmDialog](./confirm-dialog.md) — wrap destructive actions
- [FormField](./form-field.md) — the button's most common neighbor
- [Input](./input.md), [Checkbox](./checkbox.md) — common form companions
