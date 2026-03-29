import bcrypt from "bcrypt";

import { ok, fail } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/services/audit";
import { getCountryCurrency } from "@/lib/services/currency";
import { signUpSchema } from "@/lib/validators/auth";

export async function POST(req: Request) {
    try {
        const json = await req.json();
        const parsed = signUpSchema.safeParse(json);

        if (!parsed.success) {
            return fail("Invalid signup payload", 400, parsed.error.flatten());
        }

        const { companyName, adminName, email, password, country } = parsed.data;

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return fail("Email already registered", 409);
        }

        let defaultCurrency = "USD";
        try {
            defaultCurrency = await getCountryCurrency(country);
        } catch {
            // Keep signup available even if the country API is temporarily unavailable.
            defaultCurrency = "USD";
        }
        const passwordHash = await bcrypt.hash(password, 10);

        const result = await prisma.$transaction(async (tx) => {
            const company = await tx.company.create({
                data: {
                    name: companyName,
                    country,
                    defaultCurrency,
                },
            });

            const user = await tx.user.create({
                data: {
                    name: adminName,
                    email,
                    passwordHash,
                    role: "ADMIN",
                    companyId: company.id,
                },
            });

            return { company, user };
        });

        try {
            await createAuditLog({
                companyId: result.company.id,
                userId: result.user.id,
                action: "SIGNUP",
                entityType: "Company",
                entityId: result.company.id,
                details: { email, companyName, country, defaultCurrency },
            });
        } catch {
            // Do not fail account creation if audit logging fails.
        }

        return ok({
            message: "Company and admin created",
            companyId: result.company.id,
            userId: result.user.id,
        });
    } catch (error) {
        return fail("Failed to create account", 500, String(error));
    }
}
