import { NextResponse } from "next/server";
import { getUserFromRequest, userHasActiveSubscription } from "@/lib/server-auth";

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ active: false }, { status: 401 });
  }

  const active = await userHasActiveSubscription(user.id);
  return NextResponse.json({ active, email: user.email });
}
