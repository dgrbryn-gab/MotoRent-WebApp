# User Profile Enhancements

## Overview
Enhanced the user profile and booking system to include:
- **Profile picture upload** with camera icon overlay
- **Driver's license upload** with license number input
- **Birthday** field with age validation
- **Complete address** field

All details are automatically loaded when making reservations.

## Changes Made

### 1. Database Schema Update
**File:** `supabase/migrations/019_add_user_profile_fields.sql`
- Added `birthday` (DATE) column to users table
- Added `address` (TEXT) column to users table
- Added `driver_license_url` (TEXT) column to users table
- Added `license_number` (VARCHAR(50)) column to users table
- Added `profile_picture_url` (TEXT) column to users table
- Created indexes for driver's license and license number lookups

**To Apply Migration:**
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the content from `019_add_user_profile_fields.sql`
4. Run the migration

### 2. Type Definitions Updated
**File:** `src/App.tsx`
- Updated `User` interface to include:
  - `birthday?: string`
  - `address?: string`
  - `driver_license_url?: string`
  - `license_number?: string`
  - `profile_picture_url?: string`

### 3. Profile Page Enhancements
**File:** `src/components/ProfilePage.tsx`

#### New Features:
1. **Profile Picture Upload**
   - Click camera icon on avatar to upload
   - Upload profile picture (JPG, PNG)
   - Max file size: 5MB
   - Image validation
   - Shows current picture or initials fallback
   - Real-time preview indicator

2. **Driver's License Section**
   - **License Number Input**: Text field for license number (e.g., N01-12-345678)
   - **License Document Upload**: Upload driver's license (JPG, PNG, PDF)
   - Max file size: 5MB
   - File validation
   - View uploaded license
   - Replace license functionality

3. **Birthday Field**
   - Date picker input
   - Age validation (minimum 18 years old)
   - Display formatted date when not editing

4. **Complete Address Field**
   - Text input for full address
   - Placeholder: "Street, Barangay, City, Province"

#### Implementation Details:
- Added profile picture upload state management
- Added license number input field
- Integrated `documentService` for storage uploads
- Added validation for file size and type
- Updated `handleSave()` to upload both profile picture and license before saving
- Enhanced UI with proper icons (Camera, Calendar, MapPin, Upload, FileText)
- Shows upload progress indicators

### 4. Booking Page Auto-Population
**File:** `src/components/BookingPage.tsx`

#### Changes:
1. **Auto-load User Profile Data**
   - Added `useEffect` hook to load latest user profile on mount
   - Pre-fills: name, email, phone, address, birthday, **license number**

2. **Driver's License Integration**
   - Removed manual license upload from booking flow
   - Now uses license from user profile
   - Shows verification status in Documents step
   - Added link to profile if license not uploaded
   - Shows license number from profile

3. **Documents Step Redesign**
   - Simplified to show driver's license status
   - "View License" button if already uploaded
   - "Go to Profile to Upload" button if missing
   - Clean, status-based UI with badges

4. **Validation Updates**
   - Updated `canProceedToPayment` to check `user?.driver_license_url`
   - Allows proceeding if license exists in profile
   - Shows helpful messages about license status

#### UI Improvements:
- Success badge when license is uploaded
- Warning message when license is missing
- Direct navigation to profile page
- Status indicators in booking summary
- Profile picture shown in user context (if implemented in header)

## User Flow

### First-Time Setup:
1. User goes to Profile page
2. Clicks camera icon on avatar to upload profile picture
3. Clicks "Edit" button
4. Fills in birthday, address, and license number
5. Uploads driver's license document
6. Clicks "Save"
7. All data is stored in database

### Making a Reservation:
1. User selects a motorcycle
2. Clicks "Book Now"
3. **Details Step:** Name, email, phone, address, birthday, and license number are pre-filled
4. User completes rental dates and additional info
5. **Documents Step:** Driver's license status shown (from profile)
6. If license missing, user is prompted to upload in profile
7. **Payment Step:** Continues as normal
8. **Confirmation:** Reservation created with all user details

## Benefits

1. **Better User Experience**
   - Visual profile with custom picture
   - One-time data entry
   - Faster booking process
   - Centralized document management
   - License number auto-filled

2. **Data Consistency**
   - Single source of truth for user information
   - No duplicate license uploads
   - Profile data always up-to-date

3. **Admin Efficiency**
   - All user information in one place
   - Easy verification of documents
   - Complete customer profiles with pictures
   - License numbers readily available

## Technical Notes

### File Upload
- Uses `documentService.uploadFile()` for storage
- Stores in Supabase Storage
- Returns public URL for database storage
- Separate uploads for profile picture and license

### Data Validation
- Birthday: Must be 18+ years old
- Profile picture: JPG/PNG only, max 5MB
- License document: JPG/PNG/PDF, max 5MB
- Address: Complete address required for bookings
- License number: Optional text field

### Database Fields
```sql
-- New columns in users table
birthday DATE                  -- User date of birth
address TEXT                   -- Complete address
driver_license_url TEXT        -- URL to uploaded license in storage
license_number VARCHAR(50)     -- Driver's license number
profile_picture_url TEXT       -- URL to profile picture in storage
```

### State Management
- Profile page manages both picture and license upload state
- Booking page loads user data on mount
- Real-time validation feedback
- Error handling for uploads
- Upload progress indicators

## Testing Checklist

- [ ] Apply database migration in Supabase Dashboard
- [ ] Upload profile picture via camera icon
- [ ] Verify profile picture displays correctly
- [ ] Enter license number and save
- [ ] Upload driver's license in profile
- [ ] Verify birthday field accepts valid dates
- [ ] Enter complete address and save
- [ ] Start a new booking
- [ ] Verify all fields including license number are pre-filled
- [ ] Check Documents step shows license status
- [ ] Complete a booking with pre-filled data
- [ ] Verify reservation includes all user details

## Future Enhancements

Potential improvements:
- Image cropping for profile pictures
- License expiration date validation
- Address autocomplete
- Multiple document types
- Document expiration reminders
- Profile completeness indicator
- License number format validation per region

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify migration was applied successfully
3. Ensure Supabase Storage bucket "documents" exists
4. Check file permissions in Supabase Storage
5. Verify RLS policies allow user uploads
6. Clear browser cache if profile picture doesn't update


## Changes Made

### 1. Database Schema Update
**File:** `supabase/migrations/019_add_user_profile_fields.sql`
- Added `birthday` (DATE) column to users table
- Added `address` (TEXT) column to users table
- Added `driver_license_url` (TEXT) column to users table
- Created index for driver's license lookups

**To Apply Migration:**
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the content from `019_add_user_profile_fields.sql`
4. Run the migration

### 2. Type Definitions Updated
**File:** `src/App.tsx`
- Updated `User` interface to include:
  - `birthday?: string`
  - `address?: string`
  - `driver_license_url?: string`

### 3. Profile Page Enhancements
**File:** `src/components/ProfilePage.tsx`

#### New Features:
1. **Driver's License Upload Section**
   - Upload driver's license (JPG, PNG, PDF)
   - Max file size: 5MB
   - File validation
   - View uploaded license
   - Replace license functionality

2. **Birthday Field**
   - Date picker input
   - Age validation (minimum 18 years old)
   - Display formatted date when not editing

3. **Complete Address Field**
   - Text input for full address
   - Placeholder: "Street, Barangay, City, Province"

#### Implementation Details:
- Added file upload state management
- Integrated `documentService` for storage uploads
- Added validation for file size and type
- Updated `handleSave()` to upload license before saving profile
- Enhanced UI with proper icons (Calendar, MapPin, Upload, FileText)

### 4. Booking Page Auto-Population
**File:** `src/components/BookingPage.tsx`

#### Changes:
1. **Auto-load User Profile Data**
   - Added `useEffect` hook to load latest user profile on mount
   - Pre-fills: name, email, phone, address, birthday

2. **Driver's License Integration**
   - Removed manual license upload from booking flow
   - Now uses license from user profile
   - Shows verification status in Documents step
   - Added link to profile if license not uploaded

3. **Documents Step Redesign**
   - Simplified to show driver's license status
   - "View License" button if already uploaded
   - "Go to Profile to Upload" button if missing
   - Clean, status-based UI with badges

4. **Validation Updates**
   - Updated `canProceedToPayment` to check `user?.driver_license_url`
   - Allows proceeding if license exists in profile
   - Shows helpful messages about license status

#### UI Improvements:
- Success badge when license is uploaded
- Warning message when license is missing
- Direct navigation to profile page
- Status indicators in booking summary

## User Flow

### First-Time Setup:
1. User goes to Profile page
2. Clicks "Edit" button
3. Fills in birthday, address
4. Uploads driver's license
5. Clicks "Save"
6. All data is stored in database

### Making a Reservation:
1. User selects a motorcycle
2. Clicks "Book Now"
3. **Details Step:** Name, email, phone, address, birthday are pre-filled
4. User completes rental dates and additional info
5. **Documents Step:** Driver's license status shown (from profile)
6. If license missing, user is prompted to upload in profile
7. **Payment Step:** Continues as normal
8. **Confirmation:** Reservation created with all user details

## Benefits

1. **Better User Experience**
   - One-time data entry
   - Faster booking process
   - Centralized document management

2. **Data Consistency**
   - Single source of truth for user information
   - No duplicate license uploads
   - Profile data always up-to-date

3. **Admin Efficiency**
   - All user information in one place
   - Easy verification of documents
   - Complete customer profiles

## Technical Notes

### File Upload
- Uses `documentService.uploadFile()` for storage
- Stores in Supabase Storage
- Returns public URL for database storage

### Data Validation
- Birthday: Must be 18+ years old
- File size: Maximum 5MB
- File types: JPG, PNG, PDF only
- Address: Complete address required for bookings

### Database Fields
```sql
-- New columns in users table
birthday DATE              -- User date of birth
address TEXT               -- Complete address
driver_license_url TEXT    -- URL to uploaded license in storage
```

### State Management
- Profile page manages license upload state
- Booking page loads user data on mount
- Real-time validation feedback
- Error handling for uploads

## Testing Checklist

- [ ] Apply database migration in Supabase Dashboard
- [ ] Upload driver's license in profile
- [ ] Verify birthday field accepts valid dates
- [ ] Enter complete address and save
- [ ] Start a new booking
- [ ] Verify all fields are pre-filled
- [ ] Check Documents step shows license status
- [ ] Complete a booking with pre-filled data
- [ ] Verify reservation includes all user details

## Future Enhancements

Potential improvements:
- License expiration date validation
- Address autocomplete
- Multiple document types
- Document expiration reminders
- Profile completeness indicator

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify migration was applied successfully
3. Ensure Supabase Storage bucket "documents" exists
4. Check file permissions in Supabase Storage
5. Verify RLS policies allow user uploads
