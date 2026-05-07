import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, RotateCcw } from 'lucide-react';
import { chatbotService, QuickAction } from '../services/chatbotService';
import { Button } from './ui/button';
import { Input } from './ui/input';
import './ChatWidget.css';

export interface ChatWidgetProps {
  userId: string;
  variant?: 'floating' | 'embedded';
  onNavigate?: (page: string) => void;
}

interface ConversationMessage {
  id: string;
  sender: 'user' | 'bot';
  message: string;
  timestamp: Date;
  quickActions?: QuickAction[];
}

export const ChatWidget = ({ userId, variant = 'floating', onNavigate }: ChatWidgetProps) => {
  const [isOpen, setIsOpen] = useState(variant === 'embedded');
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  // Fix P7 — Dynamic unread badge count
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // M3 — isOpenRef prevents stale-closure bug in sendMessage
  const isOpenRef = useRef(isOpen);
  useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);
  const onNavigateRef = useRef(onNavigate);
  useEffect(() => { 
    onNavigateRef.current = onNavigate; 
  }, [onNavigate]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const restartConversation = async () => {
    setMessages([]);
    setInputValue('');
    setHasGreeted(false);
    chatbotService.clearConversationContext(userId);
    
    // Add fresh greeting with standard quick actions
    const greetingId = `greeting-${Date.now()}`;
    setMessages([
      {
        id: greetingId,
        sender: 'bot',
        message: `Hi there! I'm your MotoRent assistant. I can help you check bike availability, pricing, booking status, and more. What can I help you with today?`,
        timestamp: new Date(),
        quickActions: [
          { label: 'Available bikes', action: 'available_bikes', type: 'primary' },
          { label: 'Pricing', action: 'bike_pricing', type: 'secondary' },
          { label: 'How to book', action: 'booking_assistance', type: 'secondary' },
          { label: 'Requirements', action: 'age_requirements', type: 'secondary' }
        ]
      },
    ]);
    setHasGreeted(true);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await chatbotService.getChatHistory(userId, 20);
        const conversationMessages: ConversationMessage[] = [];

        // Fix P13 — Unique IDs prevent React key collisions
        history.forEach((msg) => {
          conversationMessages.push({
            id: msg.id ? `user-${msg.id}` : `user-${msg.timestamp}-${Math.random()}`,
            sender: 'user',
            message: msg.message,        // ChatMessage.message = user's text
            timestamp: new Date(msg.timestamp || ''),
          });

          conversationMessages.push({
            id: msg.id ? `bot-${msg.id}` : `bot-${msg.timestamp}-${Math.random()}`,
            sender: 'bot',
            message: msg.response,       // ChatMessage.response = bot's reply
            timestamp: new Date(msg.timestamp || ''),
          });
        });

        setMessages(conversationMessages);
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    };

    if (isOpen && !hasGreeted) {
      loadHistory();
      setHasGreeted(true);
    }
  }, [isOpen, userId, hasGreeted]);

  // Add personalized greeting on open
  useEffect(() => {
    if (isOpen && messages.length === 0 && hasGreeted) {
      const greetingId = `greeting-${Date.now()}`;
      setMessages([
        {
          id: greetingId,
          sender: 'bot',
          message: `Hi there! I'm your MotoRent assistant. I can help you check bike availability, pricing, booking status, and more. What can I help you with today?`,
          timestamp: new Date(),
          quickActions: [
            { label: 'Available bikes', action: 'available_bikes', type: 'primary' },
            { label: 'Pricing', action: 'bike_pricing', type: 'secondary' },
            { label: 'How to book', action: 'booking_assistance', type: 'secondary' },
            { label: 'Requirements', action: 'age_requirements', type: 'secondary' }
          ]
        },
      ]);
    }
  }, [hasGreeted, isOpen, messages.length, userId]);

  const sendMessage = async (text: string) => {
  if (!text.trim()) return;

  const userMessage: ConversationMessage = {
    id: `user-${Date.now()}`,
    sender: 'user',
    message: text,
    timestamp: new Date(),
  };

  setMessages((prev) => [...prev, userMessage]);
  setIsLoading(true);

  try {
    const response = await chatbotService.processMessage(userId, text);

    const botMessage: ConversationMessage = {
      id: `bot-${Date.now()}`,
      sender: 'bot',
      message: response.message,
      timestamp: new Date(),
      quickActions: response.quickActions,
    };

    setMessages((prev) => [...prev, botMessage]);
    if (!isOpenRef.current) setUnreadCount((prev) => prev + 1);

    await chatbotService.saveMessage(userId, text, response.message, response.intent);
  } catch (error) {
    console.error('Error sending message:', error);
    setMessages((prev) => [...prev, {
      id: `error-${Date.now()}`,
      sender: 'bot',
      message: 'Sorry, something went wrong. Please try again.',
      timestamp: new Date(),
    }]);
  } finally {
    setIsLoading(false);
  }
};

  

  // L1 — Dead commented code removed
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputValue.trim();
    setInputValue('');
    await sendMessage(text);
  };

  const handleQuickAction = async (action: string, label: string) => {
    // Fix P8 — External link actions (open in new tab)
    const externalLinks: { [key: string]: string } = {
      'map_directions': 'https://maps.google.com/?q=Calinog+Iloilo+Philippines',
      'contact_phone': 'tel:+63352253151',
      'contact_email': 'mailto:support@motorent.com',
    };
    if (externalLinks[action]) {
      window.open(externalLinks[action], '_blank', 'noopener,noreferrer');
      return;
    }

    // H4 — Internal page navigation: book_bike/cheapest/premium now navigate to home
    const navigationActions: { [key: string]: string } = {
      'open_catalog': 'home',
      'book_bike': 'home',
      'book_cheapest': 'home',
      'book_premium': 'home',
      // NOTE: browse_bikes intentionally NOT here — shows bikes in chat
      'upload_docs': 'reservations',
      'download_receipt': 'transactions',
      'view_reservations': 'reservations',
      'view_profile': 'profile',
      'view_favorites': 'favorites',
      'help': 'help-support',
    };
    if (navigationActions[action] && onNavigate) {
      onNavigate(navigationActions[action]);
      return;
    }

    // All other actions: send as a chat message
    const actionMessageMap: { [key: string]: string } = {
      'pricing': 'show bike prices',
      'bike_pricing': 'show bike prices',
      'browse_bikes': 'show available bikes',
      'rental_calculator': 'Calculate rental cost',
      'view_booking': 'Show my bookings',
      'check_booking': 'Check my booking status',
      'doc_help': 'I need help with document verification',
      'all_payments': 'Show my payment history',
      'filter_sport': 'Show me sport bikes',
      'filter_budget': 'Show me budget-friendly bikes',
      'check_dates': 'Check availability for different dates',
      'contact_support': 'How do I contact support?',
      'recommendations': 'Show me personalized recommendations',
      'insurance_info': 'Tell me about insurance coverage',
      'booking_today': 'I want to ride today',
      'booking_tomorrow': 'I want to ride tomorrow',
      'booking_assistance': 'Help me book a motorcycle',
      'see_more_options': 'Show me more motorcycle options',
      'more_options': 'Show me more motorcycle options',
      'how_to_book': 'Help me book a motorcycle',
    };

    const messageToSend = actionMessageMap[action] || label;
    await sendMessage(messageToSend);
  };

  const normalizeUrl = (url: string): string => {
    try {
      // Handle relative paths directly
      if (url.startsWith('/')) {
        return url.split('?')[0].split('#')[0].replace(/\/$/, '') || '/';
      }
      // Handle absolute URLs
      const parsed = new URL(url, window.location.origin);
      const path = parsed.pathname
        .split('?')[0]
        .split('#')[0]
        .replace(/\/$/, '');
      return path || '/';
    } catch {
      return url.split('?')[0].split('#')[0] || '/';
    }
  };

  // Fix P11 — Render **bold** markdown inline
  const renderMarkdown = (
    text: string
  ): React.ReactNode[] => {
    if (!text) return [];

    // H6-D + M1: arr param for conditional <br />, robust URL parsing
    return text.split('\n').map((line, lineIdx, arr) => {
      const parts = line.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);

      return (
        <span key={lineIdx}>
          {parts.map((part, partIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={partIdx}>{part.slice(2, -2)}</strong>;
            }

            const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
            if (linkMatch) {
              const linkLabel = linkMatch[1];
              const linkUrl = linkMatch[2];

              const resolvedPath = normalizeUrl(linkUrl);

              const internalRoutes: { [key: string]: string } = {
                '': 'home',
                '/': 'home',
                '/bikes': 'home',
                '/calculator': 'home',
                '/booking': 'home',
                '/documents': 'reservations',
                '/transactions': 'transactions',
                '/reservations': 'reservations',
                '/favorites': 'favorites',
                '/help': 'help-support',
                '/profile': 'profile',
              };

              const internalRoute = internalRoutes[resolvedPath];

              if (internalRoute) {
                return (
                  <button
                    key={partIdx}
                    type="button"
                    className="chat-link"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      if (onNavigateRef.current) {
                        onNavigateRef.current(internalRoute);
                      }
                    }}
                  >
                    {linkLabel}
                  </button>
                );
              }

              return (
                <a
                  key={partIdx}
                  href={linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="chat-link"
                >
                  {linkLabel}
                </a>
              );
            }

            return <span key={partIdx}>{part}</span>;
          })}
          {/* M1 — No trailing <br /> on the last line */}
          {lineIdx < arr.length - 1 && <br />}
        </span>
      );
    });
  };

  const renderMessage = (msg: ConversationMessage) => {
    const formattedMessage = renderMarkdown(msg.message ?? '');

    return (
      <div key={msg.id}>
        <div
          className={`chat-message ${msg.sender}-message`}
        >
          <div
            className={`message-bubble ${msg.sender === 'bot' ? 'bot-bubble' : 'user-bubble'}`}
            style={{ pointerEvents: 'auto' }}
          >
            <div 
              className="message-content"
              style={{ pointerEvents: 'auto' }}
            >
              {formattedMessage}
            </div>
            <span className="message-time">
              {/* M4 — Philippine Standard Time */}
              {msg.timestamp.toLocaleTimeString('en-PH', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Asia/Manila',
              })}
            </span>
          </div>
        </div>
        
        {/* Render quick action buttons for bot messages */}
        {msg.sender === 'bot' && msg.quickActions && msg.quickActions.length > 0 && (
          <div className="quick-actions-container">
            {/* M2 — Stable key prevents React reconciliation flicker */}
            {msg.quickActions.map((action) => (
              <button
                key={`${msg.id}-qa-${action.action}`}
                type="button"
                className={`quick-action-btn ${action.type || 'secondary'}`}
                onClick={() => handleQuickAction(action.action, action.label)}
                disabled={isLoading}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (variant === 'embedded') {
    return (
      <div className="chat-widget-embedded">
        <div className="chat-header">
          <h3>MotoRent Support</h3>
          {/* L2 — type=button prevents accidental form submit */}
          <button
            type="button"
            onClick={restartConversation}
            className="refresh-button"
            aria-label="Restart conversation"
            title="Restart conversation"
          >
            <RotateCcw size={18} />
          </button>
          <p className="header-subtitle">Average response: Instant</p>
        </div>

        <div className="chat-messages-container">
          {messages.length === 0 ? (
            <div className="empty-state">
              <MessageCircle size={32} />
              <p>Start a conversation</p>
            </div>
          ) : (
            <>
              {messages.map(renderMessage)}
              {isLoading && (
                <div className="chat-message bot-message">
                  <div className="message-bubble bot-bubble">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <form onSubmit={handleSendMessage} className="chat-input-form">
          <div className="input-wrapper">
            <Input
              type="text"
              placeholder="Type your question..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
              className="chat-input"
            />
            <Button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              size="icon"
              className="send-button"
            >
              <Send size={18} />
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // Floating variant
  return (
    <div className={`chat-widget-floating ${isOpen ? 'open' : 'closed'}`}>
      {isOpen && (
        <div className="chat-bubble-container">
          <div className="chat-header">
            <h3>MotoRent Support</h3>
            <div className="header-buttons">
              {/* L2 — type=button on both floating header buttons */}
              <button
                type="button"
                onClick={restartConversation}
                className="refresh-button"
                aria-label="Restart conversation"
                title="Restart conversation"
              >
                <RotateCcw size={18} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="close-button"
                aria-label="Close chat"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="chat-messages-container">
            {messages.length === 0 ? (
              <div className="empty-state">
                <MessageCircle size={32} />
                <p>Start a conversation</p>
              </div>
            ) : (
              <>
                {messages.map(renderMessage)}
                {isLoading && (
                  <div className="chat-message bot-message">
                    <div className="message-bubble bot-bubble">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          <form onSubmit={handleSendMessage} className="chat-input-form">
            <div className="input-wrapper">
              <Input
                type="text"
                placeholder="Type your question..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
                className="chat-input"
              />
              <Button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                size="icon"
                className="send-button"
              >
                <Send size={18} />
              </Button>
            </div>
          </form>
        </div>
      )}

      {!isOpen && (
        <button
          onClick={() => { setIsOpen(true); setUnreadCount(0); }}
          className="chat-fab"
          aria-label="Open MotoRent chat assistant"
          title="Chat with Moto — MotoRent Assistant"
        >
          <MessageCircle size={24} />
          {/* Fix P7 — Dynamic badge: only show when there are unread messages */}
          {unreadCount > 0 && (
            <span className="badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </button>
      )}
    </div>
  );
};
