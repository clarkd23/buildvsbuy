import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { getOrCreateUser } from "@/lib/user";

export async function POST(req: NextRequest) {
  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const body = await req.text();
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event: { type: string; data: { id: string; email_addresses: { email_address: string }[] } };
  try {
    const wh = new Webhook(secret);
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as typeof event;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "user.created") {
    const { id: clerkId, email_addresses } = event.data;
    const email = email_addresses[0]?.email_address ?? "";
    await getOrCreateUser(clerkId, email);
  }

  return NextResponse.json({ ok: true });
}
