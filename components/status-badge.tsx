import { ExpenseStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";

const classes: Record<ExpenseStatus, string> = {
    DRAFT: "bg-slate-100 text-slate-700",
    PENDING: "bg-amber-100 text-amber-700",
    IN_REVIEW: "bg-indigo-100 text-indigo-700",
    APPROVED: "bg-emerald-100 text-emerald-700",
    REJECTED: "bg-rose-100 text-rose-700",
    ESCALATED: "bg-violet-100 text-violet-700",
};

export function StatusBadge({ status }: { status: ExpenseStatus }) {
    return <Badge className={classes[status]}>{status.replace("_", " ")}</Badge>;
}
