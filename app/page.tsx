import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <section className="w-full max-w-xl rounded-2xl bg-white p-8 shadow-lg shadow-slate-900/10 dark:bg-zinc-900">
        <h1 className="text-2xl font-semibold text-slate-950 dark:text-zinc-50">
          Withdraw Demo
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">
          A small demo of a withdrawal flow with validation, idempotent API
          calls, and explicit request state.
        </p>

        <div className="mt-6 flex justify-end">
          <Link
            href="/withdraw"
            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-slate-50 hover:bg-slate-800"
          >
            Go to Withdraw page
          </Link>
        </div>
      </section>
    </main>
  );
}
