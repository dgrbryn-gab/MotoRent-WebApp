import { useState } from 'react';
import { MapPin, Navigation, Clock, Fuel, Battery, AlertTriangle, Activity, Filter, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface MotorcycleLocation {
  id: string;
  name: string;
  plateNumber: string;
  status: 'active' | 'idle' | 'maintenance' | 'offline';
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  speed: number; // km/h
  fuel: number; // percentage
  battery: number; // percentage
  lastUpdate: string;
  rider: {
    name: string;
    contact: string;
  } | null;
  reservationId?: string;
}

export function AdminGPSTracking() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedMotorcycle, setSelectedMotorcycle] = useState<MotorcycleLocation | null>(null);
  const [motorcycleLocations, setMotorcycleLocations] = useState<MotorcycleLocation[]>([]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success text-success-foreground';
      case 'idle':
        return 'bg-warning text-warning-foreground';
      case 'maintenance':
        return 'bg-info text-info-foreground';
      case 'offline':
        return 'bg-error text-error-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getFuelColor = (fuel: number) => {
    if (fuel > 50) return 'text-success';
    if (fuel > 20) return 'text-warning';
    return 'text-error';
  };

  const filteredMotorcycles = motorcycleLocations.filter(motorcycle => {
    const matchesSearch = motorcycle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         motorcycle.plateNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || motorcycle.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: motorcycleLocations.length,
    active: motorcycleLocations.filter(m => m.status === 'active').length,
    idle: motorcycleLocations.filter(m => m.status === 'idle').length,
    maintenance: motorcycleLocations.filter(m => m.status === 'maintenance').length,
    offline: motorcycleLocations.filter(m => m.status === 'offline').length
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
          GPS Tracking
        </h1>
        <p className="text-muted-foreground">
          Real-time location monitoring of all motorcycles
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Fleet</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <MapPin className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-success">{stats.active}</p>
              </div>
              <Activity className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Idle</p>
                <p className="text-2xl font-bold text-warning">{stats.idle}</p>
              </div>
              <Clock className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Maintenance</p>
                <p className="text-2xl font-bold text-info">{stats.maintenance}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-info" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Offline</p>
                <p className="text-2xl font-bold text-error">{stats.offline}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-error" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or plate number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="idle">Idle</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map View */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Live Map</CardTitle>
              <CardDescription>Real-time location of all motorcycles</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Placeholder for map integration */}
              <div className="bg-muted rounded-lg h-[600px] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5"></div>
                <div className="relative z-10 text-center p-6">
                  <MapPin className="w-16 h-16 text-primary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Map Integration</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Integrate with Google Maps, Mapbox, or OpenStreetMap API to display real-time motorcycle locations
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Motorcycle List */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Fleet Status</CardTitle>
              <CardDescription>{filteredMotorcycles.length} motorcycles</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto">
                {filteredMotorcycles.length > 0 ? (
                  filteredMotorcycles.map((motorcycle) => (
                    <div
                      key={motorcycle.id}
                      className={`p-4 border-b border-border hover:bg-muted/50 cursor-pointer transition-colors ${
                        selectedMotorcycle?.id === motorcycle.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => setSelectedMotorcycle(motorcycle)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">{motorcycle.name}</h4>
                          <p className="text-xs text-muted-foreground">{motorcycle.plateNumber}</p>
                        </div>
                        <Badge className={getStatusColor(motorcycle.status)}>
                          {motorcycle.status}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span className="line-clamp-1">{motorcycle.location.address}</span>
                        </div>

                        {motorcycle.rider && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-medium">{motorcycle.rider.name}</span>
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="flex items-center gap-1">
                            <Navigation className="w-3 h-3" />
                            <span>{motorcycle.speed} km/h</span>
                          </div>
                          <div className={`flex items-center gap-1 ${getFuelColor(motorcycle.fuel)}`}>
                            <Fuel className="w-3 h-3" />
                            <span>{motorcycle.fuel}%</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Battery className="w-3 h-3" />
                            <span>{motorcycle.battery}%</span>
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {motorcycle.lastUpdate}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      No GPS tracking data
                    </h3>
                    <p className="text-sm">
                      GPS tracking data will appear here when motorcycles are equipped with tracking devices.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Selected Motorcycle Details */}
      {selectedMotorcycle && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Information - {selectedMotorcycle.name}</CardTitle>
            <CardDescription>Plate: {selectedMotorcycle.plateNumber}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Location Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Latitude:</span>
                    <span className="font-medium">{selectedMotorcycle.location.lat}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Longitude:</span>
                    <span className="font-medium">{selectedMotorcycle.location.lng}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Speed:</span>
                    <span className="font-medium">{selectedMotorcycle.speed} km/h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Address:</span>
                    <span className="font-medium text-right">{selectedMotorcycle.location.address}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Vehicle Status</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge className={getStatusColor(selectedMotorcycle.status)}>
                      {selectedMotorcycle.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fuel Level:</span>
                    <span className={`font-medium ${getFuelColor(selectedMotorcycle.fuel)}`}>
                      {selectedMotorcycle.fuel}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Battery:</span>
                    <span className="font-medium">{selectedMotorcycle.battery}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Update:</span>
                    <span className="font-medium">{selectedMotorcycle.lastUpdate}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Rider Information</h4>
                {selectedMotorcycle.rider ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">{selectedMotorcycle.rider.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Contact:</span>
                      <span className="font-medium">{selectedMotorcycle.rider.contact}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reservation:</span>
                      <span className="font-medium">{selectedMotorcycle.reservationId}</span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-2">
                      Contact Rider
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No active rider</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
