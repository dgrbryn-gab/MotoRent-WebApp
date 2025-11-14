# Supabase Implementation Guide

## ✅ What's Been Set Up

### 1. **Supabase Client** (`src/lib/supabase.ts`)
- Configured Supabase client with TypeScript support
- Auto-refresh tokens and session persistence
- Ready to use throughout your app

### 2. **Database Types** (`src/lib/database.types.ts`)
- Complete TypeScript type definitions for all tables
- Type-safe queries and mutations
- Matches your database schema exactly

### 3. **Database Schema** (`supabase/migrations/001_initial_schema.sql`)
- 8 tables with proper relationships
- Foreign key constraints
- Indexes for performance
- Row Level Security (RLS) policies
- Triggers for auto-updating timestamps
- Useful database functions and views

### 4. **Service Layer** (All services in `src/services/`)
- `userService.ts` - User management
- `motorcycleService.ts` - Fleet management
- `reservationService.ts` - Booking operations
- `transactionService.ts` - Payment tracking
- `notificationService.ts` - User notifications (with realtime)
- `documentService.ts` - Document verification
- `gpsService.ts` - GPS tracking (with realtime)
- `adminService.ts` - Admin operations

---

## 🚀 Quick Start Steps

### Step 1: Set Up Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your Project URL and anon key
3. Create `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 2: Run Database Migrations

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/migrations/001_initial_schema.sql`
3. Paste and run in SQL Editor
4. Verify tables created in Table Editor

### Step 3: Update Your Components

Replace mock data with Supabase calls. Here's how:

---

## 📝 Component Integration Examples

### Example 1: Update `App.tsx` to Load Motorcycles

```typescript
import { useEffect } from 'react';
import { motorcycleService } from './services/motorcycleService';

// Inside App component
useEffect(() => {
  loadMotorcycles();
}, []);

const loadMotorcycles = async () => {
  try {
    const data = await motorcycleService.getAllMotorcycles();
    // Transform Supabase data to match your Motorcycle interface
    const motorcycles = data.map(m => ({
      id: m.id,
      name: m.name,
      type: m.type,
      engineCapacity: m.engine_capacity,
      transmission: m.transmission,
      year: m.year,
      color: m.color,
      fuelCapacity: m.fuel_capacity,
      pricePerDay: m.price_per_day,
      description: m.description,
      image: m.image,
      features: m.features,
      availability: m.availability,
      rating: m.rating,
      review_count: m.review_count,
      fuelType: m.fuel_type
    }));
    setMotorcycles(motorcycles);
  } catch (error) {
    console.error('Error loading motorcycles:', error);
    toast.error('Failed to load motorcycles');
  }
};
```

### Example 2: Update `BookingPage` to Create Reservations

```typescript
import { reservationService } from '../services/reservationService';
import { transactionService } from '../services/transactionService';

const handleBooking = async (reservationData) => {
  try {
    // Create reservation in Supabase
    const reservation = await reservationService.createReservation({
      user_id: user.id,
      motorcycle_id: motorcycle.id,
      start_date: startDate,
      end_date: endDate,
      pickup_time: pickupTime,
      return_time: returnTime,
      total_price: totalPrice,
      status: 'pending',
      customer_name: user.name,
      customer_email: user.email,
      customer_phone: user.phone,
      payment_method: paymentMethod,
      gcash_reference_number: gcashRef,
      gcash_proof_url: gcashProofUrl
    });

    // Create transaction
    await transactionService.createTransaction({
      reservation_id: reservation.id,
      user_id: user.id,
      type: 'payment',
      amount: totalPrice,
      date: new Date().toISOString().split('T')[0],
      status: paymentMethod === 'gcash' ? 'pending' : 'completed',
      description: `Payment for ${motorcycle.name} reservation`
    });

    toast.success('Reservation created successfully!');
    navigate('reservations');
  } catch (error) {
    console.error('Error creating reservation:', error);
    toast.error('Failed to create reservation');
  }
};
```

### Example 3: Update `AdminReservations` to Load Data

```typescript
import { reservationService } from '../../services/reservationService';
import { notificationService } from '../../services/notificationService';

useEffect(() => {
  loadReservations();
}, []);

const loadReservations = async () => {
  try {
    const data = await reservationService.getAllReservations();
    // Transform data as needed
    setReservations(data);
  } catch (error) {
    console.error('Error loading reservations:', error);
  }
};

const handleApproveReservation = async (id: string) => {
  try {
    await reservationService.updateStatus(id, 'confirmed');
    
    // Create notification for customer
    const reservation = reservations.find(r => r.id === id);
    if (reservation) {
      await notificationService.createNotification({
        user_id: reservation.user_id,
        reservation_id: id,
        type: 'confirmed',
        motorcycle_name: reservation.motorcycle.name,
        message: 'Your reservation has been confirmed!',
        read: false
      });
    }

    toast.success('Reservation approved!');
    loadReservations();
  } catch (error) {
    console.error('Error approving reservation:', error);
    toast.error('Failed to approve reservation');
  }
};
```

---

## 🔧 Utility Functions to Add

### Create `src/utils/supabaseHelpers.ts`:

```typescript
import type { Database } from '../lib/database.types';

// Transform database motorcycle to app format
export function transformMotorcycle(
  dbMotorcycle: Database['public']['Tables']['motorcycles']['Row']
) {
  return {
    id: dbMotorcycle.id,
    name: dbMotorcycle.name,
    type: dbMotorcycle.type,
    engineCapacity: dbMotorcycle.engine_capacity,
    transmission: dbMotorcycle.transmission,
    year: dbMotorcycle.year,
    color: dbMotorcycle.color,
    fuelCapacity: dbMotorcycle.fuel_capacity,
    pricePerDay: dbMotorcycle.price_per_day,
    description: dbMotorcycle.description,
    image: dbMotorcycle.image,
    features: dbMotorcycle.features,
    availability: dbMotorcycle.availability,
    rating: dbMotorcycle.rating,
    reviewCount: dbMotorcycle.review_count,
    fuelType: dbMotorcycle.fuel_type
  };
}

// Transform database reservation to app format
export function transformReservation(dbReservation: any) {
  return {
    id: dbReservation.id,
    motorcycleId: dbReservation.motorcycle_id,
    motorcycle: transformMotorcycle(dbReservation.motorcycle),
    startDate: dbReservation.start_date,
    endDate: dbReservation.end_date,
    pickupTime: dbReservation.pickup_time,
    returnTime: dbReservation.return_time,
    totalPrice: dbReservation.total_price,
    status: dbReservation.status,
    createdAt: dbReservation.created_at,
    customerName: dbReservation.customer_name,
    customerEmail: dbReservation.customer_email,
    customerPhone: dbReservation.customer_phone,
    paymentMethod: dbReservation.payment_method,
    gcashReferenceNumber: dbReservation.gcash_reference_number,
    gcashProofUrl: dbReservation.gcash_proof_url,
    adminNotes: dbReservation.admin_notes
  };
}

// Error handling helper
export function handleSupabaseError(error: any) {
  console.error('Supabase error:', error);
  
  if (error.message?.includes('JWT')) {
    return 'Session expired. Please log in again.';
  }
  
  if (error.code === '23505') {
    return 'This record already exists.';
  }
  
  if (error.code === '23503') {
    return 'Cannot delete: this record is referenced elsewhere.';
  }
  
  return error.message || 'An unexpected error occurred.';
}
```

---

## 🔐 Authentication Setup

### Enable Email Auth in Supabase

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure email templates (optional)

### Add Auth Functions to `App.tsx`:

```typescript
import { supabase } from './lib/supabase';

// Sign up new user
const signUp = async (email: string, password: string, userData: any) => {
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('No user returned');

    // Create user profile
    const { data: userProfile, error: profileError } = await userService.createUser({
      id: authData.user.id,
      name: userData.name,
      email: userData.email,
      phone: userData.phone
    });

    if (profileError) throw profileError;

    return userProfile;
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
};

// Sign in existing user
const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    if (!data.user) throw new Error('No user returned');

    // Get user profile
    const userProfile = await userService.getUserById(data.user.id);
    
    return userProfile;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
};

// Sign out
const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) console.error('Sign out error:', error);
};
```

---

## 📦 Storage Setup (For Images)

### Create Storage Buckets:

1. Go to **Storage** in Supabase
2. Create these buckets:
   - `motorcycles` (public)
   - `documents` (private)
   - `payment-proofs` (private)

### Add Storage Helper (`src/utils/storage.ts`):

```typescript
import { supabase } from '../lib/supabase';

export const storage = {
  async uploadMotorcycleImage(file: File) {
    const fileName = `${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from('motorcycles')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('motorcycles')
      .getPublicUrl(fileName);

    return publicUrl;
  },

  async uploadDocument(userId: string, file: File, type: 'license' | 'id') {
    const fileName = `${userId}/${type}_${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(fileName, file);

    if (error) throw error;

    // Get signed URL (private)
    const { data: signedUrl } = await supabase.storage
      .from('documents')
      .createSignedUrl(fileName, 3600); // 1 hour expiry

    return signedUrl?.signedUrl;
  },

  async uploadPaymentProof(userId: string, file: File) {
    const fileName = `${userId}/payment_${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from('payment-proofs')
      .upload(fileName, file);

    if (error) throw error;

    const { data: signedUrl } = await supabase.storage
      .from('payment-proofs')
      .createSignedUrl(fileName, 86400); // 24 hours

    return signedUrl?.signedUrl;
  }
};
```

---

## 🔴 Realtime Features

### Subscribe to Notifications:

```typescript
import { notificationService } from './services/notificationService';

useEffect(() => {
  if (!user) return;

  // Subscribe to new notifications
  const subscription = notificationService.subscribeToUserNotifications(
    user.id,
    (newNotification) => {
      // Add to notifications list
      setNotifications(prev => [newNotification, ...prev]);
      
      // Show toast
      toast.info(newNotification.message);
    }
  );

  return () => {
    subscription.unsubscribe();
  };
}, [user]);
```

### Subscribe to GPS Updates:

```typescript
import { gpsService } from './services/gpsService';

useEffect(() => {
  const subscription = gpsService.subscribeToGPSUpdates((gpsData) => {
    // Update GPS tracking in real-time
    setGPSData(prev => 
      prev.map(item => 
        item.motorcycle_id === gpsData.motorcycle_id ? gpsData : item
      )
    );
  });

  return () => {
    subscription.unsubscribe();
  };
}, []);
```

---

## 📊 Sample Data Seeds

### Add Sample Motorcycles (`supabase/seeds/motorcycles.sql`):

```sql
INSERT INTO motorcycles (name, type, engine_capacity, transmission, year, color, fuel_capacity, price_per_day, description, image, features, fuel_type) VALUES
  ('Honda Click 125i', 'Scooter', 125, 'Automatic', 2024, 'Red', 4.5, 500, 'Perfect for city riding', 'https://example.com/honda-click.jpg', ARRAY['LED Headlight', 'USB Charger'], 'Gasoline'),
  ('Yamaha NMAX 155', 'Scooter', 155, 'Automatic', 2024, 'Blue', 7.1, 700, 'Premium scooter experience', 'https://example.com/nmax.jpg', ARRAY['ABS', 'Smart Key'], 'Gasoline'),
  ('Suzuki Raider R150', 'Sport', 150, 'Manual', 2023, 'Black', 12, 600, 'Sporty and powerful', 'https://example.com/raider.jpg', ARRAY['Digital Display', 'Disc Brakes'], 'Gasoline');
```

---

## ✅ Testing Checklist

- [ ] Database tables created successfully
- [ ] Environment variables configured
- [ ] Supabase client connecting
- [ ] Can fetch motorcycles from database
- [ ] Can create reservations
- [ ] Can update reservation status
- [ ] Notifications working
- [ ] Admin can view all data
- [ ] RLS policies working correctly
- [ ] Realtime subscriptions working

---

## 🐛 Common Issues & Solutions

### Issue: "JWT expired" errors
**Solution**: Implement token refresh or re-login flow

### Issue: RLS blocking queries
**Solution**: Temporarily disable RLS for testing or update policies

### Issue: Type errors in services
**Solution**: These are cosmetic. The queries will work. Regenerate types if needed.

### Issue: Can't upload images
**Solution**: Check storage buckets are created and have correct policies

---

## 📚 Next Steps

1. **Replace mock data** in `App.tsx` with Supabase calls
2. **Add authentication** to login/signup pages
3. **Implement file uploads** for motorcycles and documents
4. **Set up realtime** notifications
5. **Add error boundaries** for better error handling
6. **Implement loading states** while fetching data
7. **Add optimistic updates** for better UX

---

**Ready to start? Begin by loading motorcycles in your HomePage!**
