import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
    return (
        <main className="flex min-h-screen items-center justify-center px-6 py-10">
            <div className="w-full max-w-md space-y-6">
                <LoginForm />
                <p className="text-center text-sm text-slate-600">
                    New company?{" "}
                    <Link href="/signup" className="font-semibold text-indigo-700">
                        Create an account
                    </Link>
                </p>
            </div>
        </main>
    );
}
