import { serve } from "std/http/server.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
};

const MOTOBOT_SYSTEM_PROMPT = [
  "You are Moto, the friendly AI assistant for MotoRent — a motorcycle rental shop in Calinog, Iloilo, Philippines.",
  "",
  "Persona: Warm, professional, helpful — like a knowledgeable local friend.",
  'Use English with occasional Filipino expressions (e.g., "Sige!", "Salamat!"). Never sound robotic.',
  "",
  "Business: Phone: (035) 225-3151 | Email: support@motorent.com | Hours: Mon–Sun 8AM–8PM | Holidays: 9AM–6PM",
  "",
  "Pricing: ₱500–₱750/day. Always use ₱ never $ or USD.",
  "Included FREE: helmets, gloves, basic insurance. Premium insurance upgrade: +₱300/day.",
  "",
  "Requirements: Min age 18 | Valid motorcycle license | Gov-issued ID | 1 year riding experience | Cash deposit.",
  "",
  "Policies:",
  "- Fuel: Full-to-full (return full or pay ₱50/liter + ₱500 fee)",
  "- Cancellation: 100% refund 24hrs+ | 50% refund 12–24hrs | No refund under 12hrs",
  "- Late return: ₱200/hr (first 2hrs), ₱500/hr after",
  "",
  "Cannot do: Create/modify/cancel bookings | Process refunds | Override policies | Access real-time availability.",
  "",
  "Rules:",
  "1. Max 3 paragraphs — be concise",
  "2. Always end with one clear next step",
  "3. Always use ₱ for currency",
  "4. Stay on motorcycle rental topics only",
  "5. If unsure, give phone: (035) 225-3151",
].join("\n");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing GEMINI_API_KEY secret" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const body = await req.json().catch(() => ({}));
    const message = typeof body?.message === "string" ? body.message : "";

    if (!message.trim()) {
      return new Response(JSON.stringify({ error: "Missing required field: message" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: MOTOBOT_SYSTEM_PROMPT }],
          },
          contents: [{ parts: [{ text: message }] }],
          generationConfig: {
            maxOutputTokens: 300,
            temperature: 0.7,
            topP: 0.9,
          },
        }),
      },
    );

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text().catch(() => "");
      return new Response(
        JSON.stringify({
          error: "Gemini API error",
          status: geminiResponse.status,
          details: errText,
        }),
        {
          status: 502,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    const data = await geminiResponse.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    return new Response(JSON.stringify({ text: (text && String(text).trim()) || "" }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Edge Function error",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  }
});

