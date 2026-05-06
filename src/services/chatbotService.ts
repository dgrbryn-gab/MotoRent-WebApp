import { supabase } from '../lib/supabase';

export interface ChatMessage {
  id?: string;
  user_id: string;
  message: string;
  response: string;
  intent: string;
  timestamp?: string;
  conversation_id?: string;
}

export interface QuickAction {
  label: string;
  action: string;
  type?: 'primary' | 'secondary';
}

export interface ChatResponse {
  message: string;
  intent: string;
  data?: any;
  quickActions?: QuickAction[];
  contextData?: {
    currentBike?: any;
    currentDates?: { start: Date; end: Date };
    lastIntent?: string;
  };
}

// Intent types
type Intent = 'booking_status' | 'available_bikes' | 'document_status' | 'payment_info' | 'bike_pricing' | 'rental_calculator' | 'booking_assistance' | 'availability_check' | 'general_help' | 'recommendations' | 'promotions' | 'insurance_info' | 'contact_agent' | 'cancellation_request' | 'location_hours' | 'fuel_policy' | 'age_requirements' | 'damage_liability' | 'helmet_safety' | 'delivery_options' | 'unknown';

// Conversation context storage (per user session)
const conversationContexts = new Map<string, any>();

// ============================================================
// MOTOBOT PERSONA — Single source of truth for bot identity
// ============================================================
export const MOTOBOT_PERSONA = {
  name: 'Moto',
  role: 'MotoRent AI Assistant',
  tone: 'friendly, helpful, and professional',
  businessInfo: {
    name: 'MotoRent',
    location: 'Calinog, Iloilo, Philippines',
    phone: '(035) 225-3151',
    email: 'support@motorent.com',
    hours: 'Monday–Sunday, 8:00 AM – 8:00 PM (Holidays: 9 AM – 6 PM)',
  },
  policies: {
    minAge: 18,
    cancellation: {
      fullRefund: '24+ hours before pickup (100% refund)',
      halfRefund: '12–24 hours before pickup (50% refund)',
      noRefund: 'Less than 12 hours before pickup (no refund)',
    },
    lateReturn: '₱200/hour (first 2 hrs), ₱500/hour thereafter',
    fuelPolicy: 'Full-to-full — bikes delivered full, must return full',
    insuranceIncluded: 'Basic accident coverage included; Premium upgrade +₱300/day',
    helmetsIncluded: true,
  },
  bookingRequirements: [
    'Valid motorcycle driver\'s license',
    'Government-issued ID (passport or national ID)',
    'Minimum age: 18 years old',
    'At least 1 year of riding experience',
    'Cash deposit required at pickup',
  ],
  capabilities: [
    'Check your booking status',
    'Show available motorcycles',
    'Calculate rental costs instantly',
    'Check bike availability for specific dates',
    'Explain rental policies',
    'Guide you step-by-step through booking',
    'Check your document verification status',
    'Show your payment history',
    'Connect you with support',
  ],
  cannotDo: [
    'Create or modify bookings directly — use the Bookings page',
    'Process or issue refunds directly',
    'Override any cancellation policy',
    'Guarantee availability without a confirmed booking',
  ],
  greeting: {
    new: `👋 Hey there! I\'m **Moto**, your MotoRent assistant! 🏍️\n\nHere\'s what I can help you with:\n\n🏍️ **Browse bikes** — fleet, pricing & availability\n📅 **Your bookings** — status, pickups & returns\n💰 **Rental quotes** — instant cost breakdown\n📋 **Requirements** — licenses, age rules & documents\n🛡️ **Policies** — fuel, insurance, cancellation & damage\n\nWhat can I help you with today?`,
    returning: (count: number) =>
      `👋 Welcome back! You\'ve rented with us **${count} time${count !== 1 ? 's' : ''}** — thanks for choosing MotoRent! 🏍️\n\nWhat can I help you with today?`,
  },
  fallback: `I\'m not sure I understood that, but I\'m here to help! 😊\n\nHere\'s what I can assist with:\n\n🏍️ **Browse bikes** — "What motorcycles do you have?"\n💰 **Get a quote** — "How much for a Honda for 3 days?"\n📅 **Check availability** — "Is anything available March 25?"\n📋 **Your bookings** — "Show my reservation"\n❓ **Policies** — "What\'s your cancellation policy?"\n📞 **Human support** — "I need to speak to someone"\n\nOr just type your question — I\'ll do my best! 🤖`,
  humanHandoff: `I\'ll connect you with our support team right away! 👨‍💼\n\n📱 **Call:** (035) 225-3151\n📧 **Email:** support@motorent.com\n⏰ **Hours:** Mon–Sun, 8 AM – 8 PM\n📍 **Visit:** MotoRent Shop, Calinog, Iloilo\n\n_Average call response: under 2 minutes_ ⚡`,
};

// ============================================================
// RATE LIMITER — Max 15 messages per user per minute
// ============================================================
const messageRateLimiter = new Map<string, number[]>();

function isRateLimited(userId: string, maxPerMinute = 15): boolean {
  const now = Date.now();
  const timestamps = messageRateLimiter.get(userId) || [];
  const recent = timestamps.filter((t) => now - t < 60_000);
  recent.push(now);
  messageRateLimiter.set(userId, recent);
  return recent.length > maxPerMinute;
}

// ============================================================
// INPUT SANITIZER — Strip HTML, trim, cap at 500 chars
// ============================================================
function sanitizeInput(input: string): string {
  return input
    .replace(/<[^>]*>/g, '') // strip HTML tags
    .trim()
    .substring(0, 500);
}

// Utility: Fuzzy string matching for better NLP
function fuzzyMatch(query: string, targets: string[]): string | null {
  const lowerQuery = query.toLowerCase();
  let bestMatch = null;
  let bestScore = 0;

  for (const target of targets) {
    const lowerTarget = target.toLowerCase();
    // Calculate similarity score
    let score = 0;
    let queryIdx = 0;

    for (let i = 0; i < lowerTarget.length && queryIdx < lowerQuery.length; i++) {
      if (lowerTarget[i] === lowerQuery[queryIdx]) {
        score++;
        queryIdx++;
      }
    }

    const matchPercentage = queryIdx === lowerQuery.length ? (score / lowerTarget.length) * 100 : 0;
    if (matchPercentage > bestScore) {
      bestScore = matchPercentage;
      bestMatch = target;
    }
  }

  return bestScore > 40 ? bestMatch : null;
}

// Better date parsing
function parseFlexibleDate(dateStr: string): Date | null {
  const lowerStr = dateStr.toLowerCase();
  const now = new Date();

  // Today
  if (lowerStr.includes('today')) return now;

  // Tomorrow
  if (lowerStr.includes('tomorrow')) {
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    return tomorrow;
  }

  // Next X days
  const nextDaysMatch = lowerStr.match(/next\s+(\d+)\s+days?/i);
  if (nextDaysMatch) {
    const date = new Date(now);
    date.setDate(now.getDate() + parseInt(nextDaysMatch[1]));
    return date;
  }

  // In X days
  const inDaysMatch = lowerStr.match(/in\s+(\d+)\s+days?/i);
  if (inDaysMatch) {
    const date = new Date(now);
    date.setDate(now.getDate() + parseInt(inDaysMatch[1]));
    return date;
  }

  // Next week
  if (lowerStr.includes('next week')) {
    const date = new Date(now);
    date.setDate(now.getDate() + 7);
    return date;
  }

  // This weekend
  if (lowerStr.includes('this weekend')) {
    const date = new Date(now);
    const day = now.getDay();
    const daysUntilSaturday = (6 - day + 7) % 7;
    date.setDate(now.getDate() + daysUntilSaturday);
    return date;
  }

  return null;
}

export const chatbotService = {
  // Store conversation context for multi-turn support
  setConversationContext(userId: string, context: any) {
    conversationContexts.set(userId, context);
  },

  getConversationContext(userId: string) {
    return conversationContexts.get(userId) || {};
  },

  clearConversationContext(userId: string) {
    conversationContexts.delete(userId);
  },

  // Improved intent classification with fuzzy matching
  classifyIntent(message: string): Intent {
    const lowerMessage = message.toLowerCase();

    // Booking/Reservation queries - improved with more variations
    if (
      lowerMessage.includes('booking') ||
      lowerMessage.includes('reservation') ||
      lowerMessage.includes('my booking') ||
      lowerMessage.includes('my reservation') ||
      lowerMessage.includes('check status') ||
      lowerMessage.includes('where is my') ||
      lowerMessage.includes('when is my') ||
      lowerMessage.includes('pickup date') ||
      lowerMessage.includes('return date') ||
      lowerMessage.includes('my order') ||
      lowerMessage.includes('track my') ||
      lowerMessage.includes('booked') ||
      lowerMessage.includes('scheduled') ||
      lowerMessage.includes('upcoming trip') ||
      lowerMessage.includes('my trip')
    ) {
      return 'booking_status';
    }

    // Availability check - specific date queries (improved date parsing)
    if (
      (lowerMessage.includes('available') || lowerMessage.includes('availability') || lowerMessage.includes('open')) &&
      (lowerMessage.match(/\b\d{1,2}(?:\s*(?:st|nd|rd|th))?\b/) || 
       lowerMessage.includes('march') || lowerMessage.includes('april') || lowerMessage.includes('may') ||
       lowerMessage.includes('june') || lowerMessage.includes('today') || lowerMessage.includes('tomorrow') ||
       lowerMessage.includes('next') || lowerMessage.includes('week') || lowerMessage.includes('in ') ||
       lowerMessage.includes('this weekend'))
    ) {
      return 'availability_check';
    }

    // Available bikes — general inventory (Bug 2 fix: 'show available bikes' from browse_bikes action)
    if (
      lowerMessage === 'show available bikes' ||
      lowerMessage === 'show bikes' ||
      lowerMessage === 'browse bikes' ||
      (lowerMessage.includes('available') && !lowerMessage.match(/\b\d{1,2}\b/)) ||
      (lowerMessage.includes('what') && lowerMessage.includes('bike')) ||
      lowerMessage.includes('motorcycle') ||
      lowerMessage.includes('models') ||
      lowerMessage.includes('options') ||
      lowerMessage.includes('choices') ||
      lowerMessage.includes('see bikes')
    ) {
      return 'available_bikes';
    }

    // Document/Verification
    if (
      lowerMessage.includes('document') ||
      lowerMessage.includes('license') ||
      lowerMessage.includes('verification') ||
      lowerMessage.includes('approved') ||
      lowerMessage.includes('upload') ||
      lowerMessage.includes('rejected')
    ) {
      return 'document_status';
    }

    // Bike pricing — covers "Pricing", "price list", "rates", "all prices", etc.
    if (
      lowerMessage === 'pricing' ||
      lowerMessage === 'price list' ||
      lowerMessage === 'rates' ||
      lowerMessage.includes('cheapest') ||
      lowerMessage.includes('priciest') ||
      lowerMessage.includes('most expensive') ||
      lowerMessage.includes('least expensive') ||
      lowerMessage.includes('most affordable') ||
      lowerMessage.includes('all prices') ||
      lowerMessage.includes('price list') ||
      lowerMessage.includes('rental rates') ||
      lowerMessage.includes('cost per day') ||
      lowerMessage.includes('budget') ||
      lowerMessage.includes('premium bike') ||
      lowerMessage.includes('expensive bike') ||
      (lowerMessage.includes('price') && (lowerMessage.includes('bike') || lowerMessage.includes('motorcycle'))) ||
      (lowerMessage.includes('show') && lowerMessage.includes('price')) ||
      (lowerMessage.includes('show') && lowerMessage.includes('pricing')) ||
      (lowerMessage.includes('bike') && lowerMessage.includes('rates'))
    ) {
      return 'bike_pricing';
    }

    // Rental calculator — MUST come before payment_info to correctly handle 'cost' keyword
    if (
      (lowerMessage.includes('cost') || lowerMessage.includes('price') || lowerMessage.includes('how much')) &&
      (lowerMessage.includes('rent') || lowerMessage.includes('day') || lowerMessage.includes('days')) &&
      !lowerMessage.includes('bike price')
    ) {
      return 'rental_calculator';
    }

    // Payment — 'cost' intentionally excluded (handled by rental_calculator above)
    if (
      lowerMessage.includes('payment') ||
      lowerMessage.includes('pay') ||
      lowerMessage.includes('refund') ||
      lowerMessage.includes('transaction') ||
      lowerMessage.includes('amount')
    ) {
      return 'payment_info';
    }


    // Booking assistance - help starting a booking
    if (
      lowerMessage.includes('help me book') ||
      lowerMessage.includes('how to book') ||
      lowerMessage.includes('start booking') ||
      lowerMessage.includes('guide me') ||
      lowerMessage.includes('book me a') ||
      (lowerMessage.includes('want to') && lowerMessage.includes('rent'))
    ) {
      return 'booking_assistance';
    }

    // Personalized recommendations
    if (
      lowerMessage.includes('recommend') ||
      lowerMessage.includes('suggestion') ||
      lowerMessage.includes('for me') ||
      (lowerMessage.includes('show me') && lowerMessage.includes('bike')) ||
      lowerMessage.includes('personalized')
    ) {
      return 'recommendations';
    }

    // General help
    if (
      lowerMessage.includes('help') ||
      lowerMessage.includes('support') ||
      lowerMessage.includes('contact') ||
      lowerMessage.includes('how') ||
      lowerMessage.includes('cancel') ||
      lowerMessage.includes('policy')
    ) {
      return 'general_help';
    }

    // Promotions & Discounts
    if (
      lowerMessage.includes('promo') ||
      lowerMessage.includes('discount') ||
      lowerMessage.includes('deal') ||
      lowerMessage.includes('offer') ||
      lowerMessage.includes('special') ||
      lowerMessage.includes('coupon') ||
      lowerMessage.includes('code') ||
      lowerMessage.includes('sale')
    ) {
      return 'promotions';
    }

    // Insurance Information
    if (
      lowerMessage.includes('insurance') ||
      lowerMessage.includes('coverage') ||
      lowerMessage.includes('protect') ||
      lowerMessage.includes('claim') ||
      lowerMessage.includes('damage coverage')
    ) {
      return 'insurance_info';
    }

    // Contact Human Agent
    if (
      lowerMessage.includes('agent') ||
      lowerMessage.includes('representative') ||
      lowerMessage.includes('speak to') ||
      lowerMessage.includes('talk to someone') ||
      lowerMessage.includes('human support') ||
      lowerMessage.includes('live chat') ||
      lowerMessage.includes('customer service')
    ) {
      return 'contact_agent';
    }

    // Cancellation Request
    if (
      lowerMessage.includes('cancel') ||
      lowerMessage.includes('cancellation') ||
      lowerMessage.includes('cancel booking') ||
      lowerMessage.includes('cancel reservation') ||
      lowerMessage.includes('refund')
    ) {
      return 'cancellation_request';
    }

    // Location & Hours
    if (
      lowerMessage.includes('location') ||
      lowerMessage.includes('address') ||
      lowerMessage.includes('hours') ||
      lowerMessage.includes('open') ||
      lowerMessage.includes('close') ||
      lowerMessage.includes('where') ||
      lowerMessage.includes('office') ||
      lowerMessage.includes('shop')
    ) {
      return 'location_hours';
    }

    // Fuel Policy
    if (
      lowerMessage.includes('fuel') ||
      lowerMessage.includes('gas') ||
      lowerMessage.includes('tank') ||
      lowerMessage.includes('gasoline') ||
      lowerMessage.includes('battery')
    ) {
      return 'fuel_policy';
    }

    // Age & License Requirements
    if (
      lowerMessage.includes('age') ||
      lowerMessage.includes('requirement') ||
      lowerMessage.includes('eligible') ||
      lowerMessage.includes('can i rent') ||
      lowerMessage.includes('am i old enough') ||
      lowerMessage.includes('license')
    ) {
      return 'age_requirements';
    }

    // Damage & Liability
    if (
      lowerMessage.includes('damage') ||
      lowerMessage.includes('accident') ||
      lowerMessage.includes('scratch') ||
      lowerMessage.includes('dent') ||
      lowerMessage.includes('liability') ||
      lowerMessage.includes('late return') ||
      lowerMessage.includes('charges')
    ) {
      return 'damage_liability';
    }

    // Helmet & Safety
    if (
      lowerMessage.includes('helmet') ||
      lowerMessage.includes('safety') ||
      lowerMessage.includes('safe') ||
      lowerMessage.includes('protective') ||
      lowerMessage.includes('gear')
    ) {
      return 'helmet_safety';
    }

    // Delivery & Pickup Options
    if (
      lowerMessage.includes('delivery') ||
      lowerMessage.includes('pickup') ||
      lowerMessage.includes('pick up') ||
      lowerMessage.includes('drop off') ||
      lowerMessage.includes('dropoff') ||
      lowerMessage.includes('deliver')
    ) {
      return 'delivery_options';
    }

    return 'unknown';
  },

  // Get booking status for user
  async getBookingStatus(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('id, motorcycle_id, start_date, end_date, status, total_price, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching booking status:', error);
      return [];
    }
  },

  // Get available motorcycles
  async getAvailableBikes(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('motorcycles')
        .select('id, name, type, engine_capacity, price_per_day, availability, rating')
        .eq('availability', 'Available')
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching available bikes:', error);
      return [];
    }
  },

  // Get cheapest and priciest motorcycles
  async getPriceComparison(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('motorcycles')
        .select('id, name, type, engine_capacity, price_per_day, rating')
        .eq('availability', 'Available')
        .order('price_per_day', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        return { cheapest: null, priciest: null };
      }

      const cheapest = data[0];
      const priciest = data[data.length - 1];

      return { cheapest, priciest };
    } catch (error) {
      console.error('Error fetching price comparison:', error);
      return { cheapest: null, priciest: null };
    }
  },

  // Get document verification status
  async getDocumentStatus(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id, document_type, status, submitted_at, reviewed_at, rejection_reason')
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching document status:', error);
      return [];
    }
  },

  // Get payment history
  async getPaymentHistory(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('id, type, amount, status, date, description')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching payment history:', error);
      return [];
    }
  },

  // Extract date range from message (improved)
  extractDateRange(message: string): { startDate?: Date; endDate?: Date; bikeName?: string } {
    const lowerMessage = message.toLowerCase();
    let startDate = undefined;
    let endDate = undefined;
    let bikeName = undefined;
    
    // Try new flexible date parser first
    const flexDate = parseFlexibleDate(message);
    if (flexDate) {
      startDate = flexDate;
      endDate = new Date(flexDate.getTime() + 24 * 60 * 60 * 1000);
    }

    // Pattern for dates like "january 5", "march 25", "25 march", "3/25", "25th"
    const datePatterns = [
      /(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?/i,
      /(\d{1,2})(?:st|nd|rd|th)?\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)/i,
      /(\d{1,2})\/(\d{1,2})/i,
    ];

    // Try to extract dates
    for (const pattern of datePatterns) {
      const match = message.match(pattern);
      if (match) {
        // Simple date parsing - assumes current year
        const now = new Date();
        const month = message.match(/january|february|march|april|may|june|july|august|september|october|november|december/i)?.[0];
        const months: { [key: string]: number } = {
          january: 0, february: 1,
          march: 2, april: 3, may: 4, june: 5, july: 6,
          august: 7, september: 8, october: 9, november: 10, december: 11
        };
        
        const monthNum = month ? months[month.toLowerCase()] : 2;
        const dayNum = parseInt(match[1]);
        
        startDate = new Date(now.getFullYear(), monthNum, dayNum);
        // If no end date found, assume 1 day rental
        endDate = endDate || new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
        break;
      }
    }

    // Check for date ranges like "march 25-27" or "march 25 to 27"
    const rangeMatch = message.match(/(\d{1,2})(?:\s*(?:st|nd|rd|th))?\s*(?:to|-)\s*(\d{1,2})(?:\s*(?:st|nd|rd|th))?/i);
    if (rangeMatch && startDate) {
      const endDay = parseInt(rangeMatch[2]);
      const month = message.match(/january|february|march|april|may|june|july|august|september|october|november|december/i)?.[0];
      const months: { [key: string]: number } = {
        january: 0, february: 1,
        march: 2, april: 3, may: 4, june: 5, july: 6,
        august: 7, september: 8, october: 9, november: 10, december: 11
      };
      const monthNum = month ? months[month.toLowerCase()] : 2;
      endDate = new Date(new Date().getFullYear(), monthNum, endDay);
    }

    // Handle "today" and "tomorrow"
    if (lowerMessage.includes('today')) {
      startDate = new Date();
      endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
    } else if (lowerMessage.includes('tomorrow')) {
      startDate = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
      endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
    }

    // Extract bike name
    const commonBikes = ['honda', 'yamaha', 'suzuki', 'ktm', 'ducati', 'cb', 'wave', 'xray', 'pulsar'];
    for (const bike of commonBikes) {
      if (lowerMessage.includes(bike)) {
        bikeName = bike;
        break;
      }
    }

    return { startDate, endDate, bikeName };
  },

  // Get availability for specific dates
  async getAvailabilityForDates(startDate?: Date, endDate?: Date, bikeName?: string): Promise<any> {
    try {
      // Get all motorcycles
      let bikeQuery = supabase
        .from('motorcycles')
        .select('id, name, type, engine_capacity, price_per_day, rating, availability');

      if (bikeName) {
        bikeQuery = bikeQuery.ilike('name', `%${bikeName}%`);
      }

      const { data: bikes, error: bikeError } = await bikeQuery.limit(10);
      if (bikeError) throw bikeError;

      if (!bikes || bikes.length === 0) {
        return { found: false, bikes: [], message: 'No bikes found' };
      }

      // If no date specified, show current availability
      if (!startDate || !endDate) {
        return { 
          found: true, 
          bikes: bikes.map(b => ({ ...b, available: b.availability === 'Available' })),
          dateSpecific: false 
        };
      }

      // Check reservations for the date range
      const { data: reservations, error: reservError } = await supabase
        .from('reservations')
        .select('motorcycle_id, start_date, end_date, status')
        .eq('status', 'confirmed')
        .lte('start_date', endDate.toISOString())
        .gte('end_date', startDate.toISOString());

      if (reservError) throw reservError;

      // Create set of booked motorcycle IDs
      const bookedBikeIds = new Set(reservations?.map(r => r.motorcycle_id) || []);

      // Mark availability for each bike
      const availabilityData = bikes.map(bike => {
        const isBooked = bookedBikeIds.has(bike.id);
        return {
          ...bike,
          available: !isBooked && bike.availability === 'Available',
          booked: isBooked
        };
      });

      return { found: true, bikes: availabilityData, dateSpecific: true, dateRange: { startDate, endDate } };
    } catch (error) {
      console.error('Error checking availability:', error);
      return { found: false, bikes: [], error: true };
    }
  },

  // Extract rental quote information from message
  extractRentalInfo(message: string): { bikeName?: string; days?: number } {
    const lowerMessage = message.toLowerCase();
    
    // Try to extract number of days
    const daysMatch = message.match(/(\d+)\s*(?:day|d\b)/i);
    const days = daysMatch ? parseInt(daysMatch[1]) : null;
    
    // Try to extract bike name
    let bikeName = null;
    const commonBikes = ['honda', 'yamaha', 'suzuki', 'ktm', 'ducati', 'cb', 'wave', 'xray', 'pulsar'];
    for (const bike of commonBikes) {
      if (lowerMessage.includes(bike)) {
        bikeName = bike;
        break;
      }
    }
    
    return { bikeName: bikeName ?? undefined, days: days ?? undefined };
  },

  // Calculate rental cost
  async calculateRentalCost(bikeName?: string, days: number = 1): Promise<any> {
    try {
      let query = supabase
        .from('motorcycles')
        .select('id, name, price_per_day, type, engine_capacity, rating');
      
      // If bike name provided, filter by it
      if (bikeName) {
        query = query.ilike('name', `%${bikeName}%`);
      }
      
      const { data, error } = await query.limit(5);
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return { found: false, bikes: [] };
      }
      
      // Calculate costs for each bike
      const quotes = data.map(bike => ({
        ...bike,
        daily_rate: bike.price_per_day,
        rental_days: days,
        subtotal: bike.price_per_day * days,
        insurance: 'Included',
        total: bike.price_per_day * days
      }));
      
      return { found: true, bikes: quotes };
    } catch (error) {
      console.error('Error calculating rental cost:', error);
      return { found: false, bikes: [] };
    }
  },

  // Format rental calculator response (enhanced)
  formatRentalCalculatorResponse(rentalData: any, days: number): string {
    if (!rentalData.found || rentalData.bikes.length === 0) {
      return `🔍 **Bike not found**\n\nLet me help! Would you like to:\n\n• 🏍️ See ALL available bikes (I'll calculate quotes for any)\n• 📉 Find budget bikes (under ₱300/day)\n• 👑 Find premium bikes\n• 🔤 Tell me another bike name?\n\n_Popular models: Honda CB150, Yamaha XRay, Suzuki Raider, KTM Duke_`;
    }

    const bike = rentalData.bikes[0];
    const savingsDaily = Math.max(0, 500 - bike.price_per_day);
    const savingsTotal = savingsDaily * days;
    
    let response = `📋 **Rental Cost Calculator**\n\n`;
    response += `🎯 **${bike.name}**\n`;
    response += `   🏷️ ${bike.type} | 🔧 ${bike.engine_capacity}cc | ⭐ ${bike.rating}★\n\n`;
    
    response += `💰 **Price Breakdown (${days} day${days > 1 ? 's' : ''}):**\n\n`;
    response += `   Daily Rate:  ₱${bike.price_per_day.toLocaleString()}/day\n`;
    response += `   × ${days} day${days > 1 ? 's' : ''}\n`;
    response += `   ─────────────\n`;
    response += `   Subtotal:    ₱${bike.subtotal.toLocaleString()}\n`;
    response += `   Insurance:   ✅ Included (FREE)\n`;
    response += `   ═════════════\n`;
    response += `   **TOTAL:     ₱${bike.total.toLocaleString()}**\n\n`;
    
    if (savingsTotal > 0) {
      response += `💚 _Save ₱${savingsTotal.toLocaleString()} vs ₱500/day average_\n\n`;
    }
    
    if (rentalData.bikes.length > 1) {
      response += `💡 **Compare with similar bikes:**\n`;
      rentalData.bikes.slice(1, 4).forEach((alt: any, idx: number) => {
        const totalAlt = alt.price_per_day * days;
        const diff = totalAlt - bike.total;
        const arrow = diff > 0 ? '↑' : '↓';
        response += `${idx + 2}. ${alt.name} - ₱${totalAlt.toLocaleString()} ${arrow}\n`;
      });
      response += `\n`;
    }
    
    response += `👉 **Ready to book?** [Book Now](/) or [See More Options](/bikes)`;
    return response;
  },

  // Booking assistance - step-based state machine (Fix 4)
  formatBookingStep(step: number, context: any): string {
    switch (step) {
      case 1:
        return (
          `🎯 **Let's Book Your Perfect Ride!**\n\n` +
          `I'll guide you step by step — just answer each question!\n\n` +
          `**Step 1 of 4 — When do you want to ride?**\n\n` +
          `• Today\n• Tomorrow\n• Specific date (e.g., "January 15" or "March 25")\n• Next weekend\n\n` +
          `_Just tell me the date and I'll check what's available!_`
        );
      case 2: {
        const dateLabel = context.bookingDate
          ? new Date(context.bookingDate).toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })
          : 'your chosen date';
        return (
          `📅 Got it — **${dateLabel}**!\n\n` +
          `**Step 2 of 4 — For how many days?**\n\n` +
          `• 1 day (same-day return)\n` +
          `• 2–3 days (weekend getaway)\n` +
          `• 4–7 days (extended trip)\n` +
          `• More than 7 days (long-term rental)\n\n` +
          `_Just say the number, e.g., "3 days"_`
        );
      }
      case 3: {
        const days = context.bookingDays || 1;
        return (
          `⏱️ **${days} day${days > 1 ? 's' : ''}** — great choice!\n\n` +
          `**Step 3 of 4 — What type of bike?**\n\n` +
          `• 🏍️ **Sport** — fast & thrilling\n` +
          `• 🛵 **Underbone** — comfortable & economical\n` +
          `• 🏎️ **Cruiser** — heavy & stable\n` +
          `• 💨 **Scooter** — easy to ride\n` +
          `• 🤔 **Not sure** — I'll recommend one!\n\n` +
          `_Or give me a budget, e.g., "under ₱400/day"_`
        );
      }
      case 4: {
        const days = context.bookingDays || 1;
        const bikeType = context.bikeType ? `**${context.bikeType}**` : 'any type';
        const dateLabel = context.bookingDate
          ? new Date(context.bookingDate).toLocaleDateString('en-PH', { month: 'long', day: 'numeric' })
          : 'your chosen date';
        return (
          `✅ **Booking Summary**\n\n` +
          `📅 Start Date: ${dateLabel}\n` +
          `⏱️ Duration: ${days} day${days > 1 ? 's' : ''}\n` +
          `🏍️ Bike Type: ${bikeType}\n\n` +
          `👉 Ready to complete your booking?\n\n` +
          `Click **[Book Now](/)** on the booking page, select your preferred bike, and enter these dates.\n\n` +
          `💡 _Need a price estimate first? Ask me: "How much for a Honda for ${days} days?"_`
        );
      }
      default:
        return this.formatBookingStep(1, context);
    }
  },

  // Legacy alias kept for any direct calls
  formatBookingAssistanceResponse(): string {
    return this.formatBookingStep(1, {});
  },


  // Format availability response
  formatAvailabilityResponse(availabilityData: any): string {
    if (!availabilityData.found) {
      return "❌ I couldn't check availability. Please try again or contact support.";
    }

    if (availabilityData.bikes.length === 0) {
      return "🏍️ No bikes found for your search. Would you like me to show you all available bikes?";
    }

    let response = `📅 **Availability Check**\n\n`;

    if (availabilityData.dateSpecific && availabilityData.dateRange) {
      const startDate = new Date(availabilityData.dateRange.startDate);
      const endDate = new Date(availabilityData.dateRange.endDate);
      response += `**Date Range:** ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}\n\n`;
    }

    const availableBikes = availabilityData.bikes.filter((b: any) => b.available);
    const bookedBikes = availabilityData.bikes.filter((b: any) => b.booked);

    if (availableBikes.length > 0) {
      response += `✅ **AVAILABLE (${availableBikes.length}):**\n`;
      availableBikes.slice(0, 5).forEach((bike: any) => {
        response += `• **${bike.name}** - ₱${bike.price_per_day.toLocaleString()}/day (${bike.rating}⭐)\n`;
      });
      response += `\n`;
    }

    if (bookedBikes.length > 0) {
      response += `❌ **NOT AVAILABLE (${bookedBikes.length}):**\n`;
      bookedBikes.slice(0, 3).forEach((bike: any) => {
        response += `• ${bike.name}\n`;
      });
      response += `\n`;
    }

    if (availableBikes.length === 0 && bookedBikes.length > 0) {
      response += `😔 All your preferred bikes are booked for these dates.\n`;
      response += `\n💡 **Suggestions:**\n`;
      response += `• Try different dates\n`;
      response += `• View our full fleet\n`;
      response += `• Get a custom quote\n`;
    }

    if (availableBikes.length > 0) {
      response += `Ready to book? Click [here](/) or ask me for a quote!`;
    }

    return response;
  },

  // Format booking response (enhanced)
  formatBookingResponse(bookings: any[]): string {
    if (bookings.length === 0) {
      return `😊 **No bookings yet!**\n\nWould you like to:\n\n• 🏍️ Browse our available motorcycles\n• 💰 Get a rental quote\n• ⭐ See personalized recommendations\n\nI'm here to help you find the perfect bike!`;
    }

    const latestBooking = bookings[0];
    const startDate = new Date(latestBooking.start_date).toLocaleDateString();
    const endDate = new Date(latestBooking.end_date).toLocaleDateString();
    const status = latestBooking.status.charAt(0).toUpperCase() + latestBooking.status.slice(1);
    const statusEmoji = latestBooking.status === 'confirmed' ? '✅' : latestBooking.status === 'pending' ? '⏳' : '🎉';

    let response = `📅 **Your Latest Booking**\n\n`;
    response += `${statusEmoji} **Status:** ${status}\n`;
    response += `📍 **Pickup:** ${startDate}\n`;
    response += `📍 **Return:** ${endDate}\n`;
    response += `💰 **Total:** ₱${latestBooking.total_price.toLocaleString()}\n\n`;

    if (bookings.length > 1) {
      response += `📊 _You have ${bookings.length - 1} more booking${bookings.length > 2 ? 's' : ''} in your history._\n\n`;
    }

    response += `Need anything else? I can help with:\n• 🏍️ Browse more bikes\n• 💳 View payment details\n• 🚗 Check another booking`;

    return response;
  },

  // Format bikes response (enhanced)
  formatBikesResponse(bikes: any[]): string {
    if (bikes.length === 0) {
      return `😔 **No motorcycles available right now.**\n\nBut don't worry! Check back soon or:\n\n• 📧 Get notified when a bike is available\n• 📞 Call us: (035) 225-3151\n• 📧 Email: support@motorent.com\n\n_New bikes are added regularly!_`;
    }

    let response = `🏍️ **Available Motorcycles (${bikes.length} available)**\n\n`;

    bikes.slice(0, 5).forEach((bike, idx) => {
      response += `${idx + 1}. **${bike.name}**\n`;
      response += `   🏷️ Type: ${bike.type} | 🔧 Engine: ${bike.engine_capacity}cc\n`;
      response += `   💰 ₱${bike.price_per_day.toLocaleString()}/day | ⭐ ${bike.rating}★\n\n`;
    });

    if (bikes.length > 5) {
      response += `... and ${bikes.length - 5} more bikes available!\n\n`;
    }

    response += `💡 **Next steps:**\n• 💰 [Get a quote](/calculator) for specific dates\n• 📅 Check availability on specific dates\n• 👉 [View full catalog](/bikes)`;
    return response;
  },

  // Format price comparison response
  formatPriceResponse(priceData: any): string {
    const { cheapest, priciest } = priceData;

    if (!cheapest || !priciest) {
      return "Sorry, no pricing information is available. Please check back soon!";
    }

    let response = `💰 **Price Comparison Analysis**\n\n`;

    response += `💚 **CHEAPEST BIKE**\n`;
    response += `**${cheapest.name}**\n`;
    response += `• Type: ${cheapest.type}\n`;
    response += `• Engine: ${cheapest.engine_capacity}cc\n`;
    response += `• Price: ₱${cheapest.price_per_day.toLocaleString()}/day\n`;
    response += `• Rating: ${cheapest.rating}⭐\n\n`;

    response += `🔴 **PRICIEST BIKE**\n`;
    response += `**${priciest.name}**\n`;
    response += `• Type: ${priciest.type}\n`;
    response += `• Engine: ${priciest.engine_capacity}cc\n`;
    response += `• Price: ₱${priciest.price_per_day.toLocaleString()}/day\n`;
    response += `• Rating: ${priciest.rating}⭐\n\n`;

    const priceDifference = priciest.price_per_day - cheapest.price_per_day;
    const savingsPercent = Math.round((priceDifference / priciest.price_per_day) * 100);
    response += `📊 **Price Analysis:**\n`;
    response += `   Difference: ₱${priceDifference.toLocaleString()}/day (${savingsPercent}% savings)\n`;
    response += `   💡 Save ₱${(priceDifference * 3).toLocaleString()} on a 3-day rental!\n\n`;

    response += `Want to book? Click [here](/) to browse all bikes!`;
    return response;
  },

  // Format document response
  formatDocumentResponse(documents: any[]): string {
    if (documents.length === 0) {
      return "You haven't uploaded any documents yet. Upload your driver's license to complete verification.";
    }

    let response = `📄 **Your Documents - Verification Status**\n\n`;
    let hasRejected = false;
    let hasApproved = false;
    let isPending = false;

    documents.forEach((doc) => {
      const docType = doc.document_type.replace(/_/g, ' ').toUpperCase();
      const status = doc.status.charAt(0).toUpperCase() + doc.status.slice(1);
      const statusEmoji = doc.status === 'approved' ? '✅' : doc.status === 'rejected' ? '❌' : '⏳';
      
      if (doc.status === 'approved') hasApproved = true;
      if (doc.status === 'rejected') hasRejected = true;
      if (doc.status === 'pending') isPending = true;

      response += `${statusEmoji} **${docType}**\n`;
      response += `   Status: ${status}\n`;
      
      if (doc.submitted_at) {
        const submittedDate = new Date(doc.submitted_at).toLocaleDateString();
        response += `   📤 Submitted: ${submittedDate}\n`;
      }
      
      if (doc.status === 'approved' && doc.reviewed_at) {
        const approvedDate = new Date(doc.reviewed_at).toLocaleDateString();
        response += `   ✅ Approved: ${approvedDate}\n`;
      }

      if (doc.status === 'rejected' && doc.rejection_reason) {
        response += `   ❗ Reason: ${doc.rejection_reason}\n`;
        response += `   📋 Action: Please resubmit with corrections\n`;
      }

      response += '\n';
    });

    if (hasRejected) {
      response += `\n⚠️ **Action Required:** Please resubmit rejected documents to complete verification.\n`;
    }
    
    if (isPending) {
      response += `⏳ **Pending:** Some documents are still under review. This usually takes 24-48 hours.\n`;
    }
    
    if (hasApproved && !hasRejected && !isPending) {
      response += `\n✅ **Verification Complete!** You're all set to book.\n`;
    }

    return response;
  },

  // Format payment response
  formatPaymentResponse(payments: any[]): string {
    if (payments.length === 0) {
      return "You haven't made any payments yet.";
    }

    let response = `💳 **Payment History & Spending Overview**\n\n`;
    
    let totalSpent = 0;
    let successfulPayments = 0;

    payments.forEach((payment) => {
      if (payment.status === 'completed' || payment.status === 'success') {
        totalSpent += payment.amount;
        successfulPayments++;
      }
    });

    response += `📊 **Your Spending Summary:**\n`;
    response += `   Total Spent: ₱${totalSpent.toLocaleString()}\n`;
    response += `   Successful Payments: ${successfulPayments}\n\n`;

    response += `📝 **Recent Transactions (Last 5):**\n\n`;

    payments.slice(0, 5).forEach((payment) => {
      const date = new Date(payment.date).toLocaleDateString();
      const type = payment.type.toUpperCase();
      const status = payment.status.charAt(0).toUpperCase() + payment.status.slice(1);
      const statusEmoji = payment.status === 'completed' || payment.status === 'success' ? '✅' : 
                          payment.status === 'pending' ? '⏳' : 
                          payment.status === 'failed' ? '❌' : '❓';

      response += `${statusEmoji} **${type}** - ₱${payment.amount.toLocaleString()}\n`;
      response += `   ${status} • ${date}\n`;
      if (payment.description) {
        response += `   ${payment.description}\n`;
      }
      response += `\n`;
    });

    if (payments.length > 5) {
      response += `... and ${payments.length - 5} more transactions.\n\n`;
    }

    response += `💡 **Tip:** Download receipts or contact support for payment details.`;
    return response;
  },

  // Format personalized recommendations
  formatRecommendationsResponse(recommendations: any[]): string {
    if (!recommendations || recommendations.length === 0) {
      return `🤔 **No recommendations available right now.**\n\nWould you like to:\n• Browse all available bikes\n• Calculate a rental quote\n• Check bike availability?`;
    }

    let response = `⭐ **Personalized Recommendations For You**\n\n`;
    response += `Based on your preferences, we think you'll love these bikes:\n\n`;

    recommendations.forEach((bike, idx) => {
      response += `${idx + 1}. **${bike.name}**\n`;
      response += `   Type: ${bike.type} • Engine: ${bike.engine_capacity}cc\n`;
      response += `   ₱${bike.price_per_day}/day • Rating: ${bike.rating}⭐\n\n`;
    });

    response += `Ready to book? Pick any of these top recommendations or browse more options!`;
    return response;
  },

  // General help responses
  getGeneralHelp(message: string): string {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('cancel')) {
      return `**Cancellation Policy:**\n\n
• Free cancellation up to 24 hours before pickup
• 50% refund if canceled 12-24 hours before
• No refund if canceled less than 12 hours before

Contact support if you need to cancel: support@motorent.com`;
    }

    if (lowerMessage.includes('policy')) {
      return `**Our Policies:**\n\n
• Minimum age: 18 years old
• Valid driver's license required
• Helmet & insurance included
• Fuel tank must be returned full
• Late returns: ₱500/hour surcharge`;
    }

    if (lowerMessage.includes('contact') || lowerMessage.includes('support')) {
      return `**Contact Support:**\n\n
📧 Email: support@motorent.com
📱 Phone: (035) 225-3151
💬 Chat: Available 24/7
⏰ Hours: Daily 8 AM - 8 PM`;
    }

    if (lowerMessage.includes('how') && lowerMessage.includes('book')) {
      return `**How to Book:**\n\n
1. Browse available motorcycles
2. Select dates and bike
3. Upload required documents
4. Complete payment
5. Pick up at our shop
6. Enjoy your ride!`;
    }

    return `I can help you with:\n\n
• 📅 Check booking status
• 🏍️ View available bikes
• 📅 Check bike availability on specific dates
• 💰 Calculate rental cost
• 🎯 Start guided booking
• 💎 Compare bike prices (cheapest & priciest)
• �📄 Document verification status
• 💳 Payment history
• ❓ FAQ & policies

What would you like to know?`;
  },

  // Fix 6 — DB-driven promotions
  // SQL to create table (run once in Supabase dashboard):
  // CREATE TABLE promotions (
  //   id BIGSERIAL PRIMARY KEY,
  //   title TEXT NOT NULL,
  //   description TEXT NOT NULL,
  //   discount_percent INTEGER,
  //   promo_code TEXT,
  //   valid_until TIMESTAMP WITH TIME ZONE,
  //   is_active BOOLEAN DEFAULT true,
  //   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  // );
  async getPromotions(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('title, description, discount_percent, promo_code, valid_until')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(6);
      if (error) throw error;
      return data || [];
    } catch {
      return []; // Table may not exist yet — handled gracefully below
    }
  },

  async formatPromotionsResponse(): Promise<string> {
    const promos = await this.getPromotions();

    if (promos.length === 0) {
      return (
        `🎉 **Promotions & Discounts**\n\n` +
        `📢 No active promotions at the moment — check back soon!\n\n` +
        `💡 **Always-On Benefits:**\n` +
        `• 🆕 First-time renter? Ask staff about our welcome discount!\n` +
        `• 🏆 Loyalty rewards earned with every rental\n` +
        `• 👥 Group rental? Contact us for custom group pricing\n\n` +
        `📞 Call **(035) 225-3151** or email **support@motorent.com** for the latest deals!`
      );
    }

    let response = `🎉 **Current Promotions & Discounts**\n\n📢 **Active Offers:**\n`;
    promos.forEach((p) => {
      const expiry = p.valid_until
        ? ` _(until ${new Date(p.valid_until).toLocaleDateString('en-PH')})_`
        : '';
      const discount = p.discount_percent ? ` — **${p.discount_percent}% off**` : '';
      const code = p.promo_code ? `\n   🔖 Code: \`${p.promo_code}\`` : '';
      response += `• 🏷️ **${p.title}**${discount}${expiry}\n   ${p.description}${code}\n`;
    });
    response +=
      `\n💡 **How to Apply:**\n` +
      `• Enter promo code at checkout\n` +
      `• Discounts applied automatically to eligible bookings\n` +
      `• Some restrictions may apply\n\n` +
      `Have a promo code? Just tell me and I\'ll help verify it!`;
    return response;
  },


  // Format insurance info response
  formatInsuranceInfoResponse(): string {
    return `🛡️ **Insurance Coverage**\n\n` +
           `✅ **What's Included:**\n` +
           `• Basic accident coverage (₱50,000 limit)\n` +
           `• Theft protection\n` +
           `• Natural disaster coverage\n` +
           `• 24/7 roadside assistance\n` +
           `• Third-party liability (₱100,000)\n\n` +
           `⚠️ **What's NOT Covered:**\n` +
           `• Intentional damage\n` +
           `• Damage from reckless driving\n` +
           `• Mechanical breakdowns (unless our fault)\n\n` +
           `💰 **Optional Coverage:**\n` +
           `• Premium Protection: +₱300/day (full coverage, ₱0 deductible)\n` +
           `• Extended Coverage: +₱150/day (up to ₱100k damage)\n\n` +
           `📞 To file a claim: support@motorent.com | (035) 225-3151`;
  },

  // Format contact agent response
  formatContactAgentResponse(): string {
    return `📞 **Connect with Our Support Team**\n\n` +
           `We're here to help! Choose your preferred method:\n\n` +
           `📧 **Email:**\n` +
           `support@motorent.com\n` +
           `_Response time: 2-4 hours_\n\n` +
           `📱 **Phone:**\n` +
           `(035) 225-3151\n` +
           `⏰ Available: Mon-Sun, 8 AM - 8 PM\n\n` +
           `💬 **Live Chat:**\n` +
           `Available right now! I can connect you with an agent.\n` +
           `Response time: Instant\n\n` +
           `📍 **Visit Us:**\n` +
           `MotoRent Shop, Calinog, Iloilo\n` +
           `Hours: 8 AM - 8 PM Daily\n\n` +
           `_What's your question? I may be able to help!_`;
  },

  // Format cancellation request response
  formatCancellationResponse(): string {
    return `🚫 **Booking Cancellation**\n\n` +
           `📋 **Cancellation Policy:**\n` +
           `• ✅ **24+ hours before pickup:** Full refund (100%)\n` +
           `• ⚠️ **12-24 hours before:** 50% refund\n` +
           `• ❌ **Less than 12 hours:** No refund\n\n` +
           `📞 **How to Cancel:**\n` +
           `1. Visit your bookings page\n` +
           `2. Find the booking to cancel\n` +
           `3. Click 'Cancel Booking'\n` +
           `4. Follow the confirmation steps\n\n` +
           `ℹ️ **Need Help?**\n` +
           `Contact us for assistance:\n` +
           `📧 support@motorent.com\n` +
           `📱 (035) 225-3151\n\n` +
           `_Refunds processed within 3-5 business days_`;
  },

  // Format location & hours response
  formatLocationResponse(): string {
    return `📍 **MotoRent Location & Hours**\n\n` +
           `🏪 **Our Shop:**\n` +
           `MotoRent Rental Shop\n` +
           `Calinog, Iloilo, Philippines\n\n` +
           `🕐 **Operating Hours:**\n` +
           `• Monday - Sunday: 8:00 AM - 8:00 PM\n` +
           `• Holidays: 9:00 AM - 6:00 PM\n` +
           `• Closed: None (Open 365 days!)\n\n` +
           `📞 **Contact:**\n` +
           `📱 Phone: (035) 225-3151\n` +
           `📧 Email: support@motorent.com\n\n` +
           `🗺️ **Directions:**\n` +
           `_Easy to find in the town center_\n` +
           `• Free parking available\n` +
           `• Wheelchair accessible\n` +
           `• ATM nearby\n\n` +
           `🎯 Ready to visit? We're open now!`;
  },

  // Format fuel policy response
  formatFuelPolicyResponse(): string {
    return `⛽ **Fuel Tank Policy**\n\n` +
           `📋 **Requirements:**\n` +
           `• Bikes are delivered with FULL fuel tank\n` +
           `• Must return with FULL fuel tank\n` +
           `• You pay for all fuel consumed\n\n` +
           `⚠️ **Late Return Charges:**\n` +
           `If tank is NOT full on return:\n` +
           `• ₱50 per liter to top up\n` +
           `• Additional ₱500 service fee\n\n` +
           `💰 **Fuel Cost:**\n` +
           `• Regular Gasoline: ~₱50/liter\n` +
           `• Expected consumption: 30-35 km/liter\n` +
           `• 200km trip = ~₱300-400 fuel cost\n\n` +
           `🔧 **Tips:**\n` +
           `• Fill up fuel before returning\n` +
           `• Nearby gas stations provided\n` +
           `• We give directions to cheapest fuel\n\n` +
           `💡 See your booking for fuel allowance details.`;
  },

  // Format age requirements response
  formatAgeRequirementsResponse(): string {
    return `👤 **Eligibility Requirements**\n\n` +
           `✅ **You Can Rent If:**\n` +
           `• 18 years old or older\n` +
           `• Have valid driver's license\n` +
           `• License valid for the rental period\n` +
           `• Have government-issued ID\n\n` +
           `📋 **Required Documents:**\n` +
           `1. Valid Driver's License\n` +
           `2. Government-issued ID (passport, national ID)\n` +
           `3. Proof of Address (optional)\n` +
           `4. Valid Credit/Debit Card (for deposit)\n\n` +
           `⚠️ **Additional Requirements:**\n` +
           `• Minimum 1 year driving experience\n` +
           `• No serious traffic violations\n` +
           `• Pass safety orientation\n\n` +
           `❓ **Special Cases:**\n` +
           `• Riders 18-25: Deposit may be higher\n` +
           `• International visitors: Valid passport required\n` +
           `• Corporate clients: Special rates available\n\n` +
           `Ready to book? [Upload Documents](/documents)`;
  },

  // Format damage & liability response
  formatDamageLiabilityResponse(): string {
    return `⚖️ **Damage & Liability Policy**\n\n` +
           `💰 **Damage Charges:**\n` +
           `• Minor scratches/dents: ₱500-₱2,000\n` +
           `• Broken mirrors/lights: ₱1,000-₱3,000\n` +
           `• Engine damage: ₱5,000-₱15,000\n` +
           `• Total loss/theft: Full bike value\n\n` +
           `⏱️ **Late Return Surcharge:**\n` +
           `• First 30 minutes: Free grace period\n` +
           `• 30 min - 2 hours: ₱200/hour\n` +
           `• 2+ hours: ₱500/hour + ₱50/hour late fee\n\n` +
           `🛡️ **Insurance Coverage:**\n` +
           `• Basic plan covers most accidents\n` +
           `• Premium plan: ₱0 deductible\n` +
           `• Optional add-ons available\n\n` +
           `📸 **Accident Protocol:**\n` +
           `1. Call us immediately: (035) 225-3151\n` +
           `2. Take photos of damage\n` +
           `3. Get police report if needed\n` +
           `4. File claim within 24 hours\n\n` +
           `💡 We're understanding! Most accidents covered by insurance.`;
  },

  // Format helmet & safety response
  formatHelmetSafetyResponse(): string {
    return `🎓 **Safety & Protective Gear**\n\n` +
           `✅ **What's Included:**\n` +
           `• DOT-certified helmet (required)\n` +
           `• Safety gloves\n` +
           `• Reflective vest\n` +
           `• Bike lights & signals working\n\n` +
           `🧠 **Helmet Information:**\n` +
           `• High-quality DOT helmets provided\n` +
           `• Sizes: XS to XL available\n` +
           `• Sanitary liners included\n` +
           `• Proper fitting assistance given\n\n` +
           `⚠️ **Safety Rules:**\n` +
           `• Helmet MUST be worn at all times\n` +
           `• Both rider & passenger must have helmets\n` +
           `• Check bike condition before riding\n` +
           `• Follow traffic laws\n` +
           `• No riding under influence\n\n` +
           `🏥 **Emergency Contacts:**\n` +
           `• 911 for emergencies\n` +
           `• Nearest hospital: [3km away]\n` +
           `• Insurance covers medical expenses\n\n` +
           `💪 **Ride Safe, Ride Happy!**`;
  },

  // Format delivery & pickup response
  formatDeliveryResponse(): string {
    return `🚚 **Pickup & Delivery Options**\n\n` +
           `📍 **Standard Pickup:**\n` +
           `• Location: MotoRent Shop, Calinog\n` +
           `• Hours: 8 AM - 8 PM\n` +
           `• Duration: ~30 minutes (paperwork)\n` +
           `• Cost: FREE\n\n` +
           `🚗 **Delivery Options:**\n` +
           `• Hotel Delivery: +₱500 (within 10km)\n` +
           `• Airport Pickup: +₱800\n` +
           `• Extended Area: +₱1000 (10-20km)\n` +
           `• Early Pickup (before 8AM): +₱300\n\n` +
           `⏱️ **Delivery Times:**\n` +
           `• Within town: 15-30 minutes\n` +
           `• Extended area: 30-60 minutes\n` +
           `• Advance booking required\n\n` +
           `📦 **Return Options:**\n` +
           `• Return to shop: Free\n` +
           `• Delivery return: Cost applies\n` +
           `• After-hours return: Available (+₱300)\n\n` +
           `💡 **Best Option:** Pick up & return at our shop for FREE!`;
  },

  // Main chat handler
  async processMessage(userId: string, message: string): Promise<ChatResponse> {
    try {
      // Fix P10 — Sanitize all input before processing
      const sanitized = sanitizeInput(message);

      // Fix P9 — Rate limit: 15 messages per user per minute
      if (isRateLimited(userId)) {
        return {
          message: `⏳ You're sending messages too quickly. Please wait a moment and try again!`,
          intent: 'unknown',
          quickActions: [],
        };
      }

      // Fix P2 — Load context FIRST and use it for multi-turn routing
      const context = this.getConversationContext(userId);
      let intent = this.classifyIntent(sanitized);

      // Fix P2 — Multi-turn override: short affirmatives continue previous flow
      const isAffirmative = /^(yes|yeah|yep|ok|okay|sure|book it|confirm|proceed|go ahead|book|reserve|done|i want it|let's go)$/i.test(
        sanitized.trim()
      );
      if (isAffirmative && context.lastIntent === 'rental_calculator') {
        intent = 'booking_assistance';
      }
      if (isAffirmative && context.lastIntent === 'availability_check') {
        intent = 'booking_assistance';
      }
      // Fix P4 — If we're mid-booking-flow, keep routing to booking_assistance
      if (context.lastIntent === 'booking_assistance' && context.bookingStep && context.bookingStep < 4) {
        intent = 'booking_assistance';
      }

      let responseText = '';
      let responseData = null;
      let quickActions: QuickAction[] = [];

      switch (intent) {
        case 'booking_status': {
          const bookings = await this.getBookingStatus(userId);
          responseData = bookings;
          responseText = this.formatBookingResponse(bookings);
          quickActions = bookings.length > 0
            ? [
                { label: 'View Details', action: 'view_booking', type: 'primary' },
                { label: 'Browse Bikes', action: 'browse_bikes', type: 'secondary' }
              ]
            : [{ label: 'Browse Bikes', action: 'browse_bikes', type: 'primary' }];
          this.setConversationContext(userId, { ...context, lastIntent: intent });
          break;
        }

        case 'available_bikes': {
          const bikes = await this.getAvailableBikes();
          responseData = bikes;
          responseText = this.formatBikesResponse(bikes);
          quickActions = bikes.length > 0
            ? [
                { label: 'View Catalog', action: 'open_catalog', type: 'primary' },
                { label: 'Get Quote', action: 'rental_calculator', type: 'secondary' }
              ]
            : [];
          this.setConversationContext(userId, { ...context, lastIntent: intent, bikes: bikes.slice(0, 3) });
          break;
        }

        case 'document_status': {
          const documents = await this.getDocumentStatus(userId);
          responseData = documents;
          responseText = this.formatDocumentResponse(documents);
          quickActions = [
            { label: 'Upload Documents', action: 'upload_docs', type: 'primary' },
            { label: 'Need Help?', action: 'doc_help', type: 'secondary' }
          ];
          this.setConversationContext(userId, { ...context, lastIntent: intent });
          break;
        }

        case 'payment_info': {
          const payments = await this.getPaymentHistory(userId);
          responseData = payments;
          responseText = this.formatPaymentResponse(payments);
          quickActions = [
            { label: 'View All Transactions', action: 'all_payments', type: 'primary' },
            { label: 'Download Receipt', action: 'download_receipt', type: 'secondary' }
          ];
          this.setConversationContext(userId, { ...context, lastIntent: intent });
          break;
        }

        case 'rental_calculator': {
          const { bikeName, days } = this.extractRentalInfo(sanitized);
          const rentalData = await this.calculateRentalCost(bikeName, days || 1);
          responseData = rentalData;
          responseText = this.formatRentalCalculatorResponse(rentalData, days || 1);
          quickActions = rentalData.found
            ? [
                { label: 'Book Now', action: 'book_bike', type: 'primary' },
                { label: 'See More Options', action: 'browse_bikes', type: 'secondary' }
              ]
            : [{ label: 'Browse All Bikes', action: 'browse_bikes', type: 'primary' }];
          this.setConversationContext(userId, { ...context, lastIntent: intent, rentalDays: days, selectedBike: bikeName });
          break;
        }

        // Fix P4 — Booking state machine
        case 'booking_assistance': {
          const step = context.bookingStep || 1;

          // Advance the state machine based on current step
          if (step === 1) {
            // Starting the flow — advance to step 2 (waiting for date)
            this.setConversationContext(userId, { ...context, lastIntent: intent, bookingStep: 2 });
          } else if (step === 2) {
            // Expecting a date — extract it from the message
            const { startDate } = this.extractDateRange(sanitized);
            this.setConversationContext(userId, {
              ...context,
              lastIntent: intent,
              bookingStep: 3,
              bookingDate: startDate ? startDate.toISOString() : null,
            });
          } else if (step === 3) {
            // Expecting duration — extract days and bike type
            const { days } = this.extractRentalInfo(sanitized);
            const bikeTypeMatch = sanitized.match(/sport|underbone|cruiser|scooter/i);
            this.setConversationContext(userId, {
              ...context,
              lastIntent: intent,
              bookingStep: 4,
              bookingDays: days || context.bookingDays || 1,
              bikeType: bikeTypeMatch?.[0] || context.bikeType,
            });
          } else if (step === 4) {
            // Summary shown — reset flow
            this.setConversationContext(userId, { lastIntent: intent, bookingStep: 1 });
          }

          // Render step BEFORE the context update was applied (use 'step' variable)
          responseText = this.formatBookingStep(step, context);
          quickActions = step === 1
            ? [
                { label: '📅 Today', action: 'booking_today', type: 'secondary' },
                { label: '📅 Tomorrow', action: 'booking_tomorrow', type: 'secondary' },
                { label: '🏍️ Browse All Bikes', action: 'browse_bikes', type: 'primary' },
              ]
            : step === 4
            ? [
                { label: 'Go to Booking Page', action: 'book_bike', type: 'primary' },
                { label: 'Get a Quote First', action: 'rental_calculator', type: 'secondary' },
              ]
            : [
                { label: 'Browse Bikes', action: 'browse_bikes', type: 'secondary' },
              ];
          break;
        }

        case 'bike_pricing': {
          const priceData = await this.getPriceComparison();
          responseData = priceData;
          responseText = this.formatPriceResponse(priceData);
          quickActions = [
            { label: 'Book Cheapest', action: 'book_cheapest', type: 'primary' },
            { label: 'Book Premium', action: 'book_premium', type: 'secondary' },
            { label: 'View All', action: 'browse_bikes', type: 'secondary' }
          ];
          this.setConversationContext(userId, { ...context, lastIntent: intent });
          break;
        }

        case 'availability_check': {
          const { startDate, endDate, bikeName } = this.extractDateRange(sanitized);
          const availabilityData = await this.getAvailabilityForDates(startDate, endDate, bikeName);
          responseData = availabilityData;
          responseText = this.formatAvailabilityResponse(availabilityData);
          quickActions = availabilityData.found && availabilityData.bikes.filter((b: any) => b.available).length > 0
            ? [
                { label: 'Book Now', action: 'book_bike', type: 'primary' },
                { label: 'Try Different Dates', action: 'check_dates', type: 'secondary' }
              ]
            : [{ label: 'Browse All Bikes', action: 'browse_bikes', type: 'primary' }];
          this.setConversationContext(userId, { ...context, lastIntent: intent, searchDates: { startDate, endDate }, searchBike: bikeName });
          break;
        }

        case 'general_help': {
          responseText = this.getGeneralHelp(sanitized);
          quickActions = [
            { label: 'Browse Bikes', action: 'browse_bikes', type: 'primary' },
            { label: 'Contact Support', action: 'contact_support', type: 'secondary' }
          ];
          this.setConversationContext(userId, { ...context, lastIntent: intent });
          break;
        }

        case 'recommendations': {
          const recommendations = await this.getPersonalizedRecommendations(userId);
          responseData = recommendations;
          responseText = this.formatRecommendationsResponse(recommendations);
          quickActions = recommendations.length > 0
            ? [
                { label: 'Book Top Pick', action: 'book_bike', type: 'primary' },
                { label: 'See All Bikes', action: 'browse_bikes', type: 'secondary' }
              ]
            : [{ label: 'Browse All Bikes', action: 'browse_bikes', type: 'primary' }];
          this.setConversationContext(userId, { ...context, lastIntent: intent });
          break;
        }

        case 'promotions': {
          // Fix P6 — Now async/DB-driven
          responseText = await this.formatPromotionsResponse();
          quickActions = [
            { label: 'Browse Bikes', action: 'browse_bikes', type: 'primary' },
            { label: 'Get Calculator', action: 'rental_calculator', type: 'secondary' }
          ];
          this.setConversationContext(userId, { ...context, lastIntent: intent });
          break;
        }

        case 'insurance_info': {
          responseText = this.formatInsuranceInfoResponse();
          quickActions = [
            { label: 'Book Now', action: 'book_bike', type: 'primary' },
            { label: 'Browse Bikes', action: 'browse_bikes', type: 'secondary' },
            { label: 'Contact Support', action: 'contact_support', type: 'secondary' }
          ];
          this.setConversationContext(userId, { ...context, lastIntent: intent });
          break;
        }

        case 'contact_agent': {
          // Fix P12 — Use persona humanHandoff
          responseText = MOTOBOT_PERSONA.humanHandoff;
          quickActions = [
            { label: 'Call Now', action: 'contact_phone', type: 'primary' },
            { label: 'Email Support', action: 'contact_email', type: 'secondary' }
          ];
          this.setConversationContext(userId, { ...context, lastIntent: intent });
          break;
        }

        case 'cancellation_request': {
          responseText = this.formatCancellationResponse();
          quickActions = [
            { label: 'Check My Bookings', action: 'check_booking', type: 'primary' },
            { label: 'Contact Support', action: 'contact_support', type: 'secondary' }
          ];
          this.setConversationContext(userId, { ...context, lastIntent: intent });
          break;
        }

        case 'location_hours': {
          responseText = this.formatLocationResponse();
          quickActions = [
            { label: 'Get Directions', action: 'map_directions', type: 'primary' },
            { label: 'Call Us', action: 'contact_phone', type: 'secondary' }
          ];
          this.setConversationContext(userId, { ...context, lastIntent: intent });
          break;
        }

        case 'fuel_policy': {
          responseText = this.formatFuelPolicyResponse();
          quickActions = [
            { label: 'Browse Bikes', action: 'browse_bikes', type: 'primary' },
            { label: 'Calculate Cost', action: 'rental_calculator', type: 'secondary' }
          ];
          this.setConversationContext(userId, { ...context, lastIntent: intent });
          break;
        }

        case 'age_requirements': {
          responseText = this.formatAgeRequirementsResponse();
          quickActions = [
            { label: 'Upload Documents', action: 'upload_docs', type: 'primary' },
            { label: 'Browse Bikes', action: 'browse_bikes', type: 'secondary' }
          ];
          this.setConversationContext(userId, { ...context, lastIntent: intent });
          break;
        }

        case 'damage_liability': {
          responseText = this.formatDamageLiabilityResponse();
          quickActions = [
            { label: 'Check Insurance', action: 'insurance_info', type: 'primary' },
            { label: 'Contact Support', action: 'contact_support', type: 'secondary' }
          ];
          this.setConversationContext(userId, { ...context, lastIntent: intent });
          break;
        }

        case 'helmet_safety': {
          responseText = this.formatHelmetSafetyResponse();
          quickActions = [
            { label: 'Browse Bikes', action: 'browse_bikes', type: 'primary' },
            { label: 'How to Book', action: 'booking_assistance', type: 'secondary' }
          ];
          this.setConversationContext(userId, { ...context, lastIntent: intent });
          break;
        }

        case 'delivery_options': {
          responseText = this.formatDeliveryResponse();
          quickActions = [
            { label: 'Book Now', action: 'book_bike', type: 'primary' },
            { label: 'Browse Bikes', action: 'browse_bikes', type: 'secondary' }
          ];
          this.setConversationContext(userId, { ...context, lastIntent: intent });
          break;
        }

        default:
          // Fix P12 — Use persona fallback instead of generic getGeneralHelp
          responseText = MOTOBOT_PERSONA.fallback;
          quickActions = [
            { label: 'Browse Bikes', action: 'browse_bikes', type: 'primary' },
            { label: 'Check Booking', action: 'check_booking', type: 'secondary' }
          ];
      }

      return {
        message: responseText,
        intent,
        data: responseData,
        quickActions,
        contextData: {
          lastIntent: context.lastIntent,
          currentBike: context.selectedBike,
          currentDates: context.searchDates
        }
      };
    } catch (error) {
      console.error('Error processing chat message:', error);
      return {
        message: `😕 Something went wrong on my end. Please try again or contact us at **support@motorent.com** or **(035) 225-3151**.`,
        intent: 'unknown',
        quickActions: [
          { label: 'Contact Support', action: 'contact_support', type: 'primary' }
        ]
      };
    }
  },


  // Save chat message to database
  async saveMessage(userId: string, userMessage: string, botResponse: string, intent: string): Promise<void> {
    try {
      await supabase.from('chat_conversations').insert({
        user_id: userId,
        user_message: userMessage,
        bot_response: botResponse,
        intent,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error saving chat message:', error);
    }
  },

  // Get chat history
  async getChatHistory(userId: string, limit: number = 50): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data?.reverse() || [];
    } catch (error) {
      console.error('Error fetching chat history:', error);
      return [];
    }
  },

  // Get user preferences based on booking and chat history
  async getUserPreferences(userId: string): Promise<{
    preferredBikeType?: string;
    priceRange?: { min: number; max: number };
    visitCount: number;
    avgRentalDays: number;
  }> {
    try {
      const bookings = await this.getBookingStatus(userId);
      const chatHistory = await this.getChatHistory(userId, 20);

      // Analyze chat history for preferences
      let typePreferences: { [key: string]: number } = {};
      chatHistory.forEach((msg) => {
        const response = msg.response?.toLowerCase() || '';
        if (response.includes('sport')) typePreferences['sport'] = (typePreferences['sport'] || 0) + 1;
        if (response.includes('underbone')) typePreferences['underbone'] = (typePreferences['underbone'] || 0) + 1;
        if (response.includes('cruiser')) typePreferences['cruiser'] = (typePreferences['cruiser'] || 0) + 1;
      });

      // Calculate average rental days
      let totalDays = 0;
      bookings.forEach((booking) => {
        const start = new Date(booking.start_date);
        const end = new Date(booking.end_date);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        totalDays += days;
      });

      const preferredType = Object.entries(typePreferences).sort((a, b) => b[1] - a[1])[0]?.[0];
      const avgRentalDays = bookings.length > 0 ? Math.round(totalDays / bookings.length) : 1;

      return {
        preferredBikeType: preferredType,
        visitCount: bookings.length,
        avgRentalDays,
      };
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return { visitCount: 0, avgRentalDays: 1 };
    }
  },

  // Get personalized recommendations
  async getPersonalizedRecommendations(userId: string): Promise<any[]> {
    try {
      const preferences = await this.getUserPreferences(userId);
      let query = supabase.from('motorcycles').select('id, name, type, engine_capacity, price_per_day, rating').eq('availability', 'Available');

      // Filter by preferred type if available
      if (preferences.preferredBikeType) {
        query = query.ilike('type', `%${preferences.preferredBikeType}%`);
      }

      const { data, error } = await query.limit(5);
      if (error) throw error;

      // Sort by relevance (rating and price)
      return (data || []).sort((a, b) => b.rating - a.rating).slice(0, 3);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return [];
    }
  },

  // Fix P12 — Personalized greeting using MOTOBOT_PERSONA
  async formatPersonalizedGreeting(userId: string): Promise<string> {
    const preferences = await this.getUserPreferences(userId);
    const recommendations = await this.getPersonalizedRecommendations(userId);

    // First-time user — use persona new greeting
    if (preferences.visitCount === 0) {
      return MOTOBOT_PERSONA.greeting.new;
    }

    // Returning user — use persona returning greeting + bike recommendations
    let greeting = MOTOBOT_PERSONA.greeting.returning(preferences.visitCount);

    if (recommendations.length > 0) {
      greeting += `\n\n⭐ **Based on your history, you might love:**\n`;
      recommendations.forEach((bike) => {
        greeting += `• **${bike.name}** — ${bike.type} | ${bike.engine_capacity}cc | ₱${bike.price_per_day}/day | ${bike.rating}⭐\n`;
      });
    }

    return greeting;
  },

};

