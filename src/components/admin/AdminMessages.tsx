import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import {
  Search,
  MessageSquare,
  Mail,
  Trash2,
  CheckCircle,
  Clock,
  Eye,
  Loader2,
  X,
  Send
} from 'lucide-react';
import { contactService, ContactMessage } from '../../services/contactService';
import { emailService } from '../../services/emailService';
import { toast } from 'sonner';

export function AdminMessages() {
  const [searchTerm, setSearchTerm] = useState('');
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'new' | 'read' | 'responded'>('all');
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const allMessages = await contactService.getAllMessages();
      setMessages(allMessages);
    } catch (error: any) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleViewMessage = async (message: ContactMessage) => {
    setSelectedMessage(message);
    setIsModalOpen(true);
    
    // Mark as read
    if (message.status === 'new') {
      try {
        await contactService.markAsRead(message.id);
        // Update local state
        setMessages(messages.map(m => 
          m.id === message.id ? { ...m, status: 'read' } : m
        ));
        setSelectedMessage({ ...message, status: 'read' });
      } catch (error: any) {
        console.error('Error marking message as read:', error);
      }
    }
  };

  const handleMarkAsResponded = async () => {
    if (!selectedMessage) return;

    try {
      await contactService.markAsResponded(selectedMessage.id);
      setMessages(messages.map(m => 
        m.id === selectedMessage.id ? { ...m, status: 'responded' } : m
      ));
      setSelectedMessage({ ...selectedMessage, status: 'responded' });
      toast.success('Message marked as responded');
    } catch (error: any) {
      console.error('Error marking message as responded:', error);
      toast.error('Failed to mark message as responded');
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;

    try {
      await contactService.deleteMessage(id);
      setMessages(messages.filter(m => m.id !== id));
      setIsModalOpen(false);
      setSelectedMessage(null);
      toast.success('Message deleted');
    } catch (error: any) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  const handleSendReply = async () => {
    if (!selectedMessage || !replyText.trim()) {
      toast.error('Please enter a reply message');
      return;
    }

    try {
      setIsSendingReply(true);

      // Save reply to database
      await contactService.replyToMessage(selectedMessage.id, replyText);

      // Send email to customer
      await emailService.sendAdminReply({
        customerEmail: selectedMessage.email,
        customerName: selectedMessage.name,
        originalMessage: selectedMessage.message,
        replyMessage: replyText
      });

      // Update local state
      const updatedMessage = { ...selectedMessage, reply_message: replyText, status: 'responded' as const };
      setSelectedMessage(updatedMessage);
      setMessages(messages.map(m => 
        m.id === selectedMessage.id ? updatedMessage : m
      ));
      setReplyText('');

      toast.success('Reply sent successfully!');
    } catch (error: any) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    } finally {
      setIsSendingReply(false);
    }
  };

  const filteredMessages = messages.filter(msg => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      msg.name.toLowerCase().includes(searchLower) ||
      msg.email.toLowerCase().includes(searchLower) ||
      msg.message.toLowerCase().includes(searchLower);

    const matchesStatus = filterStatus === 'all' || msg.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: messages.length,
    new: messages.filter(m => m.status === 'new').length,
    read: messages.filter(m => m.status === 'read').length,
    responded: messages.filter(m => m.status === 'responded').length,
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Customer Messages</h1>
        <p className="text-muted-foreground mt-2">
          Manage contact messages from customers ({stats.total} total)
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="text-center">
              <MessageSquare className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">Total Messages</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="text-center">
              <Clock className="w-8 h-8 text-warning mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">New Messages</p>
              <p className="text-2xl font-bold text-warning">{stats.new}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="text-center">
              <Eye className="w-8 h-8 text-info mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">Read</p>
              <p className="text-2xl font-bold text-info">{stats.read}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="text-center">
              <CheckCircle className="w-8 h-8 text-success mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">Responded</p>
              <p className="text-2xl font-bold text-success">{stats.responded}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or message..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-input border-border"
            />
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('all')}
            className="text-sm"
          >
            All
          </Button>
          <Button
            variant={filterStatus === 'new' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('new')}
            className="text-sm"
          >
            <Clock className="w-4 h-4 mr-2" />
            New ({stats.new})
          </Button>
          <Button
            variant={filterStatus === 'read' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('read')}
            className="text-sm"
          >
            <Eye className="w-4 h-4 mr-2" />
            Read ({stats.read})
          </Button>
          <Button
            variant={filterStatus === 'responded' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('responded')}
            className="text-sm"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Responded ({stats.responded})
          </Button>
        </div>
      </div>

      {/* Messages List */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          {filteredMessages.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground">No messages found</p>
            </div>
          ) : (
            <div className="divide-y divide-border overflow-hidden">
              {filteredMessages.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer border-l-4 ${
                    message.status === 'new' ? 'border-l-warning bg-warning/5' :
                    message.status === 'responded' ? 'border-l-success bg-success/5' :
                    'border-l-muted'
                  }`}
                  onClick={() => handleViewMessage(message)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-foreground truncate">{message.name}</h3>
                        <Badge
                          variant="secondary"
                          className={`whitespace-nowrap text-xs ${
                            message.status === 'new' ? 'bg-warning/20 text-warning' :
                            message.status === 'responded' ? 'bg-success/20 text-success' :
                            'bg-info/20 text-info'
                          }`}
                        >
                          {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {message.email}
                      </p>
                      <p className="text-sm text-foreground line-clamp-2">{message.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(message.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message Detail Modal */}
      {isModalOpen && selectedMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl bg-card border-border max-h-[90vh] overflow-auto">
            <CardHeader className="flex items-start justify-between border-b border-border p-6">
              <div className="flex-1">
                <CardTitle className="text-foreground">{selectedMessage.name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {selectedMessage.email}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(selectedMessage.created_at).toLocaleString()}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedMessage(null);
                }}
              >
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-foreground mb-3">Message</h3>
                <div className="bg-muted p-4 rounded-lg text-foreground whitespace-pre-wrap">
                  {selectedMessage.message}
                </div>
              </div>

              {selectedMessage.reply_message && (
                <div>
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    Your Reply
                  </h3>
                  <div className="bg-success/10 p-4 rounded-lg text-foreground whitespace-pre-wrap border-l-4 border-success">
                    {selectedMessage.reply_message}
                  </div>
                  {selectedMessage.replied_at && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Replied on {new Date(selectedMessage.replied_at).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {!selectedMessage.reply_message && (
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Send a Reply</h3>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply message here..."
                    className="w-full p-3 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={5}
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <Badge
                  className={`text-xs ${
                    selectedMessage.status === 'new' ? 'bg-warning text-foreground' :
                    selectedMessage.status === 'responded' ? 'bg-success text-foreground' :
                    'bg-info text-foreground'
                  }`}
                >
                  {selectedMessage.status.charAt(0).toUpperCase() + selectedMessage.status.slice(1)}
                </Badge>
              </div>

              <div className="flex gap-3 flex-wrap">
                {!selectedMessage.reply_message && (
                  <Button
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || isSendingReply}
                    className="bg-success hover:bg-success/90"
                  >
                    {isSendingReply ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Reply
                      </>
                    )}
                  </Button>
                )}
                {selectedMessage.status !== 'responded' && !selectedMessage.reply_message && (
                  <Button
                    onClick={handleMarkAsResponded}
                    className="bg-info hover:bg-info/90"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Responded
                  </Button>
                )}
                <Button
                  onClick={() => handleDeleteMessage(selectedMessage.id)}
                  variant="destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
