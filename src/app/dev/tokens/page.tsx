const colorGroups = [
  {
    label: 'Backgrounds',
    tokens: [
      { name: 'background', var: '--background', tw: 'bg-background', hex: '#f9fafb' },
      { name: 'foreground', var: '--foreground', tw: 'bg-foreground', hex: '#1f2937' },
      { name: 'surface', var: '--surface', tw: 'bg-surface', hex: '#ffffff' },
      { name: 'surface-foreground', var: '--surface-foreground', tw: 'bg-surface-foreground', hex: '#1f2937' },
    ],
  },
  {
    label: 'Brand',
    tokens: [
      { name: 'primary', var: '--primary', tw: 'bg-primary', hex: '#3b82f6' },
      { name: 'primary-foreground', var: '--primary-foreground', tw: 'bg-primary-foreground', hex: '#ffffff' },
    ],
  },
  {
    label: 'Neutrals',
    tokens: [
      { name: 'muted', var: '--muted', tw: 'bg-muted', hex: '#f3f4f6' },
      { name: 'muted-foreground', var: '--muted-foreground', tw: 'bg-muted-foreground', hex: '#6b7280' },
    ],
  },
  {
    label: 'Borders & Inputs',
    tokens: [
      { name: 'border', var: '--border', tw: 'bg-border', hex: '#e5e7eb' },
      { name: 'input', var: '--input', tw: 'bg-input', hex: '#e5e7eb' },
      { name: 'ring', var: '--ring', tw: 'bg-ring', hex: '#3b82f6' },
    ],
  },
  {
    label: 'Semantic States',
    tokens: [
      { name: 'success', var: '--success', tw: 'bg-success', hex: '#10b981' },
      { name: 'success-foreground', var: '--success-foreground', tw: 'bg-success-foreground', hex: '#ffffff' },
      { name: 'warning', var: '--warning', tw: 'bg-warning', hex: '#f59e0b' },
      { name: 'warning-foreground', var: '--warning-foreground', tw: 'bg-warning-foreground', hex: '#ffffff' },
      { name: 'destructive', var: '--destructive', tw: 'bg-destructive', hex: '#ef4444' },
      { name: 'destructive-foreground', var: '--destructive-foreground', tw: 'bg-destructive-foreground', hex: '#ffffff' },
    ],
  },
];

const radiiTokens = [
  { name: 'rounded-sm', label: 'sm', value: 'calc(var(--radius) - 4px)' },
  { name: 'rounded-md', label: 'md', value: 'calc(var(--radius) - 2px)' },
  { name: 'rounded-lg', label: 'lg', value: 'var(--radius)' },
  { name: 'rounded-full', label: 'full', value: '9999px' },
];

function Swatch({ token }: { token: { name: string; var: string; tw: string; hex: string } }) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className={`h-16 w-full rounded-md border border-border ${token.tw}`}
      />
      <div>
        <p className="text-sm font-medium text-foreground">{token.name}</p>
        <p className="text-xs text-muted-foreground font-mono">{token.var}</p>
        <p className="text-xs text-muted-foreground font-mono">{token.hex}</p>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </h2>
      {children}
    </section>
  );
}

export default function TokensPage() {
  return (
    <div className="min-h-screen bg-background px-8 py-12">
      <div className="mx-auto max-w-4xl flex flex-col gap-12">

        <div>
          <h1 className="text-2xl font-bold text-foreground">Design Tokens</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All semantic tokens available in this design system. Use Tailwind classes or CSS variables directly.
          </p>
        </div>

        {/* Color tokens */}
        {colorGroups.map((group) => (
          <Section key={group.label} label={group.label}>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
              {group.tokens.map((token) => (
                <Swatch key={token.name} token={token} />
              ))}
            </div>
          </Section>
        ))}

        {/* Border radius */}
        <Section label="Border Radius">
          <div className="flex flex-wrap gap-6">
            {radiiTokens.map((r) => (
              <div key={r.name} className="flex flex-col items-center gap-2">
                <div
                  className={`h-16 w-16 bg-primary ${r.name}`}
                />
                <p className="text-sm font-medium text-foreground">{r.label}</p>
                <p className="text-xs text-muted-foreground font-mono">{r.name}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Typography scale */}
        <Section label="Typography">
          <div className="flex flex-col gap-2 bg-surface border border-border rounded-lg p-6">
            {[
              { token: 'text-display', meta: 'IBM Plex Serif · 36px · bold',     sample: 'Display — Page titles, hero text' },
              { token: 'text-heading', meta: 'IBM Plex Serif · 24px · semibold', sample: 'Heading — Section headers' },
              { token: 'text-title',   meta: 'IBM Plex Serif · 18px · medium',   sample: 'Title — Card titles, subtitles' },
              { token: 'text-body',    meta: 'Nunito · 16px · normal',            sample: 'Body — The quick brown fox jumps over the lazy dog.' },
              { token: 'text-label',   meta: 'Nunito · 14px · medium',            sample: 'Label — Form labels, button text' },
              { token: 'text-caption', meta: 'Nunito · 12px · normal',            sample: 'Caption — Timestamps, helper text, metadata' },
            ].map(({ token, meta, sample }) => (
              <div key={token} className="flex items-baseline gap-6 py-3 border-b border-border last:border-0">
                <div className="w-64 shrink-0">
                  <p className="font-mono text-xs text-primary">{token}</p>
                  <p className="font-mono text-xs text-muted-foreground mt-0.5">{meta}</p>
                </div>
                <span className={`text-foreground ${token}`}>{sample}</span>
              </div>
            ))}
          </div>
        </Section>

      </div>
    </div>
  );
}
