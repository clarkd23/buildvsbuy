import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateDiscoveryQuestions } from "@/lib/claude";

export async function POST(req: NextRequest) {
  // AUTH DISABLED — re-enable when ready
  // const { userId } = await auth();
  // if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { problemStatement } = await req.json();
  if (!problemStatement?.trim()) {
    return NextResponse.json({ error: "Problem statement is required" }, { status: 400 });
  }

  try {
    const questions = await generateDiscoveryQuestions(problemStatement);
    return NextResponse.json({ questions });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/questions]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
