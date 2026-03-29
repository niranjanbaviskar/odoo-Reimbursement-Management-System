"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInSchema, type SignInInput } from "@/lib/validators/auth";

export function LoginForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const form = useForm<SignInInput>({
        resolver: zodResolver(signInSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = form.handleSubmit(async (values) => {
        setLoading(true);
        const result = await signIn("credentials", {
            email: values.email,
            password: values.password,
            redirect: false,
        });

        setLoading(false);

        if (result?.error) {
            toast.error("Invalid credentials");
            return;
        }

        toast.success("Welcome back");
        router.push("/dashboard");
        router.refresh();
    });

    return (
        <Card className="glass-card mx-auto w-full max-w-md rounded-3xl border-indigo-100">
            <CardHeader>
                <CardTitle className="text-2xl">Sign in to ClaimFlow</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" {...form.register("email")} />
                    </div>

                    <div className="space-y-2">
                        <Label>Password</Label>
                        <Input type="password" {...form.register("password")} />
                    </div>

                    <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500">
                        {loading ? "Signing in..." : "Sign in"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
