import { z } from "zod";

export const expenseItemSchema = z.object({
    name: z.string().min(1),
    quantity: z.number().int().positive().default(1),
    unitPrice: z.number().positive(),
});

export const parsedOCRSchema = z
    .object({
        merchant: z.string().optional(),
        amount: z.number().optional(),
        date: z.string().optional(),
        tax: z.number().optional(),
        category: z.string().optional(),
        description: z.string().optional(),
        lineItems: z.array(z.string()).optional(),
    })
    .optional();

export const createExpenseSchema = z.object({
    title: z.string().min(2),
    amount: z.number().positive(),
    currency: z.string().length(3),
    category: z.string().min(2),
    description: z.string().optional(),
    expenseDate: z.string(),
    receiptUrl: z.string().url().optional(),
    receiptPublicId: z.string().optional(),
    rawOCRText: z.string().optional(),
    parsedOCR: parsedOCRSchema,
    items: z.array(expenseItemSchema).optional(),
    status: z.enum(["DRAFT", "PENDING"]).default("PENDING"),
});

export const approvalActionSchema = z.object({
    expenseId: z.string(),
    action: z.enum(["APPROVE", "REJECT"]),
    comment: z.string().optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type ApprovalActionInput = z.infer<typeof approvalActionSchema>;
