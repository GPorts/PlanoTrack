import { NextResponse } from "next/server";
import { getUserFromRequest, linkSubscriptionToUser } from "@/lib/server-auth";

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user?.email) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const linked = await linkSubscriptionToUser(user.id, user.email);
  return NextResponse.json({ ok: true, linked });
}
