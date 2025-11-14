# Notification System Fix - Complete Guide

## Problem
Customers were not receiving notifications when their reservations were approved or rejected by admin. The notification icon showed no notifications.

## Root Causes
1. **Notifications not created in database**: Admin only sent emails but didn't create notification records
2. **Notifications not loaded on login**: User notifications were never fetched from database
3. **No real-time subscription**: New notifications weren't received instantly
4. **Outdated notification schema**: Database schema lacked `title` field and flexible types

## Solution Overview
1. Created notifications in database when admin approves/rejects reservations
2. Load user notifications from database on login
3. Subscribe to real-time notification updates via Supabase
4. Updated database schema to support modern notification structure
5. Fixed UI to display new notification format

## Files Modified

### 1. `supabase/migrations/014_update_notifications_table.sql` (NEW)
**Purpose**: Update notifications table schema

**Changes**:
- Made `reservation_id` and `motorcycle_name` nullable (for non-reservation notifications)
- Added `title` column for notification headlines
- Updated `type` constraint to support: 'info', 'success', 'warning', 'error', 'confirmed', 'rejected'
- Migrated existing data to populate title field

**Run this migration**: Open Supabase Dashboard → SQL Editor → Paste and run

### 2. `src/components/admin/AdminReservations.tsx`
**Purpose**: Create notifications when admin approves/rejects reservations

**Changes**:
- Imported `notificationService`
- In `handleConfirmVerification()`:
  - **Approve**: Creates notification with type='success', title='✅ Reservation Approved'
  - **Reject**: Creates notification with type='error', title='❌ Reservation Rejected'
  - Both include motorcycle name, dates, and reason in message
  - Notifications saved to database via `notificationService.createNotification()`

### 3. `src/App.tsx`
**Purpose**: Load and manage notifications for logged-in users

**Changes**:
- Imported `notificationService`
- Updated `Notification` interface to match new schema:
  ```typescript
  {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    read: boolean;
    timestamp: string;
  }
  ```
- Added `loadUserNotifications(userId)`: Fetches all user notifications from database
- **Real-time subscription** (new useEffect):
  - Subscribes to new notifications when user logs in
  - Automatically shows toast when notification arrives
  - Adds notification to state immediately
  - Unsubscribes on logout
- Updated `login()`: Now calls `loadUserNotifications()` and async
- Updated `logout()`: Clears notifications array
- Updated `markNotificationAsRead()`: Now updates database via API
- Updated `markAllNotificationsAsRead()`: Now updates database via API
- Updated `showUnreadNotifications()`: Uses new title/type fields

### 4. `src/lib/database.types.ts`
**Purpose**: TypeScript types for Supabase tables

**Changes**:
- Updated `notifications` Row/Insert/Update types:
  - Added `title: string` (required)
  - Made `reservation_id` and `motorcycle_name` nullable
  - Updated `type` to include 'info', 'success', 'warning', 'error'

### 5. `src/components/Header.tsx`
**Purpose**: Display notifications in bell icon dropdown

**Changes**:
- Updated notification display logic:
  - Shows `notification.title` instead of hardcoded text
  - Icon color based on type: success/confirmed (green), error/rejected (red), warning (yellow), info (blue)
  - Removed motorcycle name line (now in message)
  - Message displays directly from `notification.message`

## How It Works Now

### Admin Side (Approve/Reject Flow)
1. Admin clicks Approve/Reject on reservation in AdminReservations
2. Reservation status updated in database
3. Email sent to customer
4. **NEW**: Notification created in database:
   ```typescript
   {
     user_id: reservation.userId,
     title: '✅ Reservation Approved', // or '❌ Reservation Rejected'
     message: 'Your reservation for Honda Click 150i has been approved! Pick up on Jan 15, 2024.',
     type: 'success', // or 'error'
     read: false
   }
   ```
5. Customer receives notification instantly (if online via real-time subscription)

### Customer Side (Notification Reception)
1. **On Login**:
   - `loadUserNotifications()` fetches all notifications from database
   - Notifications populate bell icon
   - Unread notifications show as toast popups
   
2. **Real-Time (While Logged In)**:
   - Supabase real-time channel listens for new notifications
   - When admin creates notification, customer receives instantly
   - Toast appears automatically
   - Bell icon updates with new notification
   - Red badge shows unread count

3. **Notification Display**:
   - Click bell icon to see all notifications
   - Unread notifications have highlighted background
   - Red dot indicator on unread items
   - Click notification to mark as read
   - "Mark all as read" button available

## Testing Instructions

### 1. Run Migration
```sql
-- In Supabase Dashboard → SQL Editor
-- Paste contents of 014_update_notifications_table.sql
-- Run (Ctrl+Enter)
-- Should see "Success. No rows returned"
```

### 2. Test Notification Creation (Admin Side)
1. Login as admin
2. Go to Reservations page
3. Find a pending reservation
4. Click "Verify Documents" → Approve
5. Check console logs for "✅ Approval notification created"
6. Check Supabase Dashboard → Table Editor → notifications
7. Should see new notification record with type='success'

### 3. Test Notification Reception (Customer Side)
**Test A - Real-time (User already logged in)**:
1. Login as customer in one browser
2. Login as admin in another browser
3. Approve customer's reservation (admin side)
4. Customer should see toast notification instantly
5. Bell icon should update with red badge

**Test B - On Login**:
1. Create notification as admin (approve reservation)
2. Login as that customer
3. Should see toast notification on login
4. Bell icon should show unread count

### 4. Test Notification UI
1. Click bell icon (customer side)
2. Should see notification with:
   - Green checkmark (approved) or red X (rejected)
   - Title: "✅ Reservation Approved" or "❌ Reservation Rejected"
   - Message with motorcycle name and dates
   - Timestamp
   - Unread indicator (red dot)
3. Click notification → should mark as read
4. Click "Mark all as read" → all turn read

## Database Migration Details

**Before**:
```sql
type: 'confirmed' | 'rejected'  -- Limited types
reservation_id: NOT NULL        -- Always required
motorcycle_name: NOT NULL       -- Always required
-- No title field
```

**After**:
```sql
type: 'info' | 'success' | 'warning' | 'error' | 'confirmed' | 'rejected'  -- Flexible
reservation_id: NULL allowed    -- Optional (for non-reservation notifications)
motorcycle_name: NULL allowed   -- Optional
title: VARCHAR(255) NOT NULL    -- New required field
```

## Troubleshooting

### Notifications not appearing
1. Check migration ran successfully (Supabase Dashboard → Database → Logs)
2. Check notification created in database (Table Editor → notifications)
3. Check user_id matches logged-in user
4. Check console for errors: "Failed to create notification"

### Real-time not working
1. Check console for "🔔 Subscribing to notifications for user: [id]"
2. Check Supabase project has Realtime enabled (Settings → API)
3. Check network tab for websocket connection
4. Try logout/login to reset subscription

### TypeScript errors
1. Run migration first (types match new schema)
2. Restart VS Code TypeScript server (Cmd+Shift+P → "Restart TypeScript Server")
3. Check database.types.ts matches actual schema

### Bell icon shows wrong count
1. Check `notifications.filter(n => !n.read).length`
2. Check notifications are for correct user_id
3. Try "Mark all as read" then test again

## Security Notes
- Notifications use RLS policies (user can only see their own)
- Real-time subscription filtered by user_id
- Admin cannot see customer notifications (different table/context)
- Notification creation requires authenticated session

## Future Enhancements
- [ ] Add notification preferences (email, push, in-app)
- [ ] Support notification actions (approve payment from notification)
- [ ] Add notification categories/filtering
- [ ] Implement notification archiving
- [ ] Add push notifications for mobile
- [ ] Notification scheduling/delayed delivery
