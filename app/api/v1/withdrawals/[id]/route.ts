import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  // Simple mock status response for the requested withdrawal id.
  return NextResponse.json({
    id: params.id,
    amount: 100,
    destination: "USDT wallet",
    status: "pending",
  });
}

