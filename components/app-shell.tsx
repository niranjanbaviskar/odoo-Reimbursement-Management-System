"use client";

import { Role } from "@prisma/client";
import {
    Activity,
    BookCheck,
    ClipboardCheck,
    LayoutDashboard,
    LogOut,
    ReceiptText,
    Settings,
    Users,
    Workflow,
} from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type ShellProps = {
    role: Role;
    userName: string;
    children: React.ReactNode;
};

type NavItem = {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    roles: Role[];
};

const navItems: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "MANAGER", "EMPLOYEE"] },
    { href: "/expenses", label: "Expenses", icon: ReceiptText, roles: ["ADMIN", "MANAGER", "EMPLOYEE"] },
    { href: "/approvals", label: "Approvals", icon: ClipboardCheck, roles: ["ADMIN", "MANAGER"] },
    { href: "/workflows", label: "Workflow Builder", icon: Workflow, roles: ["ADMIN"] },
    { href: "/users", label: "User Management", icon: Users, roles: ["ADMIN"] },
    { href: "/analytics", label: "Analytics", icon: Activity, roles: ["ADMIN", "MANAGER"] },
    { href: "/audit-logs", label: "Audit Logs", icon: BookCheck, roles: ["ADMIN"] },
    { href: "/settings", label: "Settings", icon: Settings, roles: ["ADMIN"] },
];

export function AppShell({ role, userName, children }: ShellProps) {
    const pathname = usePathname();

    return (
        <div className="flex min-h-screen">
            <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-indigo-100 bg-white/95 p-4 lg:flex">
                <div className="mb-8 rounded-2xl bg-linear-to-br from-indigo-600 to-violet-600 p-4 text-white">
                    <p className="text-xs uppercase tracking-wide text-indigo-100">ClaimFlow</p>
                    <p className="mt-1 text-xl font-semibold">Smart Reimbursements</p>
                </div>

                <nav className="space-y-1">
                    {navItems
                        .filter((item) => item.roles.includes(role))
                        .map((item) => {
                            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition",
                                        active
                                            ? "bg-indigo-50 text-indigo-700"
                                            : "hover:bg-slate-100 hover:text-slate-900",
                                    )}
                                >
                                    <Icon className="size-4" />
                                    {item.label}
                                </Link>
                            );
                        })}
                </nav>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-10 border-b border-indigo-100 bg-white/80 px-4 py-3 backdrop-blur lg:px-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">Welcome back</p>
                            <p className="text-lg font-semibold text-slate-900">{userName}</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarFallback className="bg-indigo-100 text-indigo-700">{userName.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <button
                                type="button"
                                onClick={() => signOut({ callbackUrl: "/" })}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
                            >
                                <LogOut className="size-4" />
                                Sign out
                            </button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
            </div>
        </div>
    );
}
