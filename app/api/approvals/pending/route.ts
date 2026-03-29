import { Role } from "@prisma/client";

import { fail, ok } from "@/lib/api";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await getAuthSession();
        if (!session?.user) return fail("Unauthorized", 401);
        if (session.user.role !== Role.ADMIN && session.user.role !== Role.MANAGER) {
            return fail("Forbidden", 403);
        }

        const pending = await prisma.expenseApproval.findMany({
            where: {
                approverId: session.user.id,
                status: "PENDING",
                expense: { companyId: session.user.companyId },
            },
            include: {
                expense: {
                    include: {
                        user: { select: { id: true, name: true } },
                        workflow: { select: { id: true, name: true } },
                    },
                },
                step: true,
            },
            orderBy: { createdAt: "asc" },
        });

        return ok(pending);
    } catch (error) {
        return fail("Failed to fetch pending approvals", 500, String(error));
    }
}
