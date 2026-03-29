import { Role } from "@prisma/client";

import { getAuthSession } from "@/lib/auth";

export async function requireAuth() {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new Error("Unauthorized");
    }
    return session.user;
}

export function requireRole(userRole: Role, allowed: Role[]) {
    if (!allowed.includes(userRole)) {
        throw new Error("Forbidden");
    }
}

export const canManageCompany = (role: Role) => role === "ADMIN";
export const canApproveExpenses = (role: Role) => role === "ADMIN" || role === "MANAGER";
