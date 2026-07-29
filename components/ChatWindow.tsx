"use client";

import type { ChatThread, Message } from "@/lib/types";
import { formatFullTime } from "@/lib/utils";
import { FormEvent, useEffect, useRef, useState } from "react";

interface ChatWindowProps {
  thread: ChatThread;
  currentUserId: string;
  currentNickname: string;
  onSend: (text: string) => Promise<void>;
  onProposeDeal: () => Promise<void>;
  onAcceptDeal: () => Promise<void>;
  onRejectDeal: () => Promise<void>;
}

export function ChatWindow({
  thread,
  currentUserId,
  currentNickname,
  onSend,
  onProposeDeal,
  onAcceptDeal,
  onRejectDeal,
}: ChatWindowProps) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread.messages.length]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await onSend(text.trim());
      setText("");
    } finally {
      setSending(false);
    }
  }

  const otherParticipant = thread.participants.find((p) => p.id !== currentUserId);
  const isProposer = thread.dealProposedBy === currentUserId;
  const dealStatus = thread.dealStatus;

  return (
    <div className="flex flex-col h-full">
      {/* 채팅 헤더 */}
      <div className="px-4 py-3 border-b border-slate-100 bg-white rounded-t-2xl">
        <p className="text-sm text-slate-500">
          {otherParticipant?.nickname ?? "상대방"} 과의 대화
        </p>
        {dealStatus === "confirmed" && (
          <div className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
            ✅ 거래가 확정됐어요!
          </div>
        )}
        {dealStatus === "proposed" && (
          <div className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-sm">
            <p className="font-semibold text-amber-700">
              {isProposer ? "거래 확정을 요청했습니다. 상대방의 응답을 기다려주세요." : "거래 확정 요청이 왔어요!"}
            </p>
            {!isProposer && (
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white"
                  onClick={onAcceptDeal}
                >
                  수락
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600"
                  onClick={onRejectDeal}
                >
                  거절
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {thread.messages.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-8">
            대화를 시작해 보세요!
          </p>
        )}
        {thread.messages.map((msg: Message) => {
          const isMine = msg.senderId === currentUserId;
          return (
            <div
              key={msg.id}
              className={`flex flex-col gap-1 ${isMine ? "items-end" : "items-start"}`}
            >
              {!isMine && (
                <span className="text-xs text-slate-400 px-1">{msg.senderNickname}</span>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  isMine
                    ? "bg-poke-red text-white rounded-br-sm"
                    : "bg-white border border-slate-100 text-slate-800 rounded-bl-sm"
                }`}
              >
                {msg.text}
              </div>
              <span className="text-xs text-slate-300 px-1">
                {formatFullTime(msg.createdAt)}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* 거래 확정 제안 버튼 */}
      {dealStatus === "none" && (
        <div className="px-4 pt-2">
          <button
            type="button"
            className="w-full rounded-xl border border-emerald-200 bg-emerald-50 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
            onClick={onProposeDeal}
          >
            🤝 거래 확정 요청하기
          </button>
        </div>
      )}

      {/* 메시지 입력 */}
      {dealStatus !== "confirmed" && (
        <form onSubmit={handleSend} className="flex gap-2 px-4 py-3">
          <input
            className="input flex-1 py-2"
            placeholder="메시지 입력..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="rounded-xl bg-poke-red px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            전송
          </button>
        </form>
      )}
      {dealStatus === "confirmed" && (
        <div className="px-4 py-3 text-center text-sm text-slate-400">
          거래가 확정됐어요. 게임에서 만나요! 🎮
        </div>
      )}
    </div>
  );
}
