# ✅ Production Deployment Checklist

Use this checklist to track progress as you deploy to production.

---

## 🔒 SECURITY VERIFICATION (Already Done ✅)

- [x] Test files with exposed credentials deleted
- [x] Stripe secret keys removed from frontend  
- [x] Console logging cleaned up
- [x] OTP storage moved to database
- [x] Environment variables externalized
- [x] Deployment configs created

**Status: SECURITY HARDENED ✅**

---

## 📋 PRE-DEPLOYMENT (Do This First)

### Reading & Understanding
- [ ] Read `STATUS_REPORT.md` (5 min)
- [ ] Read `DEPLOYMENT_GUIDE.md` (15 min)
- [ ] Review remaining tasks below

### Local Verification  
- [ ] Run `npm install` (verify no errors)
- [ ] Run `npm run build` (verify no errors)
- [ ] Run `npm run preview` (test locally at localhost:4173)
- [ ] Test sign up flow locally
- [ ] Check browser console (should show no errors)

**Status: _______**

---

## 🗄️ PHASE 1: EXTERNAL SERVICES CONFIGURATION (30 min)

### 1️⃣ Supabase Setup

**Create Production Project:**
- [ ] Go to https://supabase.com/dashboard
- [ ] Click "New Project"
- [ ] Create project named "motorent-production"
- [ ] Copy Project URL
- [ ] Copy Anon Key

**Save to .env.production:**
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

**Status:** ☐ Not Started ☐ In Progress ☐ Complete

### 2️⃣ Email Service Setup

Choose ONE (Resend recommended):

**Option A: Resend**
- [ ] Go to https://resend.com
- [ ] Create account
- [ ] Add and verify your domain
- [ ] Go to API Keys
- [ ] Copy API key

**Option B: SendGrid**
- [ ] Go to https://sendgrid.com
- [ ] Create account
- [ ] Verify sender email
- [ ] Go to API Keys (Settings)
- [ ] Create/copy API key

**Save to .env.production:**
```
VITE_EMAIL_SERVICE=resend
VITE_EMAIL_API_KEY=re_live_xxx...
VITE_EMAIL_FROM=noreply@yourdomain.com
```

**Status:** ☐ Not Started ☐ In Progress ☐ Complete

### 3️⃣ Stripe Setup

**Get Live Keys:**
- [ ] Go to https://dashboard.stripe.com
- [ ] Click "Developers" → "API Keys"
- [ ] Switch to "Live mode"
- [ ] Copy "Publishable key" (starts with pk_live_)
- [ ] Save webhook secret separately (backend only)

**Save to .env.production:**
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx...
```

**Save webhook secret separately (backend only, not in .env.production)**

**Status:** ☐ Not Started ☐ In Progress ☐ Complete

**Phase 1 Status:** ☐ Not Started ☐ In Progress ☐ Complete ✅

---

## 🗄️ PHASE 2: DATABASE SETUP (20 min)

### 1️⃣ Run Database Migrations

**In Supabase Dashboard:**
- [ ] Go to SQL Editor
- [ ] Open each migration file from `supabase/migrations/`:
  - [ ] `001_initial_schema.sql` (Create tables) → Run
  - [ ] `002_sample_data.sql` (Optional test data) → Run
  - [ ] `003_fix_rls_policies.sql` → Run
  - [ ] `004_payments_table.sql` → Run
  - [ ] `005_fix_admin_users_rls.sql` → Run
  - [ ] `006_verify_admin_email.sql` → Run
  - [ ] `007_add_admin_crud_policies.sql` → Run
  - [ ] `008_storage_bucket.sql` → Run
  - [ ] `009_add_motorcycle_fields.sql` → Run
  - [ ] `010_fix_motorcycle_deletion.sql` → Run
  - [ ] `011_fix_payment_analytics_view.sql` → Run
  - [ ] `012_fix_all_view_security.sql` → Run
  - [ ] `013_add_transaction_delete_policy.sql` → Run
  - [ ] `014_add_transaction_update_policy.sql` → Run
  - [ ] `014_update_notifications_table.sql` → Run
  - [ ] `015_add_cancelled_status_to_transactions.sql` → Run
  - [ ] `015_create_documents_storage_bucket.sql` → Run
  - [ ] `016_enable_email_otp.sql` → Run
  - [ ] `016_fix_notifications_table.sql` → Run
  - [ ] `017_fix_notifications_rls.sql` → Run
  - [ ] `018_add_username_field.sql` → Run
  - [ ] `019_add_user_profile_fields.sql` → Run
  - [ ] `020_fix_document_storage_rls.sql` → Run
  - [ ] `021_otp_storage_table.sql` → Run ⭐ **NEW**

**Verify Tables Created:**
```sql
-- Run in SQL Editor to verify:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;
```

Expected tables:
- [ ] admin_users
- [ ] document_verifications
- [ ] gps_tracking
- [ ] motorcycles
- [ ] notifications
- [ ] otp_codes ⭐ **NEW**
- [ ] reservations
- [ ] transactions
- [ ] users

**Status:** ☐ Not Started ☐ In Progress ☐ Complete ✅

### 2️⃣ Create Storage Buckets

**In Supabase Dashboard → Storage:**
- [ ] Create bucket "motorcycles" (Public)
- [ ] Create bucket "documents" (Private)
- [ ] Create bucket "payment-proofs" (Private)

**Status:** ☐ Not Started ☐ In Progress ☐ Complete

### 3️⃣ Create Admin Users

**In Supabase Dashboard → Authentication → Users:**

**Super Admin:**
- [ ] Email: `superadmin@motorent.com`
- [ ] Password: `[Use strong password]`
- [ ] Copy password to password manager

**Regular Admin:**
- [ ] Email: `admin@motorent.com`
- [ ] Password: `[Use strong password]`
- [ ] Copy password to password manager

**Status:** ☐ Not Started ☐ In Progress ☐ Complete

**Phase 2 Status:** ☐ Not Started ☐ In Progress ☐ Complete ✅

---

## 🚀 PHASE 3: DEPLOYMENT (15 min)

### 1️⃣ Prepare Code

- [ ] Verify `.env.production` file is NOT in git: `cat .gitignore | grep env`
- [ ] Commit all security changes:
  ```bash
  git add -A
  git commit -m "Security hardening and production config for deployment"
  git push origin main
  ```

**Status:** ☐ Not Started ☐ In Progress ☐ Complete

### 2️⃣ Deploy to Vercel OR Netlify

**Choose ONE deployment platform:**

#### Option A: Vercel

- [ ] Go to https://vercel.com/new
- [ ] Click "Import Git Repository"
- [ ] Select your GitHub repository
- [ ] Project name: `motorent`
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] Environment variables: Add all from `.env.production`:
  - [ ] VITE_SUPABASE_URL
  - [ ] VITE_SUPABASE_ANON_KEY
  - [ ] VITE_STRIPE_PUBLISHABLE_KEY
  - [ ] VITE_EMAIL_SERVICE
  - [ ] VITE_EMAIL_API_KEY
  - [ ] VITE_EMAIL_FROM
  - [ ] VITE_APP_URL (your domain)
- [ ] Click "Deploy"
- [ ] Wait for build to complete (5-10 min)

#### Option B: Netlify

- [ ] Go to https://app.netlify.com/teams
- [ ] Click "Add new site" → "Import an existing project"
- [ ] Connect GitHub
- [ ] Select repository
- [ ] Build command: `npm run build`
- [ ] Publish directory: `dist`
- [ ] Click "Show advanced" → Add environment variables:
  - [ ] VITE_SUPABASE_URL
  - [ ] VITE_SUPABASE_ANON_KEY
  - [ ] VITE_STRIPE_PUBLISHABLE_KEY
  - [ ] VITE_EMAIL_SERVICE
  - [ ] VITE_EMAIL_API_KEY
  - [ ] VITE_EMAIL_FROM
  - [ ] VITE_APP_URL (your domain)
- [ ] Click "Deploy site"
- [ ] Wait for build to complete

**Status:** ☐ Not Started ☐ In Progress ☐ Complete

### 3️⃣ Configure Custom Domain

**In Vercel/Netlify Dashboard:**
- [ ] Go to Settings → Domains
- [ ] Add your custom domain (e.g., motorent.com)
- [ ] Follow DNS configuration instructions
- [ ] Wait for SSL certificate (usually instant)
- [ ] Verify domain works: https://yourdomain.com

**Status:** ☐ Not Started ☐ In Progress ☐ Complete

**Phase 3 Status:** ☐ Not Started ☐ In Progress ☐ Complete ✅

---

## ✅ PHASE 4: POST-DEPLOYMENT TESTING (30 min)

### 1️⃣ Smoke Test

- [ ] Visit https://yourdomain.com (should load)
- [ ] Check browser console (F12) - should show no errors
- [ ] Check Vercel/Netlify deployment shows "Success"

**Status:** ☐ Fail ☐ Pass ✅

### 2️⃣ User Sign Up Flow

- [ ] Go to site
- [ ] Click "Sign Up"
- [ ] Fill in form with test email
- [ ] Click "Sign Up"
- [ ] Check email for OTP code
- [ ] Copy OTP code
- [ ] Paste code and verify
- [ ] Should redirect to home page
- [ ] Should be logged in

**Status:** ☐ Fail ☐ Pass ✅

### 3️⃣ Browse Motorcycles

- [ ] Should see list of motorcycles loading from database
- [ ] Should have 12 motorcycles (from sample data)
- [ ] Click on motorcycle → details page
- [ ] Click on image → should load
- [ ] Check no console errors

**Status:** ☐ Fail ☐ Pass ✅

### 4️⃣ Create Booking

- [ ] Click "Book Now"
- [ ] Select dates
- [ ] Enter payment details
- [ ] Click "Confirm Booking"
- [ ] Should see confirmation
- [ ] Check email for confirmation email
- [ ] Verify links in email work

**Status:** ☐ Fail ☐ Pass ✅

### 5️⃣ Admin Approval

- [ ] Go to admin login: https://yourdomain.com?admin=true
- [ ] Login as: admin@motorent.com
- [ ] Password: [from earlier]
- [ ] Go to "Reservations"
- [ ] Should see your test booking
- [ ] Click "Approve"
- [ ] Check email for approval notification

**Status:** ☐ Fail ☐ Pass ✅

### 6️⃣ Payment Processing

- [ ] Create another booking
- [ ] Select Stripe payment
- [ ] Use test card: 4242 4242 4242 4242
- [ ] Expiry: 12/25
- [ ] CVC: 123
- [ ] Click "Pay"
- [ ] Should process successfully
- [ ] Check email for payment confirmation

**Status:** ☐ Fail ☐ Pass ✅

### 7️⃣ Document Upload

- [ ] Go to Profile
- [ ] Click "Upload Documents"
- [ ] Upload driver's license image
- [ ] Should upload successfully
- [ ] Go to admin → Documents
- [ ] Should see document pending
- [ ] Click "Approve"
- [ ] Check email for verification

**Status:** ☐ Fail ☐ Pass ✅

**Phase 4 Status:** ☐ Not Started ☐ In Progress ☐ Complete ✅

---

## 📊 MONITORING (First 24 hours)

- [ ] Monitor Vercel/Netlify dashboard for errors
- [ ] Check email service delivery logs
- [ ] Check Stripe dashboard for transactions
- [ ] Monitor database size in Supabase
- [ ] Test mobile responsiveness
- [ ] Test on different browsers

**Status:** ☐ Not Started ☐ In Progress ☐ Complete

---

## 🎉 LAUNCH COMPLETE!

**Congratulations!** Your MotoRent application is now live in production!

### Final Checklist
- [ ] All users can access the site
- [ ] No console errors
- [ ] Emails sending correctly
- [ ] Payments processing
- [ ] Database performing well
- [ ] Team notified of launch

### Next Steps
1. Monitor for 24 hours for any issues
2. Collect user feedback
3. Plan next feature releases
4. Set up automated backups
5. Configure monitoring/alerts

---

## 📞 Need Help?

- **Deployment Guide:** `DEPLOYMENT_GUIDE.md`
- **Status Report:** `STATUS_REPORT.md`
- **Security Summary:** `SECURITY_FIXES_SUMMARY.md`
- **Service Documentation:** Links in `DEPLOYMENT_GUIDE.md`

---

**Version:** 1.0  
**Last Updated:** December 12, 2025  
**Status:** Ready to Deploy ✅
