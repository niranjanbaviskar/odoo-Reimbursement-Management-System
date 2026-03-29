import { Role } from "@prisma/client";

import { fail, ok } from "@/lib/api";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const session = await getAuthSession();
        if (!session?.user) return fail("Unauthorized", 401);

        const { id } = await context.params;

        const expense = await prisma.expense.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, name: true, email: true } },
                workflow: { include: { steps: { orderBy: { stepOrder: "asc" } } } },
                items: true,
                approvals: {
                    include: {
                        approver: { select: { id: true, name: true, role: true } },
                        step: true,
                    },
                },
            },
        });

        if (!expense || expense.companyId !== session.user.companyId) {
            return fail("Expense not found", 404);
        }

        if (session.user.role === Role.EMPLOYEE && expense.userId !== session.user.id) {
            return fail("Forbidden", 403);
        }

        return ok(expense);
    } catch (error) {
        return fail("Failed to fetch expense", 500, String(error));
    }
}
