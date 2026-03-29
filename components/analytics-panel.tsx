"use client";

import { useEffect, useState } from "react";
import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell, Line, LineChart, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const colors = ["#6366f1", "#8b5cf6", "#14b8a6", "#f59e0b", "#f43f5e"];

type Summary = {
    employees: number;
    managers: number;
    pending: number;
    approved: number;
    rejected: number;
    totalReimbursement: number;
    byCategory: Array<{ category: string; total: number }>;
    monthly: Array<{ month: string; total: number }>;
};

export function AnalyticsPanel() {
    const [summary, setSummary] = useState<Summary | null>(null);

    useEffect(() => {
        const load = async () => {
            const response = await fetch("/api/analytics/summary");
            const json = await response.json();
            setSummary(json.data || null);
        };

        void load();
    }, []);

    if (!summary) {
        return <p className="text-sm text-slate-500">Loading analytics...</p>;
    }

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <Card className="glass-card rounded-2xl">
                <CardHeader>
                    <CardTitle>Monthly Expense Trends</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={summary.monthly}>
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={3} />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className="glass-card rounded-2xl">
                <CardHeader>
                    <CardTitle>Category Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={summary.byCategory} dataKey="total" nameKey="category" outerRadius={120}>
                                {summary.byCategory.map((entry, i) => (
                                    <Cell key={entry.category} fill={colors[i % colors.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
