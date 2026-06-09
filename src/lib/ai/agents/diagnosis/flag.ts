/**
 * Iteration-1 feature flag. The whole diagnosis surface (routes + page + nav)
 * is gated so it never appears in production until explicitly enabled.
 * Uses a NEXT_PUBLIC_ var so the client page and server routes share one switch.
 */
export function isCoachAgentEnabled(): boolean {
  return process.env.NEXT_PUBLIC_COACH_AGENT_ENABLED === 'true';
}
