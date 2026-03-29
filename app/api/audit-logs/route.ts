import { fail, ok } from "@/lib/api";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await getAuthSession();
        if (!session?.user) return fail("Unauthorized", 401);

        const logs = await prisma.auditLog.findMany({
            where: { companyId: session.user.companyId },
            include: {
                user: { select: { id: true, name: true, email: true } },
                expense: { select: { id: true, title: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 200,
        });

        return ok(logs);
    } catch (error) {
        return fail("Failed to fetch audit logs", 500, String(error));
    }
}
