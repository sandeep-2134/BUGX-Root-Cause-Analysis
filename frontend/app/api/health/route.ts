import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    service: "BUGX Next.js Vercel Edge API",
    version: "2.0.0",
    llm_provider: "mock"
  });
}
