import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const { email, password } = req.body;

  if (!email || !password) return res.status(400).json({ message: "Email and password required" });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    return res.status(200).json({ message: "Login successful", user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error("Signin error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}
