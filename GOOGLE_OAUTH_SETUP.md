# Google OAuth Setup Guide

This guide will help you set up Google Sign-In for your MotoRent application.

## Prerequisites
- Supabase account with your project
- Google Cloud Console access

## Step 1: Configure Google OAuth Provider in Supabase

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/hceylmoutuzldbywawtm
   - Click on "Authentication" in the left sidebar
   - Click on "Providers"

2. **Enable Google Provider**
   - Find "Google" in the list of providers
   - Toggle it to "Enabled"
   - You'll see fields for "Client ID" and "Client Secret"
   - **Keep this tab open** - you'll need to paste values here later

3. **Copy the Redirect URL**
   - Copy the "Redirect URL" shown (it should look like: `https://hceylmoutuzldbywawtm.supabase.co/auth/v1/callback`)
   - You'll need this for Google Cloud Console

## Step 2: Set Up Google Cloud Console

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create a New Project (if needed)**
   - Click "Select a project" at the top
   - Click "New Project"
   - Name it "MotoRent" or similar
   - Click "Create"

3. **Enable Google+ API**
   - Go to: https://console.cloud.google.com/apis/library
   - Search for "Google+ API"
   - Click on it and click "Enable"

4. **Configure OAuth Consent Screen**
   - Go to: https://console.cloud.google.com/apis/credentials/consent
   - Select "External" user type
   - Click "Create"
   - Fill in required fields:
     - **App name**: MotoRent
     - **User support email**: Your email
     - **Developer contact information**: Your email
   - Click "Save and Continue"
   - Skip "Scopes" (click "Save and Continue")
   - Add test users if in testing mode (add your email)
   - Click "Save and Continue"

5. **Create OAuth 2.0 Credentials**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Click "Create Credentials" → "OAuth client ID"
   - Select "Web application"
   - Name it "MotoRent Web Client"
   - Under "Authorized redirect URIs", click "Add URI"
   - Paste the Supabase redirect URL you copied earlier
   - Click "Create"
   - **Copy the Client ID and Client Secret** shown in the popup

## Step 3: Add Credentials to Supabase

1. **Return to Supabase Dashboard**
   - Go back to Authentication → Providers → Google
   - Paste the **Client ID** from Google Cloud Console
   - Paste the **Client Secret** from Google Cloud Console
   - Click "Save"

## Step 4: Test Google Sign-In

1. **Try signing up with Google**
   - Go to your app's sign-up page
   - Click "Sign up with Google"
   - Sign in with your Google account
   - Grant permissions

2. **Email Verification**
   - Google OAuth automatically verifies email addresses
   - Users who sign up via Google will have their email automatically verified
   - They can log in immediately without email confirmation

3. **Check the Database**
   - Go to Supabase → Table Editor → `users`
   - You should see the new user created with their Google email
   - Check Supabase → Authentication → Users
   - The user's email should show as "Confirmed"

## Important Notes

### Email Verification
- **OAuth users have verified emails by default**: When users sign in with Google, Supabase automatically marks their email as verified (`email_confirmed_at` is set)
- **No confirmation email needed**: Users can log in immediately after signing up with Google
- **Security**: Google has already verified the email ownership, so no additional verification is needed

### User Profile Creation
- The system automatically creates a user profile in the database when a Google user signs in for the first time
- The profile uses data from their Google account (name, email)
- Phone number will be set to "N/A" initially (users can update it in their profile)

### Username for Google Users
- Google OAuth users won't have a username initially
- They can log in using their email address
- They can add a username later in their profile settings (when implemented)

### Redirect Behavior
- After successful Google sign-in, users are redirected to the home page (`/`)
- The app automatically detects the authenticated session and logs them in

## Troubleshooting

### "Access blocked: This app's request is invalid"
- Make sure you've enabled the Google+ API
- Check that the redirect URI in Google Cloud Console exactly matches the one from Supabase

### "User not found" or "Profile not created"
- Check the `getCurrentUser()` function in `authService.ts`
- It should automatically create a profile for new OAuth users

### "Email not verified"
- This should NOT happen with Google OAuth
- If it does, there may be an issue with the Supabase configuration
- Check that Google is properly enabled in Supabase → Authentication → Providers

### Users can't log in after signing up with Google
- Check Supabase → Authentication → Users
- Verify the user's email shows as "Confirmed"
- Check browser console for errors
- Make sure the `email_confirmed_at` check in authService allows OAuth users

## Security Considerations

1. **Keep credentials secure**: Never commit Client ID/Secret to version control
2. **Production mode**: Switch OAuth consent screen to "Production" before launch
3. **Allowed domains**: Consider restricting to specific domains in production
4. **Rate limiting**: Enable Supabase rate limiting to prevent abuse

## Next Steps

After setup is complete:
1. Test the full sign-up and login flow with Google
2. Test the email/password flow to ensure it still works
3. Verify that all user data is being stored correctly
4. Update your profile page to allow users to add/edit usernames

## Support

If you encounter issues:
- Check Supabase logs: Dashboard → Logs → Auth Logs
- Check browser console for JavaScript errors
- Review Google Cloud Console → APIs & Services → Credentials
- Ensure all URLs match exactly (including http/https)
