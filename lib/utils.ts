const NICKNAME_KEY = "eta-nickname";
const USER_ID_KEY = "eta-user-id";

// ─── 사용자 정보 (localStorage) ──────────────────────────
export function getStoredUser(): { id: string; nickname: string } | null {
  if (typeof window === "undefined") return null;
  const id = localStorage.getItem(USER_ID_KEY);
  const nickname = localStorage.getItem(NICKNAME_KEY);
  if (!id || !nickname) return null;
  return { id, nickname };
}

export function setStoredUser(nickname: string): { id: string; nickname: string } {
  const existing = localStorage.getItem(USER_ID_KEY);
  const id = existing ?? crypto.randomUUID();
  localStorage.setItem(USER_ID_KEY, id);
  localStorage.setItem(NICKNAME_KEY, nickname);
  return { id, nickname };
}

export function clearStoredUser() {
  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(NICKNAME_KEY);
}

// ─── 시간 포맷 ────────────────────────────────────────────
export function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60_000) return "방금 전";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}분 전`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}시간 전`;

  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
}

export function formatFullTime(timestamp: number): string {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
}

// ─── 채팅 읽음 처리 (localStorage) ──────────────────────
const readKey = (threadId: string) => `eta-read-${threadId}`;

export function markThreadRead(threadId: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(readKey(threadId), String(Date.now()));
}

export function getThreadLastRead(threadId: string): number {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(readKey(threadId)) ?? 0);
}

export function countUnread(
  threads: { id: string; messages: { senderId: string; createdAt: number }[] }[],
  myUserId: string,
): number {
  return threads.filter((t) => {
    const lastRead = getThreadLastRead(t.id);
    // 내가 보낸 메시지 제외, 읽은 시간 이후 상대방 메시지가 있으면 unread
    return t.messages.some(
      (m) => m.senderId !== myUserId && m.createdAt > lastRead,
    );
  }).length;
}
export function pokemonLabel(p: {
  name: string;
  shiny?: boolean;
  level?: number;
  nature?: string;
}): string {
  const parts: string[] = [];
  if (p.shiny) parts.push("✨");
  parts.push(p.name);
  if (p.level) parts.push(`Lv.${p.level}`);
  if (p.nature) parts.push(`${p.nature}`)
  return parts.join(" ");
}
