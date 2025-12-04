# Resend OTP Integration Setup

## Overview
This document describes the OTP (One-Time Password) authentication system using Resend with a custom Hostinger domain.

## Configuration

### Environment Variables
```bash
# Email Service Configuration
VITE_EMAIL_SERVICE=resend
VITE_EMAIL_API_KEY=re_xxxxx  # Your Resend API key
VITE_EMAIL_FROM=otp@yourdomain.com  # Your custom domain
VITE_RESEND_DOMAIN=yourdomain.com  # Your domain
VITE_APP_URL=http://localhost:5173  # Your app URL
```

### Setup Steps

1. **Configure Resend**:
   - Sign up at https://resend.com
   - Add your custom domain
   - Get your API key (starts with `re_`)

2. **Configure Hostinger SMTP**:
   - Set up SMTP credentials on Hostinger
   - Configure Resend to use your custom domain via SMTP
   - This sends emails from your domain (e.g., otp@yourdomain.com)

3. **Configure Supabase**:
   - SMTP is configured on Supabase but NOT used for email sending
   - Supabase Auth no longer sends verification emails
   - User signup creates the account without email verification from Supabase

## Authentication Flow

### Signup Process
1. User enters email and password
2. `authService.signUp()` creates user in Supabase Auth
3. A 6-digit OTP code is generated (valid for 10 minutes)
4. OTP is sent to user's email via **Resend** using custom domain
5. User receives email from your custom domain (e.g., otp@yourdomain.com)
6. User enters OTP code in the app
7. `authService.verifyOTP()` validates the code
8. On successful verification, user is logged in

### OTP Resend
- User can request OTP again with 60-second cooldown
- Throttling prevents rate-limit errors
- New OTP is generated and sent via Resend

### Important Notes
- **No Supabase Email Verification**: Supabase Auth will NOT send any verification emails
- **Resend Only**: All OTP codes are delivered via Resend with your custom domain
- **Custom Domain Branding**: Users see emails from your custom domain
- **10-Minute Expiry**: OTP codes expire after 10 minutes
- **In-Memory Storage**: OTP codes are stored in memory (for production, consider database storage)

## Frontend Components

### OTPVerification.tsx
- Handles OTP input (6-digit code)
- Auto-focuses fields during entry
- Supports paste-to-fill
- 60-second resend cooldown
- Auto-verifies when all 6 digits are entered

### LoginPage.tsx
- Initiates signup flow
- Routes to OTPVerification after signup

### SignUpPage.tsx
- Collects user information
- Calls `authService.signUp()`
- Shows OTPVerification component for verification

## API Integration

### emailService.ts
- `sendEmail(to, subject, html, text)`: Generic email sending
- Routes to Resend API based on `VITE_EMAIL_SERVICE` setting
- Handles custom domain via EMAIL_FROM

### authService.ts
- `signUp()`: Creates user account and sends OTP via Resend
- `resendOTP()`: Generates new OTP and resends via Resend
- `verifyOTP()`: Validates OTP and logs user in

## Testing

### Test Email Delivery
1. Use `emailService.testEmail(email)` to test Resend configuration
2. Check email arrives from your custom domain

### Test Signup Flow
1. Navigate to signup page
2. Enter email and password
3. Check that email is received from your custom domain
4. Enter OTP code to verify

### Troubleshooting

**Issue**: OTP not received
- Verify Resend API key is correct in `.env`
- Check email domain is configured in Resend
- Verify Hostinger SMTP is configured correctly
- Check spam folder

**Issue**: "Too many requests"
- Wait 60 seconds before requesting new OTP
- Client-side throttling prevents rate-limiting

**Issue**: OTP expired
- OTP codes expire after 10 minutes
- User must request a new code

## Production Considerations

1. **OTP Storage**: Current implementation uses in-memory storage
   - Consider moving to Redis or database with TTL
   - In-memory storage lost on app restart

2. **Email Rate Limiting**: Monitor Resend API usage
   - Current throttling: 60 seconds between requests
   - Adjust based on your volume

3. **Security**:
   - OTP codes are 6 digits (1 million possibilities)
   - Should be sufficient for non-critical applications
   - Consider 8-digit codes or TOTP for higher security

4. **Monitoring**:
   - Log OTP generation and verification
   - Monitor email delivery rates
   - Alert on unusual patterns

## Related Documentation
- See `src/services/authService.ts` for implementation details
- See `src/services/emailService.ts` for email configuration
- See `.env.example` for configuration template
