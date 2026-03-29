import { ApprovalStatus, ExpenseStatus, Role } from "@prisma/client";

import { fail, ok } from "@/lib/api";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/services/audit";
import {
    evaluateApprovalStep,
    getNextApprovalStep,
} from "@/lib/services/workflow-engine";
import { approvalActionSchema } from "@/lib/validators/expense";

export async function POST(req: Request) {
    try {
        const session = await getAuthSession();
        if (!session?.user) return fail("Unauthorized", 401);
        if (session.user.role !== Role.ADMIN && session.user.role !== Role.MANAGER) {
            return fail("Forbidden", 403);
        }

        const payload = await req.json();
        const parsed = approvalActionSchema.safeParse(payload);

        if (!parsed.success) {
            return fail("Invalid action payload", 400, parsed.error.flatten());
        }

        const expense = await prisma.expense.findUnique({
            where: { id: parsed.data.expenseId },
            include: {
                workflow: true,
            },
        });

        if (!expense || expense.companyId !== session.user.companyId) {
            return fail("Expense not found", 404);
        }

        const pendingRecord = await prisma.expenseApproval.findFirst({
            where: {
                expenseId: parsed.data.expenseId,
                approverId: session.user.id,
                status: ApprovalStatus.PENDING,
            },
            include: {
                step: true,
            },
            orderBy: { step: { stepOrder: "asc" } },
        });

        if (!pendingRecord) {
            return fail("No pending approval action assigned", 400);
        }

        await prisma.expenseApproval.update({
            where: { id: pendingRecord.id },
            data: {
                status: parsed.data.action === "APPROVE" ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED,
                comment: parsed.data.comment,
                actionById: session.user.id,
                decidedAt: new Date(),
            },
        });

        if (parsed.data.action === "REJECT") {
            await prisma.expense.update({
                where: { id: expense.id },
                data: { status: ExpenseStatus.REJECTED },
            });

            await createAuditLog({
                companyId: session.user.companyId,
                userId: session.user.id,
                expenseId: expense.id,
                action: "REJECT_EXPENSE",
                entityType: "Expense",
                entityId: expense.id,
                details: { comment: parsed.data.comment },
            });

            return ok({ status: ExpenseStatus.REJECTED });
        }

        const stepApprovals = await prisma.expenseApproval.findMany({
            where: {
                expenseId: expense.id,
                stepId: pendingRecord.stepId,
            },
            select: { approverId: true, status: true },
        });

        const decision = evaluateApprovalStep({
            ruleType: pendingRecord.step.ruleType,
            threshold: pendingRecord.step.threshold,
            specificApproverId: expense.workflow?.specificApproverId,
            approvals: stepApprovals,
        });

        if (!decision.resolved) {
            return ok({ status: "WAITING_FOR_MORE_APPROVERS" });
        }

        if (!decision.approved) {
            await prisma.expense.update({
                where: { id: expense.id },
                data: { status: ExpenseStatus.REJECTED },
            });

            return ok({ status: ExpenseStatus.REJECTED });
        }

        const nextStep = await getNextApprovalStep(expense.id, pendingRecord.step.stepOrder);

        if (!nextStep) {
            await prisma.expense.update({
                where: { id: expense.id },
                data: { status: ExpenseStatus.APPROVED },
            });

            await createAuditLog({
                companyId: session.user.companyId,
                userId: session.user.id,
                expenseId: expense.id,
                action: "APPROVE_EXPENSE",
                entityType: "Expense",
                entityId: expense.id,
            });

            return ok({ status: ExpenseStatus.APPROVED });
        }

        const nextApprovers = await prisma.stepApprover.findMany({
            where: { stepId: nextStep.id },
            select: { userId: true },
        });

        if (nextApprovers.length) {
            await prisma.expenseApproval.createMany({
                data: nextApprovers.map((approver) => ({
                    expenseId: expense.id,
                    stepId: nextStep.id,
                    approverId: approver.userId,
                })),
            });
        }

        await prisma.expense.update({
            where: { id: expense.id },
            data: {
                status: ExpenseStatus.IN_REVIEW,
                currentStepOrder: nextStep.stepOrder,
            },
        });

        await createAuditLog({
            companyId: session.user.companyId,
            userId: session.user.id,
            expenseId: expense.id,
            action: "STEP_APPROVED",
            entityType: "ApprovalStep",
            entityId: nextStep.id,
            details: { movedToStep: nextStep.stepOrder },
        });

        return ok({ status: ExpenseStatus.IN_REVIEW, nextStep: nextStep.stepOrder });
    } catch (error) {
        return fail("Failed to process approval action", 500, String(error));
    }
}
