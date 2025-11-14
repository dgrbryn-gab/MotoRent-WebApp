import { useState, useEffect } from 'react';
import { User, Mail, Phone, FileText, Calendar, MapPin, RefreshCw, TrendingUp, DollarSign, Shield } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { userService } from '../services/userService';
import { reservationService } from '../services/reservationService';
import { transactionService } from '../services/transactionService';
import { toast } from 'sonner';
import type { User as UserType } from '../App';

interface ProfilePageProps {
  user: UserType;
  setUser: (user: UserType) => void;
  logout: () => void;
}

export function ProfilePage({ user, setUser, logout }: ProfilePageProps) {
  const [loading, setLoading] = useState(true);
  
  // Statistics
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalSpent: 0,
  });

  // Load user's statistics
  useEffect(() => {
    loadStatistics();
    loadLatestUserData();
  }, [user.id]);

  const loadLatestUserData = async () => {
    try {
      console.log('🔄 Fetching latest user data from database for user:', user.id);
      const latestUserData = await userService.getUserById(user.id);
      console.log('📥 Received user data from database:', latestUserData);
      
      if (latestUserData) {
        console.log('Profile picture URL from DB:', latestUserData.profile_picture_url);
        console.log('Driver license URL from DB:', latestUserData.driver_license_url);
        
        const updatedUser = {
          id: latestUserData.id,
          name: latestUserData.name,
          email: latestUserData.email,
          phone: latestUserData.phone,
          birthday: latestUserData.birthday,
          address: latestUserData.address,
          driver_license_url: latestUserData.driver_license_url,
          license_number: latestUserData.license_number,
          profile_picture_url: latestUserData.profile_picture_url,
        };
        
        console.log('✅ Updating state with synced data:', updatedUser);
        setUser(updatedUser);
      }
    } catch (error) {
      console.error('❌ Failed to load latest user data:', error);
    }
  };

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const reservations = await reservationService.getUserReservations(user.id);
      const totalBookings = reservations?.length || 0;
      
      const transactions = await transactionService.getUserTransactions(user.id);
      const totalSpent = transactions
        ?.filter((t: any) => t.type === 'payment' && t.status === 'completed')
        .reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;
      
      setStats({ totalBookings, totalSpent });
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="container mx-auto px-4 py-8 page-transition">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold text-primary mb-2">Profile</h1>
            <p className="text-muted-foreground font-body">View your account information</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              console.log('🔄 Manual refresh triggered');
              loadLatestUserData();
              toast.info('Refreshing profile data...');
            }}
            className="btn-hover"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync
          </Button>
        </div>

        {/* Profile Header with Avatar */}
        <Card className="card-hover">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Avatar className="w-20 h-20">
                {user.profile_picture_url ? (
                  <>
                    <AvatarImage 
                      src={user.profile_picture_url} 
                      alt={user.name}
                      onLoad={() => {
                        console.log('✅ Profile picture loaded successfully:', user.profile_picture_url);
                      }}
                      onError={(e) => {
                        console.error('❌ Failed to load profile picture:', user.profile_picture_url);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <AvatarFallback className="bg-primary text-white text-xl">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </>
                ) : (
                  <AvatarFallback className="bg-primary text-white text-xl">
                    {getInitials(user.name)}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="text-center sm:text-left">
                <h2 className="text-2xl font-heading font-bold">{user.name}</h2>
                <p className="text-muted-foreground font-body">{user.email}</p>
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-success/10 text-success rounded-full text-sm font-medium">
                  <Shield className="w-4 h-4" />
                  <span>Active Account</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="card-hover">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-body text-muted-foreground">Total Bookings</p>
                  <p className="text-3xl font-heading font-bold text-primary">{stats.totalBookings}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-body text-muted-foreground">Total Spent</p>
                  <p className="text-3xl font-heading font-bold text-accent">₱{stats.totalSpent.toLocaleString()}</p>
                </div>
                <DollarSign className="w-8 h-8 text-accent opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Personal Information */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="font-heading">Personal Information</CardTitle>
            <CardDescription className="font-body">Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground font-body">
                  <User className="w-4 h-4 mr-2" />
                  Full Name
                </div>
                <div className="p-3 bg-muted rounded-md font-body">
                  {user.name}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground font-body">
                  <Mail className="w-4 h-4 mr-2" />
                  Email Address
                </div>
                <div className="p-3 bg-muted rounded-md font-body">
                  {user.email}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground font-body">
                  <Phone className="w-4 h-4 mr-2" />
                  Phone Number
                </div>
                <div className="p-3 bg-muted rounded-md font-body">
                  {user.phone}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground font-body">
                  <Calendar className="w-4 h-4 mr-2" />
                  Date of Birth
                </div>
                <div className="p-3 bg-muted rounded-md font-body">
                  {user.birthday ? new Date(user.birthday).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not set'}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground font-body">
                  <MapPin className="w-4 h-4 mr-2" />
                  Complete Address
                </div>
                <div className="p-3 bg-muted rounded-md font-body">
                  {user.address || 'Not set'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Driver's License */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center font-heading">
              <FileText className="w-5 h-5 mr-2" />
              Driver's License
            </CardTitle>
            <CardDescription className="font-body">Your license information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground font-body">License Number</div>
              <div className="p-3 bg-muted rounded-md font-mono">
                {user.license_number || 'Not set'}
              </div>
            </div>

            {user.driver_license_url && (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground font-body">License Document</div>
                <div className="p-3 bg-success/10 border border-success/20 rounded-md space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-success" />
                      <span className="text-sm font-medium font-body">Driver's License Uploaded</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.open(user.driver_license_url, '_blank', 'noopener,noreferrer');
                      }}
                      type="button"
                      className="btn-hover"
                    >
                      View Document
                    </Button>
                  </div>
                  <div className="w-full rounded-lg overflow-hidden border border-border bg-background">
                    <img 
                      src={user.driver_license_url} 
                      alt="Driver's License"
                      className="w-full h-auto object-contain"
                      onError={(e) => {
                        console.error('Failed to load license image:', user.driver_license_url);
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="p-8 text-center text-muted-foreground"><p>Preview not available. Click "View Document" to open.</p></div>';
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {!user.driver_license_url && (
              <div className="p-3 bg-muted rounded-md text-center text-muted-foreground font-body">
                No license document uploaded
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
