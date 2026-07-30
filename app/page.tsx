"use client";

import { getStoredUser, setStoredUser } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const ADMIN_NICKNAME = "필랫";

export default function HomePage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [existing, setExisting] = useState<{ id: string; nickname: string } | null>(null);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    if (user) setExisting(user);
  }, []);

  function handleEnter() {
    const trimmed = nickname.trim();
    if (!trimmed) return;
    // 필랫 닉네임이면 비밀번호 입력창으로
    if (trimmed === ADMIN_NICKNAME) {
      setShowAdminPassword(true);
      return;
    }
    setStoredUser(trimmed);
    router.push("/board");
  }

  async function handleAdminLogin() {
    if (!adminPassword.trim()) return;
    setAdminLoading(true);
    setAdminError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPassword }),
      });
      if (res.ok) {
        setStoredUser(ADMIN_NICKNAME);
        router.push("/admin");
      } else {
        setAdminError("비밀번호가 틀렸어요.");
      }
    } finally {
      setAdminLoading(false);
    }
  }

  function handleContinue() {
    if (existing?.nickname === ADMIN_NICKNAME) {
      router.push("/admin");
      return;
    }
    router.push("/board");
  }

  function handleChangeNickname() {
    setExisting(null);
    setNickname(existing?.nickname ?? "");
    setShowAdminPassword(false);
    setAdminPassword("");
    setAdminError("");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 py-12 gap-8">
      {/* 로고 */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-poke-yellow shadow-lg">
          <span className="text-4xl">⚡</span>
        </div>
        <h1 className="text-3xl font-bold text-poke-red">포켓몬 거래소</h1>
        <p className="mt-2 text-slate-500">
          교환할 포켓몬을 올리고<br />원하는 포켓몬을 가진 트레이너와 거래하세요!
        </p>
      </div>

      {existing ? (
        /* 기존 유저 재방문 */
        <div className="card w-full space-y-4 text-center">
          <p className="text-slate-500 text-sm">반가워요!</p>
          <p className="text-xl font-bold text-slate-800">{existing.nickname}</p>
          <button type="button" className="btn-primary w-full" onClick={handleContinue}>
            {existing.nickname === ADMIN_NICKNAME ? "관리자 대시보드 →" : "게시판 바로가기 →"}
          </button>
          <button
            type="button"
            className="text-sm text-slate-400 underline"
            onClick={handleChangeNickname}
          >
            닉네임 변경
          </button>
        </div>
      ) : showAdminPassword ? (
        /* 관리자 비밀번호 입력 */
        <div className="card w-full space-y-4">
          <div className="flex items-center gap-2">
            <button type="button" className="text-slate-400" onClick={() => { setShowAdminPassword(false); setAdminPassword(""); setAdminError(""); }}>
              ←
            </button>
            <h2 className="font-semibold text-slate-700">관리자 비밀번호</h2>
          </div>
          <input
            className="input"
            type="password"
            placeholder="비밀번호 입력"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
            autoFocus
          />
          {adminError && <p className="text-sm text-red-500">{adminError}</p>}
          <button
            type="button"
            className="btn-primary w-full"
            onClick={handleAdminLogin}
            disabled={!adminPassword.trim() || adminLoading}
          >
            {adminLoading ? "확인 중..." : "입장하기"}
          </button>
        </div>
      ) : (
        /* 닉네임 입력 */
        <div className="card w-full space-y-4">
          <h2 className="font-semibold text-slate-700">닉네임을 입력해 주세요</h2>
          <input
            className="input"
            placeholder="트레이너 이름"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleEnter()}
            maxLength={20}
          />
          <button
            type="button"
            className="btn-primary w-full"
            onClick={handleEnter}
            disabled={!nickname.trim()}
          >
            시작하기
          </button>
        </div>
      )}

      {/* 사용 방법 */}
      <section className="w-full space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">사용 방법</h2>
        <div className="card space-y-3 text-sm text-slate-600">
          <p>1. 닉네임을 정하고 게시판에 입장하세요.</p>
          <p>2. 교환하고 싶은 포켓몬을 게시글로 올리세요.</p>
          <p>3. 마음에 드는 포켓몬에 채팅으로 거래 제안하세요.</p>
          <p>4. 협상 후 거래 확정 버튼으로 약속을 잡으세요!</p>
        </div>
      </section>
    </div>
  );
}
