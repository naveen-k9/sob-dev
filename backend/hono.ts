import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

// app will be mounted at /api
const app = new Hono();

// Enable CORS for all routes
app.use("*", cors());

// Mount tRPC router at /trpc
app.use(
  "/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
  })
);

// Simple health check endpoint
app.get("/", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});

// Razorpay payment link creation (legacy)
app.post("/payments/razorpay/create-link", async (c) => {
  try {
    const body = await c.req.json();
    const amount = Number(body?.amount ?? 0);
    const currency: string = (body?.currency as string) ?? "INR";
    const customer = body?.customer ?? {};
    const description: string = (body?.description as string) ?? "Order payment";
    const callback_url: string | undefined = body?.callback_url as string | undefined;

    if (!amount || amount <= 0) {
      return c.json({ error: "Invalid amount" }, 400);
    }

    const keyId = process.env.EXPO_PUBLIC_RAZORPAY_ID ?? "";
    const secret = process.env.RAZORPAY_SECRET ?? "";

    if (!keyId || !secret) {
      console.error("[payments] Razorpay keys not configured", { hasKeyId: !!keyId, hasSecret: !!secret });
      return c.json({ error: "Razorpay keys not configured" }, 500);
    }

    const auth = Buffer.from(`${keyId}:${secret}`).toString("base64");

    const payload = {
      amount: Math.round(amount * 100),
      currency,
      accept_partial: false,
      description,
      customer,
      notify: { sms: true, email: !!customer?.email },
      callback_url,
      callback_method: callback_url ? "get" : undefined,
    } as const;

    const resp = await fetch("https://api.razorpay.com/v1/payment_links", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return c.json({ error: "Failed to create payment link", details: errText }, 500);
    }

    const data = await resp.json();
    return c.json({ id: data?.id, short_url: data?.short_url, status: data?.status });
  } catch (e) {
    console.error("[payments] create-link error", e);
    return c.json({ error: "Server error" }, 500);
  }
});

// Razorpay create order via env keys
app.post("/payments/razorpay/create-order", async (c) => {
  try {
    const body = await c.req.json();
    const amount = Number(body?.amount ?? 0);
    const currency: string = (body?.currency as string) ?? "INR";
    const receipt: string = (body?.receipt as string) ?? `rcpt_${Date.now()}`;
    const notes: Record<string, string> = (body?.notes as Record<string, string>) ?? {};

    if (!amount || amount <= 0) {
      return c.json({ error: "Invalid amount" }, 400);
    }

    const keyId = process.env.EXPO_PUBLIC_RAZORPAY_ID ?? "";
    const secret = process.env.RAZORPAY_SECRET ?? "";

    if (!keyId || !secret) {
      console.error("[payments] Razorpay keys not configured", { hasKeyId: !!keyId, hasSecret: !!secret });
      return c.json({ error: "Razorpay keys not configured" }, 500);
    }

    const auth = Buffer.from(`${keyId}:${secret}`).toString("base64");

    const payload = {
      amount: Math.round(amount * 100),
      currency,
      receipt,
      notes,
    } as const;

    const resp = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("[payments] create-order failed", errText);
      return c.json({ error: "Failed to create order", details: errText }, 500);
    }

    const data = await resp.json();
    return c.json(data);
  } catch (e) {
    console.error("[payments] create-order error", e);
    return c.json({ error: "Server error" }, 500);
  }
});

// Razorpay Checkout bridge page
app.get("/payments/razorpay/checkout", async (c) => {
  try {
    const url = new URL(c.req.url);
    const orderId = url.searchParams.get("orderId");
    const amount = url.searchParams.get("amount");
    const name = url.searchParams.get("name") ?? "Payment";
    const description = url.searchParams.get("description") ?? "Order payment";
    const email = url.searchParams.get("email") ?? "";
    const contact = url.searchParams.get("contact") ?? "";
    const themeColor = url.searchParams.get("themeColor") ?? "#48479B";

    const keyId = process.env.EXPO_PUBLIC_RAZORPAY_ID ?? "";
    if (!orderId || !keyId) {
      console.error("[payments] Missing orderId or Razorpay key", { hasOrderId: !!orderId, hasKeyId: !!keyId });
      return c.text("Missing orderId or Razorpay key", 400);
    }

    const successUrl = `${url.origin}/api/payments/razorpay/thankyou?status=success&order_id=${encodeURIComponent(
      orderId
    )}`;
    const failureUrl = `${url.origin}/api/payments/razorpay/thankyou?status=failed&order_id=${encodeURIComponent(
      orderId
    )}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Razorpay Checkout</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; margin:0; padding:0; display:flex; align-items:center; justify-content:center; height:100vh; background:#fff; }
  .btn { background:${themeColor}; color:#fff; padding:14px 20px; border-radius:12px; border:none; font-size:16px; font-weight:700; }
  .wrap { text-align:center; padding:24px; }
  .muted { color:#6b7280; margin-top:12px; font-size:14px; }
</style>
</head>
<body>
  <div class="wrap">
    <button id="payBtn" class="btn">Pay Now</button>
    <p class="muted">If the payment window doesn't open, tap the button again.</p>
  </div>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <script>
    const options = {
      key: ${JSON.stringify(keyId)},
      order_id: ${JSON.stringify(orderId)},
      amount: ${JSON.stringify(amount || '')},
      name: ${JSON.stringify(name)},
      description: ${JSON.stringify(description)},
      theme: { color: ${JSON.stringify(themeColor)} },
      prefill: { name: ${JSON.stringify(name)}, email: ${JSON.stringify(email)}, contact: ${JSON.stringify(contact)} },
      redirect: true,
      callback_url: ${JSON.stringify(successUrl)},
      cancel_url: ${JSON.stringify(failureUrl)},
    };
    function openCheckout(){
      const rzp = new window.Razorpay(options);
      rzp.open();
    }
    document.getElementById('payBtn').addEventListener('click', openCheckout);
    // auto open
    setTimeout(openCheckout, 100);
  </script>
</body>
</html>`;

    return new Response(html, { headers: { "Content-Type": "text/html" } });
  } catch (e) {
    console.error("[payments] checkout page error", e);
    return c.text("Checkout page error", 500);
  }
});

// Simple thankyou page used for redirects
app.get("/payments/razorpay/thankyou", (c) => {
  const url = new URL(c.req.url);
  const status = url.searchParams.get("status") ?? "unknown";
  const orderId = url.searchParams.get("order_id") ?? "";
  const html = `<!DOCTYPE html><html><head><meta name=viewport content="width=device-width, initial-scale=1"/><title>Payment ${status}</title>
  <style>body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;padding:24px}</style>
  </head><body>
  <h2>Payment ${status}</h2>
  <p>Order: ${orderId}</p>
  <p>You can close this window.</p>
  </body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html" } });
});

export default app;