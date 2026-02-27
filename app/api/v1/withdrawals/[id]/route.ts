import { NextResponse, type NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  return NextResponse.json({
    id,
    amount: 100,
    destination: "USDT wallet",
    status: "pending",
  });
}

