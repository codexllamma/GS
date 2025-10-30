import NextAuth, { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

console.log("NEXTAUTH_SECRET:", process.env.NEXTAUTH_SECRET);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error("No account found with this email");
        }

        
        if (!user.password) {
          throw new Error("This account uses Google Sign-In only");
        }

        /*
        if (!user.emailVerified) {
          throw new Error("Please verify your email before signing in");
        }
        */
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error("Incorrect password");
        }

        
        return user;
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

  callbacks: {
    
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = (user as any).isAdmin ?? false;
        token.emailVerified = Boolean((user as any).emailVerified);
        token.phoneVerified = Boolean((user as any).phoneVerified);
      }
      return token;
    },

    // 🔹 Adds extra data to session object
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.isAdmin = token.isAdmin as boolean;
        session.user.emailVerified = token.emailVerified as boolean;
        session.user.phoneVerified = token.phoneVerified as boolean;
      }
      return session;
    },

    // 🔹 Runs when user signs in (handles both Google + credentials)
    async signIn({ user, account }) {
      try {
        const provider = account?.provider;
        const userId = (user as any)?.id;

        if (!provider || !userId) return false;

        const existingUser = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (existingUser) {
          // Update provider if needed
          await prisma.user.update({
            where: { id: userId },
            data: { authProvider: provider },
          });
        } else {
          // Create new Google user if missing
          await prisma.user.create({
            data: {
              id: userId,
              email: user.email,
              name: user.name,
              image: user.image,
              authProvider: provider,
              emailVerified: new Date(),
            },
          });
        }

        /*
        if (provider === "credentials" && !user.emailVerified) {
          return false;
        }
        */
        return true;
      } catch (err) {
        console.error("signIn error:", err);
        return false;
      }
    },
  },

  pages: {
    signIn: "/",
    signOut: "/",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
    newUser: "/dashboard", 
  },

  secret: process.env.NEXTAUTH_SECRET!,
};

export default NextAuth(authOptions);
