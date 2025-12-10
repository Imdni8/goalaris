# Analytics Debugging Guide

## Common Issues & Fixes

### Issue: Analytics Events Not Being Tracked

**Symptom:** Events like `action_logged` or `coach_message_sent` don't appear in the `analytics_events` table, even though the feature works correctly.

**Root Cause:** Client-side components bypassing API routes and inserting directly into Supabase.

**How to Diagnose:**
1. Open browser DevTools (F12) → **Network** tab
2. Perform the action (e.g., log an action, send coach message)
3. Look at the POST request:
   - ✅ **Good**: Request goes to `/api/action-logs` or `/api/coach/send-message`
   - ❌ **Bad**: Request goes directly to `supabase.co/rest/v1/...`

**Fix:**
Replace direct Supabase inserts with API endpoint calls in client components:

**Before (doesn't track analytics):**
```typescript
const { error } = await supabase.from('action_logs').insert([...]);
```

**After (tracks analytics):**
```typescript
const response = await fetch('/api/action-logs', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ task_id, title, description, ... }),
});
```

**Why This Happens:**
- Analytics tracking is implemented in **server-side API routes**
- Direct Supabase inserts from client bypass these routes
- Result: Action succeeds, but analytics event never fires

**Files Fixed:**
- `src/components/tasks/action-log-form.tsx` - Changed to use `/api/action-logs`

---

## Debugging Server-Side Analytics

### Check if trackEvent() is Being Called

Add logging to see if the function runs:

```typescript
// In src/lib/analytics.ts
export async function trackEvent(...) {
  console.log('[Analytics] Tracking:', { eventName, userId, properties });
  // ... rest of function
}
```

### Check Vercel Function Logs

1. Go to Vercel Dashboard → Project → Logs
2. Filter by route (e.g., `/api/action-logs`)
3. Look for `[Analytics]` log messages
4. Check for errors or success confirmations

### Return Debug Info in API Response

Temporarily add debug output to API responses:

```typescript
const analyticsResult = await trackEvent(...);
return NextResponse.json({
  data,
  _debug_analytics: analyticsResult.error ?
    { error: analyticsResult.error.message } :
    { success: true }
});
```

Then check browser DevTools → Network → Response tab to see if analytics succeeded.

---

## Common Patterns

### ✅ Server-Side Tracking (Recommended)
**When:** API routes, server actions, server components
**Method:** Call `trackEvent()` directly with userId

```typescript
await trackEvent('event_name', { property: 'value' }, user.id);
```

### ✅ Client-Side Tracking via API
**When:** Client components that can't use API routes
**Method:** Call `/api/analytics/track` endpoint

```typescript
await fetch('/api/analytics/track', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    eventName: 'event_name',
    properties: { property: 'value' },
  }),
});
```

### ❌ Direct Supabase Insert from Client
**Problem:** Bypasses analytics tracking
**Fix:** Use one of the patterns above

---

## Verification Checklist

After implementing analytics tracking:

1. **Test the feature** - Ensure it still works correctly
2. **Check Network tab** - Verify requests go through API routes
3. **Check database** - Query `analytics_events` table:
   ```sql
   SELECT * FROM analytics_events
   WHERE event_name = 'your_event_name'
   ORDER BY created_at DESC
   LIMIT 10;
   ```
4. **Check Vercel logs** - Look for `[Analytics]` messages
5. **Test error cases** - Ensure analytics failures don't break features

---

## Best Practices

1. **Always pass userId explicitly** to `trackEvent()` to avoid auth context issues
2. **Don't await in fire-and-forget contexts** - Use `.catch()` to handle errors
3. **Never throw errors** - Analytics should never break the app
4. **Log failures** - Use `console.error` to debug analytics issues
5. **Use API routes** - Centralize analytics in server-side code when possible
