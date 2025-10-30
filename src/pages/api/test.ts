import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const isLoaded = !!process.env.AUTH_SECRET;

  return res.status(200).json({
    key: isLoaded ? "Loaded ✅" : "Missing ❌",
    envValue: isLoaded ? "[hidden]" : null,
  });
}
