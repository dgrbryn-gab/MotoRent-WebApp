# Email OTP Configuration Guide

This guide explains how to configure Supabase to use OTP (One-Time Password) instead of confirmation links for email verification.

## Step 1: Configure Authentication Settings

1. **Go to Supabase Dashboard**
   - Navigate to your project dashboard
   - Go to **Authentication** → **Settings**

2. **Enable Email OTP**
   - Under "Auth Providers" → Find "Email"
   - Enable "Enable email confirmations" if not already enabled
   - Look for "Enable email OTP" option and enable it

3. **Security Settings**
   - Under "Security and Validation"
   - Enable "Enable email OTP" (if available in your Supabase version)
   - Set OTP expiry time (default: 1 hour is recommended)

## Step 2: Update Email Templates

### Confirm Signup Template

1. Go to **Authentication** → **Email Templates**
2. Select **"Confirm signup"** template
3. Replace the template content with:

```html
<h2>Welcome to MotoRent!</h2>

<p>Thank you for signing up. To complete your registration, please use the verification code below:</p>

<div style="background: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; border-radius: 8px;">
  {{ .Token }}
</div>

<p><strong>This code will expire in 1 hour.</strong></p>

<p>If you didn't sign up for MotoRent, you can safely ignore this email.</p>

<hr>
<p style="color: #666; font-size: 14px;">
  MotoRent - Your trusted motorcycle rental platform
</p>
```

### Alternative Minimal Template

If you prefer a simpler template:

```html
<h2>Verify your email</h2>
<p>Your verification code is: <strong>{{ .Token }}</strong></p>
<p>This code expires in 1 hour.</p>
```

## Step 3: Test the Configuration

1. **Run Migration**
   ```sql
   -- Run the migration file: 016_enable_email_otp.sql
   -- This creates helper functions and documentation
   ```

2. **Test Signup Flow**
   - Try signing up with a new account
   - Check that you receive an email with a 6-digit code
   - Verify the OTP verification component works

3. **Check Email Delivery**
   - Verify emails are sent promptly
   - Check spam folder if needed
   - Confirm the template renders correctly

## Step 4: SMTP Configuration (Optional)

For branded emails, configure custom SMTP:

1. Go to **Authentication** → **Settings** → **SMTP Settings**
2. Configure your SMTP provider (SendGrid, Mailgun, etc.)
3. Set sender name to "MotoRent" and appropriate email address
4. Test the configuration

## Environment Variables

Add to your `.env.local` file if needed:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Email Configuration (if using custom SMTP)
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
```

## Troubleshooting

### Common Issues:

1. **OTP not working**: Check if email OTP is enabled in Supabase settings
2. **Template not updating**: Clear browser cache, check template syntax
3. **Emails not delivered**: Check SMTP settings, verify email domain
4. **Rate limiting**: Supabase has built-in rate limiting for OTP requests

### Debug Steps:

1. Check browser network tab for API errors
2. Verify Supabase auth settings
3. Test with different email providers
4. Check Supabase logs for authentication events

## Security Notes

- OTP codes expire in 1 hour by default
- Rate limiting prevents spam/abuse
- Codes are single-use only
- Failed attempts are logged

## Implementation Notes

The OTP verification system:
- Shows a 6-digit input interface
- Auto-focuses next input field
- Supports paste functionality
- Has resend capability with countdown
- Shows loading states
- Handles errors gracefully
- Auto-submits when all digits entered

This provides a modern, mobile-friendly verification experience!