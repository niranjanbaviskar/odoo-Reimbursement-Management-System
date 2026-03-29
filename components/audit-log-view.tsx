"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AuditRecord = {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    createdAt: string;
    user?: { name: string; email: string };
};

export function AuditLogView() {
    const [logs, setLogs] = useState<AuditRecord[]>([]);

    useEffect(() => {
        const load = async () => {
            const response = await fetch("/api/audit-logs");
            const json = await response.json();
            setLogs(json.data || []);
        };

        void load();
    }, []);

    return (
        <Card className="glass-card rounded-2xl">
            <CardHeader>
                <CardTitle>Audit Trail</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {logs.map((log) => (
                    <div key={log.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                        <p className="font-semibold text-slate-900">
                            {log.action} • {log.entityType}
                        </p>
                        <p className="text-slate-500">Entity ID: {log.entityId}</p>
                        <p className="text-slate-500">By: {log.user?.name || "System"}</p>
                        <p className="text-xs text-slate-400">{new Date(log.createdAt).toLocaleString()}</p>
                    </div>
                ))}
                {!logs.length && <p className="text-sm text-slate-500">No logs yet.</p>}
            </CardContent>
        </Card>
    );
}
