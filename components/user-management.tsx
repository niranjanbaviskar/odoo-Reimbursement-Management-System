"use client";

import { Role } from "@prisma/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type UserRecord = {
    id: string;
    name: string;
    email: string;
    role: Role;
    managerId?: string;
};

export function UserManagement() {
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "EMPLOYEE" as Role,
        managerId: "",
    });

    const load = async () => {
        const response = await fetch("/api/users");
        const json = await response.json();
        setUsers(json.data || []);
    };

    useEffect(() => {
        void load();
    }, []);

    const createUser = async () => {
        const response = await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });

        const json = await response.json();
        if (!response.ok) {
            toast.error(json.error || "Failed to create user");
            return;
        }

        toast.success("User created");
        setForm({ name: "", email: "", password: "", role: "EMPLOYEE", managerId: "" });
        await load();
    };

    const managers = users.filter((user) => user.role === "MANAGER" || user.role === "ADMIN");

    return (
        <div className="space-y-6">
            <Card className="glass-card rounded-2xl">
                <CardHeader>
                    <CardTitle>Create User</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Name</Label>
                        <Input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <Label>Password</Label>
                        <Input
                            type="password"
                            value={form.password}
                            onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Role</Label>
                        <Select value={form.role} onValueChange={(value) => setForm((s) => ({ ...s, role: value as Role }))}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="EMPLOYEE">EMPLOYEE</SelectItem>
                                <SelectItem value="MANAGER">MANAGER</SelectItem>
                                <SelectItem value="ADMIN">ADMIN</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label>Manager Mapping</Label>
                        <Select
                            value={form.managerId || "none"}
                            onValueChange={(value) => {
                                const managerId = String(value ?? "none");
                                setForm((s) => ({ ...s, managerId: managerId === "none" ? "" : managerId }));
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select manager" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No manager</SelectItem>
                                {managers.map((manager) => (
                                    <SelectItem key={manager.id} value={manager.id}>
                                        {manager.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={() => void createUser()} className="md:col-span-2 bg-indigo-600 hover:bg-indigo-500">
                        Create user
                    </Button>
                </CardContent>
            </Card>

            <Card className="glass-card rounded-2xl">
                <CardHeader>
                    <CardTitle>Company Users</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {users.map((user) => (
                        <div key={user.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm">
                            <div>
                                <p className="font-medium">{user.name}</p>
                                <p className="text-slate-500">{user.email}</p>
                            </div>
                            <p className="rounded-md bg-slate-100 px-2 py-1 font-semibold text-slate-600">{user.role}</p>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
