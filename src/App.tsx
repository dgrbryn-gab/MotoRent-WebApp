import { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { SignUpPage } from './components/SignUpPage';
import { HomePage } from './components/HomePage';
import { MotorcycleDetailsPage } from './components/MotorcycleDetailsPage';
import { BookingPage } from './components/BookingPage';
import { ReservationsPage } from './components/ReservationsPage';
import { TransactionsPage } from './components/TransactionsPage';
import { ProfilePage } from './components/ProfilePage';
import { SettingsPage } from './components/SettingsPage';
import { Header } from './components/Header';
import { toast } from 'sonner';

// Supabase
import { supabase } from './lib/supabase';
import { motorcycleService } from './services/motorcycleService';
import { authService } from './services/authService';
import { notificationService } from './services/notificationService';

// Admin Components
import { AdminLoginPage } from './components/admin/AdminLoginPage';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminSettings } from './components/admin/AdminSettings';
import { AdminMotorcycles } from './components/admin/AdminMotorcycles';
import { AdminReservations } from './components/admin/AdminReservations';
import { AdminUsers } from './components/admin/AdminUsers';
import { AdminTransactions } from './components/admin/AdminTransactions';
import { AdminGPSTracking } from './components/admin/AdminGPSTracking';
import { AdminSidebar } from './components/admin/AdminSidebar';
import { Toaster } from './components/ui/sonner';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'confirmed' | 'rejected';
  read: boolean;
  timestamp: string;
}

export type Page = 'landing' | 'login' | 'signup' | 'home' | 'details' | 'booking' | 'reservations' | 'transactions' | 'profile' | 'settings' | 'admin-login' | 'admin-dashboard' | 'admin-motorcycles' | 'admin-reservations' | 'admin-users' | 'admin-transactions' | 'admin-gps' | 'admin-settings';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthday?: string;
  address?: string;
  driver_license_url?: string;
  license_number?: string;
  profile_picture_url?: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'super-admin';
  lastLogin: string;
}

export interface DocumentVerification {
  id: string;
  userId: string;
  userName: string;
  documentType: 'driver-license' | 'valid-id';
  documentUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

export interface Motorcycle {
  id: string;
  name: string; // This will be constructed from brand + model
  brand?: string; // New field (optional for backward compatibility)
  model?: string; // New field (optional for backward compatibility)
  type: string;
  engineCapacity: number; // in cc
  transmission: 'Automatic' | 'Manual';
  year: number;
  color: string;
  plateNumber?: string; // New field
  fuelCapacity: number; // in liters
  pricePerDay: number;
  description: string;
  image: string;
  features: string[];
  availability: 'Available' | 'Reserved' | 'In Maintenance';
  rating: number; // out of 5
  reviewCount: number;
  fuelType: 'Gasoline' | 'Electric';
  mileage?: number; // New field (optional)
}

export interface Reservation {
  id: string;
  userId?: string;
  motorcycleId: string;
  motorcycle: Motorcycle;
  startDate: string;
  endDate: string;
  pickupTime?: string;
  returnTime?: string;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  paymentMethod?: 'cash' | 'gcash';
  gcashReferenceNumber?: string;
  gcashProofUrl?: string;
  documents?: {
    type: string;
    status: string;
    fileUrl?: string;
  }[];
  adminNotes?: string;
  license_image_url?: string;
}

export interface Transaction {
  id: string;
  type: 'payment' | 'deposit' | 'refund';
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  description: string;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [selectedMotorcycle, setSelectedMotorcycle] = useState<Motorcycle | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [redirectAfterLogin, setRedirectAfterLogin] = useState<Page | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Local state for admin management (still used by admin components)
  // User-facing components now load directly from Supabase
  const [users, setUsers] = useState<User[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user) return;

    console.log('🔔 Subscribing to notifications for user:', user.id);
    
    const subscription = notificationService.subscribeToUserNotifications(
      user.id,
      (newNotification) => {
        console.log('🔔 New notification received:', newNotification);
        
        // Add to state (will show in notification bell dropdown)
        setNotifications(prev => [newNotification, ...prev]);
        
        // Don't show toast - notifications only appear in the bell icon
      }
    );

    return () => {
      console.log('🔕 Unsubscribing from notifications');
      subscription.unsubscribe();
    };
  }, [user]);

  // Check for existing session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔐 Checking for existing session...');
        
        // Check if there's an existing session
        const currentUser = await authService.getCurrentUser();
        
        if (currentUser) {
          console.log('✅ User session found:', currentUser.email);
          
          // Check if this is an admin user
          const { data: adminData, error } = await supabase
            .from('admin_users')
            .select('*')
            .eq('email', currentUser.email)
            .maybeSingle();
          
          if (adminData && !error) {
            // This is an admin user - restore admin session
            console.log('👨‍💼 Admin session restored:', adminData.email);
            setAdminUser({
              id: adminData.id,
              name: adminData.name,
              email: adminData.email,
              role: adminData.role as 'admin' | 'super-admin',
              lastLogin: adminData.last_login || new Date().toISOString(),
            });
            
            // If on landing/login/signup, redirect to admin dashboard
            if (['landing', 'login', 'signup', 'admin-login'].includes(currentPage)) {
              setCurrentPage('admin-dashboard');
            }
            // Otherwise stay on current admin page (for page refresh)
          } else {
            // Regular user session - restore user
            console.log('👤 Regular user session restored:', currentUser.email);
            setUser({
              id: currentUser.id,
              name: currentUser.name,
              email: currentUser.email,
              phone: currentUser.phone,
            });
            
            // Load notifications for the existing session
            await loadUserNotifications(currentUser.id);
            
            // If we're on landing/login/signup pages, redirect to home
            if (['landing', 'login', 'signup'].includes(currentPage)) {
              setCurrentPage('home');
            }
            // Otherwise stay on current page (for page refresh)
          }
        } else {
          console.log('ℹ️ No active session found');
          // No session - ensure we're on a public page
          if (!['landing', 'login', 'signup', 'admin-login'].includes(currentPage)) {
            setCurrentPage('landing');
          }
        }
      } catch (error) {
        console.error('❌ Session check error:', error);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const unsubscribe = authService.onAuthStateChange(async (authUser) => {
      if (authUser) {
        console.log('🔄 Auth state changed: User logged in');
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setUser({
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            phone: currentUser.phone,
          });
          // Load notifications when auth state changes
          await loadUserNotifications(currentUser.id);
        }
      } else {
        console.log('🔄 Auth state changed: User logged out');
        setUser(null);
        setAdminUser(null);
        if (!['landing', 'login', 'signup', 'admin-login'].includes(currentPage)) {
          setCurrentPage('landing');
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Test Supabase connection on mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('🔌 Testing Supabase connection...');
        const { data, error } = await supabase.from('motorcycles').select('count');
        if (error) throw error;
        console.log('✅ Supabase connected successfully!');
      } catch (error) {
        console.error('❌ Supabase connection error:', error);
        toast.error('Failed to connect to Supabase. Check console.');
      }
    };
    testConnection();
  }, []);

  const navigate = (page: Page) => {
    setCurrentPage(page);
    
    // No automatic toast notifications when navigating
  };

  const login = async (userData: User) => {
    setUser(userData);
    setIsGuest(false);
    
    // Add user to users list if not already there
    if (!users.find(u => u.email === userData.email)) {
      addUser(userData);
    }
    
    // Load user notifications from database
    await loadUserNotifications(userData.id);
    
    // Check if there's a pending redirect after login
    if (redirectAfterLogin) {
      const targetPage = redirectAfterLogin;
      setRedirectAfterLogin(null); // Clear the redirect target
      navigate(targetPage);
      
      // Don't show toast notifications - they appear in the bell icon
    } else {
      navigate('home');
      
      // Don't show toast notifications - they appear in the bell icon
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      setIsGuest(false);
      setNotifications([]); // Clear notifications on logout
      setRedirectAfterLogin(null); // Clear any pending redirects
      setCurrentPage('landing');
      // Sign out from Supabase to clear the session
      await authService.signOut();
    } catch (error) {
      console.error('Logout error:', error);
      // Still navigate even if signout fails
      setCurrentPage('landing');
    }
  };

  const adminLogin = (adminData: AdminUser) => {
    setAdminUser(adminData);
    navigate('admin-dashboard');
  };

  const adminLogout = async () => {
    try {
      // Clear admin state first
      setAdminUser(null);
      // Navigate to landing before signout to prevent white screen
      setCurrentPage('landing');
      // Sign out from Supabase to clear the session
      await authService.signOut();
    } catch (error) {
      console.error('Logout error:', error);
      // Still navigate even if signout fails
      setCurrentPage('landing');
    }
  };

  const continueAsGuest = () => {
    setIsGuest(true);
    navigate('home');
  };

  const selectMotorcycle = (motorcycle: Motorcycle) => {
    setSelectedMotorcycle(motorcycle);
    navigate('details');
  };

  const initiateReservation = (motorcycle: Motorcycle) => {
    setSelectedMotorcycle(motorcycle);
    setRedirectAfterLogin('booking'); // Set the redirect target
    navigate('login'); // Navigate to login page
  };

  const addReservation = (reservation: Reservation) => {
    setReservations(prev => [...prev, reservation]);
  };

  const addTransaction = (transaction: Transaction) => {
    setTransactions(prev => [...prev, transaction]);
  };

  const cancelReservation = (reservationId: string) => {
    setReservations(prev => 
      prev.map(r => 
        r.id === reservationId 
          ? { ...r, status: 'cancelled' as const }
          : r
      )
    );
  };

  // Motorcycle management functions (for admin only - will be refactored to use Supabase services)
  const [motorcycles, setMotorcycles] = useState<Motorcycle[]>([]);
  
  const addMotorcycle = (motorcycle: Motorcycle) => {
    setMotorcycles(prev => [...prev, motorcycle]);
  };

  const updateMotorcycle = (id: string, updatedMotorcycle: Motorcycle) => {
    setMotorcycles(prev => prev.map(m => m.id === id ? updatedMotorcycle : m));
  };

  const deleteMotorcycle = (id: string) => {
    setMotorcycles(prev => prev.filter(m => m.id !== id));
  };

  // User management functions
  const addUser = (newUser: User) => {
    setUsers(prev => [...prev, newUser]);
  };

  const updateUser = (id: string, updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === id ? updatedUser : u));
    // If updating the current user, also update the user state
    if (user && user.id === id) {
      setUser(updatedUser);
    }
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  // Update current user profile (updates both user state and users array)
  const updateCurrentUserProfile = (updatedUser: User) => {
    setUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  // Notification management
  const addNotification = (notification: Notification) => {
    setNotifications(prev => [...prev, notification]);
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    if (!user) return;
    try {
      await notificationService.markAllAsRead(user.id);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const clearAllNotifications = async () => {
    if (!user) return;
    try {
      await notificationService.clearAllNotifications(user.id);
      setNotifications([]);
      toast.success('All notifications cleared');
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
      toast.error('Failed to clear notifications');
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    markNotificationAsRead(notification.id);
    // Navigate to reservations page
    navigate('reservations');
  };

  // Load notifications when user logs in
  const loadUserNotifications = async (userId: string) => {
    try {
      console.log('📬 Loading notifications for user:', userId);
      const userNotifs = await notificationService.getUserNotifications(userId);
      console.log(`📬 Loaded ${userNotifs?.length || 0} notifications:`, userNotifs);
      setNotifications(userNotifs || []);
    } catch (error) {
      console.error('❌ Failed to load notifications:', error);
    }
  };

  // Note: showUnreadNotifications function removed - notifications only show in bell icon
  // Users can click the bell to see all their notifications

  // Check for unread notifications on mount and when notifications change
  // Removed auto-toast display - notifications only visible in bell dropdown
  useEffect(() => {
    // No automatic toast notifications
  }, [notifications.length]);

  const showHeader = currentPage !== 'landing' && currentPage !== 'login' && currentPage !== 'signup' && currentPage !== 'admin-login';
  const showAdminSidebar = currentPage.startsWith('admin-') && currentPage !== 'admin-login';
  const isAdminSide = currentPage.startsWith('admin-');

  return (
    <div className="min-h-screen bg-background">
      {showHeader && !isAdminSide && (
        <Header 
          user={user} 
          isGuest={isGuest}
          currentPage={currentPage}
          navigate={navigate} 
          logout={logout}
          hideSearchBar={currentPage === 'booking'}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          notifications={notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())}
          onNotificationClick={handleNotificationClick}
          onMarkAllRead={markAllNotificationsAsRead}
          onClearAll={clearAllNotifications}
        />
      )}
      
      {showAdminSidebar ? (
        <div className="flex min-h-screen">
          <AdminSidebar 
            adminUser={adminUser!}
            currentPage={currentPage}
            navigate={navigate}
            logout={adminLogout}
          />
          
          <main className="flex-1 min-w-0 pt-16 lg:pt-0 lg:pl-4">
            {/* Admin Routes */}
            {currentPage === 'admin-dashboard' && adminUser && (
              <AdminDashboard 
                navigate={navigate}
              />
            )}

            {currentPage === 'admin-motorcycles' && adminUser && (
              <AdminMotorcycles />
            )}

            {currentPage === 'admin-reservations' && adminUser && (
              <AdminReservations />
            )}

            {currentPage === 'admin-users' && adminUser && (
              <AdminUsers users={users} />
            )}

            {currentPage === 'admin-transactions' && adminUser && (
              <AdminTransactions />
            )}

            {currentPage === 'admin-gps' && adminUser && (
              <AdminGPSTracking />
            )}

            {currentPage === 'admin-settings' && adminUser && (
              <AdminSettings adminUser={adminUser} />
            )}
          </main>
        </div>
      ) : (
        <main className={showHeader && !isAdminSide ? 'pt-16' : ''}>
        {currentPage === 'landing' && (
          <LandingPage 
            navigate={navigate} 
            continueAsGuest={continueAsGuest}
            initiateReservation={initiateReservation}
            user={user}
            isGuest={isGuest}
          />
        )}
        
        {currentPage === 'login' && (
          <LoginPage 
            navigate={navigate} 
            login={login}
            adminLogin={adminLogin}
          />
        )}
        
        {currentPage === 'signup' && (
          <SignUpPage 
            navigate={navigate} 
            login={login} 
          />
        )}
        
        {currentPage === 'home' && (
          <HomePage 
            selectMotorcycle={selectMotorcycle}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        )}
        
        {currentPage === 'details' && selectedMotorcycle && (
          <MotorcycleDetailsPage 
            motorcycle={selectedMotorcycle}
            navigate={navigate}
            user={user}
            isGuest={isGuest}
            initiateReservation={initiateReservation}
          />
        )}
        
        {currentPage === 'booking' && selectedMotorcycle && (
          <BookingPage 
            motorcycle={selectedMotorcycle}
            navigate={navigate}
            user={user}
            addReservation={addReservation}
            addTransaction={addTransaction}
          />
        )}
        
        {currentPage === 'reservations' && (
          <ReservationsPage 
            user={user}
          />
        )}
        
        {currentPage === 'transactions' && (
          <TransactionsPage 
            transactions={transactions}
          />
        )}
        
        {currentPage === 'profile' && user && (
          <ProfilePage 
            user={user}
            setUser={updateCurrentUserProfile}
            logout={logout}
          />
        )}

        {currentPage === 'settings' && user && (
          <SettingsPage
            user={user}
            setUser={updateCurrentUserProfile}
            logout={logout}
          />
        )}

          {/* Admin Login Route (outside the sidebar layout) */}
          {currentPage === 'admin-login' && (
            <AdminLoginPage 
              navigate={navigate}
              adminLogin={adminLogin}
            />
          )}
        </main>
      )}
      <Toaster richColors />
    </div>
  );
}