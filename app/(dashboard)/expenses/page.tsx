import { getAuthSession } from "@/lib/auth";

import { ExpensesTable } from "@/components/expenses-table";

export default async function ExpensesPage() {
    const session = await getAuthSession();
    if (!session?.user) return null;

    return <ExpensesTable role={session.user.role} />;
}
