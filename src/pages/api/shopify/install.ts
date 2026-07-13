import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const shop = process.env.SHOPIFY_SHOP_DOMAIN;
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const scopes = process.env.SHOPIFY_SCOPES;
  const redirectUri = process.env.SHOPIFY_REDIRECT_URI;

  if (!shop || !clientId || !scopes || !redirectUri) {
    return res.status(500).json({
      error: "Missing Shopify environment variables.",
    });
  }

  // CSRF protection
  const state = crypto.randomBytes(16).toString("hex");

  const installUrl =
    `https://${shop}/admin/oauth/authorize` +
    `?client_id=${clientId}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${state}`;

  console.log("Redirecting to:", installUrl);

  res.redirect(installUrl);
}