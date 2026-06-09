import type { SupabaseClient } from '@supabase/supabase-js';
import { RubricSchema, type Rubric } from './types';
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
