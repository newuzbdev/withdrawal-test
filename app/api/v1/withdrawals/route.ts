import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

type WithdrawalStatus = "pending" | "completed" | "failed";

interface Withdrawal {
  id: string;
  amount: number;
  destination: string;
  status: WithdrawalStatus;
}

// Simple in-memory store for demo purposes only.
// In production this must be a durable store (DB, etc.).
const withdrawalsById = new Map<string, Withdrawal>();
const withdrawalsByKey = new Map<string, string>();

export async function POST(req: Request) {
  const body = await req.json();

  const { amount, destination, idempotency_key: idempotencyKey } = body ?? {};

  if (typeof amount !== "number" || amount <= 0) {
    return NextResponse.json(
      { message: "Invalid amount" },
      { status: 400 }
    );
  }

  if (!destination || typeof destination !== "string") {
    return NextResponse.json(
      { message: "Invalid destination" },
      { status: 400 }
    );
  }

  if (!idempotencyKey || typeof idempotencyKey !== "string") {
    return NextResponse.json(
      { message: "Missing idempotency key" },
      { status: 400 }
    );
  }

  // If this idempotency key was already used, simulate 409 conflict.
  if (withdrawalsByKey.has(idempotencyKey)) {
    return NextResponse.json(
      { message: "Duplicate request" },
      { status: 409 }
    );
  }

  const id = randomUUID();

  const withdrawal: Withdrawal = {
    id,
    amount,
    destination,
    status: "pending",
  };

  withdrawalsById.set(id, withdrawal);
  withdrawalsByKey.set(idempotencyKey, id);

  // Return minimal info; client will GET details afterwards.
  return NextResponse.json(
    {
      id,
      amount,
      destination,
      status: withdrawal.status,
    },
    { status: 201 }
  );
}

export { withdrawalsById };

