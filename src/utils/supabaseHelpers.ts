import type { Database } from '../lib/database.types';

type DbMotorcycle = Database['public']['Tables']['motorcycles']['Row'];
type DbReservation = Database['public']['Tables']['reservations']['Row'];
type DbTransaction = Database['public']['Tables']['transactions']['Row'];
type DbNotification = Database['public']['Tables']['notifications']['Row'];
type DbUser = Database['public']['Tables']['users']['Row'];

// Transform database motorcycle to app format (snake_case → camelCase)
export function transformMotorcycle(dbMotorcycle: DbMotorcycle) {
  return {
    id: dbMotorcycle.id,
    name: dbMotorcycle.name,
    brand: dbMotorcycle.brand,
    model: dbMotorcycle.model,
    type: dbMotorcycle.type,
    engineCapacity: dbMotorcycle.engine_capacity,
    transmission: dbMotorcycle.transmission,
    year: dbMotorcycle.year,
    color: dbMotorcycle.color,
    plateNumber: dbMotorcycle.plate_number,
    fuelCapacity: dbMotorcycle.fuel_capacity,
    pricePerDay: dbMotorcycle.price_per_day,
    description: dbMotorcycle.description,
    image: dbMotorcycle.image,
    features: dbMotorcycle.features,
    availability: dbMotorcycle.availability,
    rating: dbMotorcycle.rating,
    reviewCount: dbMotorcycle.review_count,
    fuelType: dbMotorcycle.fuel_type,
    mileage: dbMotorcycle.mileage
  };
}

// Transform database reservation to app format
export function transformReservation(dbReservation: any) {
  return {
    id: dbReservation.id,
    userId: dbReservation.user_id,
    motorcycleId: dbReservation.motorcycle_id,
    motorcycle: dbReservation.motorcycle ? transformMotorcycle(dbReservation.motorcycle) : undefined,
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
    adminNotes: dbReservation.admin_notes,
    license_image_url: dbReservation.license_image_url
  };
}

// Transform app motorcycle to database format (camelCase → snake_case)
export function toDbMotorcycle(motorcycle: any) {
  return {
    id: motorcycle.id,
    name: motorcycle.name,
    brand: motorcycle.brand,
    model: motorcycle.model,
    type: motorcycle.type,
    engine_capacity: motorcycle.engineCapacity,
    transmission: motorcycle.transmission,
    year: motorcycle.year,
    color: motorcycle.color,
    plate_number: motorcycle.plateNumber,
    fuel_capacity: motorcycle.fuelCapacity,
    price_per_day: motorcycle.pricePerDay,
    description: motorcycle.description,
    image: motorcycle.image,
    features: motorcycle.features,
    availability: motorcycle.availability,
    rating: motorcycle.rating,
    review_count: motorcycle.reviewCount,
    fuel_type: motorcycle.fuelType,
    mileage: motorcycle.mileage
  };
}

// Transform app reservation to database format
export function toDbReservation(reservation: any) {
  return {
    user_id: reservation.userId,
    motorcycle_id: reservation.motorcycleId,
    start_date: reservation.startDate,
    end_date: reservation.endDate,
    pickup_time: reservation.pickupTime,
    return_time: reservation.returnTime,
    total_price: reservation.totalPrice,
    status: reservation.status,
    customer_name: reservation.customerName,
    customer_email: reservation.customerEmail,
    customer_phone: reservation.customerPhone,
    payment_method: reservation.paymentMethod,
    gcash_reference_number: reservation.gcashReferenceNumber,
    gcash_proof_url: reservation.gcashProofUrl,
    admin_notes: reservation.adminNotes
  };
}

// Transform database transaction to app format
export function transformTransaction(dbTransaction: DbTransaction) {
  return {
    id: dbTransaction.id,
    type: dbTransaction.type,
    amount: dbTransaction.amount,
    date: dbTransaction.date,
    status: dbTransaction.status,
    description: dbTransaction.description
  };
}

// Transform database notification to app format
export function transformNotification(dbNotification: DbNotification) {
  return {
    id: dbNotification.id,
    type: dbNotification.type,
    reservationId: dbNotification.reservation_id,
    motorcycleName: dbNotification.motorcycle_name,
    message: dbNotification.message,
    timestamp: dbNotification.timestamp,
    read: dbNotification.read
  };
}

// Transform database user to app format
export function transformUser(dbUser: DbUser) {
  return {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    phone: dbUser.phone
  };
}

// Error handling helper
export function handleSupabaseError(error: any): string {
  console.error('Supabase error:', error);
  
  // JWT/Auth errors
  if (error.message?.includes('JWT') || error.message?.includes('jwt')) {
    return 'Session expired. Please log in again.';
  }
  
  // Unique constraint violation
  if (error.code === '23505') {
    return 'This record already exists.';
  }
  
  // Foreign key violation
  if (error.code === '23503') {
    return 'Cannot delete: this record is referenced elsewhere.';
  }
  
  // Not found
  if (error.code === 'PGRST116') {
    return 'Record not found.';
  }
  
  // Permission denied
  if (error.message?.includes('permission denied') || error.message?.includes('RLS')) {
    return 'You do not have permission to perform this action.';
  }
  
  // Network errors
  if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
    return 'Network error. Please check your connection.';
  }
  
  // Generic error
  return error.message || 'An unexpected error occurred.';
}

// Batch transform multiple motorcycles
export function transformMotorcycles(dbMotorcycles: DbMotorcycle[]) {
  return dbMotorcycles.map(transformMotorcycle);
}

// Batch transform multiple reservations
export function transformReservations(dbReservations: any[]) {
  return dbReservations.map(transformReservation);
}

// Batch transform multiple transactions
export function transformTransactions(dbTransactions: DbTransaction[]) {
  return dbTransactions.map(transformTransaction);
}

// Batch transform multiple notifications
export function transformNotifications(dbNotifications: DbNotification[]) {
  return dbNotifications.map(transformNotification);
}

// Batch transform multiple users
export function transformUsers(dbUsers: DbUser[]) {
  return dbUsers.map(transformUser);
}

// Format date for database
export function formatDateForDb(date: Date | string): string {
  if (typeof date === 'string') {
    return date;
  }
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

// Format datetime for database
export function formatDateTimeForDb(date: Date | string): string {
  if (typeof date === 'string') {
    return date;
  }
  return date.toISOString(); // ISO 8601 format
}

// Calculate days between dates
export function daysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = end.getTime() - start.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate phone format (Philippines)
export function isValidPhoneNumber(phone: string): boolean {
  // Matches formats: 09123456789, +639123456789, 9123456789
  const phoneRegex = /^(\+63|0)?9\d{9}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
}

// Format currency (PHP)
export function formatCurrency(amount: number): string {
  return `₱${amount.toLocaleString('en-PH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`;
}

// Format date for display
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Format datetime for display
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Generate unique ID (for optimistic updates)
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Check if date range is valid
export function isValidDateRange(startDate: string, endDate: string): boolean {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return end >= start;
}

// Check if date is in the past
export function isDateInPast(date: string): boolean {
  const dateObj = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dateObj < today;
}

// Get status color for badges
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-warning/10 text-warning border-warning/20',
    confirmed: 'bg-success/10 text-success border-success/20',
    completed: 'bg-info/10 text-info border-info/20',
    cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
    failed: 'bg-destructive/10 text-destructive border-destructive/20'
  };
  return colors[status.toLowerCase()] || 'bg-secondary text-secondary-foreground';
}

// Truncate text with ellipsis
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}
