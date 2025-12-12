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
  Loader2,
  BarChart3,
  Percent,
  Activity,
  Award
} from 'lucide-react';

import { Page } from '../../App';
import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';

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

// For chart data
type MonthlyData = { month: string; revenue: number }[];
type ReservationStatusData = { name: string; value: number }[];
type MotorcycleUsageData = { name: string; value: number }[];
type UserGrowthData = { month: string; users: number }[];
type DailyReservationData = { date: string; count: number }[];
type TopMotorcycleData = { name: string; value: number }[];

export function AdminDashboard({ navigate }: AdminDashboardProps) {

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyData>([]);
  const [userGrowth, setUserGrowth] = useState<UserGrowthData>([]);
  const [topMotorcycles, setTopMotorcycles] = useState<TopMotorcycleData>([]);
  const [dailyReservations, setDailyReservations] = useState<DailyReservationData>([]);
  const [utilization, setUtilization] = useState({ utilization: 0, inUse: 0, available: 0, total: 0 });
  const [paymentSuccess, setPaymentSuccess] = useState({ successRate: 0, completed: 0, total: 0 });
  const [avgReservationValue, setAvgReservationValue] = useState(0);
  const [repeatCustomer, setRepeatCustomer] = useState({ rate: 0, repeatCustomers: 0, totalCustomers: 0 });
  const [revenueBreakdown, setRevenueBreakdown] = useState({ today: 0, week: 0, month: 0 });


  useEffect(() => {
    loadDashboardStats();
    loadMonthlyRevenue();
    loadUserGrowth();
    loadTopMotorcycles();
    loadDailyReservations();
    loadUtilization();
    loadPaymentSuccess();
    loadAvgReservationValue();
    loadRepeatCustomer();
    loadRevenueBreakdown();
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

  const loadMonthlyRevenue = async () => {
    try {
      const data = await adminService.getMonthlyRevenue(6);
      // Convert to array for recharts
      const arr: MonthlyData = Object.entries(data).map(([month, revenue]) => ({ month, revenue }));
      setMonthlyRevenue(arr.reverse());
    } catch (error) {
      setMonthlyRevenue([]);
    }
  };

  // Simulate user growth for now (should be replaced with real API)
  const loadUserGrowth = async () => {
    if (!stats) return;
    // Fake: last 6 months, linear growth
    const now = new Date();
    const arr: UserGrowthData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      arr.push({ month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, users: Math.floor(stats.users.total * ((6 - i) / 6)) });
    }
    setUserGrowth(arr);
  };

  const loadTopMotorcycles = async () => {
    try {
      const data = await adminService.getTopMotorcyclesByRentals(5);
      setTopMotorcycles(data);
    } catch (error) {
      console.error('Error loading top motorcycles:', error);
    }
  };

  const loadDailyReservations = async () => {
    try {
      const data = await adminService.getDailyReservationTrend(30);
      setDailyReservations(data);
    } catch (error) {
      console.error('Error loading daily reservations:', error);
    }
  };

  const loadUtilization = async () => {
    try {
      const data = await adminService.getMotorcycleUtilization();
      setUtilization(data);
    } catch (error) {
      console.error('Error loading utilization:', error);
    }
  };

  const loadPaymentSuccess = async () => {
    try {
      const data = await adminService.getPaymentSuccessRate();
      setPaymentSuccess(data);
    } catch (error) {
      console.error('Error loading payment success:', error);
    }
  };

  const loadAvgReservationValue = async () => {
    try {
      const data = await adminService.getAverageReservationValue();
      setAvgReservationValue(data);
    } catch (error) {
      console.error('Error loading avg reservation:', error);
    }
  };

  const loadRepeatCustomer = async () => {
    try {
      const data = await adminService.getRepeatCustomerRate();
      setRepeatCustomer(data);
    } catch (error) {
      console.error('Error loading repeat customer:', error);
    }
  };

  const loadRevenueBreakdown = async () => {
    try {
      const data = await adminService.getRevenueBreakdown();
      setRevenueBreakdown(data);
    } catch (error) {
      console.error('Error loading revenue breakdown:', error);
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

  // Prepare chart data
  const reservationStatusData: ReservationStatusData = [
    { name: 'Pending', value: reservations.pending },
    { name: 'Confirmed', value: reservations.confirmed },
    { name: 'Completed', value: reservations.completed },
    { name: 'Cancelled', value: reservations.cancelled },
  ];
  const motorcycleUsageData: MotorcycleUsageData = [
    { name: 'Available', value: motorcycles.available },
    { name: 'Reserved', value: motorcycles.reserved },
    { name: 'Maintenance', value: motorcycles.maintenance },
  ];

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

      {/* Dashboard Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend (6 months)</CardTitle>
            <CardDescription>Monthly completed payments</CardDescription>
          </CardHeader>
          <CardContent style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyRevenue} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        {/* Reservation Status Pie */}
        <Card>
          <CardHeader>
            <CardTitle>Reservation Status Breakdown</CardTitle>
            <CardDescription>Current reservations by status</CardDescription>
          </CardHeader>
          <CardContent style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={reservationStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {reservationStatusData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={["#8884d8", "#82ca9d", "#ffc658", "#ff6b6b"][idx % 4]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        {/* Motorcycle Usage Bar */}
        <Card>
          <CardHeader>
            <CardTitle>Motorcycle Usage</CardTitle>
            <CardDescription>Current fleet status</CardDescription>
          </CardHeader>
          <CardContent style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={motorcycleUsageData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        {/* User Growth Line (simulated) */}
        <Card>
          <CardHeader>
            <CardTitle>User Growth (Simulated)</CardTitle>
            <CardDescription>Registered users over 6 months</CardDescription>
          </CardHeader>
          <CardContent style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={userGrowth} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="users" stroke="#82ca9d" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      {/* End Dashboard Graphs */}

      {/* Advanced KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Fleet Utilization</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{utilization.utilization}%</div>
            <p className="text-xs text-muted-foreground mt-1">{utilization.inUse} of {utilization.total} in use</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Payment Success Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{paymentSuccess.successRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">{paymentSuccess.completed} of {paymentSuccess.total} payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Reservation Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{avgReservationValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Per completed rental</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Repeat Customers</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{repeatCustomer.rate}%</div>
            <p className="text-xs text-muted-foreground mt-1">{repeatCustomer.repeatCustomers} repeat of {repeatCustomer.totalCustomers}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">This Month Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{revenueBreakdown.month.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Today: ₱{revenueBreakdown.today}</p>
          </CardContent>
        </Card>
      </div>

      {/* Extended Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Reservations Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Reservations (30 days)</CardTitle>
            <CardDescription>Booking activity over time</CardDescription>
          </CardHeader>
          <CardContent style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyReservations} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#ffc658" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Motorcycles by Rental */}
        <Card>
          <CardHeader>
            <CardTitle>Top Motorcycles by Rentals</CardTitle>
            <CardDescription>Most popular units</CardDescription>
          </CardHeader>
          <CardContent style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topMotorcycles} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Views */}
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
