import { NextResponse } from "next/server";
import { deletePost, getPost, getThreadsByPost, updatePostStatus } from "@/lib/store";

type Params = { params: { postId: string } };

export async function GET(_req: Request, { params }: Params) {
  const post = await getPost(params.postId);
  if (!post) {
    return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });
  }
  const threads = await getThreadsByPost(params.postId);
  return NextResponse.json({ post, threads });
}

export async function PATCH(request: Request, { params }: Params) {
  const body = (await request.json()) as { authorId: string; status: "open" | "closed" };
  const post = await getPost(params.postId);
  if (!post) {
    return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });
  }
  if (post.authorId !== body.authorId) {
    return NextResponse.json({ error: "작성자만 수정할 수 있습니다." }, { status: 403 });
  }
  const updated = await updatePostStatus(params.postId, body.status);
  return NextResponse.json({ post: updated });
}

export async function DELETE(request: Request, { params }: Params) {
  const body = (await request.json()) as { authorId: string };
  const post = await getPost(params.postId);
  if (!post) {
    return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });
  }
  if (post.authorId !== body.authorId) {
    return NextResponse.json({ error: "작성자만 삭제할 수 있습니다." }, { status: 403 });
  }
  await deletePost(params.postId);
  return NextResponse.json({ ok: true });
}
