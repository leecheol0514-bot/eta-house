import { NextResponse } from "next/server";
import { addMessage, getThread } from "@/lib/store";
import type { SendMessageRequest } from "@/lib/types";

type Params = { params: { threadId: string } };

export async function POST(request: Request, { params }: Params) {
  const body = (await request.json()) as SendMessageRequest;

  const thread = await getThread(params.threadId);
  if (!thread) {
    return NextResponse.json({ error: "스레드를 찾을 수 없습니다." }, { status: 404 });
  }

  const isParticipant = thread.participants.some((p) => p.id === body.senderId);
  if (!isParticipant) {
    return NextResponse.json({ error: "참여자만 메시지를 보낼 수 있습니다." }, { status: 403 });
  }
  if (!body.text?.trim()) {
    return NextResponse.json({ error: "메시지를 입력해 주세요." }, { status: 400 });
  }

  const updated = await addMessage(params.threadId, {
    senderId: body.senderId,
    senderNickname: body.senderNickname,
    text: body.text.trim(),
  });

  return NextResponse.json({ thread: updated });
}
