"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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
import { signUpSchema, type SignUpInput } from "@/lib/validators/auth";

type CountryCurrency = {
    country: string;
    currency: string;
};

export function SignupForm() {
    const router = useRouter();
    const [countries, setCountries] = useState<CountryCurrency[]>([]);
    const [selectedCurrency, setSelectedCurrency] = useState("USD");
    const [loading, setLoading] = useState(false);

    const form = useForm<SignUpInput>({
        resolver: zodResolver(signUpSchema),
        defaultValues: {
            companyName: "",
            adminName: "",
            email: "",
            password: "",
            country: "",
        },
    });

    useEffect(() => {
        const loadCountries = async () => {
            const response = await fetch("/api/meta/countries");
            const data = await response.json();
            setCountries(data.data || []);
        };

        void loadCountries();
    }, []);

    const onSubmit = form.handleSubmit(async (values) => {
        setLoading(true);
        form.clearErrors();

        try {
            const response = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 409) {
                    form.setError("email", {
                        type: "server",
                        message: "This email is already registered.",
                    });
                    toast.error("This email is already registered.");
                    return;
                }

                if (response.status === 400 && data?.details?.fieldErrors) {
                    const fieldErrors = data.details.fieldErrors as Partial<Record<keyof SignUpInput, string[]>>;

                    (Object.keys(fieldErrors) as Array<keyof SignUpInput>).forEach((field) => {
                        const firstError = fieldErrors[field]?.[0];
                        if (firstError) {
                            form.setError(field, { type: "server", message: firstError });
                        }
                    });

                    toast.error("Please correct the highlighted fields.");
                    return;
                }

                toast.error(data?.error || "Unable to create account right now.");
                return;
            }

            toast.success("Company created. Please sign in.");
            router.push("/login");
        } catch {
            toast.error("Could not reach server. Please ensure the app is running and try again.");
        } finally {
            setLoading(false);
        }
    });

    return (
        <Card className="glass-card mx-auto w-full max-w-2xl rounded-3xl border-indigo-100">
            <CardHeader>
                <CardTitle className="text-2xl">Create your company workspace</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Company Name</Label>
                        <Input {...form.register("companyName")} />
                        {form.formState.errors.companyName?.message ? (
                            <p className="text-xs text-rose-600">{form.formState.errors.companyName.message}</p>
                        ) : null}
                    </div>
                    <div className="space-y-2">
                        <Label>Admin Name</Label>
                        <Input {...form.register("adminName")} />
                        {form.formState.errors.adminName?.message ? (
                            <p className="text-xs text-rose-600">{form.formState.errors.adminName.message}</p>
                        ) : null}
                    </div>
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" {...form.register("email")} />
                        {form.formState.errors.email?.message ? (
                            <p className="text-xs text-rose-600">{form.formState.errors.email.message}</p>
                        ) : null}
                    </div>
                    <div className="space-y-2">
                        <Label>Password</Label>
                        <Input type="password" {...form.register("password")} />
                        {form.formState.errors.password?.message ? (
                            <p className="text-xs text-rose-600">{form.formState.errors.password.message}</p>
                        ) : null}
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label>Country</Label>
                        <Select
                            onValueChange={(value) => {
                                const nextCountry = String(value);
                                form.setValue("country", nextCountry);
                                const selected = countries.find((item) => item.country === nextCountry);
                                setSelectedCurrency(selected?.currency || "USD");
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent className="max-h-72">
                                {countries.map((item) => (
                                    <SelectItem key={item.country} value={item.country}>
                                        {item.country} ({item.currency})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-slate-500">Default currency: {selectedCurrency}</p>
                        {form.formState.errors.country?.message ? (
                            <p className="text-xs text-rose-600">{form.formState.errors.country.message}</p>
                        ) : null}
                    </div>
                    <Button disabled={loading} className="md:col-span-2 bg-indigo-600 hover:bg-indigo-500">
                        {loading ? "Creating workspace..." : "Create Company"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
