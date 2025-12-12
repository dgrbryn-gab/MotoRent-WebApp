# 🚀 MotoRent Production Deployment Guide

## Pre-Deployment Checklist

### ✅ Security & Code Quality
- [x] Test files deleted (test-admin.html, test-notification.html)
- [x] Stripe secret keys removed from frontend
- [x] Console.log statements stripped (production build)
- [x] Environment variables externalized
- [x] .env files in .gitignore

### ✅ Database & Backend
- [ ] Create production Supabase project
- [ ] Run all 21 migrations (including new OTP table)
- [ ] Verify all tables created successfully
- [ ] Set up admin users (superadmin@motorent.com, admin@motorent.com)
- [ ] Enable RLS policies on all tables
- [ ] Configure storage buckets (motorcycles, documents)

### ✅ External Services
- [ ] Stripe account set up with live keys
- [ ] Email provider configured (Resend or SendGrid)
- [ ] Domain verified with email provider
- [ ] Supabase webhooks configured (if needed)

### ✅ Deployment Platform
- [ ] Vercel/Netlify account created
- [ ] GitHub repository connected
- [ ] Environment variables set in deployment platform
- [ ] Build settings configured
- [ ] Custom domain configured

---

## Step-by-Step Deployment

### 1️⃣ Set Up Production Supabase Project (15 min)

```bash
# Go to https://supabase.com/dashboard
# Create new project "motorent-production"
# Copy Project URL and anon key
```

**Save these values** - you'll need them for environment variables:
- `VITE_SUPABASE_URL`: `https://your-project.supabase.co`
- `VITE_SUPABASE_ANON_KEY`: Your public key

**Run Database Migrations:**
1. Open Supabase SQL Editor
2. Run each migration in order (001 through 021):
   - Start with `001_initial_schema.sql` (creates 8 main tables)
   - Then `002_sample_data.sql` (optional - adds test data)
   - Continue through `021_otp_storage_table.sql` (new OTP table)

**Verify Tables Created:**
```sql
-- Run in SQL Editor to verify
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Should see these 8 core tables:
- admin_users
- document_verifications
- gps_tracking
- motorcycles
- notifications
- otp_codes (new)
- reservations
- transactions
- users

---

### 2️⃣ Configure Email Service (10 min)

**Option A: Resend (Recommended)**
1. Go to https://resend.com
2. Create account and verify domain
3. Get API key from dashboard
4. Set environment variables:
   ```
   VITE_EMAIL_SERVICE=resend
   VITE_EMAIL_API_KEY=re_live_xxxxxxxx
   VITE_EMAIL_FROM=noreply@yourdomain.com
   ```

**Option B: SendGrid**
1. Go to https://sendgrid.com
2. Create account and verify sender email
3. Get API key from Settings → API Keys
4. Set environment variables:
   ```
   VITE_EMAIL_SERVICE=sendgrid
   VITE_EMAIL_API_KEY=SG.xxxxxxxx
   VITE_EMAIL_FROM=verified-email@yourcompany.com
   ```

**Test Email Configuration:**
- Send test booking confirmation
- Check email arrives correctly
- Verify links work with production domain

---

### 3️⃣ Configure Stripe Payment Processing (15 min)

**Get Live Keys:**
1. Log in to https://dashboard.stripe.com
2. Go to Developers → API Keys
3. Switch to Live mode
4. Copy Publishable Key (`pk_live_*`)

**Set Environment Variable:**
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxx
```

**Configure Webhook (Backend):**
⚠️ **Important**: Stripe webhooks must be handled on backend, not frontend
1. Go to Developers → Webhooks
2. Add new endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Subscribe to events:
   - `payment_intent.succeeded`
   - `charge.refunded`
   - `charge.captured`
4. Get signing secret
5. Store in backend environment only (never frontend)

**Test Payment Flow:**
- Create test reservation
- Attempt payment with Stripe test card (4242 4242 4242 4242)
- Verify payment processes
- Check transaction recorded in database

---

### 4️⃣ Set Up Admin Users (5 min)

**Create admin accounts in Supabase Auth:**
1. Go to Supabase Dashboard → Authentication → Users
2. Create new users:
   - Email: `superadmin@motorent.com` (password: strong secure password)
   - Email: `admin@motorent.com` (password: strong secure password)

**Update admin_users table:**
```sql
-- Already done in migrations, but verify:
SELECT * FROM admin_users WHERE email IN ('superadmin@motorent.com', 'admin@motorent.com');
```

**Store credentials securely:**
- Use password manager (LastPass, 1Password, etc.)
- Never commit to git
- Share only with authorized team members

---

### 5️⃣ Prepare for Deployment (10 min)

**Create .env.production.local (never commit!):**
```bash
VITE_SUPABASE_URL=https://your-production-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxx
VITE_EMAIL_SERVICE=resend
VITE_EMAIL_API_KEY=re_live_xxxxxxxx
VITE_EMAIL_FROM=noreply@yourdomain.com
VITE_APP_URL=https://motorent.yourdomain.com
```

**Test local build:**
```bash
npm run build
npm run preview
# Test in browser: http://localhost:4173
```

---

### 6️⃣ Deploy to Vercel (10 min)

**Connect Repository:**
1. Push all changes to GitHub main branch
2. Go to https://vercel.com/new
3. Import repository
4. Select MotoRent project

**Configure Environment Variables in Vercel:**
1. Go to Settings → Environment Variables
2. Add all production variables:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
   - VITE_STRIPE_PUBLISHABLE_KEY
   - VITE_EMAIL_SERVICE
   - VITE_EMAIL_API_KEY
   - VITE_EMAIL_FROM
   - VITE_APP_URL

**Configure Custom Domain:**
1. Go to Settings → Domains
2. Add custom domain
3. Update DNS records (Vercel will provide)
4. Wait for SSL certificate (usually instant)

**Deploy:**
- Click "Deploy"
- Wait for build to complete (5-10 minutes)
- Verify at https://yourdomain.com

---

### 7️⃣ Post-Deployment Testing (30 min)

**Test Complete User Flow:**

1. **Customer Sign Up**
   - Visit site
   - Sign up with test email
   - Verify OTP sent to email
   - Complete profile

2. **Browse Motorcycles**
   - Load home page
   - Check motorcycles load from database
   - Filter and search works

3. **Create Booking**
   - Browse motorcycle details
   - Create reservation
   - Verify booking saved in database

4. **Admin Approval**
   - Login as admin (admin@motorent.com)
   - Go to Reservations
   - Approve/reject booking
   - Verify email notifications sent

5. **Payment Processing**
   - Create new booking
   - Attempt payment with Stripe test card
   - Verify transaction recorded
   - Check in Admin Dashboard

6. **Document Upload**
   - Upload driver's license as customer
   - Login as admin
   - Verify document appears for review
   - Approve/reject document

7. **Email Verification**
   - Check confirmation emails arrive
   - Verify links work with production domain
   - Check no console errors

---

## Monitoring & Maintenance

### Set Up Alerts
- [ ] Stripe: Failed payments alert
- [ ] Supabase: Storage quota alert
- [ ] Email: Delivery failures
- [ ] Site uptime monitoring (Uptime Robot)

### Regular Tasks
- [ ] Monitor database size and optimize queries
- [ ] Review admin logs weekly
- [ ] Backup database (Supabase auto-backups, but verify)
- [ ] Update dependencies monthly
- [ ] Review security logs for suspicious activity

### Database Maintenance
```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('postgres'));

-- Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
FROM pg_tables ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Clean up expired OTPs
DELETE FROM otp_codes WHERE expires_at < NOW();
```

---

## Rollback Procedure

If something goes wrong:

1. **Immediate Rollback (Last Good Commit)**
   ```bash
   git revert <commit-hash>
   git push origin main
   # Vercel auto-deploys within 1 minute
   ```

2. **Database Rollback**
   - Supabase has automatic backups every 24 hours
   - Go to Supabase Dashboard → Backups
   - Restore from latest good backup

3. **Restore Previous Build**
   - Go to Vercel Dashboard
   - Select previous successful deployment
   - Click "Promote to Production"

---

## Troubleshooting

### "Environment variables not working"
- [ ] Check variables are set in Vercel dashboard
- [ ] Check spelling matches vite-env.d.ts
- [ ] Redeploy after changing variables
- [ ] Check VITE_ prefix for frontend vars

### "Database connection failing"
- [ ] Verify URL is correct (with .co not .com)
- [ ] Check anon key is valid
- [ ] Check RLS policies aren't blocking (temporarily disable for testing)
- [ ] Verify IP whitelist if applicable

### "Emails not sending"
- [ ] Check API key is valid
- [ ] Verify domain is authenticated with provider
- [ ] Check sender email matches verified address
- [ ] Check email service status page

### "Stripe payments failing"
- [ ] Verify live key is set (pk_live_ not pk_test_)
- [ ] Check Stripe account is in live mode
- [ ] Verify webhook endpoint configured
- [ ] Check Stripe dashboard for error details

---

## Security Best Practices

1. **Never commit .env files**
   ```bash
   # .env* is already in .gitignore
   # But verify:
   cat .gitignore | grep -i env
   ```

2. **Rotate API keys regularly**
   - Monthly for critical keys
   - Quarterly for less critical
   - Immediately if compromised

3. **Use strong admin passwords**
   - Minimum 16 characters
   - Mix of uppercase, lowercase, numbers, symbols
   - No dictionary words
   - Store in password manager

4. **Monitor API usage**
   - Check Stripe dashboard weekly
   - Review email sending logs
   - Monitor database connections
   - Set up rate limiting

5. **Enable 2FA**
   - Vercel account: Settings → Security
   - Stripe account: Account Settings → Security
   - Supabase: Team → Members → Roles

---

## Support & Resources

- **Supabase Docs**: https://supabase.com/docs
- **Stripe Docs**: https://stripe.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Resend Docs**: https://resend.com/docs
- **React Docs**: https://react.dev

---

**Deployment Status:** Ready to deploy ✅
**Last Updated:** December 12, 2025
**Version:** 1.0 - Production Ready
