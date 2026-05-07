// Dumaguete MotoRent Chat Function
// Handles AI assistant responses with proper business context

// @ts-ignore - Deno runtime types
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore - External module
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

// @ts-ignore - Deno environment API
const supabaseUrl = Deno.env.get("SUPABASE_URL");
// @ts-ignore - Deno environment API
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Missing Supabase configuration");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// ============================================================
// MOTOBOT PERSONA — Dumaguete MotoRent
// ============================================================
const MOTOBOT_PERSONA = {
  name: "Dumaguete MotoRent Assistant",
  businessInfo: {
    name: "Dumaguete MotoRent",
    location: "Dumaguete City, Negros Oriental, Philippines",
    phone: "091234323212",
    email: "support@dumagueteMotorAent.com",
    hours: "Monday–Sunday, 8:00 AM – 5:00 PM",
  },
  policies: {
    minAge: 18,
    requiredDocuments: [
      "Valid government-issued ID",
      "Driver's license (motorcycle license required for bikes above 125cc)",
    ],
  },
};

// ============================================================
// INTENT CLASSIFICATION
// ============================================================
function classifyIntent(message: string): string {
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("booking") ||
    lowerMessage.includes("reservation") ||
    lowerMessage.includes("my booking") ||
    lowerMessage.includes("check status")
  ) {
    return "booking_status";
  }

  if (
    lowerMessage.includes("available") ||
    lowerMessage.includes("motorcycle") ||
    lowerMessage.includes("bike") ||
    lowerMessage.includes("scooter")
  ) {
    return "available_bikes";
  }

  if (
    lowerMessage.includes("price") ||
    lowerMessage.includes("pricing") ||
    lowerMessage.includes("cost") ||
    lowerMessage.includes("rate")
  ) {
    return "bike_pricing";
  }

  if (
    lowerMessage.includes("requirement") ||
    lowerMessage.includes("license") ||
    lowerMessage.includes("age") ||
    lowerMessage.includes("document")
  ) {
    return "age_requirements";
  }

  if (
    lowerMessage.includes("how to book") ||
    lowerMessage.includes("booking process") ||
    lowerMessage.includes("help me book")
  ) {
    return "booking_assistance";
  }

  if (
    lowerMessage.includes("cancel") ||
    lowerMessage.includes("refund") ||
    lowerMessage.includes("cancellation")
  ) {
    return "cancellation_request";
  }

  if (
    lowerMessage.includes("contact") ||
    lowerMessage.includes("support") ||
    lowerMessage.includes("help") ||
    lowerMessage.includes("speak to")
  ) {
    return "contact_agent";
  }

  if (
    lowerMessage.includes("location") ||
    lowerMessage.includes("address") ||
    lowerMessage.includes("where") ||
    lowerMessage.includes("hours")
  ) {
    return "location_hours";
  }

  if (
    lowerMessage.includes("insurance") ||
    lowerMessage.includes("coverage") ||
    lowerMessage.includes("damage")
  ) {
    return "insurance_info";
  }

  if (
    lowerMessage.includes("fuel") ||
    lowerMessage.includes("gas") ||
    lowerMessage.includes("tank")
  ) {
    return "fuel_policy";
  }

  return "general_help";
}

// ============================================================
// RESPONSE FORMATTERS
// ============================================================

function formatBookingStatusResponse(): string {
  return `📅 **Your Booking Status**\n\nTo check your current bookings, please:\n\n1. Go to the **Reservations** page\n2. View your active and past bookings\n3. Check booking status, dates, and details\n\nIf you need further assistance, please [contact our support team](#).\n\n📞 **Phone:** ${MOTOBOT_PERSONA.businessInfo.phone}\n⏰ **Hours:** ${MOTOBOT_PERSONA.businessInfo.hours}`;
}

function formatAvailableBikesResponse(): string {
  return `🏍️ **Available Vehicles**\n\nWe offer a variety of motorcycles and scooters to suit your needs.\n\nTo browse our available vehicles:\n\n1. Visit the **Motorcycles** page\n2. Filter by type, price, or engine capacity\n3. Check real-time availability for your dates\n\n💡 **Quick Tips:**\n• Check availability for your preferred dates\n• Compare prices and features\n• Read customer reviews\n\nWould you like help with anything specific?`;
}

function formatPricingResponse(): string {
  return `💰 **Pricing Information**\n\nOur rental rates vary based on vehicle type and rental duration.\n\n**To get a quote:**\n\n1. Visit the **Motorcycles** page\n2. Select your preferred vehicle\n3. Choose your rental dates\n4. We'll calculate your total cost\n\n**What's Included:**\n✓ Helmet\n✓ Lock\n✓ Basic insurance coverage\n\n**What's Not Included:**\n• Fuel (full-to-full policy)\n• Additional insurance upgrades\n• Damage deposits\n\nFor detailed pricing, please visit our booking page or contact support.`;
}

function formatRequirementsResponse(): string {
  return `📋 **Rental Requirements**\n\n**To rent from Dumaguete MotoRent, you must:**\n\n✓ **Minimum Age:** ${MOTOBOT_PERSONA.policies.minAge} years old\n✓ **Valid Government ID:** Passport or National ID\n✓ **Driver's License:** Valid driver's license required\n✓ **Motorcycle License:** Required for bikes above 125cc\n\n**Additional Requirements:**\n• Contact information\n• Booking deposit\n• Terms and conditions agreement\n\nFor more details or special cases, please [contact our support team](#).\n\n📞 **Phone:** ${MOTOBOT_PERSONA.businessInfo.phone}`;
}

function formatBookingAssistanceResponse(): string {
  return `🎯 **How to Book**\n\nBooking with Dumaguete MotoRent is easy!\n\n**Step 1: Browse Vehicles**\n• Visit the Motorcycles page\n• Filter by type, price, or features\n\n**Step 2: Select Dates**\n• Choose your pickup date\n• Choose your return date\n• Check availability in real-time\n\n**Step 3: Provide Details**\n• Enter your contact information\n• Upload required documents\n• Review rental terms\n\n**Step 4: Payment**\n• Select your payment method\n• Complete payment\n• Receive booking confirmation\n\n**Need Help?** Contact us anytime at ${MOTOBOT_PERSONA.businessInfo.phone}`;
}

function formatCancellationResponse(): string {
  return `❌ **Cancellation & Refund Policy**\n\nUnderstanding our cancellation policy helps you plan your rental.\n\n**Cancellation Timeline:**\n\n✅ **24+ hours before pickup:** 100% refund\n⚠️ **12–24 hours before pickup:** 50% refund\n❌ **Less than 12 hours:** No refund\n\n**To Cancel Your Booking:**\n\n1. Go to the **Reservations** page\n2. Select your booking\n3. Click "Cancel Booking"\n4. Confirm cancellation\n\nRefunds are processed within 3–5 business days.\n\n**Questions?** Please [contact support](#) for assistance.\n\n📞 **Phone:** ${MOTOBOT_PERSONA.businessInfo.phone}`;
}

function formatContactAgentResponse(): string {
  return `📞 **Connect with Our Support Team**\n\nOur friendly team is ready to assist you!\n\n**Contact Information:**\n\n📱 **Phone:** ${MOTOBOT_PERSONA.businessInfo.phone}\n⏰ **Hours:** ${MOTOBOT_PERSONA.businessInfo.hours}\n📍 **Location:** Dumaguete City, Negros Oriental, Philippines\n\n**We're here to help with:**\n• Booking inquiries\n• Vehicle recommendations\n• Rental policies and terms\n• Technical support\n• General questions\n\nFeel free to reach out anytime during business hours!`;
}

function formatLocationResponse(): string {
  return `📍 **Our Location & Hours**\n\n**Dumaguete MotoRent**\n📍 Dumaguete City, Negros Oriental, Philippines\n\n**Operating Hours:**\n⏰ ${MOTOBOT_PERSONA.businessInfo.hours}\n\n**Contact:**\n📱 **Phone:** ${MOTOBOT_PERSONA.businessInfo.phone}\n📧 **Email:** ${MOTOBOT_PERSONA.businessInfo.email}\n\n**Closed:** Closed on major holidays (specific dates available upon request)\n\nVisit us in person or call ahead for any inquiries!`;
}

function formatInsuranceResponse(): string {
  return `🛡️ **Insurance & Coverage**\n\nYour safety and peace of mind are important to us.\n\n**What's Included:**\n✓ Basic accident coverage\n✓ Liability protection\n✓ Damage assessment support\n\n**Important Notes:**\n• Coverage applies to accidents not caused by negligence\n• Damage deposits are required at pickup\n• Premium insurance upgrades available\n\n**In Case of Accident:**\n1. Contact us immediately\n2. Document the damage with photos\n3. File a claim with your details\n4. We'll assess and process your claim\n\nFor complete coverage details, ask our support team or review the rental agreement.\n\n📞 **Support:** ${MOTOBOT_PERSONA.businessInfo.phone}`;
}

function formatFuelPolicyResponse(): string {
  return `⛽ **Fuel Policy**\n\nUnderstanding our fuel policy ensures a smooth rental experience.\n\n**Fuel-to-Full Policy:**\n• All motorcycles are delivered with a full tank\n• You must return the motorcycle with a full tank\n• Refueling costs are your responsibility\n\n**If Returned on Empty:**\n• Fuel charges will be deducted from your deposit\n• Additional penalties may apply\n\n**Tip:** Plan your route and locate nearby gas stations to avoid delays.\n\nFor specific details or questions, contact our team.\n\n📞 **Phone:** ${MOTOBOT_PERSONA.businessInfo.phone}`;
}

function formatGeneralHelpResponse(): string {
  return `👋 **How Can I Help?**\n\nI'm your Dumaguete MotoRent AI assistant. I can help you with:\n\n🏍️ **Vehicle Info** — Types, availability, and features\n💰 **Pricing** — Daily rates and payment options\n📅 **Bookings** — How to reserve a motorcycle\n📋 **Requirements** — Age, licenses, and documents\n🛡️ **Policies** — Cancellation, fuel, insurance\n📍 **Location** — Where we're located and hours\n📞 **Support** — How to contact our team\n\n**Ask me anything** related to Dumaguete MotoRent!\n\n_For complex issues, I can connect you with our support team._`;
}

// ============================================================
// MAIN CHAT HANDLER
// ============================================================
// @ts-ignore - Deno serve function signature
serve(async (req: any) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const { message, userId } = await req.json();

    if (!message || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing message or userId" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Classify the user's intent
    const intent = classifyIntent(message);

    // Generate response based on intent
    let responseMessage = "";

    switch (intent) {
      case "booking_status":
        responseMessage = formatBookingStatusResponse();
        break;
      case "available_bikes":
        responseMessage = formatAvailableBikesResponse();
        break;
      case "bike_pricing":
        responseMessage = formatPricingResponse();
        break;
      case "age_requirements":
        responseMessage = formatRequirementsResponse();
        break;
      case "booking_assistance":
        responseMessage = formatBookingAssistanceResponse();
        break;
      case "cancellation_request":
        responseMessage = formatCancellationResponse();
        break;
      case "contact_agent":
        responseMessage = formatContactAgentResponse();
        break;
      case "location_hours":
        responseMessage = formatLocationResponse();
        break;
      case "insurance_info":
        responseMessage = formatInsuranceResponse();
        break;
      case "fuel_policy":
        responseMessage = formatFuelPolicyResponse();
        break;
      default:
        responseMessage = formatGeneralHelpResponse();
    }

    // Save message to database
    try {
      await supabase.from("chat_messages").insert({
        user_id: userId,
        message: message,
        response: responseMessage,
        intent: intent,
        timestamp: new Date().toISOString(),
      });
    } catch (dbError) {
      console.error("Error saving to database:", dbError);
      // Continue even if save fails
    }

    return new Response(
      JSON.stringify({
        message: responseMessage,
        intent: intent,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(
      JSON.stringify({
        error: "Error processing your request",
        message:
          "I apologize for the inconvenience. Please try again or contact our support team at 091234323212.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
