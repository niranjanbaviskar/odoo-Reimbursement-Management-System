import Image from "next/image";
import { notFound } from "next/navigation";

import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession();
  if (!session?.user) return null;

  const { id } = await params;
  const expense = await prisma.expense.findUnique({
    where: { id },
  });

  if (!expense || expense.companyId !== session.user.companyId) {
    notFound();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="glass-card rounded-2xl lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{expense.title}</span>
            <StatusBadge status={expense.status} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>Category: {expense.category}</p>
          <p>Date: {new Date(expense.expenseDate).toLocaleDateString()}</p>
          <p>
            Original: {expense.currency} {Number(expense.amount).toFixed(2)}
          </p>
          <p>
            Company Currency: {expense.convertedCurrency} {Number(expense.convertedAmount).toFixed(2)}
          </p>
          <p>Description: {expense.description || "-"}</p>
        </CardContent>
      </Card>

      <Card className="glass-card rounded-2xl">
        <CardHeader>
          <CardTitle>Receipt</CardTitle>
        </CardHeader>
        <CardContent>
          {expense.receiptUrl ? (
            <Image src={expense.receiptUrl} alt="receipt" width={400} height={400} className="h-auto w-full rounded-xl" />
          ) : (
            <p className="text-sm text-slate-500">No receipt uploaded.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
