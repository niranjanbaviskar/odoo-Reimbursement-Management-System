import { RuleType } from "@prisma/client";
import { z } from "zod";

export const workflowConditionSchema = z.object({
    field: z.enum(["amount", "category", "department"]),
    operator: z.enum([">", ">=", "<", "<=", "=", "!="]),
    stringValue: z.string().optional(),
    numericValue: z.number().optional(),
});

export const stepSchema = z.object({
    name: z.string().min(2),
    stepOrder: z.number().int().positive(),
    ruleType: z.nativeEnum(RuleType).default("SEQUENTIAL"),
    threshold: z.number().int().min(1).max(100).optional(),
    approverIds: z.array(z.string()).min(1),
});

export const createWorkflowSchema = z.object({
    name: z.string().min(2),
    description: z.string().optional(),
    managerApprovalRequired: z.boolean().default(false),
    ruleType: z.nativeEnum(RuleType),
    percentageThreshold: z.number().int().min(1).max(100).optional(),
    specificApproverId: z.string().optional(),
    conditions: z.array(workflowConditionSchema).default([]),
    steps: z.array(stepSchema).min(1),
});

export type CreateWorkflowInput = z.infer<typeof createWorkflowSchema>;
