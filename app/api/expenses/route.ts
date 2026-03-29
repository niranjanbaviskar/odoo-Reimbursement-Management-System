import { ExpenseStatus, Prisma } from "@prisma/client";

import { fail, ok } from "@/lib/api";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/services/audit";
import { convertCurrency } from "@/lib/services/currency";
import { assignWorkflowToExpense } from "@/lib/services/workflow-engine";
import { createExpenseSchema } from "@/lib/validators/expense";

export async function GET(req: Request) {
    try {
        const session = await getAuthSession();
        if (!session?.user) return fail("Unauthorized", 401);

        const { searchParams } = new URL(req.url);
        const q = searchParams.get("q") || "";
        const status = searchParams.get("status") as ExpenseStatus | null;
        const category = searchParams.get("category");
        const employeeId = searchParams.get("employeeId");

        const where: Prisma.ExpenseWhereInput = {
            companyId: session.user.companyId,
            ...(q
                ? {
                    OR: [
                        { title: { contains: q } },
                        { description: { contains: q } },
                    ],
                }
                : {}),
            ...(status ? { status } : {}),
            ...(category ? { category } : {}),
            ...(employeeId ? { userId: employeeId } : {}),
        };

        const expenses = await prisma.expense.findMany({
            where,
            include: {
                user: { select: { id: true, name: true, email: true } },
                workflow: { select: { id: true, name: true } },
                approvals: {
                    include: {
                        approver: { select: { id: true, name: true, role: true } },
                        step: { select: { stepOrder: true, name: true } },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take: 200,
        });

        return ok(expenses);
    } catch (error) {
        return fail("Failed to fetch expenses", 500, String(error));
    }
}

export async function POST(req: Request) {
    try {
        const session = await getAuthSession();
        if (!session?.user) return fail("Unauthorized", 401);

        const body = await req.json();
        const parsed = createExpenseSchema.safeParse(body);

        if (!parsed.success) {
            return fail("Invalid expense payload", 400, parsed.error.flatten());
        }

        const company = await prisma.company.findUniqueOrThrow({
            where: { id: session.user.companyId },
            select: { defaultCurrency: true },
        });

        const convertedAmount = await convertCurrency(
            parsed.data.amount,
            parsed.data.currency,
            company.defaultCurrency,
        );

        const expense = await prisma.expense.create({
            data: {
                companyId: session.user.companyId,
                userId: session.user.id,
                title: parsed.data.title,
                amount: parsed.data.amount,
                currency: parsed.data.currency,
                convertedAmount,
                convertedCurrency: company.defaultCurrency,
                category: parsed.data.category,
                description: parsed.data.description,
                expenseDate: new Date(parsed.data.expenseDate),
                receiptUrl: parsed.data.receiptUrl,
                receiptPublicId: parsed.data.receiptPublicId,
                rawOCRText: parsed.data.rawOCRText,
                parsedMerchant: parsed.data.parsedOCR?.merchant,
                parsedAmount: parsed.data.parsedOCR?.amount,
                parsedDate: parsed.data.parsedOCR?.date,
                parsedTax: parsed.data.parsedOCR?.tax,
                parsedCategory: parsed.data.parsedOCR?.category,
                parsedDescription: parsed.data.parsedOCR?.description,
                status: parsed.data.status,
                items: {
                    create:
                        parsed.data.items?.map((item) => ({
                            name: item.name,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            totalAmount: Number((item.quantity * item.unitPrice).toFixed(2)),
                        })) || [],
                },
            },
        });

        if (expense.status === ExpenseStatus.PENDING) {
            await assignWorkflowToExpense(session.user.companyId, expense.id);
        }

        await createAuditLog({
            companyId: session.user.companyId,
            userId: session.user.id,
            expenseId: expense.id,
            action: "CREATE_EXPENSE",
            entityType: "Expense",
            entityId: expense.id,
            details: {
                title: expense.title,
                amount: Number(expense.amount),
                convertedAmount: Number(expense.convertedAmount),
            },
        });

        return ok(expense, { status: 201 });
    } catch (error) {
        return fail("Failed to create expense", 500, String(error));
    }
}
