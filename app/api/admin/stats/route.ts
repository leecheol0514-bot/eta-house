import { NextResponse } from "next/server";
import { getStats } from "@/lib/store";
import { cookies } from "next/headers";

function isAdmin() {
  const session = cookies().get("admin_session")?.value;
  return session === process.env.ADMIN_PASSWORD;
}

export async function GET() {
  if (!isAdmin()) return NextResponse.json({ error: "권한 없음" }, { status: 401 });
  const stats = await getStats();
  return NextResponse.json({ stats });
}
