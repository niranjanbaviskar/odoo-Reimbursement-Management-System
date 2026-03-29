import Link from "next/link";
import {
  Bot,
  Building2,
  ChartNoAxesCombined,
  FileScan,
  GitBranchPlus,
  ShieldCheck,
} from "lucide-react";

const features = [
  {
    icon: FileScan,
    title: "OCR Receipt Capture",
    desc: "Extract merchant, date, taxes, and totals from receipts and auto-fill claim forms.",
  },
  {
    icon: GitBranchPlus,
    title: "Configurable Workflows",
    desc: "Build conditional, sequential, percentage, and hybrid approval logic from a visual builder.",
  },
  {
    icon: Building2,
    title: "Multi-Tenant Security",
    desc: "Strong company data isolation with role-aware controls for admin, manager, and employees.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Realtime Insights",
    desc: "Track reimbursement spend, category trends, bottlenecks, and approval turnaround.",
  },
  {
    icon: Bot,
    title: "Smart Parsing Layer",
    desc: "Normalize OCR text into structured expense fields and line-item hints for quick review.",
  },
  {
    icon: ShieldCheck,
    title: "Full Audit Trail",
    desc: "Every approval action, reassignment, and override is logged for governance and traceability.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-7xl px-6 pb-24 pt-10 lg:px-8">
        <nav className="mb-16 flex items-center justify-between rounded-2xl border border-indigo-100 bg-white/80 px-5 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-linear-to-br from-indigo-600 to-violet-600 p-2 text-white">
              <Building2 className="size-5" />
            </div>
            <p className="text-lg font-semibold">ClaimFlow</p>
          </div>
          <div className="flex gap-3">
            <Link href="/login" className="rounded-xl px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-500"
            >
              Start Free
            </Link>
          </div>
        </nav>

        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="inline-flex rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
              Odoo Hackathon 2026
            </span>
            <h1 className="mt-6 text-4xl font-semibold leading-tight text-slate-900 lg:text-6xl">
              Smart reimbursements with <span className="gradient-text">enterprise workflow control</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-600">
              ClaimFlow automates submission, OCR extraction, multi-currency conversion, and complex multi-level approvals across global teams.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/signup" className="rounded-2xl bg-indigo-600 px-6 py-3 font-semibold text-white shadow-xl shadow-indigo-200 hover:bg-indigo-500">
                Build Your Company Space
              </Link>
              <Link href="/dashboard" className="rounded-2xl border border-indigo-200 bg-white px-6 py-3 font-semibold text-indigo-700 hover:bg-indigo-50">
                Open Demo Dashboard
              </Link>
            </div>
          </div>

          <div className="glass-card rounded-3xl p-6">
            <div className="rounded-2xl bg-linear-to-br from-slate-950 via-indigo-950 to-violet-900 p-6 text-white">
              <p className="text-sm text-indigo-100">Approval Pipeline</p>
              <div className="mt-4 space-y-3">
                <div className="rounded-xl bg-white/10 p-3 text-sm">Step 1: Manager approval (Travel &gt; $5,000)</div>
                <div className="rounded-xl bg-white/10 p-3 text-sm">Step 2: Finance threshold check (60% quorum)</div>
                <div className="rounded-xl bg-white/10 p-3 text-sm">Step 3: CFO override rule for urgent claims</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-800">OCR Accuracy: 94%</div>
              <div className="rounded-xl bg-indigo-50 p-3 text-indigo-800">Avg Turnaround: 1.8 days</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }) => (
            <article key={title} className="glass-card rounded-3xl p-6 transition hover:-translate-y-1">
              <div className="mb-4 inline-flex rounded-xl bg-indigo-100 p-3 text-indigo-700">
                <Icon className="size-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm text-slate-600">{desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl rounded-3xl border border-indigo-100 bg-white p-10 text-center shadow-2xl shadow-indigo-100/60">
        <h2 className="text-3xl font-semibold text-slate-900">Ready to modernize reimbursements?</h2>
        <p className="mx-auto mt-3 max-w-2xl text-slate-600">
          Launch ClaimFlow for your company with full approval workflow automation, receipt OCR, and real-time analytics.
        </p>
        <Link href="/signup" className="mt-6 inline-flex rounded-2xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-500">
          Create Your Admin Workspace
        </Link>
      </section>

      <footer className="mt-14 border-t border-indigo-100 py-8 text-center text-sm text-slate-500">
        ClaimFlow Smart Reimbursement Management System
      </footer>
    </main>
  );
}
