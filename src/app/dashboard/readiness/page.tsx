import { notFound } from 'next/navigation';
import { isCoachAgentEnabled } from '@/lib/ai/agents/diagnosis/flag';
import { ReadinessFlow } from '@/components/readiness/readiness-flow';

/**
 * Promotion-readiness surface (coach agent, iteration 1 — diagnosis half).
 * Gated behind NEXT_PUBLIC_COACH_AGENT_ENABLED so it stays invisible in prod
 * until explicitly turned on.
 */
export default function ReadinessPage() {
  if (!isCoachAgentEnabled()) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <header className="space-y-1">
        <h1 className="text-heading text-foreground">Promotion readiness</h1>
        <p className="text-body text-muted-foreground">
          Define your target role, get assessed against it, and see exactly where you stand —
          honestly, including where the evidence isn’t there yet.
        </p>
      </header>
      <ReadinessFlow />
    </div>
  );
}
