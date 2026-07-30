"use client";

import { ChatWindow } from "@/components/ChatWindow";
import type { ChatThread, Post } from "@/lib/types";
import { formatTime, getStoredUser, markThreadRead, pokemonLabel } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface PageProps {
  params: { postId: string };
}

export default function PostDetailPage({ params }: PageProps) {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; nickname: string } | null>(null);
  const [post, setPost] = useState<Post | null>(null);
  const [thread, setThread] = useState<ChatThread | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const u = getStoredUser();
    if (!u) { router.replace("/"); return; }
    setUser(u);
  }, [router]);

  // 게시글 조회
  const fetchPost = useCallback(async () => {
    const res = await fetch(`/api/posts/${params.postId}`);
    if (!res.ok) { setError("게시글을 찾을 수 없습니다."); return; }
    const data = await res.json();
    setPost(data.post);
    // 내 스레드 찾기
    const u = getStoredUser();
    if (u) {
      const myThread = (data.threads as ChatThread[]).find(
        (t) => t.participants.some((p) => p.id === u.id),
      );
      if (myThread) setThread(myThread);
    }
  }, [params.postId]);

  // 스레드 폴링
  const fetchThread = useCallback(async (threadId: string) => {
    const res = await fetch(`/api/threads/${threadId}`);
    if (res.ok) {
      const data = await res.json();
      setThread(data.thread);
    }
  }, []);

  useEffect(() => {
    fetchPost().finally(() => setLoading(false));
  }, [fetchPost]);

  useEffect(() => {
    if (!thread) return;
    markThreadRead(thread.id);
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => fetchThread(thread.id), 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [thread?.id, fetchThread]);

  // 채팅 시작 (스레드 생성 or 재사용)
  async function startChat() {
    if (!user || !post) return;
    setStarting(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/threads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id, initiatorId: user.id, initiatorNickname: user.nickname }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setThread(data.thread);
    } catch (err) {
      alert(err instanceof Error ? err.message : "채팅 시작 실패");
    } finally {
      setStarting(false);
    }
  }

  // 메시지 전송
  async function sendMessage(text: string, imageUrl?: string) {
    if (!user || !thread) return;
    const res = await fetch(`/api/threads/${thread.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senderId: user.id, senderNickname: user.nickname, text, imageUrl }),
    });
    const data = await res.json();
    if (res.ok) setThread(data.thread);
  }

  // 거래 확정 액션
  async function dealAction(action: "propose" | "accept" | "reject") {
    if (!user || !thread) return;
    const res = await fetch(`/api/threads/${thread.id}/deal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId: user.id, action }),
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error); return; }
    setThread(data.thread);
    if (action === "accept") {
      // 게시글 상태도 갱신
      const postRes = await fetch(`/api/posts/${params.postId}`);
      if (postRes.ok) { const d = await postRes.json(); setPost(d.post); }
    }
  }

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center text-slate-400">불러오는 중...</div>
  );
  if (error || !post) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-red-500">{error || "게시글을 찾을 수 없습니다."}</p>
      <Link href="/board" className="btn-primary">게시판으로</Link>
    </div>
  );

  const isOwner = user?.id === post.authorId;
  const statusLabel = { open: "거래중", confirmed: "✅ 확정", closed: "마감" }[post.status];

  return (
    <div className="mx-auto min-h-screen max-w-lg px-4 py-6 pb-8 flex flex-col gap-4">
      {/* 네비 */}
      <div>
        <Link href="/board" className="text-sm text-slate-400">← 게시판</Link>
      </div>

      {/* 게시글 상세 */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-700">{post.authorNickname}</span>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              post.status === "open" ? "bg-emerald-100 text-emerald-700"
              : post.status === "confirmed" ? "bg-blue-100 text-blue-700"
              : "bg-slate-100 text-slate-500"
            }`}>{statusLabel}</span>
            <span className="text-xs text-slate-400">{formatTime(post.createdAt)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-red-50 p-3">
            <p className="mb-1 text-xs font-medium text-red-500 uppercase tracking-wide">줄게요</p>
            <p className="font-bold text-slate-800">{pokemonLabel(post.offering)}</p>
            {post.offering.ability && <p className="text-xs text-slate-500 mt-0.5">{post.offering.ability}</p>}
            {post.offering.note && <p className="text-xs text-slate-400 mt-1">{post.offering.note}</p>}
          </div>
          <div className="rounded-xl bg-blue-50 p-3">
            <p className="mb-1 text-xs font-medium text-blue-500 uppercase tracking-wide">원해요</p>
            <p className="font-bold text-slate-800">{post.wanting}</p>
          </div>
        </div>

        {post.note && <p className="text-sm text-slate-500">💬 {post.note}</p>}
      </div>

      {/* 채팅 영역 */}
      {isOwner ? (
        <div className="card">
          <p className="text-sm font-semibold text-slate-600 mb-3">💬 대화 요청 목록</p>
          {/* 게시글 작성자는 /chats 에서 스레드를 확인 */}
          <p className="text-sm text-slate-400">
            채팅 요청이 오면{" "}
            <Link href="/chats" className="text-poke-red font-semibold">내 채팅</Link>
            {" "}에서 확인할 수 있어요.
          </p>
        </div>
      ) : thread ? (
        <div className="card flex flex-col" style={{ minHeight: "420px" }}>
          <ChatWindow
            thread={thread}
            currentUserId={user!.id}
            currentNickname={user!.nickname}
            onSend={sendMessage}
            onProposeDeal={() => dealAction("propose")}
            onAcceptDeal={() => dealAction("accept")}
            onRejectDeal={() => dealAction("reject")}
          />
        </div>
      ) : post.status === "open" ? (
        <div className="card text-center space-y-3">
          <p className="text-sm text-slate-500">이 포켓몬과 거래하고 싶으신가요?</p>
          <button
            type="button"
            className="btn-primary w-full"
            onClick={startChat}
            disabled={starting}
          >
            {starting ? "연결 중..." : "💬 채팅으로 거래 제안하기"}
          </button>
        </div>
      ) : (
        <div className="card text-center">
          <p className="text-sm text-slate-400">이미 마감된 게시글이에요.</p>
        </div>
      )}
    </div>
  );
}
