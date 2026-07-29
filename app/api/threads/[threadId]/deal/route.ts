import { NextResponse } from "next/server";
import { acceptDeal, getThread, proposeDeal, rejectDeal } from "@/lib/store";
import type { DealActionRequest } from "@/lib/types";

type Params = { params: { threadId: string } };

export async function POST(request: Request, { params }: Params) {
  const body = (await request.json()) as DealActionRequest;

  const thread = await getThread(params.threadId);
  if (!thread) {
    return NextResponse.json({ error: "스레드를 찾을 수 없습니다." }, { status: 404 });
  }

  const isParticipant = thread.participants.some((p) => p.id === body.memberId);
  if (!isParticipant) {
    return NextResponse.json({ error: "참여자만 거래 확정을 요청할 수 있습니다." }, { status: 403 });
  }

  if (body.action === "propose") {
    if (thread.dealStatus !== "none") {
      return NextResponse.json({ error: "이미 거래 확정 요청이 있습니다." }, { status: 400 });
    }
    const updated = await proposeDeal(params.threadId, body.memberId);
    return NextResponse.json({ thread: updated });
  }

  if (body.action === "accept") {
    if (thread.dealStatus !== "proposed") {
      return NextResponse.json({ error: "거래 확정 요청이 없습니다." }, { status: 400 });
    }
    if (thread.dealProposedBy === body.memberId) {
      return NextResponse.json({ error: "상대방이 수락해야 합니다." }, { status: 403 });
    }
    const updated = await acceptDeal(params.threadId);
    return NextResponse.json({ thread: updated });
  }

  if (body.action === "reject") {
    if (thread.dealStatus !== "proposed") {
      return NextResponse.json({ error: "거래 확정 요청이 없습니다." }, { status: 400 });
    }
    const updated = await rejectDeal(params.threadId);
    return NextResponse.json({ thread: updated });
  }

  return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
}
