import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import {
  RubricSchema,
  InterviewPlanSchema,
  InterviewPlanItemSchema,
  type Rubric,
  type InterviewPlan,
} from './types';
import type { EvidenceLite, ProfileLite } from './run';

/** Load an approved rubric the user owns, validated back into a Rubric. */
export async function loadRubric(
  supabase: SupabaseClient,
  userId: string,
  rubricId: string,
): Promise<Rubric> {
  const { data, error } = await supabase
    .from('ca_target_rubric')
    .select('role_title, competencies')
    .eq('id', rubricId)
    .eq('user_id', userId)
    .single();
  if (error || !data) throw new Error('rubric not found');

  const parsed = RubricSchema.safeParse({
    role_title: data.role_title,
    competencies: data.competencies,
  });
  if (!parsed.success) throw new Error('stored rubric is malformed');
  return parsed.data;
}

/** Load the interview plan stored on a rubric (null when planning was skipped/failed). */
export async function loadPlan(
  supabase: SupabaseClient,
  userId: string,
  rubricId: string,
): Promise<InterviewPlan | null> {
  const { data, error } = await supabase
    .from('ca_target_rubric')
    .select('plan')
    .eq('id', rubricId)
    .eq('user_id', userId)
    .single();
  if (error || !data?.plan) return null;
  const parsed = InterviewPlanSchema.safeParse(data.plan);
  if (parsed.success) return parsed.data;
  // Tolerate plans persisted before `hard_requirements` existed: keep the items,
  // default the new field to empty rather than discarding the whole plan.
  const legacy = z.object({ items: z.array(InterviewPlanItemSchema) }).safeParse(data.plan);
  return legacy.success ? { ...legacy.data, hard_requirements: [] } : null;
}

/** Persist the interview plan onto an already-approved rubric the user owns. */
export async function savePlan(
  supabase: SupabaseClient,
  userId: string,
  rubricId: string,
  plan: InterviewPlan,
): Promise<void> {
  const { error } = await supabase
    .from('ca_target_rubric')
    .update({ plan })
    .eq('id', rubricId)
    .eq('user_id', userId);
  if (error) throw error;
}

/** Load the user's evidence ledger as lightweight rows for prompt-building. */
export async function loadEvidence(
  supabase: SupabaseClient,
  userId: string,
): Promise<EvidenceLite[]> {
  const { data, error } = await supabase
    .from('ca_evidence')
    .select('type, competency_key, content, source_label')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return data as EvidenceLite[];
}

/** Load the user's profile for context. */
export async function loadProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProfileLite | null> {
  const { data } = await supabase
    .from('profiles')
    .select('full_name, job_title, team, company, career_goal, key_skills')
    .eq('id', userId)
    .single();
  return (data as ProfileLite) ?? null;
}
