import { NextResponse } from "next/server";
import { createPost, getAllPosts } from "@/lib/store";
import type { CreatePostRequest } from "@/lib/types";

export async function GET() {
  const posts = await getAllPosts();
  return NextResponse.json({ posts });
}

export async function POST(request: Request) {
  const body = (await request.json()) as CreatePostRequest;

  if (!body.authorId?.trim() || !body.authorNickname?.trim()) {
    return NextResponse.json({ error: "사용자 정보가 없습니다." }, { status: 400 });
  }
  if (!body.offering?.name?.trim()) {
    return NextResponse.json({ error: "교환할 포켓몬 이름을 입력해 주세요." }, { status: 400 });
  }
  if (!body.wanting?.trim()) {
    return NextResponse.json({ error: "원하는 포켓몬/조건을 입력해 주세요." }, { status: 400 });
  }

  const post = await createPost({
    authorId: body.authorId,
    authorNickname: body.authorNickname,
    offering: {
      name: body.offering.name.trim(),
      level: body.offering.level,
      nature: body.offering.nature?.trim(),
      ability: body.offering.ability?.trim(),
      note: body.offering.note?.trim(),
      shiny: body.offering.shiny ?? false,
    },
    wanting: body.wanting.trim(),
    note: body.note?.trim(),
  });

  return NextResponse.json({ post }, { status: 201 });
}
