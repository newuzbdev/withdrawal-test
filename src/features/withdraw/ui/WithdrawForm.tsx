"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useWithdrawStore,
  type RequestStatus,
} from "@/features/withdraw/model/store";

const withdrawSchema = z.object({
  amount: z.coerce
    .number()
    .refine((value) => !Number.isNaN(value), {
      message: "Amount is required",
    })
    .positive("Amount must be greater than 0"),
  destination: z
    .string()
    .min(1, "Destination is required")
    .max(255, "Destination is too long"),
  confirm: z
    .boolean()
    .refine((value) => value, { message: "You must confirm this withdrawal." }),
});

export type WithdrawFormValues = z.infer<typeof withdrawSchema>;

function StatusBadge({ status }: { status: RequestStatus }) {
  const labelMap: Record<RequestStatus, string> = {
    idle: "Idle",
    loading: "Submitting",
    success: "Success",
    error: "Error",
  };

  const colorClassMap: Record<RequestStatus, string> = {
    idle: "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100",
    loading: "bg-amber-100 text-amber-900 dark:bg-amber-400/20 dark:text-amber-200",
    success: "bg-emerald-100 text-emerald-900 dark:bg-emerald-400/20 dark:text-emerald-200",
    error: "bg-rose-100 text-rose-900 dark:bg-rose-400/20 dark:text-rose-100",
  };

  return (
    <span
      aria-label={`Request status: ${labelMap[status]}`}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${colorClassMap[status]}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status === "success"
            ? "bg-emerald-500"
            : status === "error"
            ? "bg-rose-500"
            : status === "loading"
            ? "bg-amber-400"
            : "bg-slate-400"
        }`}
      />
      {labelMap[status]}
    </span>
  );
}

export default function WithdrawForm() {
  const {
    form,
    status,
    errorMessage,
    errorType,
    lastWithdrawal,
    setForm,
    submit,
    retry,
  } = useWithdrawStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<WithdrawFormValues>({
    resolver: zodResolver(withdrawSchema) as any,
    mode: "onChange",
    defaultValues: {
      amount: form.amount ?? undefined,
      destination: form.destination,
      confirm: form.confirm,
    },
  });

  useEffect(() => {
    const subscription = watch((values) => {
      setForm(values);
    });
    return () => subscription.unsubscribe();
  }, [watch, setForm]);

  const onSubmit = (values: WithdrawFormValues) => {
    void submit(values);
  };

  const isSubmitting = status === "loading";

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-6 text-sm text-slate-900 dark:text-slate-100"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          Withdrawal details
        </h2>
        <StatusBadge status={status} />
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="amount"
            className="block text-xs font-medium text-slate-600 dark:text-slate-300"
          >
            Amount
          </label>
          <input
            id="amount"
            type="number"
            step="0.01"
            inputMode="decimal"
            {...register("amount", { valueAsNumber: true })}
            className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-0 transition hover:border-slate-300 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-900/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:hover:border-slate-500 dark:focus:border-slate-400"
          />
          {errors.amount && (
            <p
              role="alert"
              className="text-xs font-medium text-rose-500"
            >
              {errors.amount.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="destination"
            className="block text-xs font-medium text-slate-600 dark:text-slate-300"
          >
            Destination
          </label>
          <input
            id="destination"
            type="text"
            {...register("destination")}
            className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-0 transition hover:border-slate-300 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-900/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:hover:border-slate-500 dark:focus:border-slate-400"
          />
          {errors.destination && (
            <p
              role="alert"
              className="text-xs font-medium text-rose-500"
            >
              {errors.destination.message}
            </p>
          )}
        </div>

        <label className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            {...register("confirm")}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-slate-900/40 dark:border-slate-600 dark:bg-slate-900"
          />
          <span>I confirm that I want to submit this withdrawal.</span>
        </label>
        {errors.confirm && (
          <p
            role="alert"
            className="text-xs font-medium text-rose-500"
          >
            {errors.confirm.message}
          </p>
        )}
      </div>

      {status === "error" && errorMessage && (
        <div
          role="alert"
          className={`rounded-lg border px-3 py-2 text-xs font-medium ${
            errorType === "conflict"
              ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-400/40 dark:bg-amber-950/40 dark:text-amber-100"
              : "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-400/40 dark:bg-rose-950/40 dark:text-rose-100"
          }`}
        >
          {errorMessage}
        </div>
      )}

      {status === "success" && lastWithdrawal && (
        <div
          aria-live="polite"
          className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900 dark:border-emerald-400/40 dark:bg-emerald-950/40 dark:text-emerald-100"
        >
          <p className="font-semibold">Withdrawal created successfully.</p>
          <dl className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-x-3 gap-y-1">
            <dt className="font-medium text-emerald-800 dark:text-emerald-100/90">
              ID
            </dt>
            <dd className="truncate">{lastWithdrawal.id}</dd>
            <dt className="font-medium text-emerald-800 dark:text-emerald-100/90">
              Amount
            </dt>
            <dd>{lastWithdrawal.amount}</dd>
            <dt className="font-medium text-emerald-800 dark:text-emerald-100/90">
              Destination
            </dt>
            <dd className="truncate">{lastWithdrawal.destination}</dd>
            <dt className="font-medium text-emerald-800 dark:text-emerald-100/90">
              Status
            </dt>
            <dd className="capitalize">{lastWithdrawal.status}</dd>
          </dl>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        {status === "error" && errorType === "network" && (
          <button
            type="button"
            onClick={() => retry()}
            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Retry
          </button>
        )}

        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-50 shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/60 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200 dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
        >
          {isSubmitting ? "Submitting..." : "Submit withdrawal"}
        </button>
      </div>
    </form>
  );
}

