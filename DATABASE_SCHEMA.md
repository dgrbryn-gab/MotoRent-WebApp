# Database Schema Diagram

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          MOTORENT DATABASE SCHEMA                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│       USERS          │
├──────────────────────┤
│ id (PK)              │
│ name                 │
│ email (UNIQUE)       │
│ phone                │
│ created_at           │
│ updated_at           │
└──────┬───────────────┘
       │
       │ 1:N
       ├──────────────────────────────────────────┐
       │                                          │
       │                                          │
       ▼                                          ▼
┌──────────────────────┐                  ┌──────────────────────┐
│   RESERVATIONS       │                  │   TRANSACTIONS       │
├──────────────────────┤                  ├──────────────────────┤
│ id (PK)              │◄─────────────────│ id (PK)              │
│ user_id (FK)         │        N:1       │ reservation_id (FK)  │
│ motorcycle_id (FK)   │                  │ user_id (FK)         │
│ start_date           │                  │ type                 │
│ end_date             │                  │ amount               │
│ pickup_time          │                  │ date                 │
│ return_time          │                  │ status               │
│ total_price          │                  │ description          │
│ status               │                  │ created_at           │
│ customer_name        │                  │ updated_at           │
│ customer_email       │                  └──────────────────────┘
│ customer_phone       │
│ payment_method       │
│ gcash_reference_no   │
│ gcash_proof_url      │
│ admin_notes          │
│ created_at           │
│ updated_at           │
└──────┬───────────────┘
       │
       │ N:1
       │
       ▼
┌──────────────────────┐
│    MOTORCYCLES       │
├──────────────────────┤
│ id (PK)              │
│ name                 │
│ type                 │
│ engine_capacity      │
│ transmission         │
│ year                 │
│ color                │
│ fuel_capacity        │
│ price_per_day        │
│ description          │
│ image                │
│ features[]           │
│ availability         │
│ rating               │
│ review_count         │
│ fuel_type            │
│ created_at           │
│ updated_at           │
└──────┬───────────────┘
       │
       │ 1:N
       │
       ▼
┌──────────────────────┐
│    GPS_TRACKING      │
├──────────────────────┤
│ id (PK)              │
│ motorcycle_id (FK)   │
│ reservation_id (FK)  │
│ latitude             │
│ longitude            │
│ speed                │
│ fuel_level           │
│ battery_level        │
│ location_address     │
│ status               │
│ last_update          │
│ created_at           │
└──────────────────────┘


┌──────────────────────┐         ┌──────────────────────┐
│    NOTIFICATIONS     │         │   ADMIN_USERS        │
├──────────────────────┤         ├──────────────────────┤
│ id (PK)              │         │ id (PK)              │
│ user_id (FK)         │         │ name                 │
│ reservation_id (FK)  │         │ email (UNIQUE)       │
│ type                 │         │ role                 │
│ motorcycle_name      │         │ last_login           │
│ message              │         │ created_at           │
│ read                 │         │ updated_at           │
│ timestamp            │         └──────┬───────────────┘
│ created_at           │                │
└──────────────────────┘                │ 1:N (reviewer)
       ▲                                │
       │                                ▼
       │ N:1                     ┌──────────────────────┐
       │                         │ DOCUMENT_VERIFICATIONS│
       │                         ├──────────────────────┤
       └─────────────────────────│ id (PK)              │
                                 │ user_id (FK)         │
                                 │ document_type        │
                                 │ document_url         │
                                 │ status               │
                                 │ submitted_at         │
                                 │ reviewed_at          │
                                 │ reviewed_by (FK)     │
                                 │ rejection_reason     │
                                 │ created_at           │
                                 │ updated_at           │
                                 └──────────────────────┘
```

## Table Relationships Summary

### **Foreign Key Constraints**

| Child Table | Foreign Key | Parent Table | On Delete |
|-------------|-------------|--------------|-----------|
| `reservations` | `user_id` | `users` | CASCADE |
| `reservations` | `motorcycle_id` | `motorcycles` | RESTRICT |
| `transactions` | `user_id` | `users` | CASCADE |
| `transactions` | `reservation_id` | `reservations` | SET NULL |
| `notifications` | `user_id` | `users` | CASCADE |
| `notifications` | `reservation_id` | `reservations` | CASCADE |
| `document_verifications` | `user_id` | `users` | CASCADE |
| `document_verifications` | `reviewed_by` | `admin_users` | SET NULL |
| `gps_tracking` | `motorcycle_id` | `motorcycles` | CASCADE |
| `gps_tracking` | `reservation_id` | `reservations` | SET NULL |

### **Relationship Types**

- **One-to-Many (1:N)**
  - `users` → `reservations`
  - `users` → `transactions`
  - `users` → `notifications`
  - `users` → `document_verifications`
  - `motorcycles` → `reservations`
  - `motorcycles` → `gps_tracking`
  - `reservations` → `transactions`
  - `reservations` → `notifications`
  - `admin_users` → `document_verifications` (as reviewer)

- **Many-to-One (N:1)**
  - All the reverse of above

### **Delete Behaviors**

- **CASCADE**: When parent deleted, children are automatically deleted
  - Deleting a user → deletes their reservations, transactions, notifications, documents
  - Deleting a motorcycle → deletes its GPS tracking records
  - Deleting a reservation → deletes associated notifications

- **RESTRICT**: Prevents deletion if children exist
  - Cannot delete a motorcycle that has active reservations

- **SET NULL**: Sets foreign key to NULL when parent deleted
  - Deleting a reservation → sets `reservation_id` to NULL in transactions/GPS
  - Deleting an admin → sets `reviewed_by` to NULL in documents

## Indexes

### **Primary Indexes** (on foreign keys)
- `idx_reservations_user_id`
- `idx_reservations_motorcycle_id`
- `idx_reservations_status`
- `idx_reservations_dates`
- `idx_transactions_user_id`
- `idx_transactions_reservation_id`
- `idx_notifications_user_id`
- `idx_notifications_read`
- `idx_gps_tracking_motorcycle_id`
- `idx_gps_tracking_status`

### **Unique Indexes**
- `users.email` (UNIQUE)
- `admin_users.email` (UNIQUE)

## Views

### **active_reservations_view**
Shows all pending and confirmed reservations with joined motorcycle and user data.

### **motorcycle_availability_view**
Shows motorcycle availability with counts of active and pending rentals.

## Functions

### **check_motorcycle_availability(motorcycle_uuid, check_start_date, check_end_date)**
Returns boolean indicating if a motorcycle is available for the specified date range.

### **get_user_total_spending(user_uuid)**
Returns the total amount spent by a user on completed payments.

## Triggers

- **update_updated_at_column**: Automatically updates `updated_at` timestamp on UPDATE for all tables with that column.

## Enums (CHECK Constraints)

- **transmission**: 'Automatic', 'Manual'
- **availability**: 'Available', 'Reserved', 'In Maintenance'
- **fuel_type**: 'Gasoline', 'Electric'
- **reservation_status**: 'pending', 'confirmed', 'cancelled', 'completed'
- **payment_method**: 'cash', 'gcash'
- **transaction_type**: 'payment', 'deposit', 'refund'
- **transaction_status**: 'completed', 'pending', 'failed'
- **notification_type**: 'confirmed', 'rejected'
- **document_type**: 'driver-license', 'valid-id'
- **document_status**: 'pending', 'approved', 'rejected'
- **gps_status**: 'active', 'idle', 'maintenance', 'offline'
- **admin_role**: 'admin', 'super-admin'
