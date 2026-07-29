import { NextResponse } from "next/server";
import { findOrCreateThread, getPost } from "@/lib/store";
import type { StartThreadRequest } from "@/lib/types";

type Params = { params: { postId: string } };

export async function POST(request: Request, { params }: Params) {
  const body = (await request.json()) as StartThreadRequest;

  const post = await getPost(params.postId);
  if (!post) {
    return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });
  }
  if (post.status !== "open") {
    return NextResponse.json({ error: "이미 마감된 게시글입니다." }, { status: 400 });
  }
  if (post.authorId === body.initiatorId) {
    return NextResponse.json({ error: "자신의 게시글에는 거래 요청을 보낼 수 없습니다." }, { status: 400 });
  }

  const thread = await findOrCreateThread(
    params.postId,
    { id: body.initiatorId, nickname: body.initiatorNickname },
    { id: post.authorId, nickname: post.authorNickname },
  );

  return NextResponse.json({ thread });
}
