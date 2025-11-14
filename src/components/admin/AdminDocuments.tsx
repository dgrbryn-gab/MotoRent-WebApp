import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { 
  Search, 
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Eye,
  Loader2,
  User,
  Calendar,
  Trash2
} from 'lucide-react';
import { documentService } from '../../services/documentService';
import { emailService } from '../../services/emailService';
import { userService } from '../../services/userService';
import { reservationService } from '../../services/reservationService';
import { motorcycleService } from '../../services/motorcycleService';
import { notificationService } from '../../services/notificationService';
import { toast } from 'sonner';
import type { AdminUser } from '../../App';

interface Document {
  id: string;
  user_id: string;
  document_type: 'driver-license' | 'valid-id';
  document_url: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  rejection_reason?: string;
  user?: {
    name: string;
    email: string;
  };
  signedUrl?: string; // Add signed URL field
}

interface AdminDocumentsProps {
  adminUser: AdminUser;
}

export function AdminDocuments({ adminUser }: AdminDocumentsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    filterDocuments();
  }, [searchTerm, statusFilter, documents]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await documentService.getAllDocuments();
      
      // Generate signed URLs for all documents
      if (data && data.length > 0) {
        const documentsWithUrls = await Promise.all(
          data.map(async (doc: any) => {
            try {
              const signedUrl = await documentService.getSignedUrl(doc.document_url, 3600);
              return { ...doc, signedUrl };
            } catch (error) {
              console.error('Failed to get signed URL for:', doc.document_url, error);
              return { ...doc, signedUrl: '' };
            }
          })
        );
        setDocuments(documentsWithUrls as Document[]);
      } else {
        setDocuments([]);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const filterDocuments = () => {
    let filtered = documents;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(d => d.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(d => 
        d.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.document_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredDocuments(filtered);
  };
  const viewDocument = (doc: Document) => {
    setSelectedDoc(doc);
    setShowDialog(true);
  };

  const handleDeleteDocument = async (doc: Document) => {
    if (!window.confirm(`Are you sure you want to delete this ${doc.document_type === 'driver-license' ? "driver's license" : 'valid ID'} document?`)) {
      return;
    }

    try {
      console.log('🗑️ Deleting document:', doc.id);
      await documentService.deleteDocument(doc.id);
      console.log('✅ Document deleted, reloading list...');
      toast.success('Document deleted successfully');
      
      // Close dialog if the deleted document is currently being viewed
      if (selectedDoc?.id === doc.id) {
        setShowDialog(false);
        setSelectedDoc(null);
      }
      
      // Reload documents to refresh the list
      await loadDocuments();
      console.log('✅ Document list reloaded');
    } catch (error: any) {
      console.error('❌ Failed to delete document:', error);
      toast.error(`Failed to delete document: ${error.message || 'Unknown error'}`);
    }
  };

  const getStats = () => {
    return {
      pending: documents.filter(d => d.status === 'pending').length,
      approved: documents.filter(d => d.status === 'approved').length,
      rejected: documents.filter(d => d.status === 'rejected').length,
      total: documents.length
    };
  };

  const stats = getStats();

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Document Verification</h1>
        <p className="text-muted-foreground mt-2">
          View submitted documents and their verification status. Approve/reject documents from the Reservations page.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:border-warning transition-colors" onClick={() => setStatusFilter('pending')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-warning" />
                <div>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                  <p className="text-xl font-bold">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-success transition-colors" onClick={() => setStatusFilter('approved')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-xl font-bold">{stats.approved}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-destructive transition-colors" onClick={() => setStatusFilter('rejected')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-destructive" />
                <div>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                  <p className="text-xl font-bold">{stats.rejected}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setStatusFilter('all')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Documents</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
      </div>

      {/* Search */}
      <Card>
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
      </Card>

      {/* Filter Badges */}
      <div className="flex gap-2">
        <Badge 
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setStatusFilter('all')}
        >
          All Documents
        </Badge>
        <Badge 
          variant={statusFilter === 'pending' ? 'secondary' : 'outline'}
          className="cursor-pointer"
          onClick={() => setStatusFilter('pending')}
        >
          Pending
        </Badge>
        <Badge 
          variant={statusFilter === 'approved' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setStatusFilter('approved')}
        >
          Approved
        </Badge>
        <Badge 
          variant={statusFilter === 'rejected' ? 'destructive' : 'outline'}
          className="cursor-pointer"
          onClick={() => setStatusFilter('rejected')}
        >
          Rejected
        </Badge>
      </div>

      {/* Documents List */}
      <Card>
          <CardHeader>
            <CardTitle>Document Submissions</CardTitle>
            <CardDescription>
              {statusFilter === 'all' ? 'All documents' : `${statusFilter} documents`} ({filteredDocuments.length})
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-spin" />
                <p className="text-muted-foreground">Loading documents...</p>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No documents found
                </h3>
                <p className="text-muted-foreground">
                  {statusFilter === 'all' 
                    ? 'Document submissions from customers will appear here.'
                    : `No ${statusFilter} documents at this time.`}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDocuments.map((doc) => (
                  <Card key={doc.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          {/* Document Preview */}
                          <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                            {doc.document_url.endsWith('.pdf') ? (
                              <FileText className="w-12 h-12 text-muted-foreground" />
                            ) : doc.signedUrl ? (
                              <img 
                                src={doc.signedUrl}
                                alt="Document"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  console.error('Image load error:', doc.document_url);
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <FileText className="w-12 h-12 text-muted-foreground" />
                            )}
                          </div>

                          {/* Document Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <h4 className="font-medium text-foreground">
                                  {doc.document_type === 'driver-license' ? "Driver's License" : 'Valid ID'}
                                </h4>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                  <User className="w-4 h-4" />
                                  <span>{doc.user?.name || 'Unknown User'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>Submitted {new Date(doc.submitted_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                              
                              <Badge variant={
                                doc.status === 'approved' ? 'default' :
                                doc.status === 'rejected' ? 'destructive' : 'secondary'
                              }>
                                {doc.status === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
                                {doc.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                                {doc.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                                {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                              </Badge>
                            </div>

                            {doc.rejection_reason && (
                              <p className="text-sm text-destructive mt-2">
                                Rejection reason: {doc.rejection_reason}
                              </p>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2 mt-3">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => viewDocument(doc)}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleDeleteDocument(doc)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      {/* Document View Dialog */}
      {showDialog && selectedDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Document Review</CardTitle>
              <CardDescription>
                {selectedDoc.document_type === 'driver-license' ? "Driver's License" : 'Valid ID'} - {selectedDoc.user?.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Document Image */}
              <div className="w-full bg-muted rounded-lg overflow-hidden">
                {selectedDoc.document_url.endsWith('.pdf') ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">PDF Document</p>
                    <Button 
                      variant="outline"
                      onClick={() => selectedDoc.signedUrl && window.open(selectedDoc.signedUrl, '_blank')}
                    >
                      Open PDF
                    </Button>
                  </div>
                ) : selectedDoc.signedUrl ? (
                  <img 
                    src={selectedDoc.signedUrl}
                    alt="Document"
                    className="w-full h-auto"
                    onError={(e) => {
                      console.error('Full image load error:', selectedDoc.document_url);
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                    <p className="text-sm text-destructive">Failed to load image</p>
                  </div>
                )}
              </div>

              {/* Document Info */}
              <div className="space-y-3">
                <div>
                  <Label>Status</Label>
                  <Badge variant={
                    selectedDoc.status === 'approved' ? 'default' :
                    selectedDoc.status === 'rejected' ? 'destructive' : 'secondary'
                  } className="ml-2">
                    {selectedDoc.status.charAt(0).toUpperCase() + selectedDoc.status.slice(1)}
                  </Badge>
                </div>
                
                <div>
                  <Label>User</Label>
                  <p className="text-sm mt-1">{selectedDoc.user?.name} ({selectedDoc.user?.email})</p>
                </div>
                
                <div>
                  <Label>Submitted</Label>
                  <p className="text-sm mt-1">{new Date(selectedDoc.submitted_at).toLocaleString()}</p>
                </div>

                {selectedDoc.reviewed_at && (
                  <div>
                    <Label>Reviewed</Label>
                    <p className="text-sm mt-1">{new Date(selectedDoc.reviewed_at).toLocaleString()}</p>
                  </div>
                )}
              </div>

              {/* Document Status Display */}
              {selectedDoc.status !== 'pending' && (
                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="p-3 bg-muted rounded-lg">
                    <Badge className={
                      selectedDoc.status === 'approved' ? 'bg-success/10 text-success border-success/20' :
                      'bg-destructive/10 text-destructive border-destructive/20'
                    }>
                      {selectedDoc.status === 'approved' ? '✅ Approved' : '❌ Rejected'}
                    </Badge>
                    {selectedDoc.rejection_reason && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Reason: {selectedDoc.rejection_reason}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between gap-2 pt-4">
                <Button 
                  variant="destructive"
                  onClick={() => handleDeleteDocument(selectedDoc)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Document
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowDialog(false);
                    setSelectedDoc(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
