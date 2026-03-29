import { Role } from "@prisma/client";

import { fail, ok } from "@/lib/api";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/services/audit";
import { createWorkflowSchema } from "@/lib/validators/workflow";

export async function GET() {
    try {
        const session = await getAuthSession();
        if (!session?.user) return fail("Unauthorized", 401);

        const workflows = await prisma.approvalWorkflow.findMany({
            where: { companyId: session.user.companyId },
            include: {
                conditions: true,
                steps: {
                    orderBy: { stepOrder: "asc" },
                    include: {
                        approvers: {
                            include: {
                                user: {
                                    select: { id: true, name: true, email: true, role: true },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return ok(workflows);
    } catch (error) {
        return fail("Failed to fetch workflows", 500, String(error));
    }
}

export async function POST(req: Request) {
    try {
        const session = await getAuthSession();
        if (!session?.user) return fail("Unauthorized", 401);
        if (session.user.role !== Role.ADMIN) return fail("Forbidden", 403);

        const payload = await req.json();
        const parsed = createWorkflowSchema.safeParse(payload);

        if (!parsed.success) {
            return fail("Invalid workflow payload", 400, parsed.error.flatten());
        }

        const workflow = await prisma.$transaction(async (tx) => {
            const created = await tx.approvalWorkflow.create({
                data: {
                    companyId: session.user.companyId,
                    name: parsed.data.name,
                    description: parsed.data.description,
                    managerApprovalRequired: parsed.data.managerApprovalRequired,
                    ruleType: parsed.data.ruleType,
                    percentageThreshold: parsed.data.percentageThreshold,
                    specificApproverId: parsed.data.specificApproverId,
                    conditions: {
                        create: parsed.data.conditions.map((condition) => ({
                            field: condition.field,
                            operator: condition.operator,
                            stringValue: condition.stringValue,
                            numericValue: condition.numericValue,
                        })),
                    },
                },
            });

            for (const step of parsed.data.steps) {
                const createdStep = await tx.approvalStep.create({
                    data: {
                        workflowId: created.id,
                        name: step.name,
                        stepOrder: step.stepOrder,
                        ruleType: step.ruleType,
                        threshold: step.threshold,
                    },
                });

                await tx.stepApprover.createMany({
                    data: step.approverIds.map((userId) => ({ stepId: createdStep.id, userId })),
                });
            }

            return created;
        });

        await createAuditLog({
            companyId: session.user.companyId,
            userId: session.user.id,
            action: "CREATE_WORKFLOW",
            entityType: "ApprovalWorkflow",
            entityId: workflow.id,
            details: parsed.data,
        });

        return ok(workflow, { status: 201 });
    } catch (error) {
        return fail("Failed to create workflow", 500, String(error));
    }
}
