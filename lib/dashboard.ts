import { Role } from "@prisma/client";

export function dashboardPathByRole(role: Role) {
    if (role === Role.ADMIN) return "/dashboard";
    if (role === Role.MANAGER) return "/dashboard";
    return "/dashboard";
}
