import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function SettingsPage() {
    const session = await getAuthSession();
    if (!session?.user) return null;

    const company = await prisma.company.findUnique({
        where: { id: session.user.companyId },
    });

    return (
        <Card className="glass-card rounded-2xl max-w-2xl">
            <CardHeader>
                <CardTitle>Company Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
                <p>Name: {company?.name}</p>
                <p>Country: {company?.country}</p>
                <p>Default Currency: {company?.defaultCurrency}</p>
            </CardContent>
        </Card>
    );
}
