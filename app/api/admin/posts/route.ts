import { NextResponse } from "next/server";
import { deletePost, getAllPosts } from "@/lib/store";
import { cookies } from "next/headers";

function isAdmin() {
  const session = cookies().get("admin_session")?.value;
  return session === process.env.ADMIN_PASSWORD;
}

// GET /api/admin/posts - 전체 게시글 조회
export async function GET() {
  if (!isAdmin()) return NextResponse.json({ error: "권한 없음" }, { status: 401 });
  const posts = await getAllPosts();
  return NextResponse.json({ posts });
}

// DELETE /api/admin/posts - 게시글 강제 삭제
export async function DELETE(request: Request) {
  if (!isAdmin()) return NextResponse.json({ error: "권한 없음" }, { status: 401 });
  const { postId } = (await request.json()) as { postId: string };
  await deletePost(postId);
  return NextResponse.json({ ok: true });
}
