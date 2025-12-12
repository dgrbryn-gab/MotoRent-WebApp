import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { 
  Search, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  MoreVertical,
  FileText,
  User,
  Phone,
  Mail,
  CreditCard,
  Image as ImageIcon,
  AlertCircle,
  Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { Reservation } from '../../App';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { reservationService } from '../../services/reservationService';
import { emailService } from '../../services/emailService';
import { motorcycleService } from '../../services/motorcycleService';
import { transactionService } from '../../services/transactionService';
import { notificationService } from '../../services/notificationService';
import { documentService } from '../../services/documentService';
import { userService } from '../../services/userService';
import { transformReservations } from '../../utils/supabaseHelpers';

interface AdminReservationsProps {}

export function AdminReservations({}: AdminReservationsProps) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [verificationAction, setVerificationAction] = useState<'approve' | 'reject'>('approve');
  const [adminNotes, setAdminNotes] = useState('');
  const [userDocuments, setUserDocuments] = useState<any[]>([]);

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    try {
      setLoading(true);
      const data = await reservationService.getAllReservations();
      const transformed = transformReservations(data);
      const validReservations = transformed.filter(r => r.motorcycle) as Reservation[];
      setReservations(validReservations);
    } catch (error: any) {
      console.error('Error loading reservations:', error);
      toast.error('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateReservation = async (
    id: string, 
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed',
    rejectionReason?: string
  ) => {
    try {
      setUpdating(true);
      
      // Find the reservation to get motorcycle ID BEFORE updating
      const reservation = reservations.find(r => r.id === id);
      
      if (!reservation) {
        console.error('❌ Reservation not found:', id);
        throw new Error('Reservation not found');
      }

      console.log('🔄 Updating reservation:', id, 'to status:', status);
      console.log('🏍️ Motorcycle ID:', reservation.motorcycleId);
      
      // Update reservation status in database
      await reservationService.updateStatus(id, status);
      
      // Update motorcycle availability based on status
      if (status === 'confirmed') {
        console.log('✅ Setting motorcycle to Reserved');
        await motorcycleService.updateAvailability(reservation.motorcycleId, 'Reserved');
      } else if (status === 'cancelled' || status === 'completed') {
        console.log('✅ Setting motorcycle to Available');
        await motorcycleService.updateAvailability(reservation.motorcycleId, 'Available');
        
        // Auto-reject all pending documents when reservation is cancelled
        if (status === 'cancelled' && reservation.userId) {
          try {
            console.log('🔄 Auto-rejecting documents for user:', reservation.userId);
            
            // Get current user for reviewer ID
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              const reason = rejectionReason || 'Reservation was cancelled by admin.';
              const rejectedDocs = await documentService.rejectAllUserDocuments(
                reservation.userId,
                user.id,
                reason
              );
              console.log(`✅ Automatically rejected ${rejectedDocs?.length || 0} documents`);
            }
          } catch (docError) {
            console.error('⚠️ Failed to auto-reject documents:', docError);
            // Don't fail the reservation cancellation
          }
        }
      }
      
      // Reload reservations
      await loadReservations();
    } catch (error: any) {
      console.error('Error updating reservation:', error);
      throw error; // Re-throw to handle in calling function
    } finally {
      setUpdating(false);
    }
  };

  const filteredReservations = reservations.filter(reservation => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = reservation.id.toLowerCase().includes(searchLower) ||
           reservation.motorcycle.name.toLowerCase().includes(searchLower) ||
           (reservation.customerName?.toLowerCase().includes(searchLower) ?? false);
    const matchesStatus = statusFilter === 'all' || reservation.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingReservations = reservations.filter(r => r.status === 'pending').length;
  const activeReservations = reservations.filter(r => r.status === 'confirmed').length;
  const completedReservations = reservations.filter(r => r.status === 'completed').length;
  const cancelledReservations = reservations.filter(r => r.status === 'cancelled').length;

  const handleViewDetails = async (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowDetailsDialog(true);
    
    // Load user's latest documents (one of each type)
    if (reservation.userId) {
      try {
        console.log('Loading documents for user:', reservation.userId);
        
        // Get documents from document_verifications table
        const docs = await documentService.getUserDocuments(reservation.userId);
        console.log('Documents from document_verifications:', docs);
        
        // Also get user profile to check for driver_license_url (mobile uploads)
        const userProfile = await userService.getUserById(reservation.userId);
        console.log('User profile:', userProfile);
        
        // Get only the latest document of each type
        const latestDocs: any[] = [];
        const docTypes = ['driver-license', 'valid-id'];
        
        docTypes.forEach(type => {
          const docsOfType = docs.filter((d: any) => d.document_type === type);
          if (docsOfType.length > 0) {
            // Sort by submitted_at descending and take the first (latest)
            const latest = docsOfType.sort((a: any, b: any) => 
              new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
            )[0];
            latestDocs.push(latest);
          }
        });
        
        // If no driver license found in document_verifications, check user profile
        if (!latestDocs.find(d => d.document_type === 'driver-license') && userProfile?.driver_license_url) {
          console.log('Found driver license in user profile:', userProfile.driver_license_url);
          latestDocs.push({
            id: `user-${userProfile.id}`,
            user_id: userProfile.id,
            document_type: 'driver-license',
            document_url: userProfile.driver_license_url,
            status: 'pending',
            submitted_at: userProfile.updated_at || new Date().toISOString()
          });
        }
        
        console.log('All documents to display:', latestDocs);
        
        // Get signed URLs or public URLs for each document
        const docsWithUrls = await Promise.all(
          latestDocs.map(async (doc: any) => {
            try {
              console.log('Getting URL for:', doc.document_url);
              let signedUrl = '';
              
              // Check if it's a full URL already (mobile might store full URLs)
              if (doc.document_url.startsWith('http://') || doc.document_url.startsWith('https://')) {
                console.log('Document URL is already a full URL:', doc.document_url);
                signedUrl = doc.document_url;
              } else {
                // Try getting signed URL
                try {
                  signedUrl = await documentService.getSignedUrl(doc.document_url, 3600);
                  console.log('Got signed URL:', signedUrl);
                } catch (signError) {
                  console.error('Signed URL failed:', signError);
                  // If signed URL fails, try public URL
                  signedUrl = documentService.getPublicUrl(doc.document_url);
                  console.log('Using public URL:', signedUrl);
                }
              }
              
              return { ...doc, signedUrl };
            } catch (error) {
              console.error('Failed to get URL for document:', doc.document_url, error);
              return { ...doc, signedUrl: '' };
            }
          })
        );
        
        console.log('Documents with URLs:', docsWithUrls);
        setUserDocuments(docsWithUrls);
      } catch (error) {
        console.error('Failed to load documents:', error);
        setUserDocuments([]);
      }
    }
  };

  const handleVerify = (reservation: Reservation, action: 'approve' | 'reject') => {
    setSelectedReservation(reservation);
    setVerificationAction(action);
    setAdminNotes('');
    setShowVerifyDialog(true);
  };

  const handleConfirmVerification = async () => {
    if (!selectedReservation) return;

    try {
      if (verificationAction === 'approve') {
        // Update transaction and payment status to completed FIRST
        try {
          console.log('🔄 Syncing transaction and payment status to completed...');
          const syncResult = await transactionService.syncTransactionAndPaymentStatus(selectedReservation.id, 'completed');
          console.log('✅ Sync result:', syncResult);
          
          if (!syncResult.transactionUpdated && !syncResult.paymentUpdated) {
            console.warn('⚠️ Neither transaction nor payment was updated');
          }
        } catch (txError) {
          console.error('❌ Failed to sync transaction and payment status:', txError);
          throw new Error('Failed to update payment status. Please try again.');
        }
        
        await handleUpdateReservation(selectedReservation.id, 'confirmed');
        
        // Auto-approve all pending documents for this user
        try {
          console.log('🔄 Auto-approving documents for user:', selectedReservation.userId);
          
          // Get current user for reviewer ID
          const { data: { user } } = await supabase.auth.getUser();
          if (user && selectedReservation.userId) {
            // Use the bulk approve method from documentService
            const approvedDocs = await documentService.approveAllUserDocuments(
              selectedReservation.userId,
              user.id
            );
            console.log(`✅ Automatically approved ${approvedDocs?.length || 0} documents`);
          }
        } catch (docError) {
          console.error('⚠️ Failed to auto-approve documents:', docError);
          // Don't fail the reservation approval
        }

        // Note: Security deposit is already included in the payment transaction
        // No need to create a separate deposit transaction
        
        // Send approval email
        try {
          await emailService.sendBookingApproved({
            userEmail: selectedReservation.customerEmail || '',
            userName: selectedReservation.customerName || 'Customer',
            motorcycleName: selectedReservation.motorcycle.name,
            startDate: new Date(selectedReservation.startDate).toLocaleDateString('en-US', { 
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
            }) + (selectedReservation.pickupTime ? ` at ${selectedReservation.pickupTime}` : ''),
            endDate: new Date(selectedReservation.endDate).toLocaleDateString('en-US', { 
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
            }) + (selectedReservation.returnTime ? ` at ${selectedReservation.returnTime}` : ''),
            pickupLocation: 'MotoRent Dumaguete Main Office', // You can make this configurable
          });
          console.log('✅ Booking approval email sent');
        } catch (emailError) {
          console.error('⚠️ Failed to send approval email:', emailError);
        }
        
        // Create ONE notification for customer (for both reservation AND documents approval)
        if (selectedReservation.userId) {
          try {
            await notificationService.createNotification({
              user_id: selectedReservation.userId,
              title: '✅ Reservation & Documents Approved',
              message: `Your reservation for ${selectedReservation.motorcycle.name} has been approved! Your documents have been verified. Pick up on ${new Date(selectedReservation.startDate).toLocaleDateString()}.`,
              type: 'success',
              read: false,
              timestamp: new Date().toISOString()
            });
            console.log('✅ Combined approval notification created');
          } catch (notifError) {
            console.error('⚠️ Failed to create notification:', notifError);
          }
        }
        
        toast.success('Reservation Approved', {
          description: `Reservation ${selectedReservation.id} has been confirmed.`
        });
      } else {
        // Update transaction and payment status to cancelled FIRST
        try {
          console.log('🔄 Syncing transaction and payment status to cancelled...');
          const syncResult = await transactionService.syncTransactionAndPaymentStatus(selectedReservation.id, 'cancelled');
          console.log('✅ Sync result:', syncResult);
          
          if (!syncResult.transactionUpdated && !syncResult.paymentUpdated) {
            console.warn('⚠️ Neither transaction nor payment was updated');
          }
        } catch (txError) {
          console.error('❌ Failed to sync transaction and payment status:', txError);
          throw new Error('Failed to update payment status. Please try again.');
        }
        
        // Reject the reservation (this will also auto-reject documents via handleUpdateReservation)
        const rejectionReason = adminNotes || 'Document verification failed during reservation review.';
        await handleUpdateReservation(selectedReservation.id, 'cancelled', rejectionReason);
        
        // Send rejection email
        try {
          await emailService.sendBookingRejected({
            userEmail: selectedReservation.customerEmail || '',
            userName: selectedReservation.customerName || 'Customer',
            motorcycleName: selectedReservation.motorcycle.name,
            reason: adminNotes || 'Your booking could not be approved at this time. Please contact support for more information.',
          });
          console.log('✅ Booking rejection email sent');
        } catch (emailError) {
          console.error('⚠️ Failed to send rejection email:', emailError);
        }
        
        // Create ONE notification for customer (for both reservation AND documents rejection)
        if (selectedReservation.userId) {
          try {
            await notificationService.createNotification({
              user_id: selectedReservation.userId,
              title: '❌ Reservation & Documents Rejected',
              message: `Your reservation for ${selectedReservation.motorcycle.name} has been rejected. Your documents were not approved. ${adminNotes || 'Please contact support for more information.'}`,
              type: 'error',
              read: false,
              timestamp: new Date().toISOString()
            });
            console.log('✅ Combined rejection notification created');
          } catch (notifError) {
            console.error('⚠️ Failed to create notification:', notifError);
          }
        }
        
        toast.error('Reservation Rejected', {
          description: `Reservation ${selectedReservation.id} has been cancelled.`
        });
      }

      setShowVerifyDialog(false);
      setSelectedReservation(null);
    } catch (error: any) {
      toast.error('Failed to update reservation', {
        description: error.message
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-warning/10 text-warning border-warning/20">Pending Verification</Badge>;
      case 'confirmed':
        return <Badge className="bg-success/10 text-success border-success/20">Confirmed</Badge>;
      case 'completed':
        return <Badge className="bg-info/10 text-info border-info/20">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-warning" />;
      case 'confirmed':
        return <Clock className="w-4 h-4 text-info" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading reservations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Reservation Management</h1>
        <p className="text-muted-foreground mt-2">
          Monitor and manage all motorcycle reservations ({reservations.length} total)
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setStatusFilter('pending')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-warning" />
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-xl font-bold">{pendingReservations}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setStatusFilter('confirmed')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-info" />
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-xl font-bold">{activeReservations}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setStatusFilter('completed')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-xl font-bold">{completedReservations}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setStatusFilter('cancelled')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-destructive" />
                <div>
                  <p className="text-sm text-muted-foreground">Cancelled</p>
                  <p className="text-xl font-bold">{cancelledReservations}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setStatusFilter('all')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-xl font-bold">{reservations.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
      </div>

      {/* Search and Filter */}
      <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search reservations by ID, motorcycle, or customer name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
      </Card>

      {/* Reservations List */}
      <Card>
          <CardHeader>
            <CardTitle>All Reservations</CardTitle>
            <CardDescription>View and manage customer reservations</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredReservations.length > 0 ? (
              <div className="space-y-4">
                {filteredReservations.map((reservation) => (
                  <div key={reservation.id} className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <ImageWithFallback
                        src={reservation.motorcycle.image}
                        alt={reservation.motorcycle.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">{reservation.motorcycle.name}</h3>
                        {getStatusBadge(reservation.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Ref: {reservation.id}
                      </p>
                      {reservation.customerName && (
                        <p className="text-sm text-muted-foreground">
                          Customer: {reservation.customerName}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(reservation.startDate).toLocaleDateString()}</span>
                        </div>
                        <span>→</span>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(reservation.endDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      {reservation.paymentMethod && (
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            💵 Cash
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-primary">₱{reservation.totalPrice.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        {Math.ceil((new Date(reservation.endDate).getTime() - new Date(reservation.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                      </p>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewDetails(reservation)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>

                      {reservation.status === 'pending' && (
                        <>
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => handleVerify(reservation, 'approve')}
                            className="bg-success hover:bg-success/90"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleVerify(reservation, 'reject')}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </>
                      )}

                      {reservation.status === 'confirmed' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={async () => {
                              try {
                                await handleUpdateReservation(reservation.id, 'completed');
                                toast.success('Reservation marked as completed');
                              } catch (error: any) {
                                toast.error('Failed to update reservation');
                              }
                            }}>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Mark as Completed
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={async () => {
                                if (window.confirm('Are you sure you want to cancel this reservation?')) {
                                  try {
                                    await handleUpdateReservation(reservation.id, 'cancelled');
                                    toast.success('Reservation cancelled');
                                  } catch (error: any) {
                                    toast.error('Failed to cancel reservation');
                                  }
                                }
                              }}
                              className="text-destructive"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Cancel Reservation
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {reservations.length === 0 ? 'No reservations yet' : 'No reservations found'}
                </h3>
                <p className="text-muted-foreground">
                  {reservations.length === 0 
                    ? 'Reservations made by customers will appear here.'
                    : 'Try adjusting your search criteria.'
                  }
                </p>
              </div>
            )}
          </CardContent>
      </Card>

      {/* Detailed View Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reservation Details</DialogTitle>
            <DialogDescription>
              Complete information for reservation {selectedReservation?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedReservation && (
            <div className="space-y-6">
              {/* Status */}
              <div>
                <h4 className="font-semibold mb-2">Status</h4>
                {getStatusBadge(selectedReservation.status)}
              </div>

              <Separator />

              {/* Motorcycle Info */}
              <div>
                <h4 className="font-semibold mb-3">Motorcycle</h4>
                <div className="flex gap-4">
                  <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                    <ImageWithFallback
                      src={selectedReservation.motorcycle.image}
                      alt={selectedReservation.motorcycle.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium">{selectedReservation.motorcycle.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedReservation.motorcycle.type}</p>
                    <p className="text-sm text-primary font-semibold mt-1">
                      ₱{selectedReservation.motorcycle.pricePerDay}/day
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Customer Information */}
              <div>
                <h4 className="font-semibold mb-3">Customer Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Name</p>
                      <p className="text-sm">{selectedReservation.customerName || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm">{selectedReservation.customerEmail || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm">{selectedReservation.customerPhone || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Rental Period */}
              <div>
                <h4 className="font-semibold mb-3">Rental Period</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Pickup</p>
                    <p className="text-sm font-medium">
                      {new Date(selectedReservation.startDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    {selectedReservation.pickupTime && (
                      <p className="text-sm text-muted-foreground">{selectedReservation.pickupTime}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Return</p>
                    <p className="text-sm font-medium">
                      {new Date(selectedReservation.endDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    {selectedReservation.returnTime && (
                      <p className="text-sm text-muted-foreground">{selectedReservation.returnTime}</p>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Duration: {Math.ceil((new Date(selectedReservation.endDate).getTime() - new Date(selectedReservation.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                </p>
              </div>

              <Separator />

              {/* Payment Information */}
              <div>
                <h4 className="font-semibold mb-3">Payment Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Method</p>
                      <p className="text-sm font-medium">
                        💵 Cash Payment
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-primary/5 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="text-2xl font-bold text-primary">₱{selectedReservation.totalPrice.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Customer Information */}
              {selectedReservation.adminNotes && (
                <div>
                  <h4 className="font-semibold mb-3">Customer Information</h4>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    {(() => {
                      // Parse admin notes into structured data
                      const notes = selectedReservation.adminNotes;
                      const lines = notes.split('\n');
                      
                      // Find section markers
                      const customerInfoStart = lines.findIndex(l => l.includes('📋 CUSTOMER INFORMATION'));
                      const emergencyContactStart = lines.findIndex(l => l.includes('🚨 EMERGENCY CONTACT'));
                      const additionalNotesStart = lines.findIndex(l => l.includes('📝 ADDITIONAL NOTES'));
                      
                      // Parse customer info section
                      const customerData: any = {};
                      const emergencyData: any = {};
                      
                      lines.forEach((line: string, index: number) => {
                        const colonIndex = line.indexOf(':');
                        if (colonIndex > -1) {
                          const key = line.substring(0, colonIndex).trim();
                          const value = line.substring(colonIndex + 1).trim();
                          
                          // Determine which section this belongs to
                          if (emergencyContactStart > -1 && index > emergencyContactStart && index < (additionalNotesStart > -1 ? additionalNotesStart : lines.length)) {
                            // This is in emergency contact section
                            emergencyData[key] = value;
                          } else if (customerInfoStart > -1 && index > customerInfoStart && (emergencyContactStart === -1 || index < emergencyContactStart)) {
                            // This is in customer info section
                            customerData[key] = value;
                          }
                        }
                      });
                      
                      // Get additional notes if present
                      let additionalNotes = '';
                      if (additionalNotesStart > -1 && additionalNotesStart < lines.length - 1) {
                        additionalNotes = lines.slice(additionalNotesStart + 1).join('\n').trim();
                      }
                      
                      return (
                        <div className="space-y-3">
                          {/* Basic Information */}
                          {customerData['Name'] && (
                            <div className="flex items-start gap-3">
                              <User className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                              <div className="flex-1">
                                <p className="text-xs text-muted-foreground">Full Name</p>
                                <p className="text-sm font-medium">{customerData['Name']}</p>
                              </div>
                            </div>
                          )}
                          {customerData['Email'] && (
                            <div className="flex items-start gap-3">
                              <Mail className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                              <div className="flex-1">
                                <p className="text-xs text-muted-foreground">Email Address</p>
                                <p className="text-sm font-medium">{customerData['Email']}</p>
                              </div>
                            </div>
                          )}
                          {customerData['Phone'] && (
                            <div className="flex items-start gap-3">
                              <Phone className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                              <div className="flex-1">
                                <p className="text-xs text-muted-foreground">Phone Number</p>
                                <p className="text-sm font-medium">{customerData['Phone']}</p>
                              </div>
                            </div>
                          )}
                          {customerData['Address'] && (
                            <div className="flex items-start gap-3">
                              <FileText className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                              <div className="flex-1">
                                <p className="text-xs text-muted-foreground">Address</p>
                                <p className="text-sm font-medium">{customerData['Address']}</p>
                              </div>
                            </div>
                          )}
                          {customerData['Date of Birth'] && (
                            <div className="flex items-start gap-3">
                              <Calendar className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                              <div className="flex-1">
                                <p className="text-xs text-muted-foreground">Date of Birth</p>
                                <p className="text-sm font-medium">{customerData['Date of Birth']}</p>
                              </div>
                            </div>
                          )}
                          {customerData["Driver's License #"] && (
                            <div className="flex items-start gap-3">
                              <CreditCard className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                              <div className="flex-1">
                                <p className="text-xs text-muted-foreground">Driver's License #</p>
                                <p className="text-sm font-medium">{customerData["Driver's License #"]}</p>
                              </div>
                            </div>
                          )}
                          
                          {/* Emergency Contact */}
                          {(emergencyData['Name'] || emergencyData['Phone']) && (
                            <div className="pt-2 border-t border-border/50">
                              <p className="text-xs font-semibold text-red-600 mb-2 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Emergency Contact
                              </p>
                              {emergencyData['Name'] && (
                                <div className="flex items-start gap-3 mb-2">
                                  <User className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                                  <div className="flex-1">
                                    <p className="text-xs text-muted-foreground">Name</p>
                                    <p className="text-sm font-medium">{emergencyData['Name']}</p>
                                  </div>
                                </div>
                              )}
                              {emergencyData['Phone'] && (
                                <div className="flex items-start gap-3">
                                  <Phone className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                                  <div className="flex-1">
                                    <p className="text-xs text-muted-foreground">Phone</p>
                                    <p className="text-sm font-medium">{emergencyData['Phone']}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Additional Notes */}
                          {additionalNotes && (
                            <div className="pt-2 border-t border-border/50">
                              <p className="text-xs font-semibold text-blue-600 mb-2 flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                Additional Notes
                              </p>
                              <div className="bg-background rounded p-2 text-sm border border-border/50">
                                {additionalNotes}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              <Separator />

              {/* User Documents */}
              <div>
                <h4 className="font-semibold mb-2">Submitted Documents</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Showing the latest version of each document type submitted by this customer
                </p>
                {userDocuments.length > 0 ? (
                  <div className="space-y-4">
                    {userDocuments.map((doc, index) => (
                      <div key={index} className="border border-border rounded-lg overflow-hidden">
                        <div className="p-3 bg-muted/30 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {doc.document_type === 'driver-license' ? "Driver's License" : 'Valid ID'}
                            </span>
                          </div>
                        </div>
                        {doc.signedUrl && (
                          <div className="p-2">
                            <img 
                              src={doc.signedUrl} 
                              alt={doc.document_type}
                              className="w-full h-48 object-contain bg-muted/20 rounded"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-muted/30 rounded-lg">
                    <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Created Date */}
              <div>
                <p className="text-xs text-muted-foreground">
                  Created: {new Date(selectedReservation.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
            {selectedReservation?.status === 'pending' && (
              <>
                <Button 
                  variant="default" 
                  onClick={() => {
                    setShowDetailsDialog(false);
                    handleVerify(selectedReservation, 'approve');
                  }}
                  className="bg-success hover:bg-success/90"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    setShowDetailsDialog(false);
                    handleVerify(selectedReservation, 'reject');
                  }}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verification Dialog */}
      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {verificationAction === 'approve' ? 'Approve Reservation' : 'Reject Reservation'}
            </DialogTitle>
            <DialogDescription>
              {verificationAction === 'approve' 
                ? 'Confirm this reservation and notify the customer.' 
                : 'Cancel this reservation and notify the customer.'}
            </DialogDescription>
          </DialogHeader>

          {selectedReservation && (
            <div className="space-y-4">
              <div className="p-4 bg-secondary rounded-lg">
                <p className="text-sm font-medium mb-1">Reservation: {selectedReservation.id}</p>
                <p className="text-sm text-muted-foreground">{selectedReservation.motorcycle.name}</p>
                <p className="text-sm text-muted-foreground">Customer: {selectedReservation.customerName}</p>
                <p className="text-sm font-semibold text-primary mt-2">₱{selectedReservation.totalPrice.toLocaleString()}</p>
                {selectedReservation.paymentMethod && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Payment: 💵 Cash
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="admin-notes">Notes (Optional)</Label>
                <Textarea
                  id="admin-notes"
                  placeholder="Add any notes about this verification..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="mt-2"
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVerifyDialog(false)} disabled={updating}>
              Cancel
            </Button>
            <Button 
              variant={verificationAction === 'approve' ? 'default' : 'destructive'}
              onClick={handleConfirmVerification}
              disabled={updating}
              className={verificationAction === 'approve' ? 'bg-success hover:bg-success/90' : ''}
            >
              {updating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {verificationAction === 'approve' ? (
                <>
                  {!updating && <CheckCircle className="w-4 h-4 mr-2" />}
                  {updating ? 'Approving...' : 'Approve Reservation'}
                </>
              ) : (
                <>
                  {!updating && <XCircle className="w-4 h-4 mr-2" />}
                  {updating ? 'Rejecting...' : 'Reject Reservation'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
