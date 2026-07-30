"use client";

import { CreatePostForm } from "@/components/CreatePostForm";
import { PostCard } from "@/components/PostCard";
import type { ChatThread, CreatePostRequest, Notice, Post } from "@/lib/types";
import { countUnread, formatTime, getStoredUser } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Filter = "all" | "open" | "mine";
type PostFormData = Omit<CreatePostRequest, "authorId" | "authorNickname">;

export default function BoardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; nickname: string } | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    const u = getStoredUser();
    if (!u) {
      router.replace("/");
      return;
    }
    setUser(u);
  }, [router]);

  const fetchPosts = useCallback(async () => {
    const res = await fetch("/api/posts");
    const data = await res.json();
    if (res.ok) setPosts(data.posts);
  }, []);

  const fetchNotices = useCallback(async () => {
    const res = await fetch("/api/admin/notice");
    const data = await res.json();
    if (res.ok) setNotices(data.notices);
  }, []);

  const fetchUnread = useCallback(async () => {
    const u = getStoredUser();
    if (!u) return;
    const res = await fetch(`/api/users/${u.id}/threads`);
    if (!res.ok) return;
    const data = await res.json();
    setUnreadCount(countUnread(data.threads as ChatThread[], u.id));
  }, []);

  useEffect(() => {
    Promise.all([fetchPosts(), fetchNotices(), fetchUnread()]).finally(() => setLoading(false));
    const interval = setInterval(() => { fetchPosts(); fetchUnread(); }, 10_000);
    return () => clearInterval(interval);
  }, [fetchPosts, fetchNotices, fetchUnread]);

  async function handleCreate(data: PostFormData) {
    if (!user) return;
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, authorId: user.id, authorNickname: user.nickname }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    setPosts((prev) => [json.post, ...prev]);
    setShowForm(false);
  }

  async function handleDelete(postId: string) {
    if (!user) return;
    if (!confirm("게시글을 삭제할까요?")) return;
    const res = await fetch(`/api/posts/${postId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authorId: user.id }),
    });
    if (res.ok) setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  async function handleClose(postId: string) {
    if (!user) return;
    const res = await fetch(`/api/posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authorId: user.id, status: "closed" }),
    });
    const json = await res.json();
    if (res.ok) setPosts((prev) => prev.map((p) => (p.id === postId ? json.post : p)));
  }

  const filtered = posts.filter((p) => {
    if (filter === "open") return p.status === "open";
    if (filter === "mine") return p.authorId === user?.id;
    return true;
  });

  return (
    <div className="mx-auto min-h-screen max-w-lg px-4 py-6 pb-24">
      {/* 헤더 */}
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-poke-red">포켓몬 거래소</h1>
          {user && (
            <p className="mt-0.5 text-sm text-slate-500">
              <span className="font-semibold text-slate-700">{user.nickname}</span> 트레이너
            </p>
          )}
        </div>
        <Link
          href="/chats"
          className="relative rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50"
        >
          💬 내 채팅
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-poke-red px-1 text-xs font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>
      </header>

      {/* 공지 */}
      {notices.length > 0 && (
        <div className="mb-5 space-y-2">
          {notices.map((notice) => (
            <div key={notice.id} className="rounded-xl bg-poke-yellow/20 border border-poke-yellow px-4 py-3">
              <div className="flex items-start gap-2">
                <span className="text-sm">📢</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{notice.content}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{formatTime(notice.createdAt)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 게시글 등록 버튼 / 폼 */}
      {!showForm ? (
        <button
          type="button"
          className="btn-primary w-full mb-5"
          onClick={() => setShowForm(true)}
        >
          + 내 포켓몬 올리기
        </button>
      ) : (
        <div className="mb-5">
          <CreatePostForm
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* 필터 탭 */}
      <div className="mb-4 grid grid-cols-3 gap-1 rounded-2xl bg-white p-1 shadow-sm">
        {(["all", "open", "mine"] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            className={`rounded-xl py-2 text-sm font-semibold transition ${
              filter === f ? "bg-poke-red text-white" : "text-slate-500 hover:bg-slate-50"
            }`}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "전체" : f === "open" ? "거래중" : "내 글"}
          </button>
        ))}
      </div>

      {/* 게시글 목록 */}
      {loading ? (
        <p className="text-center text-sm text-slate-400 py-12">불러오는 중...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-sm text-slate-400 py-12">
          {filter === "mine" ? "아직 올린 게시글이 없어요." : "게시글이 없어요. 첫 번째로 올려보세요!"}
        </p>
      ) : (
        <div className="space-y-4">
          {filtered.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={user?.id}
              onDelete={handleDelete}
              onClose={handleClose}
            />
          ))}
        </div>
      )}
    </div>
  );
}
