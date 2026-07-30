import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { password } = (await request.json()) as { password: string };

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return NextResponse.json({ error: "서버 설정 오류입니다." }, { status: 500 });
  }

  if (password !== adminPassword) {
    return NextResponse.json({ error: "비밀번호가 틀렸습니다." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  // httpOnly 쿠키로 세션 유지 (7일)
  response.cookies.set("admin_session", adminPassword, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return response;
}
