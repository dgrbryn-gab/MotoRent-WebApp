# 🚀 MotoRent Deployment Checklist - Cash-Only Version

## Pre-Deployment Setup

### Code & Build
- [x] **Cash-only payment system implemented**
  - Payment service updated
  - Components cleaned
  - Imports removed
  - Build tests passing ✅

- [x] **Database migration created**
  - File: `supabase/migrations/022_cash_only_payment.sql`
  - Ready to execute on new Supabase project

- [x] **Documentation complete**
  - CASH_PAYMENT_MODEL.md ✅
  - CASH_ONLY_IMPLEMENTATION.md ✅
  - CASH_ONLY_SUMMARY.md ✅

### Code Quality
- [x] No build errors
- [x] No TypeScript errors
- [x] All imports valid
- [x] No console warnings

---

## Phase 1: Supabase Project Setup

### Create New Supabase Project
- [ ] Go to https://supabase.com
- [ ] Create new project (naming: "motorent-production" or similar)
- [ ] Wait for project initialization (1-2 minutes)
- [ ] Copy **Project URL** and **Anon Key**

### Run Database Migrations
- [ ] Open Supabase SQL Editor
- [ ] Run `supabase/migrations/001_initial_schema.sql` (initial schema)
- [ ] Run `supabase/migrations/002_sample_data.sql` (optional - for testing)
- [ ] Run migrations 003-021 (all other migrations)
- [ ] **Run `supabase/migrations/022_cash_only_payment.sql`** ← IMPORTANT
- [ ] Verify all migrations completed without errors

### Verify Database
- [ ] Check `payments` table exists
- [ ] Verify `payment_method` column constraint: `CHECK (payment_method = 'cash')`
- [ ] Verify DEFAULT is set to 'cash'
- [ ] Test: Try to insert payment with method='card' → should fail ✓
- [ ] Test: Try to insert payment with method='cash' → should succeed ✓

---

## Phase 2: Environment Configuration

### Update .env.production
```env
# Supabase (from Phase 1)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Resend Email Service (you should have this from earlier)
VITE_RESEND_API_KEY=re_SyCJDxpK_4tzv6m16rRUL5sgUPJisPMu1

# Note: NO STRIPE KEYS NEEDED - This is cash-only ✅
# Remove any old VITE_STRIPE_* environment variables
```

### Verify Environment
- [ ] All required variables present
- [ ] No Stripe keys in environment
- [ ] Correct URLs (not staging/development)
- [ ] API keys are valid and active
- [ ] Resend API key tested for email sending

---

## Phase 3: Deployment Setup

### Vercel Deployment
If using Vercel:

- [ ] Connect GitHub repo to Vercel
- [ ] Set environment variables in Vercel dashboard
  - [ ] VITE_SUPABASE_URL
  - [ ] VITE_SUPABASE_ANON_KEY
  - [ ] VITE_RESEND_API_KEY
- [ ] Configure production domain
- [ ] Verify build configuration (Vite)
- [ ] Test deployment preview

### Netlify Deployment
If using Netlify:

- [ ] Connect GitHub repo to Netlify
- [ ] Set environment variables
  - [ ] VITE_SUPABASE_URL
  - [ ] VITE_SUPABASE_ANON_KEY
  - [ ] VITE_RESEND_API_KEY
- [ ] Configure production domain
- [ ] Verify build settings:
  - [ ] Build command: `npm run build`
  - [ ] Publish directory: `build`
  - [ ] Use netlify.toml for config ✓

### Deployment Status
- [ ] No build errors
- [ ] No deployment errors
- [ ] Site is live at domain
- [ ] Can access homepage

---

## Phase 4: Testing (Staging Environment)

### Access Application
- [ ] Open application in browser
- [ ] Verify no console errors (F12 → Console)
- [ ] Check that Supabase is connected (check Network tab)

### Test Sign Up Flow
- [ ] Create new test account
- [ ] Receive OTP email via Resend
- [ ] Verify email with OTP
- [ ] Account created successfully

### Test Booking Flow
- [ ] Log in with test account
- [ ] Browse motorcycles
- [ ] Select motorcycle
- [ ] Fill booking details
- [ ] Upload document (driver's license image)
- [ ] Reach payment step
- [ ] **Verify ONLY "Cash Payment" option shown** ✓
- [ ] Complete booking
- [ ] Verify payment record created with status "pending"

### Test Admin Dashboard
- [ ] Log in as admin
- [ ] View reservations
- [ ] See pending booking
- [ ] See payment status: "pending" ✓
- [ ] Approve reservation
- [ ] Verify can mark payment as "succeeded"
- [ ] Verify payment status updates

### Test Payment Refund
- [ ] Complete payment (mark as succeeded)
- [ ] Process refund
- [ ] Verify payment status changes to "refunded"
- [ ] Check refund is recorded

### Test Error Handling
- [ ] Close Supabase connection
- [ ] Try to make a booking → should show error
- [ ] Restore connection
- [ ] Booking works again ✓

---

## Phase 5: Monitoring & Verification

### Immediate Post-Deployment (First Hour)
- [ ] Monitor error logs in Vercel/Netlify
- [ ] No payment-related errors
- [ ] No Stripe errors (should be none!)
- [ ] Email sending working (check Resend logs)

### First 24 Hours
- [ ] Monitor application errors
- [ ] Check Supabase logs
- [ ] Verify no database errors
- [ ] Check payment processing works

### First Week
- [ ] Real users can book
- [ ] Payments are being collected
- [ ] Admin can process refunds
- [ ] No unexpected issues

### Metrics to Monitor
- [ ] Page load times
- [ ] User signup completion rate
- [ ] Booking completion rate
- [ ] Admin actions (approvals/refunds)
- [ ] Error rate (should be 0%)

---

## Phase 6: Admin Training

### Admin Should Know
- [ ] Cash-only payment model
- [ ] How to approve reservations
- [ ] How to mark payments as received
- [ ] How to process refunds
- [ ] Where to view payment status
- [ ] How to handle no-shows
- [ ] Cash reconciliation procedures

### Documentation to Share
1. **CASH_PAYMENT_MODEL.md**
   - Complete guide
   - Step-by-step admin procedures
   - Troubleshooting

2. **src/ADMIN_GUIDE.md**
   - Admin dashboard guide
   - Feature overview

3. **Payment processing guide** (custom for your shop)
   - Hours/days payments collected
   - Who collects payment
   - Refund procedures

---

## Phase 7: Monitoring & Maintenance

### Weekly Checklist
- [ ] Check Supabase backup status
- [ ] Review payment transactions
- [ ] Check error logs
- [ ] Verify email sending working

### Monthly Checklist
- [ ] Review revenue by payment method (should be 100% cash)
- [ ] Check database size
- [ ] Verify all features working
- [ ] Review user feedback

### Security Checklist
- [ ] No Stripe keys exposed
- [ ] No database credentials in code
- [ ] All environment variables secure
- [ ] Regular backups enabled in Supabase

---

## Rollback Plan (If Issues Arise)

### If Code Has Issues
```bash
# Revert to previous version
git revert <commit-with-cash-only>
git push origin main
# Vercel/Netlify auto-redeploys
```

### If Database Has Issues
```sql
-- In Supabase SQL Editor, revert migration:
ALTER TABLE payments
DROP CONSTRAINT payments_payment_method_check;

ALTER TABLE payments
ADD CONSTRAINT payments_payment_method_check
CHECK (payment_method IN ('card', 'gcash', 'cash'));
```

### Full Rollback to Previous System
- Revert code changes
- Restore old database migration
- Restore Stripe environment variables
- Redeploy

---

## Critical Reminders ⚠️

1. **Run Migration 022** - Must run on new Supabase project
2. **No Stripe Keys** - Don't accidentally add them back
3. **Cash Collection** - Admin must physically collect cash at pickup
4. **Refunds** - Must give cash back to customer + mark in system
5. **Testing** - Complete flow before telling users

---

## Success Criteria ✅

Your deployment is successful when:

- [x] Code compiles with no errors
- [ ] Database migration runs without errors
- [ ] Application loads without errors
- [ ] User can complete booking flow
- [ ] Payment shows "pending" status
- [ ] Admin can see pending payment
- [ ] Admin can mark payment "succeeded"
- [ ] Refund can be processed
- [ ] No Stripe errors in logs
- [ ] No payment processing errors
- [ ] Resend emails send successfully

---

## Timeline Estimate

| Phase | Time | Status |
|-------|------|--------|
| Phase 1: Supabase Setup | 5 min | ⏳ |
| Phase 2: Env Configuration | 5 min | ⏳ |
| Phase 3: Deployment | 5 min | ⏳ |
| Phase 4: Testing | 15 min | ⏳ |
| Phase 5: Monitoring | 1 hour | ⏳ |
| Phase 6: Admin Training | 30 min | ⏳ |
| **Total Time** | **~2 hours** | ⏳ |

---

## Support & Help

### If You Get Stuck

**Payment System Issues:**
- Check: `CASH_PAYMENT_MODEL.md`
- Check: `src/services/paymentService.ts` code

**Admin Dashboard Issues:**
- Check: `src/ADMIN_GUIDE.md`
- Check: Admin component files

**Database Issues:**
- Check: Supabase SQL Editor
- Check: Migration files in `supabase/migrations/`

**Deployment Issues:**
- Check: Vercel/Netlify build logs
- Check: Environment variables
- Check: `.env.production` file

---

## Post-Launch Improvements

### After Everything is Working

Consider future enhancements:

1. **Payment Receipt Printing**
   - Generate PDF receipt for cash payment

2. **Payment Analytics**
   - Charts showing cash flow
   - Revenue trends

3. **Accounting Export**
   - Export payment data for accountant
   - CSV/Excel format

4. **Multi-Location Support**
   - If you open branch offices
   - Each location tracks own cash

5. **Additional Payment Methods**
   - GCash (if needed)
   - Bank transfer
   - E-wallet

---

## Final Verification

Before going live:

```bash
# Run this in terminal to verify everything:
npm run build   # Should complete with no errors
echo "✅ Build successful"

# Check for any Stripe references:
grep -r "stripe" src/  # Should find nothing or only comments
echo "✅ No Stripe references"

# Verify migrations:
ls supabase/migrations/ | grep 022  # Should show 022_cash_only_payment.sql
echo "✅ Migration file exists"
```

---

**Version:** 1.0 (Cash-Only)  
**Last Updated:** January 15, 2025  
**Status:** Ready for Deployment 🚀

Remember: **This is a cash-only system. Always ensure payment is physically collected before handing over keys!**
