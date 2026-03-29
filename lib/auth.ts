import { Role } from "@prisma/client";
import bcrypt from "bcrypt";
import { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { prisma } from "@/lib/prisma";
import { signInSchema } from "@/lib/validators/auth";

const AUTH_SECRET = process.env.NEXTAUTH_SECRET || "claimflow-dev-secret-change-in-production";

export const authOptions: NextAuthOptions = {
    secret: AUTH_SECRET,
    session: { strategy: "jwt" },
    pages: {
        signIn: "/login",
    },
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const parsed = signInSchema.safeParse(credentials);
                if (!parsed.success) {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: { email: parsed.data.email },
                });

                if (!user) {
                    return null;
                }

                const isValidPassword = await bcrypt.compare(parsed.data.password, user.passwordHash);
                if (!isValidPassword) {
                    return null;
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    companyId: user.companyId,
                    role: user.role,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.companyId = user.companyId;
                token.role = user.role as Role;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id;
                session.user.companyId = token.companyId;
                session.user.role = token.role;
            }
            return session;
        },
    },
};

export const getAuthSession = () => getServerSession(authOptions);
