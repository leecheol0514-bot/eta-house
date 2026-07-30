import { NextResponse } from "next/server";
import { getAllThreads } from "@/lib/store";
import { cookies } from "next/headers";

function isAdmin() {
  const session = cookies().get("admin_session")?.value;
  return session === process.env.ADMIN_PASSWORD;
}

// GET /api/admin/threads - 전체 채팅 조회
export async function GET() {
  if (!isAdmin()) return NextResponse.json({ error: "권한 없음" }, { status: 401 });
  const threads = await getAllThreads();
  return NextResponse.json({ threads });
}
