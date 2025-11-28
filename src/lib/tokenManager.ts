// lib/xpressbees/tokenManager.ts

import axios from "axios";

let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

const XB_BASE_URL = process.env.XB_API_BASE || "https://shipment.xpressbees.com/api";
const XB_EMAIL = process.env.XB_EMAIL!;
const XB_PASSWORD = process.env.XB_PASSWORD!;

const DEFAULT_TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

async function loginToXpressBees(): Promise<string> {
  const response = await axios.post(
    `${XB_BASE_URL}/users/login`,
    {
      email: XB_EMAIL,
      password: XB_PASSWORD,
    },
    { headers: { "Content-Type": "application/json" } }
  );

  console.log("🔍 XpressBees login raw response:", response.data);

  const rawData = response.data?.data;

  // Token may be inside raw string or objects
  const token =
    (typeof rawData === "string" ? rawData : null) ||
    rawData?.token ||
    response.data?.token ||
    response.data?.access_token;

  if (!token) {
    console.error("❌ XpressBees Login Response (No Token Found):", response.data);
    throw new Error("Failed to obtain token from XpressBees");
  }

  // Try extracting expiry if exists
  const expiresInSeconds =
    (typeof rawData === "object" ? rawData?.expires_in : null) || null;

  tokenExpiry = Date.now() + (expiresInSeconds ? expiresInSeconds * 1000 : DEFAULT_TOKEN_TTL_MS);
  cachedToken = token;

  console.log("🔐 XpressBees token refreshed:", token.substring(0, 20) + "...");

  return token;
}

export async function getXpressBeesToken(): Promise<string> {
  if (!cachedToken || !tokenExpiry) {
    return await loginToXpressBees();
  }

  const now = Date.now();
  const bufferMs = 60 * 1000;

  if (now >= tokenExpiry - bufferMs) {
    return await loginToXpressBees();
  }

  return cachedToken;
}
