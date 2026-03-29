import { ExpenseStatus, Role } from "@prisma/client";

import { fail, ok } from "@/lib/api";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await getAuthSession();
        if (!session?.user) return fail("Unauthorized", 401);

        const companyId = session.user.companyId;

        const [employees, managers, expenses, byCategory, monthlyRaw] = await Promise.all([
            prisma.user.count({ where: { companyId, role: Role.EMPLOYEE } }),
            prisma.user.count({ where: { companyId, role: Role.MANAGER } }),
            prisma.expense.findMany({
                where: { companyId },
                select: { status: true, convertedAmount: true },
            }),
            prisma.expense.groupBy({
                by: ["category"],
                where: { companyId },
                _sum: { convertedAmount: true },
            }),
            prisma.$queryRaw<Array<{ month: string; total: unknown }>>`
        SELECT DATE_FORMAT(expenseDate, '%Y-%m') as month,
               SUM(convertedAmount) as total
        FROM Expense
        WHERE companyId = ${companyId}
        GROUP BY DATE_FORMAT(expenseDate, '%Y-%m')
        ORDER BY month ASC
      `,
        ]);

        const pending = expenses.filter((e) => e.status === ExpenseStatus.PENDING || e.status === ExpenseStatus.IN_REVIEW).length;
        const approved = expenses.filter((e) => e.status === ExpenseStatus.APPROVED).length;
        const rejected = expenses.filter((e) => e.status === ExpenseStatus.REJECTED).length;
        const totalReimbursement = expenses
            .filter((e) => e.status === ExpenseStatus.APPROVED)
            .reduce((sum, e) => sum + Number(e.convertedAmount), 0);

        const monthly = monthlyRaw.map((entry) => ({
            month: entry.month,
            total: Number(entry.total ?? 0),
        }));

        return ok({
            employees,
            managers,
            pending,
            approved,
            rejected,
            totalReimbursement,
            byCategory: byCategory.map((entry) => ({
                category: entry.category,
                total: Number(entry._sum.convertedAmount ?? 0),
            })),
            monthly,
        });
    } catch (error) {
        return fail("Failed to fetch analytics", 500, String(error));
    }
}
