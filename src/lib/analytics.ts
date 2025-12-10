import { createClient } from '@/lib/supabase/server';

/**
 * Track a user event to the analytics_events table
 * @param eventName - Name of the event (e.g., 'goal_created', 'tasks_generated')
 * @param properties - Additional properties to store with the event (JSONB)
 * @param userId - Optional user ID (if not provided, will attempt to get from session)
 */
export async function trackEvent(
  eventName: string,
  properties: Record<string, unknown> = {},
  userId?: string
): Promise<void> {
  try {
    const supabase = await createClient();

    let finalUserId = userId;

    // If userId not provided, try to get from session
    if (!finalUserId) {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error('Analytics: No authenticated user', authError);
        return;
      }
      finalUserId = user.id;
    }

    // Insert the event
    const { error: insertError } = await supabase
      .from('analytics_events')
      .insert({
        user_id: finalUserId,
        event_name: eventName,
        properties,
      });

    if (insertError) {
      console.error('Analytics: Failed to track event', {
        eventName,
        error: insertError,
      });
    }
  } catch (error) {
    // Don't throw errors - analytics should never break the app
    console.error('Analytics: Unexpected error tracking event', {
      eventName,
      error,
    });
  }
}

/**
 * Track event types for type safety
 */
export type AnalyticsEvent =
  | { name: 'goal_created'; properties: { type: 'ai' | 'manual' } }
  | { name: 'tasks_generated'; properties: { goalId: string; count: number } }
  | { name: 'action_logged'; properties: { taskId: string } }
  | { name: 'assessment_generated'; properties: { goalCount: number } }
  | { name: 'coach_message_sent'; properties: { conversationId: string } };

/**
 * Type-safe event tracking wrapper
 */
export async function trackAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
  await trackEvent(event.name, event.properties);
}
