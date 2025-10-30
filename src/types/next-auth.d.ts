import { DefaultSession } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isAdmin: boolean;
      // allow both Date (from DB) and boolean (client interpretation)
      emailVerified?: boolean | Date | null;
      phoneVerified?: boolean | Date | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    password?: string | null;
    image?: string | null;

    // fields from your Prisma schema
    emailVerified?: Date | null; // Prisma stores DateTime?
    phoneVerified?: boolean;
    phoneNumber?: string | null;
    authProvider?: string | null;
    isAdmin?: boolean;

    createdAt?: Date;
    updatedAt?: Date;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    isAdmin?: boolean;
    emailVerified?: boolean | Date | null;
    phoneVerified?: boolean | Date | null;
  }
}
