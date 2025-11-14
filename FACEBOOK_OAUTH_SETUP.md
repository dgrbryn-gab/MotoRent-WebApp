# Facebook OAuth Setup Guide

This guide will help you set up Facebook Sign-In for your MotoRent application.

## Step 1: Get Your Redirect URI from Supabase

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard/project/hceylmoutuzldbywawtm
   - Click "Authentication" → "Providers"
   - Find "Facebook" in the list
   - You'll see a "Redirect URL" like:
     ```
     https://hceylmoutuzldbywawtm.supabase.co/auth/v1/callback
     ```
   - **Copy this URL** - you'll need it for Facebook setup

## Step 2: Create a Facebook App

1. **Go to Facebook Developers**
   - Visit: https://developers.facebook.com/
   - Sign in with your Facebook account
   - Click "My Apps" (top right)

2. **Create New App**
   - Click "Create App"
   - Select app type: **"Consumer"** (for general users)
   - Click "Next"

3. **Fill in App Details**
   - **App Name**: `MotoRent`
   - **App Contact Email**: Your email
   - Click "Create App"
   - Complete the security check if prompted

## Step 3: Set Up Facebook Login

1. **Add Facebook Login Product**
   - In your app dashboard, scroll down to "Add Products to Your App"
   - Find "Facebook Login" and click "Set Up"

2. **Select Platform**
   - Choose "Web"
   - For Site URL, enter: `http://localhost:5173` (for development)
   - Click "Save" and "Continue"

3. **Configure OAuth Settings**
   - In the left sidebar, click "Facebook Login" → "Settings"
   - Under "Valid OAuth Redirect URIs":
     - Paste the Supabase redirect URL you copied earlier
     - Example: `https://hceylmoutuzldbywawtm.supabase.co/auth/v1/callback`
   - Click "Save Changes"

## Step 4: Get Your App Credentials

1. **Go to App Settings**
   - Click "Settings" → "Basic" in the left sidebar

2. **Copy Your Credentials**
   - **App ID**: Copy this (it's visible)
   - **App Secret**: Click "Show", then copy it
   - Keep these safe!

## Step 5: Configure Supabase

1. **Return to Supabase**
   - Go to: https://supabase.com/dashboard/project/hceylmoutuzldbywawtm
   - Authentication → Providers → Facebook

2. **Enable and Configure**
   - Toggle "Facebook" to **Enabled**
   - **Facebook client ID**: Paste your App ID
   - **Facebook client secret**: Paste your App Secret
   - Click "Save"

## Step 6: Configure Email Permissions (Important!)

Facebook OAuth requires specific permissions to access user email:

1. **Go to App Review** (in Facebook Developers)
   - Click "App Review" in the left sidebar
   - Click "Permissions and Features"

2. **Request Email Permission**
   - Find "email" in the list
   - Click "Request" or ensure it's approved
   - For development, email permission is usually granted automatically

3. **Make App Public (Optional for Testing)**
   - For testing with your own account, you can leave the app in Development Mode
   - To allow anyone to sign in, you'll need to make the app "Live":
     - Go to "Settings" → "Basic"
     - Scroll down to "App Mode"
     - Toggle from "Development" to "Live"

## Step 7: Test Facebook Sign-In

1. **Test the Integration**
   - Go to your app: http://localhost:5173
   - Click "Sign up" or "Login"
   - Click "Sign in with Facebook"
   - Authorize the app
   - You should be redirected back and logged in

2. **Check the Database**
   - Go to Supabase → Table Editor → `users`
   - You should see your new user with Facebook email
   - Go to Supabase → Authentication → Users
   - Email should show as "Confirmed"

## Important Notes

### Email Verification
- **Facebook OAuth users have verified emails by default**
- No confirmation email needed
- Users can log in immediately after signing up
- Facebook has already verified email ownership

### User Profile Creation
- System automatically creates user profile in database
- Uses Facebook name and email
- Phone number set to "N/A" (can update later)
- No username initially (can add in profile)

### Privacy & Permissions
- MotoRent requests: **public profile** and **email**
- Users will see these permissions when signing in
- Make sure your Facebook App has proper privacy policy and terms

### Development Mode vs Live Mode
- **Development Mode**: Only you and test users can sign in
- **Live Mode**: Anyone can sign in (requires app review for some permissions)
- For testing, Development Mode is fine

## Troubleshooting

### "App Not Set Up: This app is still in development mode"
- This is normal for testing
- Add yourself as a test user, or make the app Live

### "URL Blocked: This redirect failed"
- Check that the redirect URI in Facebook exactly matches Supabase
- Must include the full path: `/auth/v1/callback`

### "Can't Load URL: The domain of this URL isn't included"
- Go to Facebook Login → Settings
- Add your redirect URI to "Valid OAuth Redirect URIs"

### User Email Not Retrieved
- Check App Review → Permissions
- Ensure "email" permission is approved
- In development mode, it should work automatically

### "This app is not available right now"
- Your app might be in Development Mode
- Either switch to Live, or add yourself as a test user
- Go to "Roles" → "Test Users" and add your account

## Next Steps

After setup is complete:
1. Test sign-up with Facebook
2. Test sign-in with Facebook
3. Verify user data is saved correctly
4. Continue setting up Google OAuth when ready
5. Both OAuth providers work side-by-side

## Production Checklist

Before launching:
- [ ] Add privacy policy URL to Facebook App settings
- [ ] Add terms of service URL
- [ ] Request app review if needed for special permissions
- [ ] Switch app to "Live" mode
- [ ] Update redirect URIs for production domain
- [ ] Test with multiple users
- [ ] Ensure email permissions are working

## Support

If you encounter issues:
- Check Supabase Auth logs
- Check Facebook Developer console for errors
- Verify all URLs match exactly
- Ensure app is in correct mode (Development/Live)
- Check that email permission is granted
