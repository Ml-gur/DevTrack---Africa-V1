
# Fix Email Verification Redirect Issue

## Problem
Email verification links are redirecting to localhost instead of the production website (https://devtrackafrica.vercel.app).

## Root Cause
The Supabase client configuration doesn't specify a site URL, so it defaults to the current domain (localhost during development).

## Solution
Configure the Supabase client with the correct site URL for production redirects.
## Tasks
- [x] Update Supabase client configuration to include site URL
- [x] Test the configuration to ensure redirects work correctly
- [x] Add emailRedirectTo to signUp and resendConfirmation functions
- [x] Add auth callback handler to process email confirmation codes
- [x] Build completed successfully
- [ ] Verify email confirmation flow works in production

## Files Modified
- src/lib/supabaseClient.ts - Added site URL configuration to auth settings

## Changes Made
- Added `siteUrl` to the Supabase config object
- Set `siteUrl` in the auth configuration to ensure email confirmation links redirect to the correct domain
- Used environment variable `VITE_SITE_URL` with fallback to production URL
