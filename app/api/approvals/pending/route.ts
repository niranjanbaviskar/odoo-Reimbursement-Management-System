import { Role } from "@prisma/client";

import { fail, ok } from "@/lib/api";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assignWorkflowToExpense } from "@/lib/services/workflow-engine";

export async function GET() {
    try {
        const session = await getAuthSession();
        if (!session?.user) return fail("Unauthorized", 401);
        if (session.user.role !== Role.ADMIN && session.user.role !== Role.MANAGER) {
            return fail("Forbidden", 403);
        }

        const orphanExpenses = await prisma.expense.findMany({
            where: {
                companyId: session.user.companyId,
                status: "PENDING",
                approvals: { none: {} },
            },
            select: { id: true },
            take: 50,
        });

        if (orphanExpenses.length) {
            await Promise.all(
                orphanExpenses.map((expense) =>
                    assignWorkflowToExpense(session.user.companyId, expense.id).catch(() => null),
                ),
            );
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
