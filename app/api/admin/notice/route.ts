import { NextResponse } from "next/server";
import { createNotice, deleteNotice, getNotices } from "@/lib/store";
import { cookies } from "next/headers";

function isAdmin() {
  const session = cookies().get("admin_session")?.value;
  return session === process.env.ADMIN_PASSWORD;
}

// GET /api/admin/notice - 공지 목록
export async function GET() {
  const notices = await getNotices();
  return NextResponse.json({ notices });
}

// POST /api/admin/notice - 공지 등록
export async function POST(request: Request) {
  if (!isAdmin()) return NextResponse.json({ error: "권한 없음" }, { status: 401 });
  const { content } = (await request.json()) as { content: string };
  if (!content?.trim()) return NextResponse.json({ error: "내용을 입력해 주세요." }, { status: 400 });
  const notice = await createNotice(content.trim());
  return NextResponse.json({ notice });
}

// DELETE /api/admin/notice - 공지 삭제
export async function DELETE(request: Request) {
  if (!isAdmin()) return NextResponse.json({ error: "권한 없음" }, { status: 401 });
  const { noticeId } = (await request.json()) as { noticeId: string };
  await deleteNotice(noticeId);
  return NextResponse.json({ ok: true });
}
