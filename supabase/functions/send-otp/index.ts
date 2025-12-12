import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
const RESEND_FROM = Deno.env.get("RESEND_FROM") || "otp@motorent-dumaguete.site"

// CORS headers that allow the request
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    })
  }

  try {
    const { to, subject, html, text } = await req.json()

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, html" }),
        {
          status: 400,
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          },
        }
      )
    }

    console.log(`📧 Sending OTP email to ${to}`)

    // Call Resend API
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [to],
        subject,
        html,
        text,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("❌ Resend API error:", data)
      return new Response(
        JSON.stringify({ 
          error: "Failed to send email", 
          details: data,
          status: response.status 
        }),
        {
          status: response.status,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          },
        }
      )
    }

    console.log(`✅ Email sent successfully to ${to}`)
    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      },
    })
  } catch (error) {
    console.error("❌ Edge Function error:", error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: String(error)
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        },
      }
    )
  }
})

