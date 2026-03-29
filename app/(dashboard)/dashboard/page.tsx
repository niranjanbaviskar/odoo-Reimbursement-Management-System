import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { DashboardOverview } from "@/components/dashboard-overview";

export default async function DashboardPage() {
    const session = await getAuthSession();
    if (!session?.user) return null;

    const companyId = session.user.companyId;

    const [expenses, users, pendingApprovals, statusGroups] = await Promise.all([
        prisma.expense.findMany({
            where: { companyId },
            orderBy: { createdAt: "desc" },
            take: 20,
            include: { user: { select: { name: true } } },
        }),
        prisma.user.findMany({ where: { companyId }, select: { role: true } }),
        prisma.expenseApproval.count({ where: { approverId: session.user.id, status: "PENDING" } }),
        prisma.expense.groupBy({
            by: ["status"],
            where: { companyId },
            _count: { _all: true },
        }),
    ]);

    const approvedCount = statusGroups.find((entry) => entry.status === "APPROVED")?._count._all ?? 0;
    const pendingCount = statusGroups
        .filter((entry) => entry.status === "PENDING" || entry.status === "IN_REVIEW")
        .reduce((sum, entry) => sum + entry._count._all, 0);

    return (
        <DashboardOverview
            role={session.user.role}
            expenses={expenses.map((e) => ({
                id: e.id,
                title: e.title,
                status: e.status,
                convertedAmount: Number(e.convertedAmount),
                convertedCurrency: e.convertedCurrency,
                category: e.category,
                userName: e.user.name,
            }))}
            totalEmployees={users.filter((u) => u.role === "EMPLOYEE").length}
            totalManagers={users.filter((u) => u.role === "MANAGER").length}
            approvedCount={approvedCount}
            pendingCount={pendingCount}
            pendingApprovals={pendingApprovals}
        />
    );
}
