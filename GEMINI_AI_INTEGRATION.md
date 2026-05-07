# 🤖 Google Gemini AI Integration for MotoRent Chatbot

## Overview

Your MotoRent chatbot is now enhanced with **Google Gemini AI** for:
- ✨ More natural language understanding
- 🎯 Better intent classification
- 💬 Context-aware responses
- 🔄 Intelligent conversation flow

---

## Setup Instructions

### Step 1: Get Your Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click **"Create API Key"**
3. Select **"Create API Key in new project"** or use existing project
4. Copy the generated API key

### Step 2: Configure Environment Variables

1. Open `.env.local` in your project root
2. Replace `your_gemini_api_key_here` with your actual API key:

```
VITE_GOOGLE_GEMINI_API_KEY=your_actual_api_key_here
```

3. Save the file

### Step 3: Install Dependencies

Already done! The package was installed when you ran the integration. If needed:

```bash
npm install @google/generative-ai
```

### Step 4: Test the Integration

Restart your development server:

```bash
npm run dev
```

Then test the chatbot with questions like:
- "What bikes are available?"
- "Can I rent for next weekend?"
- "I want to cancel my booking"

---

## Architecture

### New Files Created

**`src/services/geminiService.ts`**
- `classifyIntentWithGemini()` - AI-powered intent detection
- `generateGeminiResponse()` - AI-generated contextual responses
- `buildConversationContext()` - Multi-turn conversation support
- `isGeminiAvailable()` - API availability checker

### Updated Files

**`src/services/chatbotService.ts`**
- Added Gemini imports
- Enhanced `askAI()` method to use Gemini with fallback
- Added `classifyIntentWithAI()` for improved intent classification
- Maintains backward compatibility with keyword-based fallback

---

## How It Works

### Intent Classification Flow

```
User Message
    ↓
Try Gemini AI Classification (if available)
    ↓
    ├─ Success → Use AI result
    └─ Failure → Fall back to keyword matching
    ↓
Process Intent + Generate Response
```

### Response Generation Flow

```
Unknown/Complex Intent
    ↓
Check if Gemini is available
    ↓
    ├─ Yes → Generate with Gemini AI
    │   ├─ Success → Return AI response
    │   └─ Failure → Use fallback
    │
    └─ No → Use Supabase Edge Function or fallback
```

---

## Using Gemini-Enhanced Chatbot

### For Enhanced Intent Classification

```typescript
import { chatbotService } from './services/chatbotService';

// Use AI-powered classification
const result = await chatbotService.classifyIntentWithAI(userMessage);
console.log(`Intent: ${result.intent}, Confidence: ${result.confidence}`);
```

### For Custom AI Responses

```typescript
import { generateGeminiResponse } from './services/geminiService';

const response = await generateGeminiResponse(
  "What's the best bike for beginners?",
  'recommendations',
  {
    availableBikes: [/* bike data */]
  }
);
console.log(response.text); // AI-generated response
```

---

## Configuration Options

### Model Selection

Edit `src/services/geminiService.ts` to change the model:

```typescript
// Change from gemini-2.5-flash to:
const model = genAI.getGenerativeModel({ 
  model: 'gemini-1.5-pro'  // More capable but slower/costlier
});
```

**Available Models:**
- `gemini-2.5-flash` (default) - Latest, fastest, most cost-effective
- `gemini-1.5-pro` - More capable, higher latency
- `gemini-1.5-flash` - Previous generation flash
- `gemini-pro` - Legacy model

### Custom System Prompt

Edit the `SYSTEM_PROMPT` in `geminiService.ts` to customize AI behavior, tone, or policies.

---

## Pricing & Limits

### Google Generative AI (Gemini) API

**Free Tier:**
- 15 requests per minute
- Up to 1.5M tokens per month
- Sufficient for small to medium apps

**Paid Tier:**
- Higher rate limits
- Per-token pricing
- [See pricing](https://ai.google.dev/pricing)

### Monitoring Usage

Check your API usage at [Google AI Studio Dashboard](https://makersuite.google.com/app/monitoring)

---

## Error Handling

The chatbot gracefully handles errors:

1. **Gemini API Error** → Falls back to keyword matching or edge function
2. **No API Key Configured** → Uses keyword-based classification
3. **Rate Limit Hit** → Returns user-friendly error message

Example console logs:
```
[Gemini] Intent classification: "What bikes?" → "available_bikes" (92%)
[Gemini] Intent classification failed, falling back to keyword matching
Gemini API not configured, falling back to keyword matching
```

---

## Security Best Practices

✅ **DO:**
- Keep API key in `.env.local` (never commit to git)
- Use `.gitignore` to exclude `.env.local`
- Rotate API key periodically
- Monitor usage dashboard

❌ **DON'T:**
- Hardcode API keys in source files
- Commit `.env.local` to version control
- Share API key with others
- Use on public/unsecured connections

### Gitignore Configuration

Ensure `.gitignore` contains:
```
.env.local
.env*.local
```

---

## Troubleshooting

### Issue: "Gemini API not configured"

**Solution:** 
1. Check if API key is in `.env.local`
2. Verify key format (should be long string)
3. Restart dev server after adding key

### Issue: API Key Not Recognized

**Solution:**
1. Get new key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Check for trailing spaces in `.env.local`
3. Ensure `VITE_` prefix is correct

### Issue: Rate Limit Errors

**Solution:**
1. Upgrade to paid tier for higher limits
2. Implement request batching
3. Add delays between requests

### Issue: Slow Responses

**Solution:**
1. Use `gemini-1.5-flash` instead of `pro`
2. Reduce context in system prompt
3. Implement response caching

---

## Advanced Usage

### Caching Responses

For frequently asked questions, cache Gemini responses:

```typescript
const responseCache = new Map<string, string>();

async function getCachedResponse(message: string) {
  if (responseCache.has(message)) {
    return responseCache.get(message);
  }
  
  const response = await generateGeminiResponse(message, 'unknown');
  responseCache.set(message, response.text);
  return response.text;
}
```

### Multi-Turn Conversations

Use conversation context for better multi-turn support:

```typescript
const context = {
  bookings: userBookings,
  availableBikes: bikes,
  userHistory: recentMessages.join(' | ')
};

const response = await generateGeminiResponse(message, intent, context);
```

### Custom Training Examples

Provide examples to improve responses:

```typescript
const trainingPrompt = `
Learn from these examples:
Q: "Can I rent for March 15-17?"
A: [Show available bikes with prices for those dates]

Q: "What's your cancellation policy?"
A: [Show MotoRent's cancellation policy]
`;
```

---

## Next Steps

1. ✅ Add your API key to `.env.local`
2. ✅ Restart development server
3. ✅ Test chatbot with various questions
4. ✅ Monitor Gemini API dashboard for usage
5. 📊 Collect user conversation data to train better responses
6. 🎯 Customize system prompt for your business

---

## Support

For issues with:
- **Google Gemini API:** [Google AI Documentation](https://ai.google.dev)
- **MotoRent Chatbot:** Check [CHATBOT_INTEGRATION.md](CHATBOT_INTEGRATION.md)
- **Environment Setup:** Verify `.env.local` configuration

---

## Summary

Your chatbot now has AI-powered natural language understanding! The system:
- ✨ Understands context better
- 💬 Generates more natural responses
- 🔄 Handles complex queries
- ⚡ Falls back gracefully when needed

Enjoy enhanced conversations with your customers! 🎉
