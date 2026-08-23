import { NextResponse } from "next/server";
import { getUserAccess, getUserFromRequest } from "@/lib/server-auth";

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ active: false }, { status: 401 });
  }

  const access = await getUserAccess(user.id, user.email);
  return NextResponse.json({ ...access, email: user.email });
}
