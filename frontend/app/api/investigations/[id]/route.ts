import { NextRequest, NextResponse } from "next/server";
import { getInvestigationById } from "@/lib/serverless-store";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const record = getInvestigationById(id);

  if (!record) {
    return NextResponse.json({ detail: `Investigation '${id}' not found.` }, { status: 404 });
  }

  return NextResponse.json(record);
}
