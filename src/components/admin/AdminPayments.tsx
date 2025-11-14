import { useState, useEffect } from 'react';
import { DollarSign, CreditCard, Filter, Search, Download, CheckCircle, Clock, XCircle, Calendar, Check, RefreshCw, AlertCircle, Eye, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { toast } from 'sonner';
import {
  getAllPayments,
  confirmCashPayment,
  refundPayment,
  getPaymentStatistics,
  formatCurrency,
  getPaymentStatusColor,
  Payment as PaymentType,
  PaymentStatus,
  PaymentMethod,
} from '../../services/paymentService';

// Extended payment interface with joined data
interface PaymentWithDetails extends PaymentType {
  customer_name: string;
  customer_email: string;
  motorcycle_name: string;
  type: 'rental' | 'deposit' | 'refund';
  date: string;
  users?: {
    name: string;
    email: string;
  };
  reservations?: {
    motorcycle_id: string;
    start_date: string;
    end_date: string;
  };
}

interface Payment {
  id: string;
  reservationId: string;
  customerName: string;
  motorcycleName: string;
  amount: number;
  paymentMethod: 'cash' | 'gcash' | 'card';
  status: 'completed' | 'pending' | 'failed' | 'refunded' | 'succeeded' | 'processing' | 'cancelled' | 'partially_refunded';
  type: 'rental' | 'deposit' | 'refund';
  date: string;
  transactionId?: string;
  stripePaymentIntentId?: string;
  refundAmount?: number;
  refundReason?: string;
}

export function AdminPayments() {
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithDetails | null>(null);
  const [showMarkAsPaidDialog, setShowMarkAsPaidDialog] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [paymentStats, setPaymentStats] = useState({
    total: 0,
    succeeded: 0,
    pending: 0,
    failed: 0,
    refunded: 0,
    totalRevenue: 0,
    byMethod: { card: 0, cash: 0 },
  });

  const loadPayments = async () => {
    try {
      setLoading(true);
      const paymentsData = await getAllPayments();
      
      // Transform data to include customer and motorcycle info
      const transformedPayments: PaymentWithDetails[] = paymentsData.map((payment: any) => {
        const motorcycleName = payment.reservations?.motorcycles?.name || 
                              `${payment.reservations?.motorcycles?.brand || ''} ${payment.reservations?.motorcycles?.model || ''}`.trim() ||
                              'Unknown Motorcycle';
        
        // Determine type from metadata or default to 'rental'
        const paymentType = payment.metadata?.type || 'rental';
        
        return {
          ...payment,
          customer_name: payment.users?.name || 'Unknown',
          customer_email: payment.users?.email || '',
          motorcycle_name: motorcycleName,
          type: paymentType,
          date: payment.created_at,
        };
      });
      
      setPayments(transformedPayments);
    } catch (error) {
      console.error('Error loading payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const statsData = await getPaymentStatistics();
      setPaymentStats(statsData);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  useEffect(() => {
    loadPayments();
    loadStatistics();
  }, [statusFilter, paymentMethodFilter]);

  const handleMarkAsPaid = (payment: PaymentWithDetails) => {
    setSelectedPayment(payment);
    setShowMarkAsPaidDialog(true);
  };

  const handleViewDetails = (payment: PaymentWithDetails) => {
    setSelectedPayment(payment);
    setShowDetailsDialog(true);
  };

  const handleRefund = (payment: PaymentWithDetails) => {
    setSelectedPayment(payment);
    setRefundAmount(payment.amount.toString());
    setRefundReason('');
    setShowRefundDialog(true);
  };

  const exportToCSV = () => {
    const csvData = filteredPayments.map(payment => ({
      'Payment ID': payment.id,
      'Date': formatDate(payment.date),
      'Customer': payment.customer_name,
      'Email': payment.customer_email || 'N/A',
      'Motorcycle': payment.motorcycle_name,
      'Type': payment.type,
      'Method': payment.payment_method,
      'Amount': payment.amount,
      'Status': payment.status,
      'Transaction ID': payment.stripe_payment_intent_id || 'N/A',
      'Reservation ID': payment.reservation_id,
    }));

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Payment data exported successfully');
  };

  const confirmMarkAsPaid = async () => {
    if (!selectedPayment) return;
    
    try {
      setProcessing(true);
      await confirmCashPayment(selectedPayment.id);
      await loadPayments();
      await loadStatistics();
      setShowMarkAsPaidDialog(false);
      setSelectedPayment(null);
      toast.success('Payment marked as completed');
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast.error('Failed to confirm payment');
    } finally {
      setProcessing(false);
    }
  };

  const confirmRefund = async () => {
    if (!selectedPayment || !refundAmount || !refundReason) {
      toast.error('Please enter refund amount and reason');
      return;
    }

    try {
      setProcessing(true);
      await refundPayment({
        paymentId: selectedPayment.id,
        amount: parseFloat(refundAmount),
        reason: refundReason,
      });
      await loadPayments();
      await loadStatistics();
      setShowRefundDialog(false);
      setSelectedPayment(null);
      setRefundAmount('');
      setRefundReason('');
      toast.success('Refund processed successfully');
    } catch (error) {
      console.error('Error processing refund:', error);
      toast.error('Failed to process refund');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success text-success-foreground';
      case 'pending':
        return 'bg-warning text-warning-foreground';
      case 'failed':
        return 'bg-error text-error-foreground';
      case 'refunded':
        return 'bg-info text-info-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return '💵';
      default:
        return '💰';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesMethod = paymentMethodFilter === 'all' || payment.payment_method === paymentMethodFilter;
    const matchesTab = selectedTab === 'all' || payment.type === selectedTab;
    
    return matchesSearch && matchesStatus && matchesMethod && matchesTab;
  });

  const summaryStats = {
    total: payments.reduce((sum, p) => (p.status === 'succeeded' || p.status === 'partially_refunded') ? sum + p.amount : sum, 0),
    pending: payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
    completed: payments.filter(p => p.status === 'succeeded' || p.status === 'partially_refunded').length,
    failed: payments.filter(p => p.status === 'failed').length,
    refunded: payments.filter(p => p.status === 'refunded').reduce((sum, p) => sum + p.amount, 0)
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
            Payments & Transactions
          </h1>
          <p className="text-muted-foreground">
            Manage all rental payments and financial transactions
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary-dark" onClick={exportToCSV} disabled={filteredPayments.length === 0}>
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">₱{summaryStats.total.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {payments.filter(p => p.status === 'succeeded' || p.status === 'partially_refunded').length} completed
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">₱{summaryStats.pending.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {payments.filter(p => p.status === 'pending').length} transactions
                </p>
              </div>
              <Clock className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{summaryStats.completed}</p>
                <p className="text-xs text-muted-foreground mt-1">Successful payments</p>
              </div>
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Refunded</p>
                <p className="text-2xl font-bold">₱{summaryStats.refunded.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {payments.filter(p => p.status === 'refunded').length} refunds
                </p>
              </div>
              <XCircle className="w-8 h-8 text-info" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>

            <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="w-full">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                Showing {filteredPayments.length} of {payments.length} transactions
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="rental">Rentals</TabsTrigger>
              <TabsTrigger value="deposit">Deposits</TabsTrigger>
              <TabsTrigger value="refund">Refunds</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedTab}>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Motorcycle</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.length > 0 ? (
                      filteredPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">{payment.id}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{payment.customer_name}</p>
                              <p className="text-xs text-muted-foreground">{payment.reservation_id}</p>
                            </div>
                          </TableCell>
                          <TableCell>{payment.motorcycle_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {payment.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>{getPaymentMethodIcon(payment.payment_method)}</span>
                              <span className="capitalize text-sm">
                                {payment.payment_method.replace('-', ' ')}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">
                            ₱{payment.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(payment.status)}>
                              {payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(payment.date)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {payment.status === 'pending' && (
                                <Button 
                                  variant="default" 
                                  size="sm"
                                  onClick={() => handleMarkAsPaid(payment)}
                                  className="bg-success hover:bg-success/90"
                                >
                                  <Check className="w-3 h-3 mr-1" />
                                  Mark Paid
                                </Button>
                              )}
                              {(payment.status === 'succeeded' || payment.status === 'partially_refunded') && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleRefund(payment)}
                                  className="border-error text-error hover:bg-error hover:text-error-foreground"
                                >
                                  <RotateCcw className="w-3 h-3 mr-1" />
                                  Refund
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleViewDetails(payment)}
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                View
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-12">
                          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-foreground mb-2">
                            {payments.length === 0 ? 'No payment transactions yet' : 'No payments found'}
                          </h3>
                          <p className="text-muted-foreground">
                            {payments.length === 0 
                              ? 'Payment transactions will appear here when customers make reservations.'
                              : 'Try adjusting your search criteria.'}
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Mark as Paid Confirmation Dialog */}
      <AlertDialog open={showMarkAsPaidDialog} onOpenChange={setShowMarkAsPaidDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Payment Receipt</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this payment as completed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {selectedPayment && (
            <div className="my-4 p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment ID:</span>
                <span className="font-medium">{selectedPayment.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Customer:</span>
                <span className="font-medium">{selectedPayment.customer_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Motorcycle:</span>
                <span className="font-medium">{selectedPayment.motorcycle_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-semibold text-accent">₱{selectedPayment.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Method:</span>
                <span className="font-medium capitalize">
                  {getPaymentMethodIcon(selectedPayment.payment_method)} {selectedPayment.payment_method}
                </span>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmMarkAsPaid}
              disabled={processing}
              className="bg-success hover:bg-success/90"
            >
              {processing ? 'Processing...' : 'Confirm Payment'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              Complete information about this payment transaction
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4">
              {/* Payment Information */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Payment Information
                </h4>
                <div className="grid grid-cols-2 gap-3 p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Payment ID</p>
                    <p className="font-medium text-sm">{selectedPayment.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge className={getStatusColor(selectedPayment.status)}>
                      {selectedPayment.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="font-semibold text-primary">₱{selectedPayment.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Payment Method</p>
                    <p className="font-medium text-sm capitalize">
                      {getPaymentMethodIcon(selectedPayment.payment_method)} {selectedPayment.payment_method}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Type</p>
                    <Badge variant="outline" className="capitalize">{selectedPayment.type}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="font-medium text-sm">{formatDate(selectedPayment.date)}</p>
                  </div>
                  {selectedPayment.stripe_payment_intent_id && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Transaction ID</p>
                      <p className="font-mono text-xs">{selectedPayment.stripe_payment_intent_id}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Information */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Customer Information
                </h4>
                <div className="grid grid-cols-2 gap-3 p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="font-medium text-sm">{selectedPayment.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium text-sm">{selectedPayment.customer_email || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Reservation Information */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Reservation Information
                </h4>
                <div className="grid grid-cols-2 gap-3 p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Reservation ID</p>
                    <p className="font-mono text-xs">{selectedPayment.reservation_id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Motorcycle</p>
                    <p className="font-medium text-sm">{selectedPayment.motorcycle_name}</p>
                  </div>
                </div>
              </div>

              {/* Metadata if available */}
              {selectedPayment.metadata && Object.keys(selectedPayment.metadata).length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Additional Information</h4>
                  <div className="p-4 bg-muted rounded-lg">
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(selectedPayment.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              Issue a refund for this payment
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="font-medium">{selectedPayment.customer_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Original Amount:</span>
                  <span className="font-semibold">₱{selectedPayment.amount.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="refundAmount">Refund Amount</Label>
                <Input
                  id="refundAmount"
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder="Enter refund amount"
                  max={selectedPayment.amount}
                  min={0}
                  disabled={processing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="refundReason">Refund Reason</Label>
                <Textarea
                  id="refundReason"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Explain the reason for this refund..."
                  rows={3}
                  disabled={processing}
                />
              </div>

              <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  This action cannot be undone. The refund will be processed immediately.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRefundDialog(false)} disabled={processing}>
              Cancel
            </Button>
            <Button 
              onClick={confirmRefund}
              disabled={processing || !refundAmount || !refundReason}
              className="bg-error hover:bg-error/90"
            >
              {processing ? 'Processing...' : 'Process Refund'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
