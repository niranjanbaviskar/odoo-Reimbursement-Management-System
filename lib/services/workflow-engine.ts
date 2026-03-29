import {
    ApprovalStatus,
    Expense,
    ExpenseStatus,
    RuleType,
    WorkflowCondition,
    type ApprovalStep,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

type WorkflowWithRules = {
    id: string;
    managerApprovalRequired: boolean;
    conditions: WorkflowCondition[];
    steps: ApprovalStep[];
};

function isConditionMatch(expense: Pick<Expense, "amount" | "category">, condition: WorkflowCondition) {
    if (condition.field === "amount") {
        const numeric = Number(condition.numericValue ?? 0);
        const value = Number(expense.amount);

        switch (condition.operator) {
            case ">":
                return value > numeric;
            case ">=":
                return value >= numeric;
            case "<":
                return value < numeric;
            case "<=":
                return value <= numeric;
            case "=":
                return value === numeric;
            case "!=":
                return value !== numeric;
            default:
                return false;
        }
    }

    if (condition.field === "category") {
        const expected = (condition.stringValue || "").toLowerCase();
        const actual = expense.category.toLowerCase();

        if (condition.operator === "=") return actual === expected;
        if (condition.operator === "!=") return actual !== expected;
    }

    return true;
}

export async function assignWorkflowToExpense(companyId: string, expenseId: string) {
    const expense = await prisma.expense.findUniqueOrThrow({
        where: { id: expenseId },
        select: { id: true, amount: true, category: true, userId: true },
    });

    const workflows = await prisma.approvalWorkflow.findMany({
        where: { companyId, isActive: true },
        include: { conditions: true, steps: { orderBy: { stepOrder: "asc" } } },
    });

    const matched = workflows.filter((workflow) => {
        if (!workflow.conditions.length) return true;
        return workflow.conditions.every((condition) => isConditionMatch(expense, condition));
    });

    const selected = matched
        .sort((a, b) => b.conditions.length - a.conditions.length)
        .at(0) as WorkflowWithRules | undefined;

    if (!selected) {
        const submitter = await prisma.user.findUnique({
            where: { id: expense.userId },
            select: { managerId: true },
        });

        const managersAndAdmins = await prisma.user.findMany({
            where: {
                companyId,
                OR: [{ role: "MANAGER" }, { role: "ADMIN" }],
            },
            select: { id: true },
        });

        const orderedApproverIds = [
            ...(submitter?.managerId ? [submitter.managerId] : []),
            ...managersAndAdmins.map((u) => u.id),
        ];
        const approverIds = Array.from(new Set(orderedApproverIds));

        if (!approverIds.length) {
            return null;
        }

        const defaultWorkflow = await prisma.approvalWorkflow.upsert({
            where: { id: `${companyId}-default-workflow` },
            update: {
                isActive: true,
                ruleType: RuleType.PERCENTAGE,
                percentageThreshold: 60,
            },
            create: {
                id: `${companyId}-default-workflow`,
                companyId,
                name: "Default Expense Approval",
                description: "Auto-generated fallback workflow for expense approvals",
                managerApprovalRequired: true,
                ruleType: RuleType.PERCENTAGE,
                percentageThreshold: 60,
                isActive: true,
            },
        });

        const defaultStep = await prisma.approvalStep.upsert({
            where: {
                workflowId_stepOrder: {
                    workflowId: defaultWorkflow.id,
                    stepOrder: 1,
                },
            },
            update: {
                name: "Primary Review",
                ruleType: RuleType.PERCENTAGE,
                threshold: 60,
            },
            create: {
                workflowId: defaultWorkflow.id,
                name: "Primary Review",
                stepOrder: 1,
                ruleType: RuleType.PERCENTAGE,
                threshold: 60,
            },
        });

        await prisma.stepApprover.createMany({
            data: approverIds.map((userId) => ({
                stepId: defaultStep.id,
                userId,
            })),
            skipDuplicates: true,
        });

        await prisma.expense.update({
            where: { id: expenseId },
            data: {
                workflowId: defaultWorkflow.id,
                status: ExpenseStatus.IN_REVIEW,
                currentStepOrder: 1,
            },
        });

        await prisma.expenseApproval.createMany({
            data: approverIds.map((approverId) => ({
                expenseId,
                stepId: defaultStep.id,
                approverId,
                status: ApprovalStatus.PENDING,
            })),
            skipDuplicates: true,
        });

        return defaultWorkflow.id;
    }

    await prisma.expense.update({
        where: { id: expenseId },
        data: {
            workflowId: selected.id,
            status: ExpenseStatus.IN_REVIEW,
            currentStepOrder: selected.steps[0]?.stepOrder ?? 0,
        },
    });

    if (selected.steps[0]) {
        const approvers = await prisma.stepApprover.findMany({
            where: { stepId: selected.steps[0].id },
            select: { userId: true },
        });

        if (approvers.length) {
            await prisma.expenseApproval.createMany({
                data: approvers.map((approver) => ({
                    expenseId,
                    stepId: selected.steps[0].id,
                    approverId: approver.userId,
                    status: ApprovalStatus.PENDING,
                })),
            });
        }
    }

    return selected.id;
}

export function evaluateApprovalStep(params: {
    ruleType: RuleType;
    threshold?: number | null;
    specificApproverId?: string | null;
    approvals: Array<{ approverId: string; status: ApprovalStatus }>;
}) {
    const approved = params.approvals.filter((a) => a.status === ApprovalStatus.APPROVED).length;
    const rejected = params.approvals.filter((a) => a.status === ApprovalStatus.REJECTED).length;
    const total = params.approvals.length || 1;

    if (rejected > 0) {
        return { resolved: true, approved: false };
    }

    if (params.ruleType === RuleType.SEQUENTIAL) {
        return { resolved: approved === total, approved: approved === total };
    }

    if (params.ruleType === RuleType.PERCENTAGE) {
        const threshold = params.threshold ?? 100;
        const percentage = (approved / total) * 100;
        return { resolved: percentage >= threshold, approved: percentage >= threshold };
    }

    if (params.ruleType === RuleType.SPECIFIC_APPROVER) {
        const isSpecificApproved = params.approvals.some(
            (a) => a.approverId === params.specificApproverId && a.status === ApprovalStatus.APPROVED,
        );
        return { resolved: isSpecificApproved, approved: isSpecificApproved };
    }

    const threshold = params.threshold ?? 60;
    const percentageApproved = (approved / total) * 100 >= threshold;
    const specificApproved = params.approvals.some(
        (a) => a.approverId === params.specificApproverId && a.status === ApprovalStatus.APPROVED,
    );

    return {
        resolved: percentageApproved || specificApproved,
        approved: percentageApproved || specificApproved,
    };
}

export async function getNextApprovalStep(expenseId: string, currentStepOrder: number) {
    const expense = await prisma.expense.findUniqueOrThrow({
        where: { id: expenseId },
        select: { workflowId: true },
    });

    if (!expense.workflowId) return null;

    return prisma.approvalStep.findFirst({
        where: {
            workflowId: expense.workflowId,
            stepOrder: { gt: currentStepOrder },
        },
        orderBy: { stepOrder: "asc" },
    });
}
