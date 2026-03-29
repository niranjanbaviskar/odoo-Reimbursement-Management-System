"use client";

import { Role } from "@prisma/client";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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

type UserOption = { id: string; name: string; role: Role };

type SavedWorkflow = {
    id: string;
    name: string;
    description?: string | null;
    isActive: boolean;
    ruleType: "SEQUENTIAL" | "PERCENTAGE" | "SPECIFIC_APPROVER" | "HYBRID";
    percentageThreshold?: number | null;
    steps: Array<{
        id: string;
        name: string;
        stepOrder: number;
        ruleType: "SEQUENTIAL" | "PERCENTAGE" | "SPECIFIC_APPROVER" | "HYBRID";
        threshold?: number | null;
        approvers: Array<{ user: { id: string; name: string; role: Role } }>;
    }>;
    conditions: Array<{
        id: string;
        field: string;
        operator: string;
        stringValue?: string | null;
        numericValue?: string | number | null;
    }>;
};

type StepDraft = {
    name: string;
    stepOrder: number;
    ruleType: "SEQUENTIAL" | "PERCENTAGE" | "SPECIFIC_APPROVER" | "HYBRID";
    threshold?: number;
    approverIds: string[];
};

export function WorkflowBuilder() {
    const [users, setUsers] = useState<UserOption[]>([]);
    const [workflows, setWorkflows] = useState<SavedWorkflow[]>([]);
    const [loadingWorkflows, setLoadingWorkflows] = useState(true);
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState("Travel Claims Workflow");
    const [ruleType, setRuleType] = useState<StepDraft["ruleType"]>("SEQUENTIAL");
    const [threshold, setThreshold] = useState<number>(60);
    const [specificApproverId, setSpecificApproverId] = useState("");
    const [steps, setSteps] = useState<StepDraft[]>([
        { name: "Manager Review", stepOrder: 1, ruleType: "SEQUENTIAL", approverIds: [] },
    ]);
    const [amountCondition, setAmountCondition] = useState("5000");
    const [categoryCondition, setCategoryCondition] = useState("Travel");

    const loadUsers = async () => {
        const response = await fetch("/api/users", { cache: "no-store" });
        const json = await response.json();

        if (!response.ok || !json?.success) {
            toast.error(json?.error || "Failed to load users");
            return;
        }

        setUsers(json.data || []);
    };

    const loadWorkflows = async () => {
        setLoadingWorkflows(true);

        try {
            const response = await fetch("/api/workflows", { cache: "no-store" });
            const json = await response.json();

            if (!response.ok || !json?.success) {
                toast.error(json?.error || "Failed to load workflows");
                setWorkflows([]);
                return;
            }

            setWorkflows(json.data || []);
        } catch {
            toast.error("Failed to load workflows");
            setWorkflows([]);
        } finally {
            setLoadingWorkflows(false);
        }
    };

    useEffect(() => {
        const load = async () => {
            await Promise.all([loadUsers(), loadWorkflows()]);
        };

        void load();
    }, []);

    const managerAndAdmin = useMemo(
        () => users.filter((user) => user.role === "MANAGER" || user.role === "ADMIN"),
        [users],
    );

    const addStep = () => {
        setSteps((current) => [
            ...current,
            {
                name: `Step ${current.length + 1}`,
                stepOrder: current.length + 1,
                ruleType: "SEQUENTIAL",
                approverIds: [],
            },
        ]);
    };

    const normalizeSteps = (draft: StepDraft[]) =>
        draft.map((step, index) => ({
            ...step,
            stepOrder: index + 1,
        }));

    const updateStep = (index: number, next: Partial<StepDraft>) => {
        setSteps((current) => current.map((step, i) => (i === index ? { ...step, ...next } : step)));
    };

    const createWorkflow = async () => {
        if (name.trim().length < 2) {
            toast.error("Workflow name must be at least 2 characters");
            return;
        }

        if (steps.some((step) => !step.name.trim())) {
            toast.error("Every step must have a name");
            return;
        }

        if (steps.some((step) => step.approverIds.length === 0 || !step.approverIds[0])) {
            toast.error("Please select an approver for every step");
            return;
        }

        if ((ruleType === "PERCENTAGE" || ruleType === "HYBRID") && (threshold < 1 || threshold > 100)) {
            toast.error("Percentage threshold must be between 1 and 100");
            return;
        }

        if ((ruleType === "SPECIFIC_APPROVER" || ruleType === "HYBRID") && !specificApproverId) {
            toast.error("Please select a specific approver");
            return;
        }

        setSaving(true);

        try {
            const response = await fetch("/api/workflows", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    ruleType,
                    percentageThreshold: ruleType === "PERCENTAGE" || ruleType === "HYBRID" ? threshold : undefined,
                    specificApproverId: ruleType === "SPECIFIC_APPROVER" || ruleType === "HYBRID" ? specificApproverId : undefined,
                    managerApprovalRequired: true,
                    conditions: [
                        {
                            field: "amount",
                            operator: ">",
                            numericValue: Number(amountCondition),
                        },
                        {
                            field: "category",
                            operator: "=",
                            stringValue: categoryCondition,
                        },
                    ],
                    steps: normalizeSteps(steps),
                }),
            });

            const json = await response.json();

            if (!response.ok) {
                toast.error(json.error || "Failed to create workflow");
                return;
            }

            toast.success("Workflow created");
            await loadWorkflows();
        } catch {
            toast.error("Failed to create workflow");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card className="glass-card rounded-2xl">
                <CardHeader>
                    <CardTitle>Workflow Builder</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                        <Label>Workflow Name</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} />
                    </div>

                    <div className="space-y-2">
                        <Label>Rule Type</Label>
                        <Select value={ruleType} onValueChange={(value) => setRuleType(value as StepDraft["ruleType"])}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="SEQUENTIAL">Sequential</SelectItem>
                                <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                                <SelectItem value="SPECIFIC_APPROVER">Specific Approver</SelectItem>
                                <SelectItem value="HYBRID">Hybrid</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Percentage Threshold</Label>
                        <Input type="number" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} />
                    </div>

                    <div className="space-y-2">
                        <Label>Specific Approver (CFO)</Label>
                        <Select
                            value={specificApproverId}
                            onValueChange={(value) => setSpecificApproverId(String(value ?? ""))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select approver" />
                            </SelectTrigger>
                            <SelectContent>
                                {managerAndAdmin.map((user) => (
                                    <SelectItem key={user.id} value={user.id}>
                                        {user.name} ({user.role})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Amount Condition (&gt;)</Label>
                        <Input value={amountCondition} onChange={(e) => setAmountCondition(e.target.value)} />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <Label>Category Condition (=)</Label>
                        <Input value={categoryCondition} onChange={(e) => setCategoryCondition(e.target.value)} />
                    </div>
                </CardContent>
            </Card>

            {steps.map((step, index) => (
                <Card key={`${step.stepOrder}-${index}`} className="glass-card rounded-2xl">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Step {step.stepOrder}</CardTitle>
                        {steps.length > 1 && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                    setSteps((current) => normalizeSteps(current.filter((_, i) => i !== index)))
                                }
                            >
                                <Trash2 className="size-4" />
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Step Name</Label>
                            <Input value={step.name} onChange={(e) => updateStep(index, { name: e.target.value })} />
                        </div>

                        <div className="space-y-2">
                            <Label>Approver</Label>
                            <Select
                                value={step.approverIds[0] || ""}
                                onValueChange={(value) => updateStep(index, { approverIds: [String(value ?? "")] })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select approver" />
                                </SelectTrigger>
                                <SelectContent>
                                    {managerAndAdmin.map((user) => (
                                        <SelectItem key={user.id} value={user.id}>
                                            {user.name} ({user.role})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            ))}

            <div className="flex flex-wrap gap-3">
                <Button onClick={addStep} variant="outline">
                    <Plus className="mr-1 size-4" />
                    Add Step
                </Button>
                <Button onClick={() => void createWorkflow()} className="bg-indigo-600 hover:bg-indigo-500" disabled={saving}>
                    {saving ? "Saving..." : "Save Workflow"}
                </Button>
            </div>

            <Card className="glass-card rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Saved Workflows</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => void loadWorkflows()} disabled={loadingWorkflows}>
                        Refresh
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {loadingWorkflows ? (
                        <p className="text-sm text-slate-500">Loading workflows...</p>
                    ) : workflows.length === 0 ? (
                        <p className="text-sm text-slate-500">No workflows found. Save one from the builder above.</p>
                    ) : (
                        workflows.map((workflow) => (
                            <article key={workflow.id} className="rounded-xl border border-slate-200 p-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="font-semibold text-slate-900">{workflow.name}</p>
                                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                                        {workflow.isActive ? "ACTIVE" : "INACTIVE"}
                                    </span>
                                </div>
                                <p className="mt-1 text-xs text-slate-500">
                                    Rule: {workflow.ruleType}
                                    {workflow.percentageThreshold ? ` (${workflow.percentageThreshold}%)` : ""}
                                </p>

                                {!!workflow.conditions.length && (
                                    <p className="mt-2 text-xs text-slate-600">
                                        Conditions: {workflow.conditions
                                            .map((condition) => {
                                                const value = condition.numericValue ?? condition.stringValue ?? "";
                                                return `${condition.field} ${condition.operator} ${value}`;
                                            })
                                            .join(" | ")}
                                    </p>
                                )}

                                <div className="mt-3 space-y-2">
                                    {workflow.steps
                                        .slice()
                                        .sort((a, b) => a.stepOrder - b.stepOrder)
                                        .map((step) => (
                                            <div key={step.id} className="rounded-lg border border-slate-100 bg-white/50 p-2 text-xs text-slate-700">
                                                <p className="font-medium">
                                                    Step {step.stepOrder}: {step.name} ({step.ruleType}
                                                    {step.threshold ? ` ${step.threshold}%` : ""})
                                                </p>
                                                <p className="mt-1 text-slate-500">
                                                    Approvers: {step.approvers.map((entry) => entry.user.name).join(", ") || "None"}
                                                </p>
                                            </div>
                                        ))}
                                </div>
                            </article>
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
