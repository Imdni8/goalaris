import { Runner, OpenAIChatCompletionsModel } from '@openai/agents';
import { OpenAI } from 'openai';

/**
 * Model providers for the agent layer, with OpenAI as primary and Google
 * (Gemini) as an automatic fallback (see `runCoachAgent`).
 *
 * - Primary: the SDK's default OpenAI client, configured from `OPENAI_API_KEY`.
 * - Fallback: Gemini via Google's OpenAI-compatible endpoint, driven through the
 *   Chat Completions API with `GOOGLE_AI_API_KEY`. Going direct to Google (rather
 *   than through a gateway) avoids both the OpenAI billing block and any extra
 *   network hop, using a key the app already relies on.
 *
 * Tracing is disabled on both runners: the SDK's tracing exporter uploads to
 * OpenAI and needs OpenAI quota, which is exactly what we're failing over from.
 */

/** Model used when talking to OpenAI directly. */
export const PRIMARY_MODEL = 'gpt-4.1-mini';

/** Google's OpenAI-compatible base URL. */
const GOOGLE_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/';
/** Gemini model for the fallback. Override with FALLBACK_MODEL if desired. */
const FALLBACK_MODEL = process.env.FALLBACK_MODEL ?? 'gemini-2.5-flash';

let fallbackModel: OpenAIChatCompletionsModel | null = null;

function getFallbackModel(): OpenAIChatCompletionsModel {
  if (!process.env.GOOGLE_AI_API_KEY) {
    throw new Error('GOOGLE_AI_API_KEY is not set; cannot use Gemini fallback');
  }
  if (!fallbackModel) {
    const client = new OpenAI({
      apiKey: process.env.GOOGLE_AI_API_KEY,
      baseURL: GOOGLE_BASE_URL,
    });
    fallbackModel = new OpenAIChatCompletionsModel(client, FALLBACK_MODEL);
  }
  return fallbackModel;
}

/**
 * Per-stage model routing for the diagnosis pipeline (iteration 1).
 *
 * Cost-tiered: cheap models for high-volume conversational/extraction work,
 * a stronger model only for the infrequent, quality-critical diagnosis synthesis.
 *
 * NOTE: fallback is intentionally SKIPPED for iteration 1 — OpenAI-only, no Gemini
 * failover map. We run on a small OpenAI test budget; a fallback column comes back
 * in a later slice. The existing getPrimaryRunner/getFallbackRunner (used by the POC
 * `coachAgent`) are left untouched.
 */
export type PipelineStage = 'rubric' | 'interview' | 'diagnosis';

const STAGE_MODELS: Record<PipelineStage, string> = {
  rubric: 'gpt-4.1-mini', // structured extraction from a JD
  interview: 'gpt-4.1-mini', // routine conversational turns
  diagnosis: 'gpt-4.1', // current-vs-target judgment + confidence — quality-critical
};

const stageRunners = new Map<PipelineStage, Runner>();

/** OpenAI-only Runner for a given pipeline stage (no fallback in iteration 1). */
export function getRunnerFor(stage: PipelineStage): Runner {
  let runner = stageRunners.get(stage);
  if (!runner) {
    runner = new Runner({ model: STAGE_MODELS[stage], tracingDisabled: true });
    stageRunners.set(stage, runner);
  }
  return runner;
}

let primaryRunner: Runner | null = null;
let fallbackRunner: Runner | null = null;

/** Runner backed by OpenAI directly. Sets the model here (not on the agent) so
 * the fallback Runner can override it — an agent-level model would win over
 * RunConfig.model and defeat failover. */
export function getPrimaryRunner(): Runner {
  if (!primaryRunner) {
    primaryRunner = new Runner({ model: PRIMARY_MODEL, tracingDisabled: true });
  }
  return primaryRunner;
}

/** Runner that overrides every agent's model to run on Gemini via Google. */
export function getFallbackRunner(): Runner {
  if (!fallbackRunner) {
    fallbackRunner = new Runner({ model: getFallbackModel(), tracingDisabled: true });
  }
  return fallbackRunner;
}

export type Provider = 'openai' | 'google';
