import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { 
  Search, 
  Trash2, 
  DollarSign,
  Calendar,
  FileText,
  Loader2,
  AlertCircle,
  Eye,
  Download,
  Filter,
  User
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { transactionService } from '../../services/transactionService';
import { toast } from 'sonner';

interface Transaction {
  id: string;
  user_id: string;
  reservation_id?: string;
  type: 'payment' | 'deposit' | 'refund';
  amount: number;
  date: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  created_at?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  reservation?: {
    id: string;
    motorcycle: {
      name: string;
    };
  };
}

export function AdminTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showDepositsDialog, setShowDepositsDialog] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await transactionService.getAllTransactions();
      setTransactions(data);
    } catch (error: any) {
      console.error('Error loading transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(id);
      await transactionService.deleteTransaction(id);
      toast.success('Transaction deleted successfully');
      await loadTransactions(); // Reload the list
    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      toast.error('Failed to delete transaction: ' + error.message);
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteAllTransactions = async () => {
    if (!window.confirm('⚠️ WARNING: Are you sure you want to delete ALL transactions? This action cannot be undone and will remove all transaction records permanently!')) {
      return;
    }

    // Double confirmation for safety
    if (!window.confirm('This is your final confirmation. Delete ALL transactions?')) {
      return;
    }

    try {
      setDeletingAll(true);
      await transactionService.deleteAllTransactions();
      toast.success('All transactions deleted successfully');
      await loadTransactions(); // Reload the list
    } catch (error: any) {
      console.error('Error deleting all transactions:', error);
      toast.error('Failed to delete all transactions: ' + error.message);
    } finally {
      setDeletingAll(false);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = transaction.description.toLowerCase().includes(searchLower) ||
           transaction.type.toLowerCase().includes(searchLower) ||
           transaction.status.toLowerCase().includes(searchLower) ||
           transaction.id.toLowerCase().includes(searchLower) ||
           transaction.user?.name?.toLowerCase().includes(searchLower) ||
           transaction.user?.email?.toLowerCase().includes(searchLower);
    
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleViewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsDialog(true);
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Status', 'Amount', 'Description', 'Customer', 'Email', 'Transaction ID'];
    const rows = filteredTransactions.map(t => [
      formatDate(t.date),
      t.type,
      t.status,
      t.amount,
      t.description,
      t.user?.name || 'N/A',
      t.user?.email || 'N/A',
      t.id
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Transactions exported to CSV');
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'payment': return 'bg-success/10 text-success border-success/20';
      case 'deposit': return 'bg-info/10 text-info border-info/20';
      case 'refund': return 'bg-warning/10 text-warning border-warning/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success/10 text-success border-success/20';
      case 'pending': return 'bg-warning/10 text-warning border-warning/20';
      case 'failed': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'cancelled': return 'bg-muted/10 text-muted-foreground border-muted/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper function to extract breakdown from description
  const extractBreakdown = (description: string) => {
    const subtotalMatch = description.match(/Subtotal:\s*₱([\d,]+)/);
    const depositMatch = description.match(/Security Deposit:\s*₱([\d,]+)/);
    
    if (subtotalMatch && depositMatch) {
      return {
        subtotal: parseFloat(subtotalMatch[1].replace(/,/g, '')),
        deposit: parseFloat(depositMatch[1].replace(/,/g, '')),
      };
    }
    return null;
  };

  // Total Revenue: Only the rental portion (subtotal), excluding security deposits
  const totalRevenue = filteredTransactions
    .filter(t => t.status === 'completed' && t.type === 'payment')
    .reduce((sum, t) => {
      const breakdown = extractBreakdown(t.description);
      if (breakdown) {
        // Only count the rental amount (subtotal), not the deposit
        return sum + breakdown.subtotal;
      }
      // Fallback for old transactions without breakdown
      // Assume 20% is deposit, so subtotal = total / 1.20
      return sum + (t.amount / 1.20);
    }, 0);

  // Total Deposits: Sum of all security deposits held
  const totalDeposits = filteredTransactions
    .filter(t => t.status === 'completed' && t.type === 'payment')
    .reduce((sum, t) => {
      const breakdown = extractBreakdown(t.description);
      if (breakdown) {
        return sum + breakdown.deposit;
      }
      // Fallback: deposit = total - subtotal = total - (total/1.20) = total * 0.20/1.20
      return sum + (t.amount - (t.amount / 1.20));
    }, 0);

  // Get deposit details with motorcycle info
  const depositDetails = filteredTransactions
    .filter(t => t.status === 'completed' && t.type === 'payment')
    .map(t => {
      const breakdown = extractBreakdown(t.description);
      const depositAmount = breakdown ? breakdown.deposit : Math.round(t.amount - (t.amount / 1.20));
      
      return {
        id: t.id,
        amount: depositAmount,
        motorcycleName: t.reservation?.motorcycle?.name || 'Unknown Motorcycle',
        customerName: t.user?.name || 'Unknown',
        description: t.description,
        date: t.date,
      };
    })
    .filter(d => d.amount > 0);

  const totalRefunds = filteredTransactions
    .filter(t => t.status === 'completed' && t.type === 'refund')
    .reduce((sum, t) => sum + t.amount, 0);

  const completedCount = filteredTransactions.filter(t => t.status === 'completed').length;
  const pendingCount = filteredTransactions.filter(t => t.status === 'pending').length;
  const cancelledCount = filteredTransactions.filter(t => t.status === 'cancelled').length;

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Transaction Management</h1>
        <p className="text-muted-foreground mt-2">
          View and manage all financial transactions ({transactions.length} total)
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-xl font-bold">₱{totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Rental income only</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setShowDepositsDialog(true)}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-info" />
              <div>
                <p className="text-sm text-muted-foreground">Security Deposits</p>
                <p className="text-xl font-bold">₱{totalDeposits.toLocaleString()}</p>
                <p className="text-xs text-info mt-1">{depositDetails.length} active · Click to view →</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-xl font-bold">{completedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-warning" />
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-xl font-bold">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by description, customer name, email, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={exportToCSV}
                disabled={filteredTransactions.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAllTransactions}
                disabled={deletingAll || transactions.length === 0}
                className="whitespace-nowrap"
              >
                {deletingAll ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete All
                  </>
                )}
              </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters:</span>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="refund">Refund</SelectItem>
                </SelectContent>
              </Select>

              {(statusFilter !== 'all' || typeFilter !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStatusFilter('all');
                    setTypeFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      {filteredTransactions.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>All Transactions</CardTitle>
            <CardDescription>
              {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge className={getTypeColor(transaction.type)}>
                        {transaction.type}
                      </Badge>
                      <Badge className={getStatusColor(transaction.status)}>
                        {transaction.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        ID: {transaction.id.slice(0, 8)}...
                      </span>
                    </div>
                    
                    <p className="font-medium text-foreground">
                      {transaction.description || 'No description'}
                    </p>

                    {transaction.user && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <User className="w-3 h-3" />
                        <span>{transaction.user.name} ({transaction.user.email})</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(transaction.date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        <span className="font-semibold text-lg">₱{transaction.amount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(transaction)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteTransaction(transaction.id)}
                      disabled={deleting === transaction.id}
                    >
                      {deleting === transaction.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {transactions.length === 0 ? 'No transactions yet' : 'No transactions found'}
            </h3>
            <p className="text-muted-foreground text-center">
              {transactions.length === 0 
                ? 'Transactions will appear here when customers make payments.'
                : 'Try adjusting your search criteria.'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Transaction Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              Complete information about this transaction
            </DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-4">
              {/* Status and Type */}
              <div className="flex items-center gap-3">
                <Badge className={`${getTypeColor(selectedTransaction.type)} text-base px-3 py-1`}>
                  {selectedTransaction.type.toUpperCase()}
                </Badge>
                <Badge className={`${getStatusColor(selectedTransaction.status)} text-base px-3 py-1`}>
                  {selectedTransaction.status.toUpperCase()}
                </Badge>
              </div>

              {/* Amount */}
              <div className="bg-primary/5 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Transaction Amount</p>
                <p className="text-3xl font-bold text-primary">₱{selectedTransaction.amount.toLocaleString()}</p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Transaction ID</p>
                  <p className="font-mono text-sm">{selectedTransaction.id}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Transaction Date</p>
                  <p className="text-sm">{formatDate(selectedTransaction.date)}</p>
                </div>

                {selectedTransaction.user && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Customer Name</p>
                      <p className="text-sm font-medium">{selectedTransaction.user.name}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Customer Email</p>
                      <p className="text-sm">{selectedTransaction.user.email}</p>
                    </div>
                  </>
                )}

                {selectedTransaction.reservation_id && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground mb-1">Reservation ID</p>
                    <p className="font-mono text-sm">{selectedTransaction.reservation_id}</p>
                  </div>
                )}

                {selectedTransaction.reservation?.motorcycle && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground mb-1">Motorcycle</p>
                    <p className="text-sm font-medium">{selectedTransaction.reservation.motorcycle.name}</p>
                  </div>
                )}

                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{selectedTransaction.description || 'No description provided'}</p>
                </div>

                {selectedTransaction.created_at && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground mb-1">Created At</p>
                    <p className="text-sm">{formatDate(selectedTransaction.created_at)}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Deposits Breakdown Dialog */}
      <Dialog open={showDepositsDialog} onOpenChange={setShowDepositsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Security Deposits Breakdown</DialogTitle>
            <DialogDescription>
              Detailed breakdown of all security deposits held. These amounts will be returned to customers after motorcycle return and inspection.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Summary Card */}
            <Card className="bg-info/5 border-info/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Deposits Held</p>
                    <p className="text-2xl font-bold text-info">₱{totalDeposits.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Number of Deposits</p>
                    <p className="text-2xl font-bold">{depositDetails.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Deposits List */}
            {depositDetails.length > 0 ? (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground">Individual Deposits</h4>
                {depositDetails.map((deposit) => (
                  <Card key={deposit.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-info/10 text-info border-info/20">
                              Deposit
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(deposit.date)}
                            </span>
                          </div>
                          
                          <div>
                            <p className="font-semibold text-foreground">{deposit.motorcycleName}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {deposit.customerName}
                            </p>
                          </div>

                          {deposit.description && (
                            <p className="text-xs text-muted-foreground italic">
                              {deposit.description}
                            </p>
                          )}
                        </div>

                        <div className="text-right">
                          <p className="text-2xl font-bold text-info">
                            ₱{deposit.amount.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            20% Security Deposit
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No security deposits currently held</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowDepositsDialog(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
