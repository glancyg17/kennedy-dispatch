// Supabase Edge Function: create-payment-link
// Deploy with: supabase functions deploy create-payment-link
// Set the secret with: supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;

Deno.serve(async (req) => {
  // CORS for calls from your dispatch app
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  try {
    const { amount_pence, description, job_id, customer_name } = await req.json();

    if (!amount_pence || amount_pence < 30) {
      return new Response(JSON.stringify({ error: "Invalid amount" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // 1. Create a one-off Price for this exact amount
    const priceRes = await fetch("https://api.stripe.com/v1/prices", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        currency: "gbp",
        unit_amount: String(amount_pence),
        "product_data[name]": description || "Kennedy Executive Travel booking",
      }),
    });
    const price = await priceRes.json();
    if (!priceRes.ok) throw new Error(price.error?.message || "Price creation failed");

    // 2. Create the Payment Link pointing at that price
    const linkRes = await fetch("https://api.stripe.com/v1/payment_links", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "line_items[0][price]": price.id,
        "line_items[0][quantity]": "1",
        "metadata[job_id]": job_id || "",
        "metadata[customer_name]": customer_name || "",
        "after_completion[type]": "hosted_confirmation",
        "after_completion[hosted_confirmation][custom_message]":
          "Thanks — your payment with Kennedy Executive Travel is confirmed.",
      }),
    });
    const link = await linkRes.json();
    if (!linkRes.ok) throw new Error(link.error?.message || "Payment link creation failed");

    return new Response(JSON.stringify({ url: link.url, link_id: link.id }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
