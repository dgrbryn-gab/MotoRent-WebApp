import { useState, useEffect } from 'react';
import { MessageCircle, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { contactService } from '../services/contactService';

interface HelpSupportPageProps {
  user?: { id: string; name: string; email: string; phone?: string };
}

export function HelpSupportPage({ user }: HelpSupportPageProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadMessages();
  }, [user]);

  const loadMessages = async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const allMessages = await contactService.getAllMessages();
      const userMessages = allMessages.filter(m => m.email === user.email);
      setMessages(userMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (!user?.email || !user?.name) {
      toast.error('Please log in to send a message');
      return;
    }

    try {
      setSubmitting(true);
      await contactService.createMessage({
        name: user.name,
        email: user.email,
        message: message
      });

      toast.success('Message sent! We\'ll get back to you soon.');
      setMessage('');
      await loadMessages();
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl text-primary mb-2">Help & Support</h1>
        <p className="text-muted-foreground">Get help with your account, bookings, or any questions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Form */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Send a Message
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Message</label>
                  <Textarea
                    placeholder="Describe your issue or question in detail..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={submitting}
                    rows={4}
                    className="mt-1"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Messages History */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Message History</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 text-muted-foreground mx-auto mb-2 animate-spin" />
                  <p className="text-muted-foreground">Loading messages...</p>
                </div>
              ) : messages.length > 0 ? (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{msg.subject}</h4>
                        <Badge variant={
                          msg.replied_at ? 'default' : 'secondary'
                        }>
                          {msg.replied_at ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Replied
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Pending
                            </>
                          )}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground">{msg.message}</p>

                      {msg.reply_message && (
                        <div className="bg-muted/50 rounded p-3 mt-3">
                          <p className="text-xs font-semibold text-muted-foreground mb-1">Admin Reply:</p>
                          <p className="text-sm">{msg.reply_message}</p>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground pt-2">
                        {new Date(msg.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Messages Yet</h3>
                  <p className="text-muted-foreground">
                    Send a message to get help from our support team
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
