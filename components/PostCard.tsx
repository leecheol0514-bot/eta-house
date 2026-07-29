import type { Post } from "@/lib/types";
import { formatTime, pokemonLabel } from "@/lib/utils";
import Link from "next/link";

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  onDelete?: (postId: string) => void;
  onClose?: (postId: string) => void;
}

const statusConfig = {
  open: { label: "거래중", className: "bg-emerald-100 text-emerald-700" },
  confirmed: { label: "✅ 확정", className: "bg-blue-100 text-blue-700" },
  closed: { label: "마감", className: "bg-slate-100 text-slate-500" },
};

export function PostCard({ post, currentUserId, onDelete, onClose }: PostCardProps) {
  const isOwner = currentUserId === post.authorId;
  const status = statusConfig[post.status];

  return (
    <div className="card space-y-3">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-slate-700">{post.authorNickname}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}
          >
            {status.label}
          </span>
        </div>
        <span className="text-xs text-slate-400 shrink-0">{formatTime(post.createdAt)}</span>
      </div>

      {/* 포켓몬 정보 */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl bg-red-50 p-3">
          <p className="mb-1 text-xs font-medium text-red-500 uppercase tracking-wide">줄게요</p>
          <p className="font-bold text-slate-800">{pokemonLabel(post.offering)}</p>
          {post.offering.ability && (
            <p className="text-xs text-slate-500 mt-0.5">{post.offering.ability}</p>
          )}
        </div>
        <div className="rounded-xl bg-blue-50 p-3">
          <p className="mb-1 text-xs font-medium text-blue-500 uppercase tracking-wide">원해요</p>
          <p className="font-bold text-slate-800">{post.wanting}</p>
        </div>
      </div>

      {/* 메모 */}
      {post.note && (
        <p className="text-sm text-slate-500 px-1">💬 {post.note}</p>
      )}

      {/* 액션 버튼 */}
      <div className="flex items-center justify-between pt-1">
        {isOwner ? (
          <div className="flex gap-2">
            {post.status === "open" && onClose && (
              <button
                type="button"
                className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
                onClick={() => onClose(post.id)}
              >
                마감
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-100"
                onClick={() => onDelete(post.id)}
              >
                삭제
              </button>
            )}
          </div>
        ) : (
          post.status === "open" && (
            <Link
              href={`/board/${post.id}`}
              className="rounded-lg bg-poke-yellow px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-yellow-400"
            >
              채팅으로 제안하기 →
            </Link>
          )
        )}
        {post.status !== "open" && !isOwner && (
          <span className="text-xs text-slate-400">{status.label}</span>
        )}
        {isOwner && (
          <Link
            href={`/board/${post.id}`}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            상세 보기 →
          </Link>
        )}
      </div>
    </div>
  );
}
