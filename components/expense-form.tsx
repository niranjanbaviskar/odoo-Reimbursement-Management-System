"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import Tesseract from "tesseract.js";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { parseOCRReceipt } from "@/lib/services/ocr";

const formSchema = z.object({
    title: z.string().min(2),
    amount: z.number().positive(),
    currency: z.string().length(3),
    category: z.string().min(2),
    description: z.string().optional(),
    expenseDate: z.string(),
});

type FormInput = z.infer<typeof formSchema>;

type OCRPreview = {
    rawText: string;
    parsed: ReturnType<typeof parseOCRReceipt>;
};

export function ExpenseForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [uploadingOCR, setUploadingOCR] = useState(false);
    const [receipt, setReceipt] = useState<{ url: string; publicId?: string } | null>(null);
    const [ocrPreview, setOcrPreview] = useState<OCRPreview | null>(null);

    const form = useForm<FormInput>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            amount: 0,
            currency: "USD",
            category: "Travel",
            description: "",
            expenseDate: new Date().toISOString().slice(0, 10),
        },
    });

    const runOCR = async (file: File) => {
        setUploadingOCR(true);
        const result = await Tesseract.recognize(file, "eng");
        const rawText = result.data.text || "";
        const parsed = parseOCRReceipt(rawText);

        setOcrPreview({ rawText, parsed });
        setUploadingOCR(false);
    };

    const onReceiptChange: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        await runOCR(file);

        const base64 = await toBase64(file);

        const response = await fetch("/api/upload/receipt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: base64 }),
        });

        const data = await response.json();
        if (!response.ok) {
            toast.error(data.error || "Failed to upload receipt");
            return;
        }

        setReceipt(data.data);
        toast.success("Receipt uploaded and scanned");
    };

    const onSubmit = form.handleSubmit(async (values) => {
        setLoading(true);
        const response = await fetch("/api/expenses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...values,
                status: "PENDING",
                receiptUrl: receipt?.url,
                receiptPublicId: receipt?.publicId,
                rawOCRText: ocrPreview?.rawText,
                parsedOCR: ocrPreview?.parsed,
            }),
        });

        const data = await response.json();
        setLoading(false);

        if (!response.ok) {
            toast.error(data.error || "Failed to submit expense");
            return;
        }

        toast.success("Expense submitted successfully");
        router.push("/expenses");
        router.refresh();
    });

    return (
        <div className="glass-card mx-auto max-w-3xl rounded-3xl border border-indigo-100 p-6">
            <h1 className="text-2xl font-semibold">Submit Expense Claim</h1>
            <p className="mt-1 text-sm text-slate-500">OCR-assisted claim entry with multi-currency conversion.</p>

            <form onSubmit={onSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                    <Label>Title</Label>
                    <Input {...form.register("title")} />
                </div>

                <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input type="number" step="0.01" {...form.register("amount", { valueAsNumber: true })} />
                </div>

                <div className="space-y-2">
                    <Label>Currency</Label>
                    <Input maxLength={3} {...form.register("currency")} />
                </div>

                <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                        value={form.watch("category")}
                        onValueChange={(value) => form.setValue("category", String(value))}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                            {EXPENSE_CATEGORIES.map((category) => (
                                <SelectItem key={category} value={category}>
                                    {category}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" {...form.register("expenseDate")} />
                </div>

                <div className="space-y-2 md:col-span-2">
                    <Label>Description</Label>
                    <Textarea rows={4} {...form.register("description")} />
                </div>

                <div className="space-y-2 md:col-span-2">
                    <Label>Receipt Upload</Label>
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-indigo-300 bg-indigo-50 px-4 py-4 text-sm text-indigo-700">
                        <Upload className="size-4" />
                        {uploadingOCR ? "Scanning receipt..." : "Upload receipt image"}
                        <input type="file" accept="image/*" className="hidden" onChange={onReceiptChange} />
                    </label>
                </div>

                <Button disabled={loading} className="md:col-span-2 bg-indigo-600 hover:bg-indigo-500">
                    {loading ? "Submitting..." : "Submit for Approval"}
                </Button>
            </form>

            <Dialog open={!!ocrPreview} onOpenChange={(open) => !open && setOcrPreview(null)}>
                <DialogContent className="max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>OCR Preview and Auto-Fill</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 text-sm">
                        <div className="rounded-lg bg-slate-50 p-3">
                            <p className="font-medium">Raw OCR Text</p>
                            <p className="mt-1 whitespace-pre-wrap text-slate-600">{ocrPreview?.rawText}</p>
                        </div>

                        <div className="grid gap-2 rounded-lg bg-indigo-50 p-3">
                            <p>Merchant: {ocrPreview?.parsed.merchant || "N/A"}</p>
                            <p>Amount: {ocrPreview?.parsed.amount || "N/A"}</p>
                            <p>Date: {ocrPreview?.parsed.date || "N/A"}</p>
                            <p>Category Suggestion: {ocrPreview?.parsed.category || "N/A"}</p>
                            <p>Description Suggestion: {ocrPreview?.parsed.description || "N/A"}</p>
                        </div>

                        <Button
                            className="w-full"
                            onClick={() => {
                                if (!ocrPreview) return;
                                if (ocrPreview.parsed.amount) form.setValue("amount", ocrPreview.parsed.amount);
                                if (ocrPreview.parsed.category) form.setValue("category", ocrPreview.parsed.category);
                                if (ocrPreview.parsed.description) form.setValue("description", ocrPreview.parsed.description);
                                if (ocrPreview.parsed.merchant) form.setValue("title", ocrPreview.parsed.merchant);
                                setOcrPreview(null);
                            }}
                        >
                            Apply Auto-Fill Data
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function toBase64(file: File) {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
    });
}
