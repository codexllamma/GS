import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";
import { Session } from "next-auth";

export async function adminMiddleware(req:NextApiRequest, res:NextApiResponse, next:() => void): Promise<void> {
    const session = await getServerSession(req,res, authOptions) as Session;

    if(!session || !(session.user as any).id){
      return res.status(401).json({message: "Unauthorized"})
    }

    const user = await prisma.user.findUnique({ where: {id: (session.user as any).id}});

    if(!user || !user.isAdmin){
       return res.status(403).json({message: "Only Admins are allowed to handle this operation"});
    }

    next();
  };