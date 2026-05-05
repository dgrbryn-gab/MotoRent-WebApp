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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

        history.forEach((msg) => {
          conversationMessages.push({
            id: msg.id || `user-${msg.timestamp}`,
            sender: 'user',
            message: msg.user_message,
            timestamp: new Date(msg.timestamp || ''),
          });

          conversationMessages.push({
            id: `bot-${msg.timestamp}`,
            sender: 'bot',
            message: msg.bot_response,
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim()) return;

    // Add user message
    const userMessageId = `user-${Date.now()}`;
    const userMessage: ConversationMessage = {
      id: userMessageId,
      sender: 'user',
      message: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Get bot response
      const response = await chatbotService.processMessage(userId, inputValue);

      // Add bot message with quick actions
      const botMessageId = `bot-${Date.now()}`;
      const botMessage: ConversationMessage = {
        id: botMessageId,
        sender: 'bot',
        message: response.message,
        timestamp: new Date(),
        quickActions: response.quickActions,
      };

      setMessages((prev) => [...prev, botMessage]);

      // Save to database
      await chatbotService.saveMessage(userId, inputValue, response.message, response.intent);
    } catch (error) {
      console.error('Error sending message:', error);

      const errorMessage: ConversationMessage = {
        id: `error-${Date.now()}`,
        sender: 'bot',
        message:
          "Sorry, I encountered an error processing your request. Please try again or contact support.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (action: string, label: string) => {
    // Navigation actions that don't send a message
    const navigationActions: { [key: string]: string } = {
      'open_catalog': 'home',
      'browse_bikes': 'home',
      'book_bike': 'booking',
    };

    // If this is a navigation action, navigate instead of sending a message
    if (navigationActions[action] && onNavigate) {
      onNavigate(navigationActions[action]);
      return;
    }

    // Handle different quick action types that send messages
    const actionMessageMap: { [key: string]: string } = {
      'browse_bikes': 'Show me available bikes',
      'rental_calculator': 'Calculate rental cost',
      'book_bike': 'I want to book a bike',
      'view_booking': 'Show my bookings',
      'check_booking': 'Check my booking status',
      'upload_docs': 'Help me upload documents',
      'doc_help': 'I need help with document verification',
      'all_payments': 'Show my payment history',
      'download_receipt': 'Download receipt',
      'filter_sport': 'I like sport bikes',
      'filter_budget': 'Show me budget-friendly bikes',
      'book_cheapest': 'Book the cheapest bike',
      'book_premium': 'Book the premium bike',
      'check_dates': 'Check availability for different dates',
      'contact_support': 'How do I contact support?',
      'open_catalog': 'Open the bike catalog',
      'recommendations': 'Show me personalized recommendations'
    };

    const messageToSend = actionMessageMap[action] || label;
    setInputValue(messageToSend);
    
    // Simulate sending the message
    setTimeout(() => {
      const formElement = document.querySelector('.chat-input-form') as HTMLFormElement;
      if (formElement) {
        formElement.dispatchEvent(new Event('submit', { bubbles: true }));
      }
    }, 100);
  };

  const renderMessage = (msg: ConversationMessage) => {
    const formattedMessage = msg.message
      .split('\n')
      .map((line, idx) => (
        <span key={idx}>
          {line}
          <br />
        </span>
      ));

    return (
      <div key={msg.id}>
        <div
          className={`chat-message ${msg.sender}-message`}
        >
          <div
            className={`message-bubble ${msg.sender === 'bot' ? 'bot-bubble' : 'user-bubble'}`}
          >
            <p className="message-text">{formattedMessage}</p>
            <span className="message-time">
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
        
        {/* Render quick action buttons for bot messages */}
        {msg.sender === 'bot' && msg.quickActions && msg.quickActions.length > 0 && (
          <div className="quick-actions-container">
            {msg.quickActions.map((action, idx) => (
              <button
                key={idx}
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
          <button
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
              <button
                onClick={restartConversation}
                className="refresh-button"
                aria-label="Restart conversation"
                title="Restart conversation"
              >
                <RotateCcw size={18} />
              </button>
              <button
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
          onClick={() => setIsOpen(true)}
          className="chat-fab"
          aria-label="Open chat"
        >
          <MessageCircle size={24} />
          <span className="badge">1</span>
        </button>
      )}
    </div>
  );
};
