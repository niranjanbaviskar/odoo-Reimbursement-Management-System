import { prisma } from "@/lib/prisma";

type AuditInput = {
    companyId: string;
    userId?: string;
    expenseId?: string;
    action: string;
    entityType: string;
    entityId: string;
    details?: Record<string, unknown>;
};

export async function createAuditLog(input: AuditInput) {
    await prisma.auditLog.create({
        data: {
            companyId: input.companyId,
            userId: input.userId,
            expenseId: input.expenseId,
            action: input.action,
            entityType: input.entityType,
            entityId: input.entityId,
            details: input.details ? JSON.stringify(input.details) : undefined,
        },
    });
}
