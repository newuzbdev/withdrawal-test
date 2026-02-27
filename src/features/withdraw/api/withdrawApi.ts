import { request, ApiError, NetworkError } from "@/shared/api/client";
import type { Withdrawal } from "../model/types";

interface CreateWithdrawalPayload {
  amount: number;
  destination: string;
  idempotencyKey: string;
}

export async function createWithdrawal(
  payload: CreateWithdrawalPayload
): Promise<Withdrawal> {
  const body = {
    amount: payload.amount,
    destination: payload.destination,
    idempotency_key: payload.idempotencyKey,
  };

  return request<Withdrawal>("/v1/withdrawals", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getWithdrawal(id: string): Promise<Withdrawal> {
  return request<Withdrawal>(`/v1/withdrawals/${encodeURIComponent(id)}`, {
    method: "GET",
  });
}

export { ApiError, NetworkError };

