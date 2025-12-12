# 🚀 MotoRent Vercel Deployment Guide

## Prerequisites ✅

Before deploying, ensure you have:

- [x] GitHub repository with MotoRent code
- [x] Vercel account (free tier available at https://vercel.com)
- [x] New Supabase project created
- [x] Database migration 022 executed on Supabase
- [x] Supabase credentials (URL + Anon Key)
- [x] Resend API key obtained
- [x] Production domain name (optional, can use Vercel subdomain)

---

## Step 1: Prepare Your Repository

### 1.1 Commit All Changes

```bash
cd c:\Users\ACER\Desktop\MotoRent_webapp

# Check git status
git status

# Stage all changes
git add .

# Commit with clear message
git commit -m "feat: implement cash-only payment system

- Remove Stripe integration
- Update paymentService for cash-only operations
- Create database migration 022 for payment constraints
- Update Vercel configuration
- Add comprehensive documentation for cash-only model"

# Push to GitHub
git push origin main
```

### 1.2 Verify Repository on GitHub

- Go to https://github.com/your-username/MotoRent_webapp
- Verify latest commit is there
- Verify all files are present

---

## Step 2: Create Vercel Project

### 2.1 Sign In to Vercel

1. Go to https://vercel.com
2. Click "Sign Up" or "Log In"
3. Choose "Continue with GitHub"
4. Authorize Vercel to access your GitHub

### 2.2 Import Project

1. Click "Add New..." → "Project"
2. Select "Import Git Repository"
3. Search for "MotoRent_webapp" repository
4. Click "Import"

### 2.3 Project Configuration

Vercel should auto-detect:
- **Framework:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

Verify these are correct, then proceed to environment variables.

---

## Step 3: Configure Environment Variables

### 3.1 Get Your Supabase Credentials

You should have these from Phase 1:
```
VITE_SUPABASE_URL = https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

If you don't have these:
1. Go to https://supabase.com
2. Log in to your Supabase project
3. Click "Settings" → "API"
4. Copy **Project URL** and **Anon Key**

### 3.2 Get Your Resend API Key

You should have this from earlier:
```
VITE_RESEND_API_KEY = re_SyCJDxpK_4tzv6m16rRUL5sgUPJisPMu1
```

### 3.3 Add Environment Variables in Vercel

In Vercel deployment screen, scroll to "Environment Variables" and add:

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `VITE_RESEND_API_KEY` | `re_SyCJDxpK_4tzv6m16rRUL5sgUPJisPMu1` |
| `VITE_EMAIL_FROM` | `noreply@motorent.com` |
| `VITE_APP_URL` | `https://motorent.vercel.app` |

### 3.4 Verify Environment Variables

```
✅ VITE_SUPABASE_URL ........... Added
✅ VITE_SUPABASE_ANON_KEY ...... Added
✅ VITE_RESEND_API_KEY ......... Added
✅ VITE_EMAIL_FROM ............ Added
✅ VITE_APP_URL ............... Added

❌ NO Stripe keys needed ✓
```

---

## Step 4: Deploy

### 4.1 Click "Deploy"

Once environment variables are set:
1. Click the "Deploy" button
2. Vercel begins build process
3. Watch for completion (takes 1-2 minutes)

### 4.2 Monitor Build

Build logs will show:
```
✓ Installing dependencies...
✓ Building application...
✓ 3255 modules transformed
✓ Generating sitemap...
✓ Deployment complete!
```

### 4.3 Verify Deployment

When deployment completes:
- ✅ You'll see "Congratulations! Your site is live"
- ✅ Vercel provides a unique URL: `https://motorent-xxxx.vercel.app`
- ✅ Save this URL (your production domain)

---

## Step 5: Post-Deployment Testing

### 5.1 Open Your Live Site

1. Click the deployment URL provided by Vercel
2. Website should load without errors
3. Check browser console (F12) for any errors

### 5.2 Test Sign Up Flow

1. Click "Sign Up" on homepage
2. Enter test email: `test@example.com`
3. Enter password: `TestPassword123!`
4. Should receive OTP email from Resend
5. Enter OTP to verify
6. Account should be created ✅

### 5.3 Test Booking Flow

1. Log in with test account
2. Browse motorcycles
3. Select a motorcycle
4. Fill booking details
5. Upload driver's license (image file)
6. Reach payment step
7. **Verify ONLY "Cash Payment" option shows** ✅
8. Click "Confirm Reservation"
9. Should see "Booking confirmed" message ✅

### 5.4 Test Admin Dashboard

1. Log in as admin (use admin account credentials)
2. Go to Admin Dashboard
3. Click "Reservations"
4. Should see the test booking you created
5. Payment status should show: **"pending"** ✅
6. Try to approve the reservation
7. Should be able to mark payment as "succeeded" ✅

### 5.5 Check for Errors

In browser console (F12):
- ❌ No Stripe errors
- ❌ No payment processing errors
- ❌ No Supabase connection errors
- ✅ Only normal logs and warnings (if any)

---

## Step 6: Set Up Custom Domain (Optional)

### 6.1 If You Have a Domain

1. In Vercel project settings → "Domains"
2. Click "Add Domain"
3. Enter your domain: `motorent.com`
4. Follow DNS configuration instructions
5. Update Nameservers with your domain registrar
6. Wait for DNS to propagate (24-48 hours)

### 6.2 Update Environment Variables

Once custom domain is active:
1. Go to project settings → "Environment Variables"
2. Update `VITE_APP_URL` to: `https://motorent.com`
3. Redeploy with new variable

---

## Step 7: Enable Auto-Deployments

### 7.1 Configure GitHub Integration

Vercel automatically deploys on GitHub push. Verify:

1. In Vercel project settings → "Git"
2. Ensure "Deploy on every push to main" is enabled
3. Optional: Set up branch deployments for staging

### 7.2 From Now On

Every time you push to main:
```bash
git push origin main
# Vercel automatically builds and deploys ✅
```

---

## Step 8: Monitor Production

### 8.1 Enable Vercel Analytics (Optional)

In Vercel dashboard:
1. Click project
2. Go to "Analytics"
3. Monitor:
   - Page load times
   - Core Web Vitals
   - Real user metrics

### 8.2 Monitor Errors

Vercel provides error tracking:
1. Click "Deployments" tab
2. Click latest deployment
3. View build logs
4. Check for any warnings/errors

### 8.3 Set Up Error Notifications

1. Go to project settings → "Notifications"
2. Enable email alerts for failed deployments
3. You'll be notified of any issues

---

## Vercel Dashboard Overview

After deployment, your Vercel dashboard shows:

```
Project: MotoRent
├── Current Deployment: ✅ Active
│   ├── URL: https://motorent-xxxx.vercel.app
│   ├── Build Status: Success
│   ├── Deployment Time: 1m 45s
│   └── Last Update: Just now
│
├── Environment Variables: ✅ Configured
│   ├── VITE_SUPABASE_URL
│   ├── VITE_SUPABASE_ANON_KEY
│   ├── VITE_RESEND_API_KEY
│   ├── VITE_EMAIL_FROM
│   └── VITE_APP_URL
│
├── Analytics: ✅ Available
│   ├── Page Views
│   ├── Load Times
│   └── Errors
│
└── Deployments: ✅ Active
    └── Auto-deploy on git push enabled
```

---

## Troubleshooting

### Build Fails

**Error:** "Build failed"

**Solution:**
1. Click deployment → "Build Logs"
2. Look for error message
3. Common causes:
   - Missing environment variable
   - Syntax error in code
   - Missing dependency

**Action:**
```bash
# Locally test build
npm run build

# If it fails locally, fix it
# Then push to GitHub
git add .
git commit -m "fix: build error"
git push origin main
```

### Site Shows Blank Page

**Error:** White screen, no content

**Causes:**
- Supabase URL/key incorrect
- Environment variables not set
- Supabase not reachable

**Solution:**
1. Check browser console (F12) for errors
2. Verify environment variables in Vercel
3. Test Supabase connection is working

### Sign Up Not Working

**Error:** "Failed to sign up" or no OTP received

**Causes:**
- Resend API key incorrect
- Email address wrong
- Supabase auth not configured

**Solution:**
1. Check Vercel env var: `VITE_RESEND_API_KEY`
2. Test with valid email address
3. Check Resend dashboard for delivery failures

### Payment Not Showing Cash Option

**Error:** Payment step shows blank or other methods

**Causes:**
- PaymentService not updated
- Migration 022 not run on Supabase
- Old code still deployed

**Solution:**
1. Verify migration 022 ran on Supabase
2. Verify code changes pushed to GitHub
3. Trigger new deployment in Vercel

---

## Rollback to Previous Version

If critical issue occurs:

### 8.1 Rollback in Vercel

1. Go to Vercel dashboard
2. Click "Deployments"
3. Find previous working deployment
4. Click the three dots
5. Click "Promote to Production"
6. Previous version is now live

### 8.2 Rollback on GitHub

If needed to revert code:
```bash
# Find previous commit
git log --oneline

# Revert to specific commit
git revert <commit-hash>
git push origin main

# Vercel auto-deploys the reverted code
```

---

## Production Checklist

Before telling users to use your site:

### Pre-Launch
- [x] Code deployed ✅
- [ ] Supabase migrations run (migration 022)
- [ ] Environment variables configured
- [ ] Domain configured (or Vercel URL noted)
- [ ] Full testing completed

### Launch Day
- [ ] Monitor error logs
- [ ] Monitor performance
- [ ] No user-facing errors
- [ ] Payment flow working
- [ ] Email sending working

### Post-Launch
- [ ] 24-hour monitoring period
- [ ] Verify first real bookings work
- [ ] Check payment collection process
- [ ] Train admin staff on procedures
- [ ] Set up daily monitoring

---

## Daily Monitoring

### Every Day (First Week)

1. **Check Vercel Dashboard**
   - No failed deployments
   - Error rate normal
   - Response times acceptable

2. **Check Supabase Dashboard**
   - Database performing well
   - No connection errors
   - Auth is working

3. **Check Resend Email**
   - Emails being sent
   - No delivery failures
   - OTP codes working

4. **Check Bookings**
   - Any issues reported by users
   - Payment flow working
   - Admin can complete reservations

---

## Success Criteria

Your Vercel deployment is successful when:

✅ Site is live at URL  
✅ No build errors  
✅ Sign up works (receives OTP)  
✅ Login works  
✅ Booking flow works  
✅ Payment shows cash-only option  
✅ Admin can approve reservations  
✅ Admin can mark payment succeeded  
✅ No console errors  
✅ No Stripe references  
✅ Database connected  
✅ Emails sending  

---

## Next Steps After Deployment

1. **Communication**
   - Tell users site is live
   - Share production URL
   - Provide feedback email

2. **Monitoring**
   - Watch first bookings
   - Monitor for errors
   - Check payment flow

3. **Scale Up** (if needed)
   - Monitor usage
   - Upgrade Vercel plan if needed
   - Optimize performance if needed

4. **Future Improvements**
   - Gather user feedback
   - Plan enhancements
   - Add features as needed

---

## Support & Help

### Vercel Documentation
- https://vercel.com/docs
- Deployment guides
- Environment variables
- Custom domains

### Supabase Documentation
- https://supabase.com/docs
- Database setup
- Authentication
- API documentation

### Project Documentation
- See DOCUMENTATION_INDEX.md for all guides
- CASH_PAYMENT_MODEL.md for payment operations
- DEPLOYMENT_GUIDE.md for general deployment info

---

**Your site is now ready for production!** 🎉

**Production URL:** https://motorent-xxxx.vercel.app (you'll get the actual URL)  
**Payment System:** Cash-Only ✅  
**Status:** Ready for Users 🚀
