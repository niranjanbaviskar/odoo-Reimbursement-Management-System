"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type PendingApproval = {
    id: string;
    expenseId: string;
    expense: {
        title: string;
        convertedAmount: string;
        convertedCurrency: string;
        category: string;
        user: { name: string };
    };
    step: {
        name: string;
        stepOrder: number;
    };
};

export function ApprovalsInbox() {
    const [items, setItems] = useState<PendingApproval[]>([]);
    const [comment, setComment] = useState("");

    const load = async () => {
        const response = await fetch("/api/approvals/pending");
        const json = await response.json();
        setItems(json.data || []);
    };

    useEffect(() => {
        void load();
    }, []);

    const action = async (expenseId: string, actionType: "APPROVE" | "REJECT") => {
        const response = await fetch("/api/approvals/action", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ expenseId, action: actionType, comment }),
        });

        const json = await response.json();

        if (!response.ok) {
            toast.error(json.error || "Action failed");
            return;
        }

        toast.success(`Expense ${actionType.toLowerCase()}d`);
        setComment("");
        await load();
    };

    return (
        <div className="space-y-4">
            {items.map((item) => (
                <Card key={item.id} className="glass-card rounded-2xl">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>{item.expense.title}</span>
                            <span className="text-sm text-slate-500">
                                Step {item.step.stepOrder}: {item.step.name}
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-sm text-slate-600">Submitted by {item.expense.user.name}</p>
                        <p className="text-sm font-semibold text-slate-900">
                            {item.expense.convertedCurrency} {Number(item.expense.convertedAmount).toFixed(2)} • {item.expense.category}
                        </p>
                        <Textarea
                            placeholder="Optional approval comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <Button onClick={() => void action(item.expenseId, "APPROVE")} className="bg-emerald-600 hover:bg-emerald-500">
                                Approve
                            </Button>
                            <Button onClick={() => void action(item.expenseId, "REJECT")} variant="destructive">
                                Reject
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}

            {!items.length && (
                <Card className="glass-card rounded-2xl">
                    <CardContent className="p-8 text-center text-sm text-slate-500">No pending approvals.</CardContent>
                </Card>
            )}
        </div>
    );
}
