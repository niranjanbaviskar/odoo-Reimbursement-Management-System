import Link from "next/link";

import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
    return (
        <main className="min-h-screen px-6 py-10">
            <div className="mx-auto w-full max-w-3xl space-y-6">
                <SignupForm />
                <p className="text-center text-sm text-slate-600">
                    Already have an account?{" "}
                    <Link href="/login" className="font-semibold text-indigo-700">
                        Sign in
                    </Link>
                </p>
            </div>
        </main>
    );
}
