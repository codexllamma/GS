import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { shop, code } = req.query;

  if (!shop || !code) {
    return res.status(400).json({
      error: "Missing shop or code.",
    });
  }

  try {
    const response = await fetch(
      `https://${shop}/admin/oauth/access_token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.SHOPIFY_CLIENT_ID,
          client_secret: process.env.SHOPIFY_API_SECRET,
          code,
        }),
      }
    );

    const data = await response.json();





    return res.status(200).json(data);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Failed to exchange token.",
    });
  }
}