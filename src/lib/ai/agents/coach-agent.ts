import { Agent, tool } from '@openai/agents';
import type { AgentInputItem } from '@openai/agents';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getPrimaryRunner, getFallbackRunner, type Provider } from './providers';

/**
 * Proof-of-concept coach agent built on the OpenAI Agents SDK.
 *
 * This is intentionally minimal: one agent, two read-only tools that pull the
 * signed-in user's profile and goals from Supabase. It exists to validate the
 * SDK setup (model access, tool-calling, context plumbing) before we design the
 * full multi-agent coaching system.
 *
 * The agent is given NO user data up front — it must call its tools to fetch
 * context. That is deliberate: it proves tool-calling works end-to-end.
 */

/** Per-request context handed to the agent's tools (never sent to the model). */
export interface CoachContext {
  supabase: SupabaseClient;
  userId: string;
}

const getUserProfile = tool({
  name: 'get_user_profile',
  description:
    "Fetch the signed-in user's professional profile (role, team, company, " +
    'career goal, skills). Use this to personalize advice to their seniority and context.',
  parameters: z.object({}),
  async execute(_args, runContext) {
    const { supabase, userId } = runContext!.context as CoachContext;
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, job_title, team, company, career_goal, key_skills')
      .eq('id', userId)
      .single();

    if (error || !data) return { found: false as const };
    return { found: true as const, profile: data };
  },
});

const getGoalContext = tool({
  name: 'get_goal_context',
  description:
    "Fetch the user's active goals and their tasks (including any blockers). " +
    'Use this to ground advice in what the user is actually working on.',
  parameters: z.object({}),
  async execute(_args, runContext) {
    const { supabase, userId } = runContext!.context as CoachContext;
    const { data, error } = await supabase
      .from('goals')
      .select('title, description, status, time_bound, tasks ( title, status, blocker_description )')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) return { goals: [] };
    return { goals: data ?? [] };
  },
});

export const coachAgent = new Agent<CoachContext>({
  name: 'Career Coach',
  // No model here on purpose: the model is set per-Runner (OpenAI vs Gemini) so
  // failover works. An agent-level model would override RunConfig.model and pin
  // every run to one provider. See providers.ts.
  tools: [getUserProfile, getGoalContext],
  instructions: `You are an experienced career coach for an enterprise goal-tracking app.

Before giving advice, ALWAYS call get_user_profile to learn the user's role and
career goal, and get_goal_context to see what they're working on. Tailor your
tone and specificity to their seniority (infer it from their job title): be more
strategic with senior roles, more concrete and tactical with junior ones.

Keep responses focused and actionable — a few short paragraphs at most. Reference
the user's actual goals and blockers when relevant. If you lack the data to answer
well, say so plainly rather than inventing details.`,
});

export interface RunCoachAgentResult {
  output: string;
  toolsCalled: string[];
  /** Which provider actually produced the response. */
  provider: Provider;
}

function toolNames(history: AgentInputItem[]): string[] {
  return history
    .filter(
      (item): item is Extract<AgentInputItem, { type: 'function_call' }> =>
        item.type === 'function_call',
    )
    .map((item) => item.name);
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/**
 * Run the coach agent for a single user turn (non-streaming), with automatic
 * failover from OpenAI to Gemini (Google).
 *
 * We fail over on ANY error from the primary so a billing/quota/outage problem
 * at OpenAI doesn't take coaching down. The active provider is returned so
 * callers can observe when the fallback kicked in.
 */
export async function runCoachAgent(
  message: string,
  context: CoachContext,
): Promise<RunCoachAgentResult> {
  try {
    const result = await getPrimaryRunner().run(coachAgent, message, { context });
    return { output: result.finalOutput ?? '', toolsCalled: toolNames(result.history), provider: 'openai' };
  } catch (primaryError) {
    console.warn('[coach-agent] OpenAI failed, falling back to Gemini:', errMsg(primaryError));
    try {
      const result = await getFallbackRunner().run(coachAgent, message, { context });
      return { output: result.finalOutput ?? '', toolsCalled: toolNames(result.history), provider: 'google' };
    } catch (fallbackError) {
      throw new Error(
        `Both providers failed. OpenAI: ${errMsg(primaryError)} | Google: ${errMsg(fallbackError)}`,
      );
    }
  }
}
