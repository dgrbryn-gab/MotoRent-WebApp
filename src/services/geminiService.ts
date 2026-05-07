import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const model = genAI ? genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }) : null;

export interface GeminiIntentResponse {
  intent: string;
  confidence: number;
  reasoning: string;
}

export interface GeminiResponse {
  text: string;
  intent: string;
  confidence: number;
}

/**
 * System prompt for MotoRent chatbot with training examples
 */
const SYSTEM_PROMPT = `You are MotoRent Assistant, an AI chatbot for Dumaguete MotoRent motorcycle rental service in the Philippines.

═══════════════════════════════════════════════════════════════
BUSINESS INFO
═══════════════════════════════════════════════════════════════
- Company: Dumaguete MotoRent
- Location: Dumaguete City, Negros Oriental, Philippines
- Phone: 091234323212
- Email: support@dumagueteMotorAent.com
- Hours: Monday–Sunday, 8:00 AM – 5:00 PM (Philippine Time)
- Services: Motorcycle and scooter rentals for locals and tourists

═══════════════════════════════════════════════════════════════
AVAILABLE MOTORCYCLES & PRICING
═══════════════════════════════════════════════════════════════
SCOOTERS (Best for beginners & city riding):
- Underbone (125cc): ₱200-300/day | Fuel-efficient, reliable
  Example: Yamaha XRay, Honda Wave

SPORT BIKES (Speed & performance):
- Sport (150-250cc): ₱300-400/day | Fast, agile, ideal for experienced riders
  Example: Honda CB150, Yamaha YZF-R15

CRUISERS (Comfort & style):
- Cruiser (500cc+): ₱600-1000/day | Comfortable, great for long rides
  Example: Harley-Davidson Sportster

SPECIAL PACKAGES:
- Weekend (Fri-Sun): 15% discount
- Weekly (7+ days): 20% discount
- Corporate (5+ bikes): 25% discount
- Long-term monthly: 30% discount

═══════════════════════════════════════════════════════════════
RENTAL POLICIES & REQUIREMENTS
═══════════════════════════════════════════════════════════════
ELIGIBILITY:
- Minimum age: 18 years old
- Valid government-issued ID required
- Motorcycle license required for bikes above 125cc
- International license accepted for tourists

FUEL POLICY:
- Full tank provided at pickup
- Return with same fuel level (±5%) or pay ₱50-150 refill charge
- Gas stations nearby for convenience

DAMAGE & LIABILITY:
- Basic insurance: Included (₱10,000 coverage)
- Premium insurance: +₱200/day (₱50,000 coverage)
- Helmets & basic gear: Included
- Late return charges: ₱500 per hour or ₱5,000 per day

CANCELLATION POLICY:
- 24+ hours before pickup: 100% refund (no questions)
- 12-24 hours: 50% refund
- Less than 12 hours: No refund (deposit kept)
- Emergency cancellations: Contact support immediately

═══════════════════════════════════════════════════════════════
WHAT I CAN DO
═══════════════════════════════════════════════════════════════
✅ Check booking status and reservation details
✅ Show available motorcycles with specs and prices
✅ Calculate rental costs for specific dates
✅ Check bike availability for future dates
✅ Answer all rental policy questions
✅ Guide through booking process step-by-step
✅ Recommend bikes based on preferences
✅ Check document verification status
✅ Explain insurance options
✅ Provide local travel tips for Dumaguete
✅ Connect with human support team when needed

═══════════════════════════════════════════════════════════════
WHAT I CANNOT DO
═══════════════════════════════════════════════════════════════
❌ Create or modify bookings directly → Direct to Bookings page
❌ Process refunds directly → Escalate to support@dumagueteMotorAent.com
❌ Guarantee availability → Confirm on website
❌ Override rental policies → Refer to terms
❌ Accept payment → Use website checkout
❌ Handle technical issues → Call 091234323212

═══════════════════════════════════════════════════════════════
RESPONSE GUIDELINES
═══════════════════════════════════════════════════════════════
TONE: Professional, friendly, encouraging, and concise.

FORMAT RULES:
1. Use appropriate emojis (🏍️ for bikes, 💰 for prices, 📅 for dates)
2. Always mention prices in Philippine Peso (₱)
3. Bold important information: **Status: Confirmed**, **Price: ₱300/day**
4. Use bullet points for multiple items
5. Keep responses under 150 words unless detailed info requested
6. When unsure, ask clarifying questions

RESPONSE EXAMPLES:
─────────────────
Q: "How much is a rental?"
A: "It depends on the bike! 🏍️
- Scooters (125cc): ₱200-300/day
- Sport bikes: ₱300-400/day
- Cruisers: ₱600-1000/day
Which type interests you?"

Q: "What's your cancellation policy?"
A: "Great question! 📋 Here's our policy:
- **24+ hours before**: 100% refund ✅
- **12-24 hours**: 50% refund
- **Less than 12h**: No refund
Need to cancel? Contact us ASAP at 091234323212!"

Q: "Can I rent for next weekend?"
A: "Absolutely! 📅 Our weekend special gives 15% discount!
When exactly? Give me dates and I'll check availability for you."

Q: "I'm a beginner, what bike do you recommend?"
A: "Perfect for beginners! 🌟 Start with our **Yamaha XRay (125cc)**:
- ₱250/day | Very stable & fuel-efficient
- Easy to handle | Great for city riding
- Includes helmet & basic insurance
Want me to check availability for specific dates?"
─────────────────

ESCALATION TRIGGERS:
- If user requests refund → "I'll connect you with our team"
- If complaint about service → Offer phone/email contact
- If technical issue → Direct to support team
- If out of scope → "Let me get someone to help"

═══════════════════════════════════════════════════════════════`;

/**
 * Classify user message intent using Gemini
 * Returns the detected intent and confidence level
 */
export async function classifyIntentWithGemini(message: string): Promise<GeminiIntentResponse> {
  if (!model) {
    console.warn('Gemini API not configured, falling back to keyword matching');
    return {
      intent: 'unknown',
      confidence: 0,
      reasoning: 'Gemini API not available'
    };
  }

  try {
    const intentClassificationPrompt = `Classify the following customer message into ONE of these intents and provide confidence level (0-100):

AVAILABLE INTENTS:
- booking_status: User asking about their reservation/booking status
- available_bikes: User asking to see available motorcycles
- bike_pricing: User asking about bike prices or rental rates
- rental_calculator: User asking how much a rental would cost
- availability_check: User asking if specific bike is available on specific dates
- document_status: User asking about document verification
- payment_info: User asking about payments or transactions
- booking_assistance: User needs help making a booking
- recommendations: User asking for bike recommendations
- policies: User asking about rental policies, requirements, cancellation
- contact_agent: User wants to speak with human agent
- cancellation_request: User wants to cancel booking
- location_hours: User asking about office location/hours
- fuel_policy: User asking about fuel
- age_requirements: User asking about age/license requirements
- damage_liability: User asking about damage/accident charges
- helmet_safety: User asking about safety equipment
- delivery_options: User asking about pickup/delivery
- general_help: Generic help request
- unknown: Cannot classify message

Respond in JSON format:
{
  "intent": "intent_name",
  "confidence": 85,
  "reasoning": "Brief explanation why you chose this intent"
}

User Message: "${message}"

RESPOND ONLY WITH VALID JSON, NO MARKDOWN OR EXPLANATION:`;

    const result = await model.generateContent(intentClassificationPrompt);
    const responseText = result.response.text();
    
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid JSON response from Gemini');
    
    const classifiedIntent = JSON.parse(jsonMatch[0]) as GeminiIntentResponse;
    return classifiedIntent;
  } catch (error) {
    console.error('Error classifying intent with Gemini:', error);
    return {
      intent: 'unknown',
      confidence: 0,
      reasoning: 'Error during classification'
    };
  }
}

/**
 * Generate AI response for a user message in conversation context
 */
export async function generateGeminiResponse(
  userMessage: string,
  intent: string,
  context?: {
    bookings?: any[];
    availableBikes?: any[];
    userHistory?: string;
  }
): Promise<GeminiResponse> {
  if (!model) {
    console.warn('Gemini API not configured');
    return {
      text: 'I apologize, but I\m having trouble connecting to my AI service. Please try again shortly.',
      intent,
      confidence: 0
    };
  }

  try {
    const contextStr = context ? `\nContext: ${JSON.stringify(context)}` : '';
    
    const responsePrompt = `${SYSTEM_PROMPT}

USER MESSAGE: "${userMessage}"
DETECTED INTENT: ${intent}${contextStr}

Generate a natural, helpful response. If data is provided in context, use it to answer. 
Keep response concise (under 200 words). Use appropriate emojis and formatting.
If you cannot fully help, offer to connect user with support team.

RESPOND WITH ONLY THE CHATBOT RESPONSE, NO ADDITIONAL EXPLANATION:`;

    const result = await model.generateContent(responsePrompt);
    const responseText = result.response.text().trim();

    return {
      text: responseText,
      intent,
      confidence: 85
    };
  } catch (error) {
    console.error('Error generating Gemini response:', error);
    return {
      text: 'I apologize, but I encountered an error. Could you please rephrase your question?',
      intent,
      confidence: 0
    };
  }
}

/**
 * Format context for multi-turn conversations
 * Keeps track of what the user was discussing
 */
export function buildConversationContext(
  bookings: any[] = [],
  bikes: any[] = [],
  lastMessages: string[] = []
): string {
  const parts: string[] = [];

  if (bookings.length > 0) {
    parts.push(`Recent bookings: ${bookings.length} bookings found`);
  }

  if (bikes.length > 0) {
    parts.push(`Available bikes: ${bikes.length} bikes available`);
  }

  if (lastMessages.length > 0) {
    parts.push(`Recent conversation: ${lastMessages.slice(-2).join(' | ')}`);
  }

  return parts.join('; ');
}

/**
 * Generate response with Retrieval-Augmented Generation (RAG)
 * Retrieves relevant training data to provide better, fact-based responses
 */
export async function generateGeminiResponseWithRAG(
  userMessage: string,
  intent: string,
  context?: {
    bookings?: any[];
    availableBikes?: any[];
    userHistory?: string;
  }
): Promise<GeminiResponse> {
  if (!model) {
    console.warn('Gemini API not configured');
    return {
      text: 'I apologize, but I\m having trouble connecting to my AI service. Please try again shortly.',
      intent,
      confidence: 0
    };
  }

  try {
    // Dynamically import trainingDataService to avoid circular dependency
    const { getRelevantTrainingData } = await import('./trainingDataService');
    
    // Retrieve relevant training examples
    const relevantExamples = await getRelevantTrainingData(userMessage, 3);
    
    // Build training context
    let trainingContext = '';
    if (relevantExamples.length > 0) {
      trainingContext = '\n\nSIMILAR QUESTIONS & ANSWERS FROM OUR TRAINING DATA:\n';
      relevantExamples.forEach((example, index) => {
        trainingContext += `${index + 1}. Q: "${example.question}"\n   A: ${example.answer}\n`;
      });
      trainingContext += '\nUse these as reference for better accuracy.\n';
    }

    const contextStr = context ? `\nContext: ${JSON.stringify(context)}` : '';
    
    const responsePrompt = `${SYSTEM_PROMPT}${trainingContext}

USER MESSAGE: "${userMessage}"
DETECTED INTENT: ${intent}${contextStr}

Generate a natural, helpful response. If data is provided in context or training examples, use it to answer. 
Keep response concise (under 200 words). Use appropriate emojis and formatting.
If you cannot fully help, offer to connect user with support team.

RESPOND WITH ONLY THE CHATBOT RESPONSE, NO ADDITIONAL EXPLANATION:`;

    const result = await model.generateContent(responsePrompt);
    const responseText = result.response.text().trim();

    return {
      text: responseText,
      intent,
      confidence: relevantExamples.length > 0 ? 90 : 85 // Higher confidence with training data
    };
  } catch (error) {
    console.error('Error generating Gemini response with RAG:', error);
    // Fallback to non-RAG version
    return generateGeminiResponse(userMessage, intent, context);
  }
}

/**
 * Check if Gemini is configured and available
 */
export function isGeminiAvailable(): boolean {
  return !!model && !!apiKey;
}

export default {
  classifyIntentWithGemini,
  generateGeminiResponse,
  buildConversationContext,
  isGeminiAvailable
};
