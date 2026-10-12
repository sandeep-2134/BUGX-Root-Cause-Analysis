import { NextRequest, NextResponse } from "next/server";
import { getOrCreateInvestigation, listAllInvestigations } from "@/lib/serverless-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { repository_url, bug_report, mode } = body;

    if (!repository_url || !bug_report) {
      return NextResponse.json(
        { detail: "Please provide both repository_url and bug_report." },
        { status: 400 }
      );
    }

    const record = getOrCreateInvestigation(repository_url, bug_report, mode || "WHY");

    return NextResponse.json({
      id: record.id,
      status: "started",
      message: "Investigation pipeline initiated."
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to start investigation" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(listAllInvestigations());
}
