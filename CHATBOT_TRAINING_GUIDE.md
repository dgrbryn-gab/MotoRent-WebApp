# 🎓 Chatbot AI Training Guide

Your MotoRent chatbot now has a complete training infrastructure! Here's how to use it.

---

## 🚀 Quick Start

### Step 1: Run Database Migrations

Apply the new database tables:

```bash
# In Supabase Dashboard or via CLI:
# Apply migration 025_create_chatbot_training_tables.sql
# Apply migration 026_seed_chatbot_training_data.sql
```

This creates:
- `chatbot_training_data` table (30+ Q&A examples included)
- `chatbot_feedback` table (for user ratings)
- Necessary indexes and RLS policies

### Step 2: Use RAG-Enhanced Responses

The system now uses **Retrieval-Augmented Generation (RAG)**:

1. User asks question
2. System retrieves relevant training examples
3. Gemini AI uses examples to provide accurate answer
4. Response is more reliable & fact-based

---

## 📚 Training Data Management

### Adding New Training Examples

```typescript
import { addTrainingData } from './services/trainingDataService';

// Add a new Q&A pair
await addTrainingData({
  question: 'What bikes are best for long rides?',
  answer: 'For long rides, cruisers are best! They offer maximum comfort. Our Harley-Davidson (₱800/day) is perfect with extra insurance recommended.',
  intent: 'recommendations',
  category: 'recommendations',
  confidence: 95
});
```

### Finding Poor Responses

Identify questions your bot struggles with:

```typescript
import { findUnhandledQueries } from './services/trainingDataService';

// Get the most common unhandled questions
const unhandled = await findUnhandledQueries(20);
console.log('Questions to train on:', unhandled);

// Result example:
// [
//   { user_message: "Can I ride with a learner's permit?", frequency: 5 },
//   { user_message: "What if I damage the bike?", frequency: 3 }
// ]
```

Then add these as training data to improve future responses.

### Deactivating Incorrect Answers

```typescript
import { deactivateTrainingData } from './services/trainingDataService';

// Hide incorrect training data (instead of deleting)
await deactivateTrainingData(12); // by training data ID
```

---

## 📊 Performance Monitoring

### Check Bot Stats

```typescript
import { getChatbotStats } from './services/trainingDataService';

// Get overall chatbot performance
const stats = await getChatbotStats();
console.log('Chatbot Stats:', stats);

// Output:
// {
//   totalConversations: 245,
//   intents: [
//     { intent: 'available_bikes', count: 85 },
//     { intent: 'booking_status', count: 62 },
//     ...
//   ],
//   unknownIntents: 8  // Should be low!
// }
```

### User Feedback Analysis

```typescript
import { getFeedbackStats } from './services/trainingDataService';

// Get quality metrics
const feedback = await getFeedbackStats();
console.log('Feedback Stats:', feedback);

// Output:
// {
//   avgRating: "4.2",
//   totalFeedback: 156,
//   distribution: { 5: 89, 4: 42, 3: 15, 2: 8, 1: 2 }
// }
```

Low ratings? Find which responses to improve.

---

## 🔄 RAG (Retrieval-Augmented Generation)

### How RAG Works

```
User Query
    ↓
Retrieve Similar Training Examples (Top 3)
    ↓
Gemini AI reads examples + system prompt
    ↓
Generates response grounded in training data
    ↓
Higher accuracy & consistency
```

### Using RAG in Responses

The chatbot automatically uses RAG for unknown intents:

```typescript
// In chatbotService.ts
case 'unknown': {
  responseText = await this.askAI(sanitized, context);
  // Automatically retrieves training data via RAG
}
```

Or manually use RAG-enhanced generation:

```typescript
import { generateGeminiResponseWithRAG } from './services/geminiService';

const response = await generateGeminiResponseWithRAG(
  'Can I rent for a wedding event?',
  'booking_assistance',
  { userHistory: 'Previous conversation context' }
);
```

---

## 👥 Collecting User Feedback

### Save Rating After Response

```typescript
import { saveChatbotFeedback } from './services/trainingDataService';

// User rates bot response
await saveChatbotFeedback({
  bot_response: 'Here are our available bikes: ...',
  rating: 5,  // 1-5 stars
  user_comment: 'Very helpful!',
  helpful: true
});
```

### Add Feedback Widget to ChatWidget

```tsx
// In ChatWidget.tsx
{message.sender === 'bot' && (
  <div className="feedback-buttons">
    <button onClick={() => rateFeedback(message.id, 5)}>👍</button>
    <button onClick={() => rateFeedback(message.id, 1)}>👎</button>
  </div>
)}
```

---

## 📋 Training Workflow

### Weekly Training Cycle

**Monday:** Check unhandled queries
```typescript
const unhandled = await findUnhandledQueries(20);
// Review these manually
```

**Tuesday-Thursday:** Add missing training data
```typescript
for (const query of reviewedQueries) {
  await addTrainingData({
    question: query.question,
    answer: 'Your carefully crafted answer',
    intent: query.intent,
    category: 'appropriate_category',
    confidence: 95
  });
}
```

**Friday:** Review feedback stats
```typescript
const stats = await getChatbotStats();
const feedback = await getFeedbackStats();
// Identify low-rated responses to improve
```

---

## 🎯 Categories & Intents

### Recommended Categories

- `pricing` - Costs, discounts, payment
- `policies` - Cancellation, requirements, rules
- `booking` - How to book, availability
- `requirements` - Age, documents, eligibility
- `insurance` - Coverage, claims
- `maintenance` - Fuel, care, damage
- `documents` - Uploads, verification
- `payment` - Methods, transactions
- `support` - Contact, hours, location
- `recommendations` - Bike selection
- `special` - Corporate, long-term, events
- `general` - General help, what I do

### Intent Types

Match with `type Intent` in chatbotService.ts:
- `booking_status`, `available_bikes`, `bike_pricing`
- `rental_calculator`, `availability_check`
- `document_status`, `payment_info`
- `booking_assistance`, `recommendations`
- `policies`, `contact_agent`
- And 10+ more...

---

## 🔧 Advanced Usage

### Fine-tune System Prompt

Edit `SYSTEM_PROMPT` in geminiService.ts for:
- Tone adjustments (more formal/casual)
- Business-specific rules
- Response format preferences
- Emoji usage

Example:
```typescript
const SYSTEM_PROMPT = `
Your updated instructions here...
Include more examples for areas where bot struggles
`;
```

### Implement Feedback Loop

Auto-improve based on ratings:

```typescript
async function autoRetrainFromFeedback() {
  // Get low-rated responses
  const feedback = await supabase
    .from('chatbot_feedback')
    .select('bot_response, user_comment')
    .lt('rating', 3);
  
  // Analyze patterns and notify admin
  console.log('Poor responses to improve:', feedback.data);
}

// Run weekly
setInterval(autoRetrainFromFeedback, 7 * 24 * 60 * 60 * 1000);
```

### Build Knowledge Base Admin Panel

Create a dashboard to:
- View all training data
- Edit Q&A pairs
- Add/remove examples
- Monitor performance
- Review feedback

---

## 📈 Expected Improvements

### Before Training System
- ❌ Generic responses
- ❌ High "unknown intent" rate
- ❌ Inconsistent answers
- ❌ Limited context awareness

### After Training System
- ✅ Accurate, fact-based responses
- ✅ <5% unknown intent rate
- ✅ Consistent, branded tone
- ✅ Context-aware, multi-turn support
- ✅ Continuous improvement cycle

---

## 🐛 Troubleshooting

### Training Data Not Being Retrieved

**Problem:** RAG isn't improving responses

**Solution:**
1. Check database has data: `SELECT COUNT(*) FROM chatbot_training_data WHERE active = true;`
2. Verify text search index: `CREATE INDEX idx_training_search ON chatbot_training_data USING gin(to_tsvector('english', question));`
3. Check service imports are correct

### Low Feedback Ratings

**Problem:** Users rating responses poorly

**Solution:**
1. Review lowest-rated responses
2. Check if examples conflict with policies
3. Update training data with better answers
4. A/B test new response formats

### Slow Response Generation

**Problem:** RAG taking too long

**Solution:**
1. Limit retrieval to top 3 examples (not 5+)
2. Cache frequent queries
3. Use `gemini-2.5-flash` (already set)
4. Consider indexing on category too

---

## 📞 Getting Help

- **Database Issues:** Check Supabase dashboard
- **Gemini Errors:** Review GEMINI_AI_INTEGRATION.md
- **Training Data:** Add better examples for struggling intents
- **Performance:** Monitor with getChatbotStats()

---

## ✅ Checklist

Before going live:
- [ ] Run database migrations
- [ ] Seed initial 30 training examples
- [ ] Test RAG responses
- [ ] Set up feedback collection
- [ ] Monitor stats for 1 week
- [ ] Address low-rated responses
- [ ] Add custom training data for your business
- [ ] Schedule weekly review cycle

---

## 🎉 You're Ready!

Your chatbot now learns and improves over time. The more training data and feedback you collect, the smarter it gets!

**Next Steps:**
1. Deploy migrations to production
2. Monitor performance daily first week
3. Collect user feedback
4. Add domain-specific training data
5. Celebrate smarter responses! 🚀
