# Goalaris Production Testing Plan

**Production URL**: https://goalaris.vercel.app (verify from Vercel dashboard)
**Date**: December 4, 2025
**Tester**: Tousif Rahaman

---

## 🚨 Critical Issue Identified

**Issue #1**: Signup failing with "Failed to create profile"
- **Error**: User creation succeeds but profile creation fails
- **Screenshot**: Captured
- **Status**: ❌ BLOCKING - Must fix before beta launch

### Probable Causes:
1. RLS policy on `profiles` table preventing inserts
2. Missing trigger to auto-create profile on user signup
3. Foreign key constraint issue (profiles.id → auth.users.id)
4. Service role key not working in production

---

## Test Plan Structure

For each test case:
- ✅ = Pass
- ❌ = Fail (document error message/screenshot)
- ⚠️ = Partial (works but with issues)
- ⏭️ = Skipped (blocked by previous failure)

---

## Phase 1: Authentication & Profile (CRITICAL)

### Test Case 1.1: Sign Up
**Steps:**
1. Navigate to production URL
2. Click "Sign up"
3. Enter:
   - Full Name: `Tousif Rahaman`
   - Email: `tousif.rahaman@gmail.com`
   - Password: (your test password)
4. Click "Sign Up"

**Expected Result**:
- Account created successfully
- Profile row inserted in `profiles` table
- Redirected to `/dashboard`

**Actual Result**: ❌ FAILED
- Error: "Failed to create profile"
- User might be created in auth.users but profile insert fails

**Debug Info Needed:**
- Check browser console for API errors (F12 → Console tab)
- Check Network tab for `/api/auth/signup` or similar request
- Copy full error response if available

---

### Test Case 1.2: Email Confirmation (if enabled)
**Prerequisite**: Test 1.1 passes

**Steps:**
1. Check email inbox for confirmation email
2. Click confirmation link
3. Navigate to production URL
4. Try logging in

**Expected Result**: Login succeeds after email confirmation

**Actual Result**: [ ] (fill in)

---

### Test Case 1.3: Login with Existing Account
**Prerequisite**: Test 1.1 passes OR manual account creation in Supabase

**Steps:**
1. Navigate to `/login`
2. Enter valid credentials
3. Click "Login"

**Expected Result**: Redirected to `/dashboard`

**Actual Result**: [ ] (fill in)

---

### Test Case 1.4: Profile Data Display
**Prerequisite**: Test 1.3 passes

**Steps:**
1. After login, check dashboard for user name display
2. Navigate to profile settings (if exists)

**Expected Result**: Full name "Tousif Rahaman" displays correctly

**Actual Result**: [ ] (fill in)

---

## Phase 2: Goal Management

### Test Case 2.1: Create Goal Manually
**Prerequisite**: Logged in

**Steps:**
1. Click "Goals" or navigate to `/dashboard/goals`
2. Click "Create Goal" or "New Goal"
3. Fill in:
   - Title: `Complete Q1 Performance Review Preparation`
   - Description: `Prepare comprehensive documentation for annual review`
   - Status: Active
4. Fill SMART fields (optional for now)
5. Click "Save"

**Expected Result**: Goal created and appears in goals list

**Actual Result**: [ ] (fill in)

**Notes**: [ ]

---

### Test Case 2.2: Create Goal with AI
**Prerequisite**: Test 2.1 passes

**Steps:**
1. Click "Create with AI" or navigate to `/dashboard/goals/new-ai`
2. Enter raw goal: `I want to improve my team's code quality by implementing better testing practices`
3. Click "Generate SMART Goal"
4. Wait for AI response (should take 3-10 seconds)
5. Review generated SMART breakdown
6. Click "Save Goal"

**Expected Result**:
- AI generates structured SMART goal
- Goal saved with ai_suggested=true
- Redirected to goal detail page

**Actual Result**: [ ] (fill in)

**Notes**: [ ]

**If Failed - Check**:
- Browser console for errors
- Does it timeout or return error?
- Error message displayed?

---

### Test Case 2.3: Generate Tasks from Goal
**Prerequisite**: Test 2.2 passes

**Steps:**
1. On goal detail page, click "Generate Tasks with AI"
2. Wait for AI response
3. Review generated tasks (should be 5-10 tasks)
4. Click "Save All Tasks"

**Expected Result**:
- AI generates 5-10 actionable tasks
- Tasks saved with proper order_index
- Tasks appear in task list

**Actual Result**: [ ] (fill in)

**Notes**: [ ]

---

### Test Case 2.4: View Goal Details
**Prerequisite**: Test 2.1 passes

**Steps:**
1. From goals list, click on a goal card
2. Verify goal detail page loads
3. Check SMART breakdown display

**Expected Result**: All goal details display correctly

**Actual Result**: [ ] (fill in)

---

### Test Case 2.5: Edit Goal
**Prerequisite**: Test 2.1 passes

**Steps:**
1. On goal detail page, click "Edit"
2. Modify title or description
3. Click "Save"

**Expected Result**: Goal updated successfully

**Actual Result**: [ ] (fill in)

---

### Test Case 2.6: Delete Goal
**Prerequisite**: Test 2.1 passes

**Steps:**
1. Create a test goal to delete
2. Click delete button (trash icon)
3. Confirm deletion

**Expected Result**:
- Goal deleted
- Tasks cascaded deleted (if any existed)
- Removed from goals list

**Actual Result**: [ ] (fill in)

---

## Phase 3: Task Management & Kanban

### Test Case 3.1: View Kanban Board
**Prerequisite**: Test 2.3 passes (tasks exist)

**Steps:**
1. Navigate to `/dashboard` or main dashboard
2. Locate Kanban board section

**Expected Result**:
- Tasks displayed in columns: To Do, In Progress, Completed
- Goal badge shows on each task card
- Drag-and-drop enabled

**Actual Result**: [ ] (fill in)

---

### Test Case 3.2: Drag Task to Change Status
**Prerequisite**: Test 3.1 passes

**Steps:**
1. Drag a task from "To Do" to "In Progress"
2. Wait for update confirmation

**Expected Result**:
- Task moves to new column
- Status updated in database
- UI reflects change

**Actual Result**: [ ] (fill in)

---

### Test Case 3.3: Create Task Manually
**Prerequisite**: Test 2.1 passes (goal exists)

**Steps:**
1. Navigate to goal detail
2. Click "Add Task" or similar
3. Enter task details
4. Save

**Expected Result**: Task created and appears in list

**Actual Result**: [ ] (fill in)

---

## Phase 4: Progress Tracking

### Test Case 4.1: Log Action on Task
**Prerequisite**: Test 3.1 passes (tasks exist)

**Steps:**
1. Click on a task card to open detail modal
2. In action log form, enter:
   - Title: `Completed code review training session`
   - Description: `Attended 2-hour workshop on effective code reviews`
3. Click "Log Action"

**Expected Result**:
- Action log saved
- Appears in timeline
- Task status auto-updates to "in_progress"

**Actual Result**: [ ] (fill in)

---

### Test Case 4.2: Log Blocker
**Prerequisite**: Test 4.1 passes

**Steps:**
1. Open task detail modal
2. In action log form:
   - Title: `Blocked on test framework setup`
   - Status: Select "Blocked"
   - Blocker description: `Waiting for DevOps to approve Jest installation`
3. Save

**Expected Result**:
- Blocker logged with active status
- Task status updates to "blocked"
- Red badge appears on goal card

**Actual Result**: [ ] (fill in)

---

### Test Case 4.3: Resolve Blocker
**Prerequisite**: Test 4.2 passes

**Steps:**
1. Find blocker in action log timeline
2. Click "Mark Resolved"

**Expected Result**:
- Blocker status changes to "resolved"
- Background color changes from red to gray
- Blocker count badge updates

**Actual Result**: [ ] (fill in)

---

### Test Case 4.4: Delete Action Log
**Prerequisite**: Test 4.1 passes

**Steps:**
1. In action log timeline, click delete button
2. Confirm deletion

**Expected Result**: Log entry removed from timeline

**Actual Result**: [ ] (fill in)

---

## Phase 5: Dashboard & Visualization

### Test Case 5.1: View Dashboard Overview
**Prerequisite**: Tests 2.1, 3.1, 4.1 pass (data exists)

**Steps:**
1. Navigate to `/dashboard`
2. Review dashboard widgets

**Expected Result**:
- Total goals count displayed
- Overall completion % shown
- Recent actions (7d) count
- Active blockers count
- Activity heatmap visible

**Actual Result**: [ ] (fill in)

---

### Test Case 5.2: Activity Heatmap
**Prerequisite**: Test 4.1 passes (action logs exist)

**Steps:**
1. On dashboard, locate activity heatmap
2. Hover over cells

**Expected Result**:
- GitHub-style heatmap showing 90 days
- Cells colored based on activity (gray=0, green shades=1+)
- Tooltip shows date and action count

**Actual Result**: [ ] (fill in)

---

### Test Case 5.3: Goal Progress Charts
**Prerequisite**: Test 2.1 passes

**Steps:**
1. On goals list, check each goal card
2. Verify progress bar

**Expected Result**:
- Progress bar shows completion %
- Color coded: green (>70%), yellow (40-70%), red (<40%)

**Actual Result**: [ ] (fill in)

---

## Phase 6: AI Career Coach

### Test Case 6.1: Start Coaching Conversation
**Prerequisite**: Logged in, some goals/tasks exist

**Steps:**
1. Navigate to `/dashboard/coach`
2. In message input, type: `How am I progressing on my goals?`
3. Click send

**Expected Result**:
- AI response streams in (not blank)
- Response is contextual (mentions your actual goals)
- Response saved to conversation history

**Actual Result**: [ ] (fill in)

**If Failed - Check**:
- Does message send but no response?
- Blank response?
- Error message?

---

### Test Case 6.2: Goal-Focused Coaching
**Prerequisite**: Test 6.1 passes, multiple goals exist

**Steps:**
1. Click "Focus on Goal" button
2. Select a specific goal
3. Ask: `What should I focus on next for this goal?`

**Expected Result**:
- Selected goal badge appears
- AI response is specific to that goal
- Mentions tasks from that goal

**Actual Result**: [ ] (fill in)

---

### Test Case 6.3: Create New Conversation
**Prerequisite**: Test 6.1 passes

**Steps:**
1. Click "New Conversation" or similar
2. Start fresh chat

**Expected Result**: New conversation created, previous one saved in sidebar

**Actual Result**: [ ] (fill in)

---

### Test Case 6.4: Delete Conversation
**Prerequisite**: Test 6.1 passes

**Steps:**
1. Hover over conversation in sidebar
2. Click trash icon
3. Confirm deletion

**Expected Result**: Conversation removed from list

**Actual Result**: [ ] (fill in)

---

## Phase 7: Self-Assessment Generation

### Test Case 7.1: Generate Assessment
**Prerequisite**: Tests 2.1, 4.1 pass (goals + action logs exist)

**Steps:**
1. Navigate to `/dashboard/self-assessment`
2. Select 1-2 goals (checkboxes)
3. Select date range: "Last 6 Months"
4. Click "Generate Assessment"
5. Wait for AI generation (10-30 seconds)

**Expected Result**:
- AI generates 3-4 paragraph summary
- Written in first-person
- Mentions specific accomplishments from action logs
- Assessment appears in editor

**Actual Result**: [ ] (fill in)

**If Failed - Check**:
- Timeout?
- Error message?
- Console errors?

---

### Test Case 7.2: Refine Assessment Text with AI
**Prerequisite**: Test 7.1 passes

**Steps:**
1. In assessment editor, select a sentence
2. Popup appears with "Refine with AI"
3. Enter instruction: `Make this more quantitative`
4. Click "Refine"
5. Preview refined text
6. Click "Accept"

**Expected Result**:
- AI refines only selected text
- Preview shows before accepting
- Text updates in editor

**Actual Result**: [ ] (fill in)

---

### Test Case 7.3: Save Assessment
**Prerequisite**: Test 7.1 passes

**Steps:**
1. After generating assessment, enter title: `Q4 2024 Self-Assessment`
2. Click "Save as Draft"

**Expected Result**:
- Assessment saved with draft status
- Appears in "Saved Assessments" list
- Blue border indicates loaded assessment

**Actual Result**: [ ] (fill in)

---

### Test Case 7.4: Load Saved Assessment
**Prerequisite**: Test 7.3 passes

**Steps:**
1. From saved assessments list, click on saved assessment
2. Verify it loads into editor

**Expected Result**:
- Assessment content loads
- Configuration (goals, date range) restored
- Button changes to "Update"

**Actual Result**: [ ] (fill in)

---

### Test Case 7.5: Copy Assessment to Clipboard
**Prerequisite**: Test 7.1 passes

**Steps:**
1. Click "Copy to Clipboard" button
2. Paste into notepad/text editor

**Expected Result**: Full assessment text copied

**Actual Result**: [ ] (fill in)

---

## Phase 8: Edge Cases & Error Handling

### Test Case 8.1: Logout
**Steps:**
1. Click profile/user menu
2. Click "Logout"

**Expected Result**:
- Logged out successfully
- Redirected to login page
- Cannot access /dashboard without login

**Actual Result**: [ ] (fill in)

---

### Test Case 8.2: Invalid Login
**Steps:**
1. Try logging in with wrong password

**Expected Result**: Clear error message displayed

**Actual Result**: [ ] (fill in)

---

### Test Case 8.3: Browser Console Errors
**Throughout all tests above:**

Check browser console (F12) for:
- Red errors
- Failed network requests (except chrome-extension ones)
- React errors/warnings

**List any errors found**: [ ]

---

### Test Case 8.4: Mobile Responsiveness (Optional)
**Steps:**
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select iPhone/Android view
4. Navigate through key pages

**Expected Result**: Layout adapts reasonably (may not be perfect)

**Actual Result**: [ ] (fill in)

---

## Critical Bugs to Report

For each bug, include:
1. Test case number
2. Steps to reproduce
3. Error message (exact text)
4. Screenshot
5. Browser console errors
6. Network request details (if applicable)

### Bug Report Template:
```
**Bug #[number]**: [Short description]
**Test Case**: [e.g., 1.1]
**Severity**: Critical / High / Medium / Low
**Reproducible**: Always / Sometimes / Once

**Steps to Reproduce**:
1.
2.
3.

**Expected**: [What should happen]
**Actual**: [What actually happened]

**Error Message**:
```

**Screenshots**: [Attach or describe]

**Console Errors**:
```
[Paste console.log output]
```

**Network Details** (if API error):
- Request URL:
- Status Code:
- Response Body:
```

---

## Summary Report

After completing all tests, fill this in:

**Total Test Cases**: 45
**Passed**: [ ]
**Failed**: [ ]
**Skipped**: [ ]

**Critical Issues Found**: [ ]
**High Priority Issues**: [ ]
**Medium Priority Issues**: [ ]

**Blocker for Beta Launch?**: Yes / No

**Overall Assessment**: [ ]

**Recommended Next Steps**:
1. [ ]
2. [ ]
3. [ ]

---

## Additional Notes

[Add any observations, performance issues, UX feedback, etc.]

---

**Next Session Instructions:**
When you return with test results, provide:
1. This completed document
2. Any screenshots of errors
3. Browser console logs (if errors occurred)
4. We'll systematically fix all issues before beta launch
