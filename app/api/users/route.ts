import { Role } from "@prisma/client";
import bcrypt from "bcrypt";

import { fail, ok } from "@/lib/api";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await getAuthSession();
        if (!session?.user) return fail("Unauthorized", 401);

        const users = await prisma.user.findMany({
            where: { companyId: session.user.companyId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                managerId: true,
                manager: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        return ok(users);
    } catch (error) {
        return fail("Failed to fetch users", 500, String(error));
    }
}

export async function POST(req: Request) {
    try {
        const session = await getAuthSession();
        if (!session?.user) return fail("Unauthorized", 401);
        if (session.user.role !== Role.ADMIN) return fail("Forbidden", 403);

        const body = (await req.json()) as {
            name: string;
            email: string;
            password: string;
            role: Role;
            managerId?: string;
        };

        if (!body.name || !body.email || !body.password || !body.role) {
            return fail("Missing required fields", 400);
        }

        const user = await prisma.user.create({
            data: {
                name: body.name,
                email: body.email,
                passwordHash: await bcrypt.hash(body.password, 10),
                role: body.role,
                managerId: body.managerId,
                companyId: session.user.companyId,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                managerId: true,
            },
        });

        return ok(user, { status: 201 });
    } catch (error) {
        return fail("Failed to create user", 500, String(error));
    }
}
