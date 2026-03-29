import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { getAuthSession } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const session = await getAuthSession();

    if (!session?.user) {
        redirect("/login");
    }

    return <AppShell role={session.user.role} userName={session.user.name || "User"}>{children}</AppShell>;
}
