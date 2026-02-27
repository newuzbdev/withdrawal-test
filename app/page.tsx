import WithdrawForm from "@/features/withdraw/ui/WithdrawForm";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <section className="w-full max-w-xl rounded-2xl bg-white p-8 shadow-lg shadow-slate-900/10 dark:bg-zinc-900">
        <header className="mb-6 space-y-1">
          <h1 className="text-xl font-semibold text-slate-950 dark:text-zinc-50">
            Withdraw funds
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Submit a withdrawal request and track its status.
          </p>
        </header>
        <WithdrawForm />
      </section>
    </main>
  );
}
