import { Calendar, Clock, CheckCircle, XCircle, MoreHorizontal, AlertCircle, Loader2, X, MapPin, Phone, Mail, User as UserIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { ImageWithFallback } from './figma/ImageWithFallback';
import type { Reservation } from '../App';
import { useState, useEffect } from 'react';
import { reservationService } from '../services/reservationService';
import { motorcycleService } from '../services/motorcycleService';
import { transformReservations } from '../utils/supabaseHelpers';
import { toast } from 'sonner';

interface ReservationsPageProps {
  user: { id: string; name: string; email: string; phone?: string } | null;
}

export function ReservationsPage({ user }: ReservationsPageProps) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    loadReservations();
  }, [user]);

  const loadReservations = async () => {
    if (!user) {
      setReservations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const data = await reservationService.getUserReservations(user.id);
      
      // Transform the data from database format to app format
      const transformedReservations = transformReservations(data);
      
      // Filter out any reservations without a motorcycle (shouldn't happen but for type safety)
      const validReservations = transformedReservations.filter(r => r.motorcycle) as Reservation[];
      
      setReservations(validReservations);
    } catch (error: any) {
      console.error('Error loading reservations:', error);
      toast.error('Failed to load reservations: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (reservationId: string) => {
    try {
      // Find the reservation to get motorcycle ID BEFORE cancelling
      const reservation = reservations.find(r => r.id === reservationId);
      
      if (!reservation) {
        toast.error('Reservation not found');
        return;
      }
      
      // Update reservation status to cancelled
      await reservationService.cancelReservation(reservationId);
      
      // Update motorcycle availability back to Available
      await motorcycleService.updateAvailability(
        reservation.motorcycleId,
        'Available'
      );
      
      toast.success('Reservation cancelled successfully');
      
      // Reload reservations
      await loadReservations();
    } catch (error: any) {
      console.error('Error cancelling reservation:', error);
      toast.error('Failed to cancel reservation: ' + error.message);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-warning" />;
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-warning/10 text-warning border-warning/20',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      rejected: 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge className={`${variants[status as keyof typeof variants] || variants.cancelled} border-0`}>
        {status === 'pending' ? 'Pending Verification' : 
         status === 'rejected' ? 'Rejected' : 
         status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const activeReservations = reservations.filter(r => r.status === 'pending' || r.status === 'confirmed');
  const pastReservations = reservations.filter(r => r.status === 'completed' || r.status === 'cancelled');

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading your reservations...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-warning mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Please Log In</h3>
            <p className="text-muted-foreground">You need to be logged in to view your reservations.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl text-primary mb-2">My Reservations</h1>
        <p className="text-muted-foreground">Manage your motorcycle rental bookings</p>
      </div>

      {/* Active Reservations */}
      <div className="mb-8">
        <h2 className="text-xl mb-4">Active Reservations</h2>
        {activeReservations.length > 0 ? (
          <div className="space-y-4">
            {activeReservations.map((reservation) => (
              <Card key={reservation.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-20 h-20 rounded-lg overflow-hidden">
                        <ImageWithFallback
                          src={reservation.motorcycle.image}
                          alt={reservation.motorcycle.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium">{reservation.motorcycle.name}</h3>
                        <p className="text-sm text-muted-foreground">{reservation.motorcycle.type}</p>
                        <div className="flex items-center mt-2">
                          {getStatusIcon(reservation.status)}
                          {getStatusBadge(reservation.status)}
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Pick-up Date</p>
                        <p className="font-medium">{formatDate(reservation.startDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Return Date</p>
                        <p className="font-medium">{formatDate(reservation.endDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Amount</p>
                        <p className="font-medium text-primary">₱{reservation.totalPrice}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Are you sure you want to cancel this reservation?')) {
                            handleCancelReservation(reservation.id);
                          }
                        }}
                      >
                        Cancel
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedReservation(reservation);
                            setShowDetailsDialog(true);
                          }}>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Contact Support</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Active Reservations</h3>
              <p className="text-muted-foreground">You don't have any active reservations at the moment.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Past Reservations */}
      <div>
        <h2 className="text-xl mb-4">Past Reservations</h2>
        {pastReservations.length > 0 ? (
          <div className="space-y-4">
            {pastReservations.map((reservation) => (
              <Card key={reservation.id} className="opacity-75">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-20 h-20 rounded-lg overflow-hidden">
                        <ImageWithFallback
                          src={reservation.motorcycle.image}
                          alt={reservation.motorcycle.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium">{reservation.motorcycle.name}</h3>
                        <p className="text-sm text-muted-foreground">{reservation.motorcycle.type}</p>
                        <div className="flex items-center mt-2">
                          {getStatusIcon(reservation.status)}
                          {getStatusBadge(reservation.status)}
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Pick-up Date</p>
                        <p className="font-medium">{formatDate(reservation.startDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Return Date</p>
                        <p className="font-medium">{formatDate(reservation.endDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Amount</p>
                        <p className="font-medium">₱{reservation.totalPrice}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedReservation(reservation);
                            setShowDetailsDialog(true);
                          }}>View Details</DropdownMenuItem>
                          {reservation.status === 'completed' && (
                            <DropdownMenuItem>Book Again</DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Past Reservations</h3>
              <p className="text-muted-foreground">Your rental history will appear here.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* View Details Dialog */}
      {showDetailsDialog && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-3xl">
            <div className="flex flex-row items-center justify-between p-4 border-b">
              <CardTitle className="text-lg">Reservation Details</CardTitle>
              <Button 
                variant="ghost" 
                size="icon"
                className="ml-4 h-8 w-8"
                onClick={() => {
                  setShowDetailsDialog(false);
                  setSelectedReservation(null);
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
            <div className="p-4">
              <div className="flex gap-4">
                {/* Left: Motorcycle Image */}
                <div className="flex-shrink-0">
                  <div className="w-56 h-56 rounded-lg overflow-hidden">
                    <ImageWithFallback
                      src={selectedReservation.motorcycle.image}
                      alt={selectedReservation.motorcycle.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Right: All Details */}
                <div className="flex-1 space-y-2">
                  {/* Motorcycle Info */}
                  <div>
                    <h3 className="text-lg font-semibold mb-0">{selectedReservation.motorcycle.name}</h3>
                    <p className="text-xs text-muted-foreground mb-1">{selectedReservation.motorcycle.type}</p>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedReservation.status)}
                      {getStatusBadge(selectedReservation.status)}
                    </div>
                  </div>

                  <Separator className="my-1" />

                  {/* Reservation Info */}
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold">Booking Information</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Reservation ID</p>
                        <p className="font-mono text-xs">{selectedReservation.id.slice(0, 8)}...</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Booking Date</p>
                        <p className="text-xs">{formatDate(selectedReservation.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Pick-up Date</p>
                        <p className="text-xs font-medium">{formatDate(selectedReservation.startDate)}</p>
                        {selectedReservation.pickupTime && (
                          <p className="text-xs text-muted-foreground">{selectedReservation.pickupTime}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Return Date</p>
                        <p className="text-xs font-medium">{formatDate(selectedReservation.endDate)}</p>
                        {selectedReservation.returnTime && (
                          <p className="text-xs text-muted-foreground">{selectedReservation.returnTime}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator className="my-1" />

                  {/* Customer Info (from admin_notes) */}
                  {selectedReservation.adminNotes && (
                    <div className="space-y-1">
                      <h4 className="text-xs font-semibold">Customer Information</h4>
                      <div className="bg-muted/50 rounded p-1.5 text-xs space-y-0">
                        <pre className="whitespace-pre-wrap font-sans text-xs">{selectedReservation.adminNotes}</pre>
                      </div>
                    </div>
                  )}

                  {/* Payment Info */}
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold">Payment Details</h4>
                    <div className="bg-muted/50 rounded p-1.5 space-y-0 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Payment Method</span>
                        <span className="text-xs">💵 Cash</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span className="text-primary">₱{selectedReservation.totalPrice}</span>
                      </div>
                    </div>
                  </div>

                  {/* Document Status */}
                  {selectedReservation.license_image_url && (
                    <div className="space-y-1">
                      <h4 className="text-xs font-semibold flex items-center gap-1">
                        <CheckCircle className="w-2.5 h-2.5 text-green-500" />
                        License Document Uploaded
                      </h4>
                      <div className="bg-muted/50 rounded p-1.5">
                        <img 
                          src={selectedReservation.license_image_url} 
                          alt="Driver's License"
                          className="w-full max-w-xs rounded shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => window.open(selectedReservation.license_image_url, '_blank')}
                          onError={(e) => {
                            e.currentTarget.alt = 'Failed to load license image';
                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzlmYTZiMiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkZhaWxlZCB0byBsb2FkIGltYWdlPC90ZXh0Pjwvc3ZnPg==';
                          }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {selectedReservation.documents && selectedReservation.documents.length > 0 && (
                    <>
                      <div className="space-y-1">
                        <h4 className="text-xs font-semibold">Documents</h4>
                        <div className="space-y-0.5">
                          {selectedReservation.documents.map((doc, index) => (
                            <div key={index} className="flex items-center justify-between p-1 bg-muted/50 rounded text-xs">
                              <span className="capitalize">{doc.type.replace('-', ' ')}</span>
                              <Badge variant={
                                doc.status === 'verified' || doc.status === 'approved' ? 'default' :
                                doc.status === 'rejected' ? 'destructive' : 'secondary'
                              } className="text-xs py-0 px-1">
                                {doc.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2 mt-2 border-t">
                <Button 
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => {
                    setShowDetailsDialog(false);
                    setSelectedReservation(null);
                  }}
                >
                  Close
                </Button>
                {selectedReservation.status === 'pending' && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => {
                      setShowDetailsDialog(false);
                      if (window.confirm('Are you sure you want to cancel this reservation?')) {
                        handleCancelReservation(selectedReservation.id);
                      }
                      setSelectedReservation(null);
                    }}
                  >
                    Cancel Reservation
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
