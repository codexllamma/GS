import crypto from "crypto";

function hashField(value?: string | null): string | undefined {
  if (!value) return undefined;
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export async function sendMetaCapiPurchase(params: {
  eventId: string;
  totalAmount: number;
  currency?: string;
  email?: string;
  phone?: string;
  clientIp?: string;
  userAgent?: string;
}) {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    console.warn("[META CAPI] Missing environment variables. Skipping dispatch.");
    return;
  }

  const payload = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: params.eventId,
        action_source: "website",
        user_data: {
          em: params.email ? [hashField(params.email)] : undefined,
          ph: params.phone ? [hashField(params.phone)] : undefined,
          client_ip_address: params.clientIp,
          client_user_agent: params.userAgent,
        },
        custom_data: {
          currency: params.currency || "INR",
          value: params.totalAmount,
        },
      },
    ],
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    return await res.json();
  } catch (err) {
    console.error("[META CAPI ERROR]:", err);
  }
}