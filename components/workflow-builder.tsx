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

type StepDraft = {
    name: string;
    stepOrder: number;
    ruleType: "SEQUENTIAL" | "PERCENTAGE" | "SPECIFIC_APPROVER" | "HYBRID";
    threshold?: number;
    approverIds: string[];
};

export function WorkflowBuilder() {
    const [users, setUsers] = useState<UserOption[]>([]);
    const [name, setName] = useState("Travel Claims Workflow");
    const [ruleType, setRuleType] = useState<StepDraft["ruleType"]>("SEQUENTIAL");
    const [threshold, setThreshold] = useState<number>(60);
    const [specificApproverId, setSpecificApproverId] = useState("");
    const [steps, setSteps] = useState<StepDraft[]>([
        { name: "Manager Review", stepOrder: 1, ruleType: "SEQUENTIAL", approverIds: [] },
    ]);
    const [amountCondition, setAmountCondition] = useState("5000");
    const [categoryCondition, setCategoryCondition] = useState("Travel");

    useEffect(() => {
        const load = async () => {
            const response = await fetch("/api/users");
            const json = await response.json();
            setUsers(json.data || []);
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

    const updateStep = (index: number, next: Partial<StepDraft>) => {
        setSteps((current) => current.map((step, i) => (i === index ? { ...step, ...next } : step)));
    };

    const createWorkflow = async () => {
        const response = await fetch("/api/workflows", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name,
                ruleType,
                percentageThreshold: ruleType === "PERCENTAGE" || ruleType === "HYBRID" ? threshold : undefined,
                specificApproverId: ruleType === "SPECIFIC_APPROVER" || ruleType === "HYBRID" ? specificApproverId : undefined,
                managerApprovalRequired: true,
                steps,
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
            }),
        });

        const json = await response.json();
        if (!response.ok) {
            toast.error(json.error || "Failed to create workflow");
            return;
        }

        toast.success("Workflow created");
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
                                onClick={() => setSteps((current) => current.filter((_, i) => i !== index))}
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
                <Button onClick={() => void createWorkflow()} className="bg-indigo-600 hover:bg-indigo-500">
                    Save Workflow
                </Button>
            </div>
        </div>
    );
}
