# 🚀 MotoRent Supabase Integration - Quick Start Guide

## ✅ What's Been Done

### Files Created/Updated:
1. **`supabase/migrations/001_initial_schema.sql`** - Complete database schema (8 tables)
2. **`supabase/migrations/002_sample_data.sql`** - 12 sample motorcycles + 3 sample users
3. **`src/lib/supabase.ts`** - Supabase client configuration
4. **`src/lib/database.types.ts`** - TypeScript type definitions
5. **`src/services/`** - 8 service files for database operations
6. **`src/utils/supabaseHelpers.ts`** - Utility functions
7. **`.env`** - Environment variables configured

### Components Integrated:
✅ **HomePage.tsx** - Now loads motorcycles from Supabase
✅ **BookingPage.tsx** - Saves reservations, transactions to database

---

## 📋 YOUR ACTION ITEMS

### Step 1: Run Database Migrations (CRITICAL - DO THIS FIRST!)

1. **Open Supabase SQL Editor:**
   👉 https://supabase.com/dashboard/project/hceylmoutuzldbywawtm/sql

2. **Run First Migration (Create Tables):**
   - Click **"New query"**
   - Open file: `supabase/migrations/001_initial_schema.sql`
   - Copy **ALL** content (450+ lines)
   - Paste into SQL Editor
   - Click **"Run"**
   - ✅ Verify you see "Success" message

3. **Run Second Migration (Add Sample Data):**
   - Click **"New query"** again
   - Open file: `supabase/migrations/002_sample_data.sql`
   - Copy **ALL** content
   - Paste into SQL Editor
   - Click **"Run"**
   - ✅ Should see "12 rows inserted" or similar

### Step 2: Verify Data in Table Editor

1. **Go to Table Editor:**
   👉 https://supabase.com/dashboard/project/hceylmoutuzldbywawtm/editor

2. **Check Tables Created:**
   - You should see 8 tables:
     - `users`
     - `admin_users`
     - `motorcycles` (should have 12 rows)
     - `reservations`
     - `transactions`
     - `notifications`
     - `document_verifications`
     - `gps_tracking`

### Step 3: Test the Application

1. **Your dev server should already be running** (`npm run dev`)

2. **Check browser console (F12):**
   - You should see: ✅ "Supabase connected successfully!"
   - Green toast notification: "Connected to Supabase!"

3. **Test the user flow:**
   - Browse motorcycles (should load from database)
   - View motorcycle details
   - Create a booking (saves to database)
   - Check Supabase Table Editor to see new reservation

---

## 🎯 What Happens Next

### Current Behavior:
- **HomePage**: Loads 12 motorcycles from Supabase database
- **Search/Filter**: Works with database data
- **Booking**: Saves to database (reservations + transactions)
- **Motorcycle Status**: Updates to "Reserved" when booked

### What Still Uses Mock Data:
- **User authentication** (will integrate Supabase Auth next)
- **Admin dashboard** (will connect to database next)
- **Profile/Reservations pages** (need database integration)

---

## 🔍 How to Verify Integration is Working

### Test 1: Browse Motorcycles
1. Go to Home page
2. You should see 12 motorcycles loaded
3. **Check browser console:** Should NOT see any errors
4. **Brands:** Honda, Yamaha, Suzuki, Kawasaki

### Test 2: Create a Booking
1. Click on any motorcycle
2. Click "Reserve Now"
3. Login or Sign up (creates user in database)
4. Fill out booking form
5. Complete payment
6. **Then check Supabase:**
   - Go to Table Editor → `reservations` table
   - You should see your new reservation!
   - Check `transactions` table for payment records

### Test 3: Check Database Updates
1. After creating booking, check `motorcycles` table
2. The booked motorcycle's `availability` should change to "Reserved"

---

## 🐛 Troubleshooting

### Issue: "Failed to load motorcycles"
**Solution:** 
- Make sure you ran BOTH migration SQL files
- Check browser console for specific error
- Verify .env file has correct credentials

### Issue: Connection test fails
**Solution:**
- Check if `motorcycles` table exists in Supabase
- Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
- Restart dev server after changing .env

### Issue: Booking creation fails
**Solution:**
- User must be logged in
- Check browser console for error details
- Verify all tables exist in database

---

## 📊 Database Schema Overview

```
users (customer data)
  ├── reservations (bookings)
  │   ├── transactions (payments, deposits)
  │   ├── document_verifications (ID uploads)
  │   └── gps_tracking (location monitoring)
  └── notifications (alerts)

motorcycles (fleet)
  └── reservations (linked bookings)

admin_users (staff accounts)
```

---

## 🎨 Sample Data Included

### 12 Motorcycles:
- **Scooters:** Honda Click, Yamaha NMAX, Honda Beat, Mio i125, PCX 160, etc.
- **Sport:** Suzuki Raider, Kawasaki Ninja 400
- **Underbone:** Honda XRM, Yamaha Sniper
- **Adventure:** Honda ADV 160

### 3 Sample Users:
- Juan Dela Cruz
- Maria Santos  
- Pedro Reyes

---

## 📝 Next Steps After Testing

Once you confirm everything works:

1. **Integrate Admin Dashboard** - Connect admin pages to database
2. **Add Supabase Auth** - Replace mock login with real authentication
3. **Add Profile Page** - Show user's reservations from database
4. **Add Image Upload** - Store motorcycle photos in Supabase Storage
5. **Add Document Upload** - Store ID verification documents

---

## 📚 Documentation Files

- `SUPABASE_SETUP.md` - Complete setup guide
- `DATABASE_SCHEMA.md` - Detailed schema documentation  
- `IMPLEMENTATION_GUIDE.md` - Step-by-step integration
- `INTEGRATION_CHECKLIST.md` - Feature checklist
- `SUPABASE_REFERENCE.md` - Quick reference guide

---

## ⚡ Quick Commands

```bash
# Start dev server
npm run dev

# Install dependencies (if needed)
npm install

# Check for TypeScript errors
npm run build
```

---

## 🎉 Success Checklist

- [ ] Ran 001_initial_schema.sql in Supabase
- [ ] Ran 002_sample_data.sql in Supabase
- [ ] See 8 tables in Table Editor
- [ ] See 12 motorcycles in `motorcycles` table
- [ ] Dev server running without errors
- [ ] See "Connected to Supabase!" toast
- [ ] Can browse motorcycles on home page
- [ ] Can create a booking
- [ ] Booking appears in Supabase Table Editor

---

**🚀 You're all set! Run those migrations and start testing!**
