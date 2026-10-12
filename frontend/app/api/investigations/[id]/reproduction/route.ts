import { NextRequest, NextResponse } from "next/server";
import { getInvestigationById } from "@/lib/serverless-store";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const record = getInvestigationById(params.id);
  if (!record) {
    return NextResponse.json({ detail: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ reproduction_result: record.reproduction_result || null });
}
