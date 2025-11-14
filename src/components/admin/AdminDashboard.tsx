import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  Bike, 
  Calendar, 
  Users, 
  DollarSign, 
  TrendingUp, 
  FileCheck,
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  Navigation,
  Loader2
} from 'lucide-react';
import { Page } from '../../App';
import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { toast } from 'sonner';

interface AdminDashboardProps {
  navigate?: (page: Page) => void;
}

interface DashboardStats {
  motorcycles: {
    total: number;
    available: number;
    reserved: number;
    maintenance: number;
  };
  reservations: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    recent: Array<{
      id: string;
      status: string;
      startDate: string;
      endDate: string;
      motorcycleName: string;
      totalPrice: number;
    }>;
  };
  users: {
    total: number;
  };
  revenue: {
    total: number;
    deposits: number;
    refunds: number;
    paymentCount: number;
  };
}

export function AdminDashboard({ navigate }: AdminDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const data = await adminService.getDashboardStats();
      setStats(data);
    } catch (error: any) {
      console.error('Error loading dashboard stats:', error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 lg:p-8">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-warning mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Failed to Load Dashboard</h3>
            <p className="text-muted-foreground mb-4">Unable to fetch dashboard statistics.</p>
            <Button onClick={loadDashboardStats}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Destructure stats for easier access
  const { motorcycles, reservations, users, revenue } = stats;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of MotoRent Dumaguete operations and key metrics
        </p>
      </div>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate?.('admin-motorcycles')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Motorcycles</CardTitle>
              <Bike className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{motorcycles.total}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <Badge variant="secondary" className="text-xs">{motorcycles.available} Available</Badge>
                {motorcycles.maintenance > 0 && (
                  <Badge variant="outline" className="text-xs">{motorcycles.maintenance} Maintenance</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate?.('admin-reservations')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Reservations</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reservations.total}</div>
              <div className="flex items-center gap-1 text-xs text-success mt-1">
                <CheckCircle className="h-3 w-3" />
                <span>{reservations.confirmed} active</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.total}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <span>Registered customers</span>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate?.('admin-transactions')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₱{revenue.total.toLocaleString()}</div>
              <div className="flex items-center gap-1 text-xs text-success mt-1">
                <TrendingUp className="h-3 w-3" />
                <span>From {revenue.paymentCount} payments</span>
              </div>
            </CardContent>
          </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GPS Tracking Quick View */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate?.('admin-gps')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              GPS Tracking
            </CardTitle>
            <CardDescription>Real-time fleet monitoring</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-success/10 border border-success/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-success rounded-full flex items-center justify-center">
                  <Navigation className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Active Rentals</p>
                  <p className="text-sm text-muted-foreground">Currently on the road</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-success">{reservations.confirmed}</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Available Units</span>
                <span className="font-medium">{motorcycles.available}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">In Maintenance</span>
                <span className="font-medium">{motorcycles.maintenance}</span>
              </div>
            </div>            <Button className="w-full" variant="outline" onClick={(e: React.MouseEvent) => { e.stopPropagation(); navigate?.('admin-gps'); }}>
              View GPS Dashboard
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest reservations and updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {reservations.recent.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No reservations yet</p>
              </div>
            ) : (
              <>
                {reservations.recent.map((reservation) => (
                  <div key={reservation.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`w-2 h-2 rounded-full ${
                      reservation.status === 'confirmed' ? 'bg-success' :
                      reservation.status === 'cancelled' ? 'bg-destructive' :
                      'bg-info'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{reservation.motorcycleName}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(reservation.startDate).toLocaleDateString()} - {new Date(reservation.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={
                      reservation.status === 'confirmed' ? 'default' :
                      reservation.status === 'cancelled' ? 'destructive' :
                      'secondary'
                    } className="text-xs">
                      {reservation.status}
                    </Badge>
                  </div>
                ))}
                {reservations.total > 5 && (
                  <Button 
                    variant="ghost" 
                    className="w-full"
                    onClick={() => navigate?.('admin-reservations')}
                  >
                    View All Reservations ({reservations.total})
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => navigate?.('admin-motorcycles')}
            >
              <Bike className="w-5 h-5" />
              <span className="text-xs">Add Motorcycle</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => navigate?.('admin-reservations')}
            >
              <Calendar className="w-5 h-5" />
              <span className="text-xs">View Reservations</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => navigate?.('admin-gps')}
            >
              <MapPin className="w-5 h-5" />
              <span className="text-xs">GPS Tracking</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
