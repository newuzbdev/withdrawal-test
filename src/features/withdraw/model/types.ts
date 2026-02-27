export type WithdrawalStatus = "pending" | "completed" | "failed";

export interface Withdrawal {
  id: string;
  amount: number;
  destination: string;
  status: WithdrawalStatus;
}

