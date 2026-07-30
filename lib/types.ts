// ─── 공통 ───────────────────────────────────────────────
export interface Pokemon {
  name: string;
  level?: number;
  nature?: string;
  ability?: string;
  note?: string;
  shiny?: boolean;
}

// ─── 게시글 ──────────────────────────────────────────────
export type PostStatus = "open" | "confirmed" | "closed";

export interface Post {
  id: string;
  authorId: string;
  authorNickname: string;
  offering: Pokemon;      // 내가 줄 포켓몬
  wanting: string;        // 원하는 포켓몬 이름/조건 (자유 텍스트)
  note?: string;          // 추가 설명
  images?: string[];      // Cloudinary 이미지 URL 목록
  status: PostStatus;
  createdAt: number;
  updatedAt: number;
}

// ─── 채팅 ────────────────────────────────────────────────
export interface Message {
  id: string;
  senderId: string;
  senderNickname: string;
  text: string;
  imageUrl?: string;      // 첨부 이미지 URL
  createdAt: number;
}

export type DealStatus = "none" | "proposed" | "confirmed";

export interface ChatThread {
  id: string;
  postId: string;
  participants: { id: string; nickname: string }[];
  messages: Message[];
  dealStatus: DealStatus;
  dealProposedBy?: string;   // 거래 확정 제안한 memberId
  dealConfirmedAt?: number;
  createdAt: number;
}

// ─── API 요청/응답 타입 ──────────────────────────────────
export interface CreatePostRequest {
  authorId: string;
  authorNickname: string;
  offering: Pokemon;
  wanting: string;
  note?: string;
  images?: string[];
}

export interface SendMessageRequest {
  senderId: string;
  senderNickname: string;
  text: string;
  imageUrl?: string;
}

export interface StartThreadRequest {
  postId: string;
  initiatorId: string;
  initiatorNickname: string;
}

export interface DealActionRequest {
  memberId: string;
  action: "propose" | "accept" | "reject";
}

// ─── 공지 ────────────────────────────────────────────────
export interface Notice {
  id: string;
  content: string;
  createdAt: number;
}
