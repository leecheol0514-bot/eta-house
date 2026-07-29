"use client";

import { ChatWindow } from "@/components/ChatWindow";
import type { ChatThread, Post } from "@/lib/types";
import { formatTime, getStoredUser, pokemonLabel } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function ChatsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; nickname: string } | null>(null);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [posts, setPosts] = useState<Record<string, Post>>({});
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const u = getStoredUser();
    if (!u) { router.replace("/"); return; }
    setUser(u);
  }, [router]);

  const fetchThreads = useCallback(async () => {
    const u = getStoredUser();
    if (!u) return;
    const res = await fetch(`/api/users/${u.id}/threads`);
    if (!res.ok) return;
    const data = await res.json();
    const list: ChatThread[] = data.threads;
    setThreads(list);

    // 관련 게시글 정보 일괄 조회
    const uniquePostIds = [...new Set(list.map((t) => t.postId))];
    const postMap: Record<string, Post> = {};
    await Promise.all(
      uniquePostIds.map(async (postId) => {
        const r = await fetch(`/api/posts/${postId}`);
        if (r.ok) { const d = await r.json(); postMap[postId] = d.post; }
      }),
    );
    setPosts(postMap);
  }, []);

  // 활성 스레드 폴링
  const fetchActiveThread = useCallback(async (threadId: string) => {
    const res = await fetch(`/api/threads/${threadId}`);
    if (res.ok) {
      const data = await res.json();
      setThreads((prev) => prev.map((t) => (t.id === threadId ? data.thread : t)));
    }
  }, []);

  useEffect(() => {
    fetchThreads().finally(() => setLoading(false));
  }, [fetchThreads]);

  useEffect(() => {
    if (!activeThreadId) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => fetchActiveThread(activeThreadId), 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeThreadId, fetchActiveThread]);

  const activeThread = threads.find((t) => t.id === activeThreadId);

  async function sendMessage(text: string) {
    if (!user || !activeThreadId) return;
    const res = await fetch(`/api/threads/${activeThreadId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senderId: user.id, senderNickname: user.nickname, text }),
    });
    const data = await res.json();
    if (res.ok) setThreads((prev) => prev.map((t) => (t.id === activeThreadId ? data.thread : t)));
  }

  async function dealAction(action: "propose" | "accept" | "reject") {
    if (!user || !activeThreadId) return;
    const res = await fetch(`/api/threads/${activeThreadId}/deal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId: user.id, action }),
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error); return; }
    setThreads((prev) => prev.map((t) => (t.id === activeThreadId ? data.thread : t)));
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg px-4 py-6 pb-8">
      <header className="mb-6 flex items-center gap-3">
        <Link href="/board" className="text-sm text-slate-400">← 게시판</Link>
        <h1 className="text-xl font-bold text-slate-800">내 채팅</h1>
      </header>

      {loading ? (
        <p className="text-center text-sm text-slate-400 py-12">불러오는 중...</p>
      ) : threads.length === 0 ? (
        <div className="card text-center space-y-3 py-8">
          <p className="text-sm text-slate-400">아직 채팅이 없어요.</p>
          <Link href="/board" className="btn-primary inline-block">게시판에서 거래 찾기</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {/* 스레드 목록 */}
          {threads.map((t) => {
            const relatedPost = posts[t.postId];
            const other = t.participants.find((p) => p.id !== user?.id);
            const lastMsg = t.messages.at(-1);
            const isActive = t.id === activeThreadId;

            return (
              <div key={t.id}>
                <button
                  type="button"
                  className={`w-full card text-left transition ${
                    isActive ? "border-poke-red ring-2 ring-poke-red/20" : "hover:border-slate-300"
                  }`}
                  onClick={() => setActiveThreadId(isActive ? null : t.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-700 text-sm">{other?.nickname ?? "상대방"}</span>
                        {t.dealStatus === "confirmed" && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">✅ 확정</span>
                        )}
                        {t.dealStatus === "proposed" && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">확정 요청</span>
                        )}
                      </div>
                      {relatedPost && (
                        <p className="mt-0.5 text-xs text-slate-400 truncate">
                          {pokemonLabel(relatedPost.offering)} ⇄ {relatedPost.wanting}
                        </p>
                      )}
                      {lastMsg && (
                        <p className="mt-1 text-sm text-slate-500 truncate">{lastMsg.text}</p>
                      )}
                    </div>
                    {lastMsg && (
                      <span className="text-xs text-slate-300 shrink-0">{formatTime(lastMsg.createdAt)}</span>
                    )}
                  </div>
                </button>

                {/* 인라인 채팅 창 */}
                {isActive && (
                  <div className="mt-2 card flex flex-col" style={{ minHeight: "400px" }}>
                    <ChatWindow
                      thread={t}
                      currentUserId={user!.id}
                      currentNickname={user!.nickname}
                      onSend={sendMessage}
                      onProposeDeal={() => dealAction("propose")}
                      onAcceptDeal={() => dealAction("accept")}
                      onRejectDeal={() => dealAction("reject")}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
