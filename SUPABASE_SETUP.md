# Supabase Integration Guide

## 🚀 Quick Setup

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in project details:
   - **Name**: MotoRent Dumaguete
   - **Database Password**: (choose a strong password)
   - **Region**: Choose closest to your location
5. Wait for project to be provisioned (~2 minutes)

### 2. Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

### 3. Configure Environment Variables

1. Create a `.env` file in the project root (copy from `.env.example`):

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

2. **IMPORTANT**: Add `.env` to your `.gitignore` (should already be there)

### 4. Run Database Migrations

1. In your Supabase dashboard, go to **SQL Editor**
2. Open the file `supabase/migrations/001_initial_schema.sql`
3. Copy all the SQL code
4. Paste it into the Supabase SQL Editor
5. Click **Run** to execute
6. You should see success messages for all tables created

### 5. Verify Tables Created

Go to **Table Editor** in Supabase dashboard. You should see these tables:
- ✅ users
- ✅ admin_users
- ✅ motorcycles
- ✅ reservations
- ✅ transactions
- ✅ notifications
- ✅ document_verifications
- ✅ gps_tracking

---

## 📊 Database Schema Overview

### Entity Relationship Diagram

```
┌─────────────┐
│    users    │
└──────┬──────┘
       │
       │ 1:N
       │
┌──────▼──────────────┐
│   reservations      │◄─────┐
└──────┬──────────────┘      │
       │                     │ N:1
       │ 1:N                 │
       │              ┌──────┴──────────┐
┌──────▼──────────┐   │  motorcycles    │
│  transactions   │   └──────┬──────────┘
└─────────────────┘          │
                             │ 1:N
                      ┌──────▼──────────┐
                      │  gps_tracking   │
                      └─────────────────┘

┌──────────────────┐          ┌──────────────────────┐
│  notifications   │◄─────────┤        users         │
└──────────────────┘   1:N    └──────────────────────┘

┌──────────────────────────┐
│ document_verifications   │◄────── users (1:N)
└──────────────────────────┘
         │
         │ N:1
         ▼
┌──────────────────┐
│  admin_users     │
└──────────────────┘
```

---

## 🗃️ Tables & Relationships

### **1. users**
- Primary table for customer accounts
- **Relations**:
  - Has many `reservations` (1:N)
  - Has many `transactions` (1:N)
  - Has many `notifications` (1:N)
  - Has many `document_verifications` (1:N)

### **2. admin_users**
- Separate table for admin/super-admin accounts
- **Relations**:
  - Reviews many `document_verifications` (1:N)

### **3. motorcycles**
- Motorcycle inventory/fleet
- **Relations**:
  - Has many `reservations` (1:N)
  - Has many `gps_tracking` records (1:N)

### **4. reservations**
- Central table for bookings
- **Relations**:
  - Belongs to `users` (N:1) - CASCADE delete
  - Belongs to `motorcycles` (N:1) - RESTRICT delete
  - Has many `transactions` (1:N)
  - Has many `notifications` (1:N)
  - Has one `gps_tracking` (1:1) - optional

### **5. transactions**
- Financial records (payments, deposits, refunds)
- **Relations**:
  - Belongs to `users` (N:1) - CASCADE delete
  - Belongs to `reservations` (N:1) - SET NULL on delete

### **6. notifications**
- User notifications for reservation updates
- **Relations**:
  - Belongs to `users` (N:1) - CASCADE delete
  - Belongs to `reservations` (N:1) - CASCADE delete

### **7. document_verifications**
- User document submissions (ID, license)
- **Relations**:
  - Belongs to `users` (N:1) - CASCADE delete
  - Reviewed by `admin_users` (N:1) - SET NULL on delete

### **8. gps_tracking**
- Real-time GPS location data
- **Relations**:
  - Belongs to `motorcycles` (N:1) - CASCADE delete
  - Optionally linked to `reservations` (N:1) - SET NULL on delete

---

## 🔐 Row Level Security (RLS)

The database uses RLS to secure data:

### Public Access
- ✅ Anyone can view motorcycles

### User Access
- ✅ Users can view/update their own profile
- ✅ Users can view their own reservations
- ✅ Users can create new reservations
- ✅ Users can view their own transactions
- ✅ Users can view/update their own notifications
- ✅ Users can view/submit their own documents

### Admin Access
- Implement admin policies based on your auth strategy
- Consider using custom claims or separate admin auth

---

## 🛠️ Useful Database Functions

### 1. Check Motorcycle Availability
```sql
SELECT check_motorcycle_availability(
  'motorcycle-uuid'::UUID,
  '2025-01-01'::DATE,
  '2025-01-05'::DATE
);
```

### 2. Get User Total Spending
```sql
SELECT get_user_total_spending('user-uuid'::UUID);
```

### 3. View Active Reservations
```sql
SELECT * FROM active_reservations_view;
```

### 4. View Motorcycle Availability
```sql
SELECT * FROM motorcycle_availability_view;
```

---

## 📝 Database Constraints

### Referential Integrity
- ✅ Foreign keys enforce relationships
- ✅ CASCADE deletes for user data
- ✅ RESTRICT deletes for motorcycles (can't delete if reserved)
- ✅ SET NULL for optional relationships

### Data Validation
- ✅ Check constraints on enums (status, role, type)
- ✅ Date validation (end_date >= start_date)
- ✅ Unique constraints on emails
- ✅ NOT NULL constraints on required fields

### Auto-timestamps
- ✅ `created_at` auto-set on insert
- ✅ `updated_at` auto-updated via triggers
- ✅ Timezone-aware timestamps (TIMESTAMPTZ)

---

## 🔍 Indexes for Performance

Indexes created for common queries:
- ✅ User email lookups
- ✅ Reservation filtering by status, dates, user
- ✅ Motorcycle availability searches
- ✅ Transaction user/reservation lookups
- ✅ Notification read status and timestamps
- ✅ GPS tracking by motorcycle and status

---

## 🚦 Next Steps

### 1. Test Database Connection
Run your app and check console for Supabase connection

### 2. Create API Service Layer
Update your components to use Supabase instead of mock data

### 3. Set Up Authentication
- Enable Email/Password auth in Supabase
- Or use OAuth providers (Google, Facebook, etc.)

### 4. Configure Storage (Optional)
For images (motorcycles, documents, GCash proofs):
1. Go to **Storage** in Supabase
2. Create buckets:
   - `motorcycles` - for motorcycle images
   - `documents` - for user ID uploads
   - `payment-proofs` - for GCash screenshots

### 5. Set Up Realtime (Optional)
Enable realtime for:
- GPS tracking updates
- Notification real-time delivery
- Reservation status changes

---

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Storage](https://supabase.com/docs/guides/storage)

---

## 🐛 Troubleshooting

### Can't connect to Supabase?
- Check `.env` file exists and has correct values
- Verify URL and key from Supabase dashboard
- Restart dev server after changing `.env`

### Tables not created?
- Ensure entire SQL script ran without errors
- Check Supabase SQL Editor for error messages
- Try running table creation in smaller chunks

### RLS blocking queries?
- Temporarily disable RLS for testing:
  ```sql
  ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
  ```
- Review RLS policies for your use case
- Ensure proper authentication is set up

---

**Ready to integrate? Follow the implementation guide in the next section!**
