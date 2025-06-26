import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const { email, password, name } = req.body;

  if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(409).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || "",
      },
    });

    return res.status(201).json({ message: "Signup successful", user: { id: newUser.id, email: newUser.email } });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}
