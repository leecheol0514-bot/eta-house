"use client";

import type { ChatThread, Notice, Post } from "@/lib/types";
import { formatTime, getStoredUser, pokemonLabel } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Tab = "stats" | "posts" | "threads" | "notice";

interface Stats {
  totalPosts: number;
  openPosts: number;
  confirmedPosts: number;
  todayPosts: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("stats");
  const [stats, setStats] = useState<Stats | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [noticeInput, setNoticeInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedThread, setExpandedThread] = useState<string | null>(null);

  // 관리자 인증 확인
  useEffect(() => {
    const user = getStoredUser();
    if (user?.nickname !== "필랫") {
      router.replace("/");
    }
  }, [router]);

  const fetchAll = useCallback(async () => {
    const [statsRes, postsRes, threadsRes, noticesRes] = await Promise.all([
      fetch("/api/admin/stats"),
      fetch("/api/admin/posts"),
      fetch("/api/admin/threads"),
      fetch("/api/admin/notice"),
    ]);

    if (statsRes.status === 401) { router.replace("/"); return; }

    const [s, p, t, n] = await Promise.all([
      statsRes.json(),
      postsRes.json(),
      threadsRes.json(),
      noticesRes.json(),
    ]);

    if (s.stats) setStats(s.stats);
    if (p.posts) setPosts(p.posts);
    if (t.threads) setThreads(t.threads);
    if (n.notices) setNotices(n.notices);
  }, [router]);

  useEffect(() => {
    fetchAll().finally(() => setLoading(false));
  }, [fetchAll]);

  async function handleDeletePost(postId: string) {
    if (!confirm("게시글을 삭제할까요?")) return;
    const res = await fetch("/api/admin/posts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
    });
    if (res.ok) setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  async function handleAddNotice() {
    if (!noticeInput.trim()) return;
    const res = await fetch("/api/admin/notice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: noticeInput.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      setNotices((prev) => [data.notice, ...prev]);
      setNoticeInput("");
    }
  }

  async function handleDeleteNotice(noticeId: string) {
    const res = await fetch("/api/admin/notice", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noticeId }),
    });
    if (res.ok) setNotices((prev) => prev.filter((n) => n.id !== noticeId));
  }

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center text-slate-400">불러오는 중...</div>
  );

  return (
    <div className="mx-auto min-h-screen max-w-lg px-4 py-6 pb-24">
      {/* 헤더 */}
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-poke-red">관리자 대시보드</h1>
          <p className="text-sm text-slate-400">필랫 전용</p>
        </div>
        <Link href="/board" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
          게시판 →
        </Link>
      </header>

      {/* 탭 */}
      <div className="mb-5 grid grid-cols-4 gap-1 rounded-2xl bg-white p-1 shadow-sm">
        {([["stats", "통계"], ["posts", "게시글"], ["threads", "채팅"], ["notice", "공지"]] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`rounded-xl py-2 text-xs font-semibold transition ${tab === key ? "bg-poke-red text-white" : "text-slate-500 hover:bg-slate-50"}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 통계 */}
      {tab === "stats" && stats && (
        <div className="grid grid-cols-2 gap-3">
          {[
            ["전체 게시글", stats.totalPosts, "📋"],
            ["거래중", stats.openPosts, "🟢"],
            ["거래 확정", stats.confirmedPosts, "✅"],
            ["오늘 등록", stats.todayPosts, "📅"],
          ].map(([label, value, icon]) => (
            <div key={label as string} className="card text-center space-y-1">
              <p className="text-2xl">{icon}</p>
              <p className="text-2xl font-bold text-poke-red">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* 게시글 관리 */}
      {tab === "posts" && (
        <div className="space-y-3">
          {posts.length === 0 ? (
            <p className="card text-center text-sm text-slate-400 py-8">게시글 없음</p>
          ) : posts.map((post) => (
            <div key={post.id} className="card space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-sm font-semibold text-slate-700">{post.authorNickname}</span>
                  <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                    post.status === "open" ? "bg-emerald-100 text-emerald-700"
                    : post.status === "confirmed" ? "bg-blue-100 text-blue-700"
                    : "bg-slate-100 text-slate-500"
                  }`}>{post.status}</span>
                </div>
                <span className="text-xs text-slate-400">{formatTime(post.createdAt)}</span>
              </div>
              <p className="text-sm text-slate-600">
                <span className="font-medium">{pokemonLabel(post.offering)}</span>
                {" ⇄ "}{post.wanting}
              </p>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="rounded-lg bg-red-50 px-3 py-1 text-xs font-medium text-red-500 hover:bg-red-100"
                  onClick={() => handleDeletePost(post.id)}
                >
                  강제 삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 채팅 열람 */}
      {tab === "threads" && (
        <div className="space-y-3">
          {threads.length === 0 ? (
            <p className="card text-center text-sm text-slate-400 py-8">채팅 없음</p>
          ) : threads.map((thread) => {
            const isExpanded = expandedThread === thread.id;
            const lastMsg = thread.messages.at(-1);
            return (
              <div key={thread.id} className="card space-y-2">
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => setExpandedThread(isExpanded ? null : thread.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-700">
                        {thread.participants.map((p) => p.nickname).join(" ↔ ")}
                      </span>
                      {thread.dealStatus === "confirmed" && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">✅ 확정</span>
                      )}
                      {thread.dealStatus === "proposed" && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">확정 요청 중</span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">{thread.messages.length}개</span>
                  </div>
                  {lastMsg && (
                    <p className="mt-1 text-xs text-slate-400 truncate">{lastMsg.text}</p>
                  )}
                </button>

                {isExpanded && (
                  <div className="mt-2 max-h-60 overflow-y-auto space-y-2 border-t border-slate-100 pt-2">
                    {thread.messages.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-2">메시지 없음</p>
                    ) : thread.messages.map((msg) => (
                      <div key={msg.id} className="text-xs">
                        <span className="font-semibold text-slate-600">{msg.senderNickname}: </span>
                        <span className="text-slate-700">{msg.text}</span>
                        <span className="ml-1 text-slate-300">{formatTime(msg.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 공지 관리 */}
      {tab === "notice" && (
        <div className="space-y-4">
          {/* 공지 작성 */}
          <div className="card space-y-3">
            <h3 className="font-semibold text-slate-700">공지 작성</h3>
            <textarea
              className="input min-h-[80px] resize-none"
              placeholder="공지 내용 입력..."
              value={noticeInput}
              onChange={(e) => setNoticeInput(e.target.value)}
            />
            <button
              type="button"
              className="btn-primary w-full"
              onClick={handleAddNotice}
              disabled={!noticeInput.trim()}
            >
              공지 등록
            </button>
          </div>

          {/* 공지 목록 */}
          {notices.length === 0 ? (
            <p className="card text-center text-sm text-slate-400 py-8">등록된 공지 없음</p>
          ) : notices.map((notice) => (
            <div key={notice.id} className="card space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-slate-700 flex-1">{notice.content}</p>
                <button
                  type="button"
                  className="rounded-lg bg-red-50 px-2 py-1 text-xs text-red-500 hover:bg-red-100 shrink-0"
                  onClick={() => handleDeleteNotice(notice.id)}
                >
                  삭제
                </button>
              </div>
              <p className="text-xs text-slate-400">{formatTime(notice.createdAt)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
