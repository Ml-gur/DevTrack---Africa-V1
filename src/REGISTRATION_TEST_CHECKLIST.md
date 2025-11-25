# 🧪 Registration Testing Checklist

## Pre-Testing Setup

- [ ] `.env` file exists with correct Supabase credentials
- [ ] Dev server is running (`npm run dev`)
- [ ] Browser console is open (F12)
- [ ] Supabase dashboard is open in another tab

## Test 1: New User Registration ✅

### Steps
1. [ ] Open the application
2. [ ] Click "Register" or "Get Started"
3. [ ] Fill in registration form:
   - Email: `test1@devtrack.africa`
   - Password: `TestPassword123!`
   - Full Name: `Test User One`
   - Country: `Nigeria`
   - Phone: `+234 123 4567`
4. [ ] Click "Sign Up" button

### Expected Results
- [ ] No "Failed to fetch" error
- [ ] Success message appears
- [ ] Automatically logged in
- [ ] Redirected to dashboard or onboarding
- [ ] Console shows:
  ```
  🔄 Starting registration for: test1@devtrack.africa
  ✅ User created in auth: [user-id]
  ✅ Profile created successfully
  ✅ User registered and signed in successfully
  ```

### Verify in Supabase Dashboard
- [ ] User appears in `Authentication > Users`
- [ ] Profile appears in `Table Editor > profiles`
- [ ] Profile data matches submitted form

## Test 2: Duplicate Email Registration ❌

### Steps
1. [ ] Try registering again with same email
2. [ ] Use: `test1@devtrack.africa`

### Expected Results
- [ ] Error message: "User already registered"
- [ ] Registration form still visible
- [ ] User NOT created again
- [ ] Clear error displayed to user

## Test 3: Login After Registration ✅

### Steps
1. [ ] Sign out from the app
2. [ ] Go to login page
3. [ ] Enter credentials:
   - Email: `test1@devtrack.africa`
   - Password: `TestPassword123!`
4. [ ] Click "Sign In"

### Expected Results
- [ ] Successfully logged in
- [ ] Profile loaded
- [ ] Dashboard displayed
- [ ] Console shows:
  ```
  ✅ User signed in successfully
  🔄 Loading profile for user: [user-id]
  ✅ Profile loaded successfully
  ```

## Test 4: Profile Auto-Creation on Login ✅

### Setup
1. [ ] In Supabase dashboard, delete the profile record
2. [ ] Keep the auth user
3. [ ] Sign out from app

### Steps
1. [ ] Login with the credentials
2. [ ] Watch console output

### Expected Results
- [ ] Login succeeds
- [ ] Profile auto-created
- [ ] Console shows:
  ```
  🔄 Loading profile for user: [user-id]
  ⚠️ Profile fetch error: PGRST116
  🔄 Profile not found, creating one...
  ✅ Profile created and loaded successfully
  ```
- [ ] New profile appears in database

## Test 5: Invalid Credentials ❌

### Steps
1. [ ] Try logging in with wrong password
2. [ ] Email: `test1@devtrack.africa`
3. [ ] Password: `WrongPassword123!`

### Expected Results
- [ ] Error message: "Invalid login credentials"
- [ ] User NOT logged in
- [ ] Login form still visible

## Test 6: Weak Password ❌

### Steps
1. [ ] Try registering with weak password
2. [ ] Email: `test2@devtrack.africa`
3. [ ] Password: `123`

### Expected Results
- [ ] Error message about password requirements
- [ ] Registration fails
- [ ] User NOT created

## Test 7: Invalid Email Format ❌

### Steps
1. [ ] Try registering with invalid email
2. [ ] Email: `notanemail`
3. [ ] Password: `TestPassword123!`

### Expected Results
- [ ] Error message: "Invalid email format"
- [ ] Registration fails
- [ ] User NOT created

## Test 8: Profile Update ✅

### Steps
1. [ ] Login as `test1@devtrack.africa`
2. [ ] Go to profile/settings page
3. [ ] Update information:
   - Full Name: `Updated Test User`
   - Country: `Kenya`
   - Phone: `+254 987 6543`
4. [ ] Save changes

### Expected Results
- [ ] Success message appears
- [ ] Changes saved to database
- [ ] Console shows:
  ```
  🔄 Updating profile for user: [user-id]
  ✅ Profile updated successfully
  ```
- [ ] Verify in Supabase dashboard

## Test 9: Network Error Handling 🌐

### Steps
1. [ ] Open browser DevTools
2. [ ] Go to Network tab
3. [ ] Set throttling to "Offline"
4. [ ] Try to register

### Expected Results
- [ ] Error message: "Network error" or "Failed to create account"
- [ ] App doesn't crash
- [ ] Error is user-friendly

## Test 10: Multiple Users ✅

### Steps
1. [ ] Register 3 different users:
   - User 1: `alice@devtrack.africa`
   - User 2: `bob@devtrack.africa`
   - User 3: `charlie@devtrack.africa`

### Expected Results
- [ ] All 3 users created successfully
- [ ] All 3 profiles created
- [ ] Each user has unique ID
- [ ] Each user can login independently

## Test 11: Special Characters in Name ✅

### Steps
1. [ ] Register with special characters:
   - Email: `test3@devtrack.africa`
   - Full Name: `Ngọzi O'Brien-José`
   - Country: `Côte d'Ivoire`

### Expected Results
- [ ] Registration succeeds
- [ ] Special characters preserved
- [ ] Profile displays correctly

## Test 12: Email Confirmation (if enabled) 📧

### Steps (if email confirmation is enabled)
1. [ ] Register new user
2. [ ] Check email inbox
3. [ ] Click confirmation link
4. [ ] Try to login

### Expected Results
- [ ] Confirmation email received
- [ ] Link works
- [ ] Login succeeds after confirmation

## Test 13: Session Persistence 🔄

### Steps
1. [ ] Login successfully
2. [ ] Refresh the page (F5)
3. [ ] Close and reopen browser tab

### Expected Results
- [ ] User remains logged in after refresh
- [ ] Session restored
- [ ] Profile data still available

## Test 14: Sign Out ✅

### Steps
1. [ ] While logged in, click "Sign Out"

### Expected Results
- [ ] User logged out
- [ ] Redirected to login/home page
- [ ] Session cleared
- [ ] Profile data cleared
- [ ] Console shows:
  ```
  ✅ User signed out successfully
  ```

## Test 15: Concurrent Sessions 👥

### Steps
1. [ ] Login in Chrome
2. [ ] Login with same account in Firefox
3. [ ] Sign out in Chrome

### Expected Results
- [ ] Both sessions work independently
- [ ] Signing out in one doesn't affect other
- [ ] Each browser maintains its session

## Performance Tests ⚡

### Registration Speed
- [ ] Registration completes in < 3 seconds
- [ ] No UI freezing
- [ ] Loading indicators work

### Login Speed
- [ ] Login completes in < 2 seconds
- [ ] Profile loads quickly
- [ ] Smooth transition to dashboard

## Error Messages Quality 💬

Check that error messages are:
- [ ] User-friendly (no technical jargon)
- [ ] Clear and actionable
- [ ] Displayed prominently
- [ ] Not too long or too short
- [ ] Properly formatted

## Console Logging Quality 📝

Check that console logs are:
- [ ] Informative
- [ ] Use proper emoji indicators (✅, ❌, 🔄, ⚠️)
- [ ] Show relevant data (not sensitive)
- [ ] Help with debugging
- [ ] Not too verbose

## Database Verification Checklist 🗄️

### In Supabase Dashboard

**Auth Users Table:**
- [ ] User records exist
- [ ] Email addresses correct
- [ ] User IDs are UUIDs
- [ ] Created timestamps accurate

**Profiles Table:**
- [ ] Profile records exist
- [ ] `user_id` matches auth user ID
- [ ] All fields populated correctly
- [ ] No duplicate profiles
- [ ] Timestamps correct

**RLS Policies:**
- [ ] Users can only see own profile
- [ ] Users can only update own profile
- [ ] No unauthorized access possible

## Common Issues & Solutions 🔧

### Issue: "Failed to fetch"
**Check:**
- [ ] `.env` file configured
- [ ] Supabase project is running
- [ ] No CORS errors in console
- [ ] Restart dev server

### Issue: Profile not created
**Check:**
- [ ] `profiles` table exists
- [ ] RLS policies correct
- [ ] User has insert permission
- [ ] Auto-creation triggers on login

### Issue: Email confirmation not working
**Check:**
- [ ] Email settings in Supabase
- [ ] SMTP configured (if custom)
- [ ] Check spam folder
- [ ] Disable for development testing

## Final Checklist ✅

- [ ] All registration tests pass
- [ ] All login tests pass
- [ ] Profile management works
- [ ] Error handling is robust
- [ ] No console errors
- [ ] Database records correct
- [ ] Sessions work properly
- [ ] Sign out works
- [ ] Performance is good
- [ ] UI/UX is smooth

## Sign-Off

**Tester:** _________________

**Date:** _________________

**Test Environment:**
- Browser: _________________
- OS: _________________
- Node version: _________________
- Database: Supabase

**Overall Status:** [ ] PASS / [ ] FAIL

**Notes:**
_____________________________________
_____________________________________
_____________________________________

---

## Next Steps After Testing

If all tests pass:
- ✅ Registration system is production-ready
- ✅ Move to testing other features
- ✅ Consider deployment

If tests fail:
- 🔍 Review failed test details
- 🔧 Check `/REGISTRATION_FIX_COMPLETE.md`
- 🆘 Check console for detailed errors
- 📧 Note error messages for debugging

---

**Happy Testing! 🧪**
