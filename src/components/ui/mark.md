A mark highlights a span of text within a larger block — typically a search-query match within a result snippet.

Use it sparingly. If everything is highlighted, nothing is.

> **Source:** [`src/components/ui/mark.tsx`](../../src/components/ui/mark.tsx) · **Storybook:** Atoms / Mark

## When to use

- Highlight search-query matches inside list-row text or snippets.
- Call out a token in a sentence that the user just typed or selected (e.g. echoing a filter back).

**When not to use**

- Permanent emphasis on a single word → use `font-semibold` or `text-foreground` weight, not a `<mark>`.
- Highlighting code → use a `<code>` element or syntax-highlighted block.
- Drawing attention to a row or card → restyle the container, not its text.

## Best practices

**Do**

- Use the `highlightMatches(text, query)` helper for search hit-highlighting — it splits on case-insensitive matches and avoids reinventing the loop per call site.
- Trim the query before passing it in (the helper does too, but be deliberate at the boundary).
- Wrap the marked text in the same paragraph type as the surrounding text — Mark inherits font sizing.

**Don't**

- Don't wrap entire paragraphs. The whole point of Mark is contrast against unmarked text.
- Don't restyle Mark via `className` to use a non-primary color. The `bg-primary/20` and `text-primary` tokens tie marked text to the brand accent intentionally.
- Don't use Mark for state ("this row is selected") — selection has its own visual language.

## States

Mark has no interactive states — it's a static text element. Appearance is fixed: `bg-primary/20` background, `text-primary` foreground, `rounded-sm` corners, hair-thin horizontal padding.

## Accessibility

- Renders as a native `<mark>` element. Some screen readers announce marked text; most don't. Treat the highlight as visual reinforcement, not the sole carrier of meaning.
- Don't put interactive controls inside `<mark>`. If the user needs to act on the highlight, the surrounding row should be the click target.

## API

```tsx
import { Mark, highlightMatches } from '@/components/ui';

<p className="text-body">
  The quick brown <Mark>fox</Mark> jumps over the lazy dog.
</p>

// Helper for search-result snippets
<p className="text-body">
  {highlightMatches('Ship the design system to unblock feature work.', 'design')}
</p>
```

| Export                       | Type                                                                                  | Default |
| ---------------------------- | ------------------------------------------------------------------------------------- | ------- |
| `<Mark>`                     | Component — all native `<mark>` attributes                                            | —       |
| `highlightMatches(text, q)`  | `(text: string \| null, query: string) => ReactNode` — wraps matches of `q` in Mark   | —       |

## Related

- [Input](./input.md) — the search field that produces the query you'll highlight.
