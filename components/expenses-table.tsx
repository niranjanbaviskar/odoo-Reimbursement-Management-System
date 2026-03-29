"use client";

import { Role } from "@prisma/client";
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    useReactTable,
} from "@tanstack/react-table";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

type ExpenseRecord = {
    id: string;
    title: string;
    amount: string;
    convertedAmount: string;
    convertedCurrency: string;
    category: string;
    status: "DRAFT" | "PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED" | "ESCALATED";
    user: { name: string };
    createdAt: string;
};

const column = createColumnHelper<ExpenseRecord>();

export function ExpensesTable({ role }: { role: Role }) {
    const [data, setData] = useState<ExpenseRecord[]>([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const [status, setStatus] = useState("all");

    useEffect(() => {
        const load = async () => {
            const params = new URLSearchParams();
            if (status !== "all") params.set("status", status);
            if (globalFilter) params.set("q", globalFilter);

            const response = await fetch(`/api/expenses?${params.toString()}`);
            const json = await response.json();
            setData(json.data || []);
        };

        void load();
    }, [globalFilter, status]);

    const columns = useMemo(
        () => [
            column.accessor("title", { header: "Title" }),
            column.accessor("user.name", { header: "Employee" }),
            column.accessor("category", { header: "Category" }),
            column.accessor("convertedAmount", {
                header: "Amount",
                cell: (info) => `${info.row.original.convertedCurrency} ${Number(info.getValue()).toFixed(2)}`,
            }),
            column.accessor("status", {
                header: "Status",
                cell: (info) => <StatusBadge status={info.getValue()} />,
            }),
            column.display({
                id: "details",
                header: "",
                cell: (info) => (
                    <Link href={`/expenses/${info.row.original.id}`} className="text-sm font-semibold text-indigo-700">
                        View
                    </Link>
                ),
            }),
        ],
        [],
    );

    const table = useReactTable({
        data,
        columns,
        state: { globalFilter },
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    return (
        <Card className="glass-card rounded-2xl">
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <CardTitle>Expense Claims</CardTitle>
                <div className="flex flex-col gap-2 md:flex-row">
                    <Input
                        value={globalFilter ?? ""}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        placeholder="Search claims..."
                        className="w-56"
                    />
                    <Select value={status} onValueChange={(value) => setStatus(String(value ?? "all"))}>
                        <SelectTrigger className="w-44">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="IN_REVIEW">In Review</SelectItem>
                            <SelectItem value="APPROVED">Approved</SelectItem>
                            <SelectItem value="REJECTED">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                    <Link href="/expenses/new">
                        <Button className="bg-indigo-600 hover:bg-indigo-500">Submit Expense</Button>
                    </Link>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id}>
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-slate-500">Role view: {role}</p>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            Previous
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                            Next
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
