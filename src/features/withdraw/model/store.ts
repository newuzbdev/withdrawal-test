import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  createWithdrawal,
  getWithdrawal,
  ApiError,
  NetworkError,
} from "@/features/withdraw/api/withdrawApi";
import type { Withdrawal } from "./types";

export type RequestStatus = "idle" | "loading" | "success" | "error";

export interface WithdrawFormState {
  amount: number | null;
  destination: string;
  confirm: boolean;
}

type ErrorType = "none" | "conflict" | "network" | "api";

interface WithdrawState {
  form: WithdrawFormState;
  status: RequestStatus;
  errorType: ErrorType;
  errorMessage: string | null;
  lastWithdrawal: Withdrawal | null;
  currentIdempotencyKey: string | null;
  setForm: (updates: Partial<WithdrawFormState>) => void;
  resetForm: () => void;
  submit: (values: {
    amount: number;
    destination: string;
    confirm: boolean;
  }) => Promise<void>;
  retry: () => Promise<void>;
}

const initialForm: WithdrawFormState = {
  amount: null,
  destination: "",
  confirm: false,
};

function generateIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  // Fallback for environments without crypto.randomUUID (mainly tests)
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const useWithdrawStore = create<WithdrawState>()(
  devtools(
    (set, get) => ({
      form: initialForm,
      status: "idle",
      errorType: "none",
      errorMessage: null,
      lastWithdrawal: null,
      currentIdempotencyKey: null,

      setForm: (updates) =>
        set((state) => ({
          form: {
            ...state.form,
            ...updates,
          },
        })),

      resetForm: () =>
        set({
          form: initialForm,
          status: "idle",
          errorType: "none",
          errorMessage: null,
          currentIdempotencyKey: null,
        }),

      submit: async (values) => {
        const { status, currentIdempotencyKey } = get();

        // Code-side guard against double submit
        if (status === "loading") {
          return;
        }

        let idempotencyKey = currentIdempotencyKey;
        if (!idempotencyKey) {
          idempotencyKey = generateIdempotencyKey();
          set({ currentIdempotencyKey: idempotencyKey });
        }

        set({
          status: "loading",
          errorType: "none",
          errorMessage: null,
        });

        try {
          const created = await createWithdrawal({
            amount: values.amount,
            destination: values.destination,
            idempotencyKey,
          });

          const latest = await getWithdrawal(created.id);

          set({
            status: "success",
            lastWithdrawal: latest,
            errorType: "none",
            errorMessage: null,
            currentIdempotencyKey: null,
            form: {
              amount: values.amount,
              destination: values.destination,
              confirm: values.confirm,
            },
          });
        } catch (error) {
          if (error instanceof ApiError && error.status === 409) {
            set({
              status: "error",
              errorType: "conflict",
              errorMessage:
                "This withdrawal request was already submitted. Please wait for status.",
            });
            return;
          }

          if (error instanceof NetworkError) {
            // Keep idempotency key and form so Retry can safely re-use them
            set({
              status: "error",
              errorType: "network",
              errorMessage:
                "We could not reach the server. Please check your connection and try again.",
              form: {
                amount: values.amount,
                destination: values.destination,
                confirm: values.confirm,
              },
            });
            return;
          }

          const message =
            error instanceof ApiError
              ? error.message
              : "Something went wrong while submitting your withdrawal.";

          set({
            status: "error",
            errorType: "api",
            errorMessage: message,
          });
        }
      },

      retry: async () => {
        const { status, errorType, form, currentIdempotencyKey } = get();

        if (status !== "error" || errorType !== "network") {
          return;
        }

        if (!form.amount || !form.destination) {
          return;
        }

        // Re-use the same idempotency key for a single submission attempt
        const idempotencyKey =
          currentIdempotencyKey ?? generateIdempotencyKey();

        set({
          status: "loading",
          errorType: "none",
          errorMessage: null,
          currentIdempotencyKey: idempotencyKey,
        });

        try {
          const created = await createWithdrawal({
            amount: form.amount,
            destination: form.destination,
            idempotencyKey,
          });

          const latest = await getWithdrawal(created.id);

          set({
            status: "success",
            lastWithdrawal: latest,
            errorType: "none",
            errorMessage: null,
            currentIdempotencyKey: null,
          });
        } catch (error) {
          if (error instanceof ApiError && error.status === 409) {
            set({
              status: "error",
              errorType: "conflict",
              errorMessage:
                "This withdrawal request was already submitted. Please wait for status.",
            });
            return;
          }

          if (error instanceof NetworkError) {
            set({
              status: "error",
              errorType: "network",
              errorMessage:
                "We could not reach the server. Please check your connection and try again.",
            });
            return;
          }

          const message =
            error instanceof ApiError
              ? error.message
              : "Something went wrong while retrying your withdrawal.";

          set({
            status: "error",
            errorType: "api",
            errorMessage: message,
          });
        }
      },
    }),
    { name: "withdraw-store" }
  )
);

