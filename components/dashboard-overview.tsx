"use client";

import { ExpenseStatus, Role } from "@prisma/client";
import { CheckCircle2, Clock3, FileText, UsersRound } from "lucide-react";
import {
    Bar,
    BarChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ExpenseRow = {
    id: string;
    title: string;
    status: ExpenseStatus;
    convertedAmount: number;
    convertedCurrency: string;
    category: string;
    userName: string;
};

type DashboardOverviewProps = {
    role: Role;
    expenses: ExpenseRow[];
    totalEmployees: number;
    totalManagers: number;
    approvedCount: number;
    pendingCount: number;
    pendingApprovals: number;
};

export function DashboardOverview({
    role,
    expenses,
    totalEmployees,
    totalManagers,
    approvedCount,
    pendingCount,
    pendingApprovals,
}: DashboardOverviewProps) {
    const rejectedCount = expenses.filter((expense) => expense.status === "REJECTED").length;

    const chartData = expenses.reduce<Record<string, number>>((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.convertedAmount;
        return acc;
    }, {});

    const chart = Object.entries(chartData).map(([name, total]) => ({ name, total }));

    return (
        <div className="space-y-6">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Card className="glass-card rounded-2xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-slate-500">Employees</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                        <p className="text-2xl font-semibold">{totalEmployees}</p>
                        <UsersRound className="size-5 text-indigo-600" />
                    </CardContent>
                </Card>
                <Card className="glass-card rounded-2xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-slate-500">Managers</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                        <p className="text-2xl font-semibold">{totalManagers}</p>
                        <UsersRound className="size-5 text-violet-600" />
                    </CardContent>
                </Card>
                <Card className="glass-card rounded-2xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-slate-500">Pending</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                        <div>
                            <p className="text-2xl font-semibold">{pendingCount}</p>
                            {role !== "EMPLOYEE" && (
                                <p className="text-xs text-slate-500">My queue: {pendingApprovals}</p>
                            )}
                        </div>
                        <Clock3 className="size-5 text-amber-600" />
                    </CardContent>
                </Card>
                <Card className="glass-card rounded-2xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-slate-500">Approved</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                        <p className="text-2xl font-semibold">{approvedCount}</p>
                        <CheckCircle2 className="size-5 text-emerald-600" />
                    </CardContent>
                </Card>
            </section>

            <section className="grid gap-6 lg:grid-cols-5">
                <Card className="glass-card rounded-2xl lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Category Spend</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chart}>
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="total" fill="#6366f1" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="glass-card rounded-2xl lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Recent Claims</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {expenses.slice(0, 8).map((expense) => (
                            <article key={expense.id} className="rounded-xl border border-slate-200 p-3">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">{expense.title}</p>
                                        <p className="text-xs text-slate-500">
                                            {expense.userName} • {expense.category}
                                        </p>
                                    </div>
                                    <StatusBadge status={expense.status} />
                                </div>
                                <p className="mt-2 text-sm font-semibold text-slate-700">
                                    {expense.convertedCurrency} {expense.convertedAmount.toFixed(2)}
                                </p>
                            </article>
                        ))}
                        {!expenses.length && (
                            <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                                <FileText className="mx-auto mb-2 size-5" />
                                No expenses submitted yet.
                            </div>
                        )}
                        <p className="text-xs text-slate-500">Rejected claims in recent list: {rejectedCount}</p>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
