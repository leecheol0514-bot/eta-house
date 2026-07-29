import { NextResponse } from "next/server";
import { getThreadsByMember } from "@/lib/store";

type Params = { params: { userId: string } };

export async function GET(_req: Request, { params }: Params) {
  const threads = await getThreadsByMember(params.userId);
  return NextResponse.json({ threads });
}
