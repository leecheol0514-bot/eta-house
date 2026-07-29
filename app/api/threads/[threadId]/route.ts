import { NextResponse } from "next/server";
import { getThread } from "@/lib/store";

type Params = { params: { threadId: string } };

export async function GET(_req: Request, { params }: Params) {
  const thread = await getThread(params.threadId);
  if (!thread) {
    return NextResponse.json({ error: "스레드를 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json({ thread });
}
