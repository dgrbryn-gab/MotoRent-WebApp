# 🤖 MotoRent Chatbot Integration

## Overview

A fully functional database-driven chatbot has been integrated into the MotoRent system. The chatbot uses natural language processing to understand customer inquiries and queries your database to provide real-time, accurate responses.

---

## ✨ Features

### What the Chatbot Can Do

1. **📅 Check Booking Status**
   - View all reservations
   - See pickup and return dates
   - Track reservation status (pending, confirmed, completed)
   - View total price for each booking

2. **🏍️ Browse Available Motorcycles**
   - List all available bikes
   - Show bike details (type, engine capacity, rating)
   - Display prices per day
   - Help with bike selection

3. **📄 Document Verification Status**
   - Check uploaded document status
   - View submission dates
   - See rejection reasons if applicable
   - Track verification progress

4. **💳 Payment History**
   - View recent transactions
   - See payment amounts
   - Check transaction status
   - Track refunds

5. **❓ FAQ & Policies**
   - Answer cancellation policy questions
   - Explain rental policies
   - Provide contact information
   - Guide through booking process

6. **💬 Conversation History**
   - Persistent chat history in database
   - Retrieve past conversations
   - Track conversation intents

---

## 🏗️ Architecture

### Components Created

#### 1. **ChatWidget Component** (`src/components/ChatWidget.tsx`)
- Reusable chat interface
- Two variants: `floating` (fixed position) and `embedded` (inline)
- Message display with typing indicators
- Real-time message updates
- Responsive design for mobile/desktop

#### 2. **Chatbot Service** (`src/services/chatbotService.ts`)
- Intent classification engine
- Database query functions
- Response formatting
- Conversation history management

#### 3. **Database Table** (`chat_conversations`)
- Stores all conversations
- User-specific isolation via RLS
- Indexed for fast queries
- Includes user input, bot response, and intent

### Intent Classification

The chatbot classifies incoming messages into intents using keyword matching:

```typescript
'booking_status'      → Keywords: booking, reservation, status, where, when, pickup, return
'available_bikes'     → Keywords: available, bike, motorcycle, rent, models
'document_status'     → Keywords: document, license, verification, approved, upload
'payment_info'        → Keywords: payment, pay, price, cost, refund, transaction
'general_help'        → Keywords: help, support, contact, how, cancel, policy
'unknown'            → Falls back to general help menu
```

---

## 🚀 Usage

### For Customers

1. **Login** to the MotoRent app as a customer
2. Look for the **chat bubble** (💬) in the bottom-right corner
3. Click to open the chat widget
4. Type your question naturally:
   - "Where's my booking?"
   - "What bikes are available?"
   - "What's my document status?"
   - "How much was my last payment?"

### For Developers

#### Import the ChatWidget

```tsx
import { ChatWidget } from './components/ChatWidget';

// Floating variant (recommended for main app)
<ChatWidget userId={user.id} variant="floating" />

// Embedded variant (for dedicated chat page)
<ChatWidget userId={user.id} variant="embedded" />
```

#### Use the Chatbot Service

```tsx
import { chatbotService } from '../services/chatbotService';

// Process a message
const response = await chatbotService.processMessage(userId, 'What bikes are available?');
console.log(response.message);  // Formatted response
console.log(response.intent);   // 'available_bikes'

// Get chat history
const history = await chatbotService.getChatHistory(userId, 50);

// Get specific data
const bookings = await chatbotService.getBookingStatus(userId);
const bikes = await chatbotService.getAvailableBikes();
```

---

## 📊 Database Schema

### chat_conversations Table

```sql
CREATE TABLE chat_conversations (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  user_message TEXT NOT NULL,
  bot_response TEXT NOT NULL,
  intent VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Row-Level Security (RLS):**
- ✅ Users can only read their own conversations
- ✅ Users can only insert their own messages
- ✅ Admins can read all conversations (for support)

**Indexes:**
- `user_id` - Fast user lookups
- `timestamp DESC` - Recent messages first
- `user_id, timestamp DESC` - Combined queries

---

## 🎯 Current Response Examples

### Booking Status Query
```
Customer: "Where's my booking?"
Bot: "📅 **Your Latest Booking:**

**Status:** Confirmed
**Pickup:** 03/20/2026
**Return:** 03/22/2026
**Total:** ₱7,200

_You have 3 total bookings._"
```

### Available Bikes Query
```
Customer: "What motorcycles are available?"
Bot: "🏍️ **Available Motorcycles (8):**

**Honda CB150**
• Type: Sport
• Engine: 150cc
• Price: ₱300/day
• Rating: 4.8⭐

**Yamaha XRay 125**
• Type: Underbone
• Engine: 125cc
• Price: ₱250/day
• Rating: 4.5⭐

... (up to 5 bikes shown)

Browse all bikes on our [Catalog](/)"
```

### Document Status Query
```
Customer: "What's my document status?"
Bot: "📄 **Your Documents:**

✅ **DRIVER LICENSE**
Status: Approved

⏳ **VALID ID**
Status: Pending"
```

### Payment History Query
```
Customer: "Show my payments"
Bot: "💳 **Recent Transactions:**

**DEPOSIT** - ₱1,500
Completed • 03/18/2026

**PAYMENT** - ₱7,200
Completed • 03/15/2026"
```

---

## 🔧 Deployment Steps

### 1. Run Database Migration

```bash
# Execute the migration in Supabase dashboard
# File: supabase/migrations/023_chatbot_conversations.sql

# Or via Supabase CLI
supabase migration up
```

### 2. Deploy Code

```bash
# Build and deploy as normal
npm run build
# Deploy to Vercel/Netlify
```

### 3. Test

1. Login as a customer
2. Open the chat widget (bottom-right corner)
3. Type test questions:
   - "Where's my booking?"
   - "What bikes do you have?"
   - "Check my document status"
   - "Show my payments"

---

## 🎨 Customization

### Styling

Edit `src/components/ChatWidget.css` to customize:
- Chat bubble colors
- Message styling
- Animation effects
- Mobile responsiveness

### Intent Classification

Edit `src/services/chatbotService.ts` `classifyIntent()` method to add keywords:

```typescript
classifyIntent(message: string): Intent {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('your_keyword')) {
    return 'your_intent_type';
  }
  // ...
}
```

### Response Formatting

Edit the `format*Response()` methods to customize bot messages:

```typescript
formatBookingResponse(bookings: any[]): string {
  // Customize response format here
  return "Your custom response";
}
```

### Default Help Text

Edit `getGeneralHelp()` method:

```typescript
getGeneralHelp(message: string): string {
  // Add more help options or change defaults
}
```

---

## 📈 Future Enhancements

### Phase 2: AI Integration (Optional)

For more intelligent responses, integrate OpenAI API:

```typescript
async function getAIResponse(message: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: message }],
    }),
  });
  
  const data = await response.json();
  return data.choices[0].message.content;
}
```

### Phase 3: Admin Escalation

Add ability to escalate to human support:

```typescript
async function escalateToAdmin(userId: string, conversationId: string) {
  // Create ticket in admin panel
  // Notify admin of escalation
  // Transfer conversation history
}
```

### Phase 4: Sentiment Analysis

Track customer sentiment from conversations:

```typescript
async function analyzeSentiment(message: string) {
  // Use NLP to determine sentiment
  // Track satisfaction scores
  // Identify issues
}
```

### Phase 5: Analytics Dashboard

Add admin dashboard to view:
- Most common questions
- Chatbot performance metrics
- Customer satisfaction trends
- Escalation patterns

---

## 🐛 Troubleshooting

### Chat Widget Not Appearing
- ✅ Check user is logged in (not on landing/login page)
- ✅ Check `ChatWidget` is imported in `App.tsx`
- ✅ Verify `userId` is passed correctly
- ✅ Check browser console for errors

### Responses Not Showing Data
- ✅ Verify database tables exist (`reservations`, `motorcycles`, etc.)
- ✅ Check RLS policies are set correctly
- ✅ Verify current user has data in tables
- ✅ Check browser network tab for API errors

### Chat History Not Persisting
- ✅ Verify migration 023 was run
- ✅ Check `chat_conversations` table exists
- ✅ Verify RLS policies on table
- ✅ Check user ID matches auth user

### Performance Issues
- ✅ Limit chat history retrieval (default: 50 messages)
- ✅ Add pagination for long conversations
- ✅ Cache frequent queries
- ✅ Consider implementing search history cleanup

---

## 📝 Files Created/Modified

### Created
```
✅ src/services/chatbotService.ts         - Core chatbot logic
✅ src/components/ChatWidget.tsx          - UI component
✅ src/components/ChatWidget.css          - Styling
✅ supabase/migrations/023_chatbot_conversations.sql - Database
```

### Modified
```
✅ src/App.tsx                            - Added ChatWidget import & integration
```

---

## 📚 Related Documentation

- [Database Schema](DATABASE_SCHEMA.md) - Complete database structure
- [Deployment Guide](DEPLOYMENT_CHECKLIST.md) - Production setup
- [Services Documentation](src/services/) - Service layer reference

---

## ✅ Status

- ✅ Database schema created
- ✅ Service layer implemented
- ✅ UI component built
- ✅ Integrated into App
- ✅ Build verified (passing)
- ✅ Ready for production

**Next Steps:**
1. Run migration: `supabase migration up`
2. Deploy to production
3. Test with real users
4. Monitor chatbot metrics
5. Gather feedback for improvements
