import { Role } from "@prisma/client";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            companyId: string;
            role: Role;
        } & DefaultSession["user"];
    }

    interface User {
        id: string;
        companyId: string;
        role: Role;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        companyId: string;
        role: Role;
    }
}
