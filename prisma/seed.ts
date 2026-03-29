import bcrypt from "bcrypt";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const passwordHash = await bcrypt.hash("Password@123", 10);

    const company = await prisma.company.upsert({
        where: { id: "claimflow-demo-company" },
        update: {},
        create: {
            id: "claimflow-demo-company",
            name: "ClaimFlow Demo Inc",
            country: "India",
            defaultCurrency: "INR",
        },
    });

    const users = [
        { id: "admin-demo", name: "Ava Admin", email: "admin@claimflow.demo", role: Role.ADMIN },
        { id: "manager-demo", name: "Mason Manager", email: "manager@claimflow.demo", role: Role.MANAGER },
        { id: "employee-demo", name: "Elena Employee", email: "employee@claimflow.demo", role: Role.EMPLOYEE },
    ];

    for (const user of users) {
        await prisma.user.upsert({
            where: { email: user.email },
            update: {},
            create: {
                id: user.id,
                companyId: company.id,
                name: user.name,
                email: user.email,
                role: user.role,
                passwordHash,
                managerId: user.role === Role.EMPLOYEE ? "manager-demo" : undefined,
            },
        });
    }

    const workflow = await prisma.approvalWorkflow.upsert({
        where: { id: "travel-workflow" },
        update: {},
        create: {
            id: "travel-workflow",
            companyId: company.id,
            name: "Travel Claims > 5000",
            description: "Manager + Finance sequential approval for high value travel claims",
            managerApprovalRequired: true,
            ruleType: "HYBRID",
            percentageThreshold: 60,
            specificApproverId: "admin-demo",
            conditions: {
                create: [
                    { field: "amount", operator: ">", numericValue: 5000 },
                    { field: "category", operator: "=", stringValue: "Travel" },
                ],
            },
            steps: {
                create: [
                    { name: "Manager Review", stepOrder: 1, ruleType: "SEQUENTIAL" },
                    { name: "Finance Review", stepOrder: 2, ruleType: "PERCENTAGE", threshold: 60 },
                ],
            },
        },
        include: { steps: true },
    });

    const managerStep = workflow.steps.find((step) => step.stepOrder === 1);
    const financeStep = workflow.steps.find((step) => step.stepOrder === 2);

    if (managerStep) {
        await prisma.stepApprover.upsert({
            where: {
                stepId_userId: {
                    stepId: managerStep.id,
                    userId: "manager-demo",
                },
            },
            update: {},
            create: {
                stepId: managerStep.id,
                userId: "manager-demo",
            },
        });
    }

    if (financeStep) {
        await prisma.stepApprover.upsert({
            where: {
                stepId_userId: {
                    stepId: financeStep.id,
                    userId: "admin-demo",
                },
            },
            update: {},
            create: {
                stepId: financeStep.id,
                userId: "admin-demo",
            },
        });
    }

    await prisma.expense.createMany({
        data: [
            {
                id: "expense-1",
                companyId: company.id,
                userId: "employee-demo",
                workflowId: workflow.id,
                title: "Client Visit to Delhi",
                amount: 8500,
                currency: "INR",
                convertedAmount: 8500,
                convertedCurrency: "INR",
                category: "Travel",
                description: "Flight and local taxi for enterprise customer onboarding.",
                expenseDate: new Date(),
                status: "IN_REVIEW",
                currentStepOrder: 1,
            },
            {
                id: "expense-2",
                companyId: company.id,
                userId: "employee-demo",
                title: "Team Lunch",
                amount: 3200,
                currency: "INR",
                convertedAmount: 3200,
                convertedCurrency: "INR",
                category: "Food",
                description: "Quarterly project celebration lunch.",
                expenseDate: new Date(),
                status: "APPROVED",
                currentStepOrder: 0,
            },
        ],
        skipDuplicates: true,
    });

    if (managerStep) {
        await prisma.expenseApproval.upsert({
            where: {
                expenseId_stepId_approverId: {
                    expenseId: "expense-1",
                    stepId: managerStep.id,
                    approverId: "manager-demo",
                },
            },
            update: {},
            create: {
                expenseId: "expense-1",
                stepId: managerStep.id,
                approverId: "manager-demo",
                status: "PENDING",
            },
        });
    }

    console.log("Seed complete");
    console.log("Admin login: admin@claimflow.demo / Password@123");
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
