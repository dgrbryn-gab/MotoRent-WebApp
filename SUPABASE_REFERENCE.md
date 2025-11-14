# MotoRent Supabase Quick Reference

## 📋 Database Tables

| Table | Description | Key Relations |
|-------|-------------|---------------|
| `users` | Customer accounts | → reservations, transactions, notifications |
| `admin_users` | Admin accounts | → document_verifications (reviewer) |
| `motorcycles` | Fleet inventory | → reservations, gps_tracking |
| `reservations` | Bookings | ← users, motorcycles; → transactions |
| `transactions` | Payments | ← users, reservations |
| `notifications` | User alerts | ← users, reservations |
| `document_verifications` | ID verification | ← users, admin_users |
| `gps_tracking` | Real-time GPS | ← motorcycles, reservations |

---

## 🔑 Environment Variables

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📦 Available Services

### User Service (`userService`)
```typescript
import { userService } from './services/userService';

// Get all users
await userService.getAllUsers();

// Get user by email
await userService.getUserByEmail('user@example.com');

// Create user
await userService.createUser({ name, email, phone });

// Update user
await userService.updateUser(id, { name: 'New Name' });
```

### Motorcycle Service (`motorcycleService`)
```typescript
import { motorcycleService } from './services/motorcycleService';

// Get all motorcycles
await motorcycleService.getAllMotorcycles();

// Get available only
await motorcycleService.getAvailableMotorcycles();

// Search motorcycles
await motorcycleService.searchMotorcycles('Honda');

// Create motorcycle
await motorcycleService.createMotorcycle({ ...data });

// Update availability
await motorcycleService.updateAvailability(id, 'Available');

// Check availability for dates
await motorcycleService.checkAvailability(id, '2025-01-01', '2025-01-05');
```

### Reservation Service (`reservationService`)
```typescript
import { reservationService } from './services/reservationService';

// Get all reservations
await reservationService.getAllReservations();

// Get user's reservations
await reservationService.getUserReservations(userId);

// Create reservation
await reservationService.createReservation({ ...data });

// Update status
await reservationService.updateStatus(id, 'confirmed');

// Get pending count
await reservationService.getPendingCount();
```

### Transaction Service (`transactionService`)
```typescript
import { transactionService } from './services/transactionService';

// Get user transactions
await transactionService.getUserTransactions(userId);

// Create transaction
await transactionService.createTransaction({ ...data });

// Get total revenue
await transactionService.getCompletedTotal();
```

### Notification Service (`notificationService`)
```typescript
import { notificationService } from './services/notificationService';

// Get unread notifications
await notificationService.getUnreadNotifications(userId);

// Create notification
await notificationService.createNotification({ ...data });

// Mark as read
await notificationService.markAsRead(id);

// Mark all as read
await notificationService.markAllAsRead(userId);

// Subscribe to realtime
const subscription = notificationService.subscribeToUserNotifications(
  userId,
  (notification) => {
    console.log('New notification:', notification);
  }
);
// Don't forget to unsubscribe
subscription.unsubscribe();
```

### GPS Service (`gpsService`)
```typescript
import { gpsService } from './services/gpsService';

// Get all GPS data
await gpsService.getAllGPSData();

// Get active GPS (motorcycles in use)
await gpsService.getActiveGPS();

// Update GPS location
await gpsService.updateGPSLocation(motorcycleId, lat, lng, address, speed);

// Subscribe to realtime updates
const subscription = gpsService.subscribeToGPSUpdates((gpsData) => {
  console.log('GPS updated:', gpsData);
});
```

### Document Service (`documentService`)
```typescript
import { documentService } from './services/documentService';

// Get pending documents
await documentService.getDocumentsByStatus('pending');

// Submit document
await documentService.submitDocument({ ...data });

// Approve document
await documentService.approveDocument(id, reviewerId);

// Reject document
await documentService.rejectDocument(id, reviewerId, reason);
```

---

## 🔐 Authentication Example

```typescript
import { supabase } from './lib/supabase';

// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'securePassword123'
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'securePassword123'
});

// Sign out
await supabase.auth.signOut();

// Get current user
const { data: { user } } = await supabase.auth.getUser();

// Listen to auth changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event, session);
});
```

---

## 📊 Useful Database Functions

```typescript
// Check motorcycle availability
const available = await supabase.rpc('check_motorcycle_availability', {
  motorcycle_uuid: 'motorcycle-id',
  check_start_date: '2025-01-01',
  check_end_date: '2025-01-05'
});

// Get user total spending
const total = await supabase.rpc('get_user_total_spending', {
  user_uuid: 'user-id'
});
```

---

## 🎯 Common Queries

### Get reservations with motorcycle details
```typescript
const { data } = await supabase
  .from('reservations')
  .select(`
    *,
    motorcycle:motorcycles(*),
    user:users(*)
  `)
  .eq('status', 'confirmed');
```

### Get motorcycles with active rental count
```typescript
const { data } = await supabase
  .from('motorcycle_availability_view')
  .select('*');
```

### Get active reservations
```typescript
const { data } = await supabase
  .from('active_reservations_view')
  .select('*');
```

---

## 🚨 Error Handling

```typescript
try {
  const data = await motorcycleService.getAllMotorcycles();
  setMotorcycles(data);
} catch (error) {
  console.error('Error:', error);
  
  if (error.code === 'PGRST116') {
    // No rows found
    setMotorcycles([]);
  } else if (error.message.includes('JWT')) {
    // Session expired
    toast.error('Please log in again');
    navigate('login');
  } else {
    toast.error('Failed to load data');
  }
}
```

---

## 📝 Column Name Mapping

When transforming data between Supabase (snake_case) and App (camelCase):

| Supabase | App Interface |
|----------|--------------|
| `engine_capacity` | `engineCapacity` |
| `fuel_capacity` | `fuelCapacity` |
| `price_per_day` | `pricePerDay` |
| `review_count` | `reviewCount` |
| `fuel_type` | `fuelType` |
| `user_id` | `userId` |
| `motorcycle_id` | `motorcycleId` |
| `start_date` | `startDate` |
| `end_date` | `endDate` |
| `total_price` | `totalPrice` |
| `created_at` | `createdAt` |

---

## 🔄 Realtime Subscriptions

```typescript
// Subscribe to table changes
const subscription = supabase
  .channel('custom-channel')
  .on(
    'postgres_changes',
    {
      event: '*', // or 'INSERT', 'UPDATE', 'DELETE'
      schema: 'public',
      table: 'reservations'
    },
    (payload) => {
      console.log('Change received!', payload);
    }
  )
  .subscribe();

// Unsubscribe when component unmounts
subscription.unsubscribe();
```

---

## 🎨 Storage URLs

```typescript
// Upload file
const { data, error } = await supabase.storage
  .from('motorcycles')
  .upload('filename.jpg', file);

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('motorcycles')
  .getPublicUrl('filename.jpg');

// Get signed URL (private files)
const { data } = await supabase.storage
  .from('documents')
  .createSignedUrl('filename.jpg', 3600); // 1 hour
```

---

## 🔗 Useful Links

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Supabase Docs](https://supabase.com/docs)
- [PostgREST API Docs](https://postgrest.org)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

---

**For detailed implementation, see `IMPLEMENTATION_GUIDE.md`**
**For database setup, see `SUPABASE_SETUP.md`**
