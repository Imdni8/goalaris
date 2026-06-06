A progress bar shows how close something is to completion as a percentage. It's a glance-able indicator, not a precise gauge.

Use `tone` to encode whether progress is on-track, ahead, or behind — not just for color variety.

> **Source:** [`src/components/ui/progress.tsx`](../../src/components/ui/progress.tsx) · **Storybook:** Atoms / Progress

## When to use

- Show completion of a long-running goal, task list, or onboarding flow.
- Visualize a velocity or pacing metric where the tone encodes status ("ahead", "on track", "lagging").
- Pair with a `marker` (typically a [Badge](./badge.md) with `shape="marker"`) to show a milestone or velocity flag at the current position.

**When not to use**

- Indeterminate work (loading a screen, waiting on a network call) → use a spinner.
- Step-based flows where each step is a discrete page → use a stepper component.
- Tiny inline progress (e.g. file upload in a list row) → consider a different micro-pattern; this Progress is sized for full-width contexts.

## Best practices

**Do**

- Always pass a `value` between 0 and 100. The component clamps for safety, but feed it clean numbers.
- Pick `tone` to match the *status*, not the variant of the brand color: `success` for ahead/done, `primary` for on track, `warning` for slipping, `destructive` for blocked or far behind.
- When using `marker`, use [Badge](./badge.md) with `shape="marker"` — it's built to sit opaquely over the fill without color bleed.

**Don't**

- Don't use `destructive` tone for ordinary progress that just happens to be low — that reads as "broken", not "just starting".
- Don't try to render the value as text inside the bar. Put it next to the bar (e.g. "42% — on track") so the number doesn't fight the fill.
- Don't override `h-2` to make the bar much taller — markers and the rounded fill assume the default height.

## Variants

`tone` sets the fill color. Use it to communicate the status of the progress, not just for visual variety.

| Tone          | Use for                                                          |
| ------------- | ---------------------------------------------------------------- |
| `primary`     | On-track, in-progress, normal pace                               |
| `success`     | Ahead of schedule, completed, healthy                            |
| `warning`     | Slipping, at-risk, behind expected pace                          |
| `destructive` | Blocked, failing, far behind                                     |

**Guidance**

- Tones are signal — one bar = one tone. Don't animate between tones; recompute on data change.
- Pair tones with matching [Badge](./badge.md) `variant`s for the marker so the colors reinforce each other.

## States

Progress has no interactive states. The component animates the fill width smoothly (`transition-all duration-150 ease-out`) when `value` changes.

## Accessibility

- Renders with `role="progressbar"` and `aria-valuemin=0`, `aria-valuemax=100`, `aria-valuenow={clamped value}` — screen readers announce the percentage.
- The marker is rendered with `pointer-events-none` so it never intercepts clicks. If the marker carries meaning (e.g. an emoji status), make sure the same status is announced via a sibling label or `aria-label` on the bar — emoji alone is not reliable.
- Don't put interactive controls inside the bar.

## API

```tsx
import { Progress, Badge } from '@/components/ui';

<Progress value={45} />

<Progress value={80} tone="success" />

<Progress
  value={45}
  tone="primary"
  marker={<Badge shape="marker" variant="primary" aria-hidden>🧘</Badge>}
  aria-label="Goal progress: on track"
/>
```

| Prop     | Type                                                  | Default     |
| -------- | ----------------------------------------------------- | ----------- |
| `value`  | `number` — 0–100, clamped                             | —           |
| `tone`   | `'primary' \| 'success' \| 'warning' \| 'destructive'`| `'primary'` |
| `marker` | `ReactNode` — usually a `<Badge shape="marker">`      | —           |
| …rest    | All native `<div>` attributes                         | —           |

## Related

- [Badge](./badge.md) — the marker is designed to be a Badge with `shape="marker"`.
