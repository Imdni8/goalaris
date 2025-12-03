# Signup Failure - Quick Fix Guide

## Issue
"Failed to create profile" error when signing up in production.

## Root Cause Analysis

**Probable causes (in order of likelihood):**

1. ✅ **Email confirmation enabled in Supabase**
   - Supabase auth creates user but doesn't confirm them immediately
   - Browser client tries to insert profile but RLS policy blocks unconfirmed users
   - Fix: Disable email confirmation OR use trigger

2. **RLS Policy too restrictive**
   - Policy: `auth.uid() = id` requires authenticated user
   - During signup, user might not be fully authenticated yet
   - Fix: Check RLS policies

3. **Foreign key constraint**
   - profiles.id references auth.users(id)
   - If auth.users insert fails/rollbacks, profile insert fails
   - Less likely since we check `authData.user` exists

---

## Immediate Fix Options

### Option A: Disable Email Confirmation (Recommended for Beta)

**Steps:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/uwglcctcvgzimqqhhxby)
2. Navigate to **Authentication → Settings**
3. Scroll to **Email Auth**
4. Find "Enable email confirmations"
5. **Uncheck/Disable** this option
6. Save changes

**Result**: Users can sign up and log in immediately without email confirmation.

**Trade-off**: No email verification required (acceptable for closed beta)

---

### Option B: Add Database Trigger (Better for Production)

Create a trigger that auto-creates profile when user signs up.

**Steps:**
1. Go to Supabase Dashboard → SQL Editor
2. Run this SQL:

```sql
-- Create function to auto-create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

3. Remove profile creation from signup code (optional but cleaner)

**Result**: Profile auto-created by database trigger, regardless of email confirmation.

**Trade-off**: Requires database change (but best practice)

---

### Option C: Check RLS Policies

Verify the RLS policy on profiles table allows inserts.

**Steps:**
1. Go to Supabase Dashboard → Database → Tables → profiles
2. Click "Policies" tab
3. Check "Users can insert own profile" policy

**Current Policy:**
```sql
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);
```

**Potential Issue**: `auth.uid()` returns NULL for unconfirmed users

**Fix** (if needed):
```sql
-- Drop old policy
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Create new policy allowing insert during signup
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (
  auth.uid() = id
  OR
  -- Allow insert if user exists in auth.users (during signup)
  EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = profiles.id)
);
```

---

## Testing After Fix

1. **Clear browser cache/cookies** or use incognito mode
2. Try signup again with fresh email
3. If Option A: Should work immediately
4. If Option B: Check that profile was created with trigger
5. If still failing: Check browser console and send error details

---

## Debug Checklist

Before testing fix, gather this info:

1. **Check Supabase Auth Settings**:
   - Is email confirmation enabled?
   - What's the confirmation URL template?

2. **Check if user was created**:
   - Go to Supabase Dashboard → Authentication → Users
   - Search for `tousif.rahaman@gmail.com`
   - Is the user there? Status?

3. **Check if profile exists**:
   - Go to Supabase Dashboard → Table Editor → profiles
   - Is there a row with matching user ID?

4. **Browser Console Error**:
   - F12 → Console tab
   - Look for error from Supabase client
   - Usually shows: "new row violates row-level security policy"

5. **Network Request Details**:
   - F12 → Network tab
   - Filter for "profiles"
   - Check the INSERT request
   - Copy response body

---

## Recommended Action Plan

**For Beta Launch (Quick & Simple):**
→ **Use Option A**: Disable email confirmation

**For Production (Best Practice):**
→ **Use Option B**: Add database trigger

**If you want both:**
1. Use Option A now to unblock testing
2. Add Option B trigger for future
3. Re-enable email confirmation later

---

## Expected Timeline

- Option A: 2 minutes (just toggle a setting)
- Option B: 10 minutes (SQL + testing)
- Option C: 15 minutes (investigate + fix)

---

## Next Steps After Fix

1. ✅ Fix signup issue
2. Test signup with new account
3. Continue with PRODUCTION-TEST-PLAN.md
4. Report results

---

## Contact Points

If still blocked:
- Check Supabase project: https://supabase.com/dashboard/project/uwglcctcvgzimqqhhxby
- Review profiles table RLS policies
- Check auth.users for created accounts
- Provide browser console errors for debugging
