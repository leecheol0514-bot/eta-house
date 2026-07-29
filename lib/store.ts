import { redis } from "./redis";
import type { ChatThread, Post } from "./types";

// ─── Redis 키 규칙 ────────────────────────────────────────
// posts:all        → sorted set (score=createdAt, member=postId)
// post:{id}        → hash (Post 객체 JSON)
// thread:{id}      → hash (ChatThread 객체 JSON)
// threads:post:{postId}   → set (threadId 목록)
// threads:user:{userId}   → set (threadId 목록)

const POSTS_KEY = "posts:all";
const postKey = (id: string) => `post:${id}`;
const threadKey = (id: string) => `thread:${id}`;
const threadsByPostKey = (postId: string) => `threads:post:${postId}`;
const threadsByUserKey = (userId: string) => `threads:user:${userId}`;

// ─── Posts ───────────────────────────────────────────────
export async function getAllPosts(): Promise<Post[]> {
  // score 내림차순으로 postId 목록 조회
  const ids = await redis.zrange<string[]>(POSTS_KEY, 0, -1, { rev: true });
  if (!ids || ids.length === 0) return [];

  const posts = await Promise.all(
    ids.map(async (id) => {
      const raw = await redis.get<Post>(postKey(id));
      return raw ?? null;
    }),
  );
  return posts.filter((p): p is Post => p !== null);
}

export async function getPost(id: string): Promise<Post | null> {
  return redis.get<Post>(postKey(id));
}

export async function createPost(
  data: Omit<Post, "id" | "status" | "createdAt" | "updatedAt">,
): Promise<Post> {
  const post: Post = {
    id: crypto.randomUUID(),
    status: "open",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...data,
  };
  await redis.set(postKey(post.id), post);
  await redis.zadd(POSTS_KEY, { score: post.createdAt, member: post.id });
  return post;
}

export async function updatePostStatus(
  id: string,
  status: Post["status"],
): Promise<Post | null> {
  const post = await getPost(id);
  if (!post) return null;
  const updated = { ...post, status, updatedAt: Date.now() };
  await redis.set(postKey(id), updated);
  return updated;
}

export async function deletePost(id: string): Promise<void> {
  await redis.del(postKey(id));
  await redis.zrem(POSTS_KEY, id);
}

// ─── Threads ─────────────────────────────────────────────
export async function getThread(id: string): Promise<ChatThread | null> {
  return redis.get<ChatThread>(threadKey(id));
}

export async function getThreadsByPost(postId: string): Promise<ChatThread[]> {
  const ids = await redis.smembers<string[]>(threadsByPostKey(postId));
  if (!ids || ids.length === 0) return [];
  const threads = await Promise.all(ids.map((id) => redis.get<ChatThread>(threadKey(id))));
  return threads
    .filter((t): t is ChatThread => t !== null)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export async function getThreadsByMember(memberId: string): Promise<ChatThread[]> {
  const ids = await redis.smembers<string[]>(threadsByUserKey(memberId));
  if (!ids || ids.length === 0) return [];
  const threads = await Promise.all(ids.map((id) => redis.get<ChatThread>(threadKey(id))));
  return threads
    .filter((t): t is ChatThread => t !== null)
    .sort((a, b) => {
      const aLast = a.messages.at(-1)?.createdAt ?? a.createdAt;
      const bLast = b.messages.at(-1)?.createdAt ?? b.createdAt;
      return bLast - aLast;
    });
}

export async function findOrCreateThread(
  postId: string,
  initiator: { id: string; nickname: string },
  postAuthor: { id: string; nickname: string },
): Promise<ChatThread> {
  // 기존 스레드 재사용 여부 확인
  const existingIds = await redis.smembers<string[]>(threadsByPostKey(postId));
  for (const id of existingIds ?? []) {
    const t = await redis.get<ChatThread>(threadKey(id));
    if (
      t &&
      t.participants.some((p) => p.id === initiator.id) &&
      t.participants.some((p) => p.id === postAuthor.id)
    ) {
      return t;
    }
  }

  const thread: ChatThread = {
    id: crypto.randomUUID(),
    postId,
    participants: [initiator, postAuthor],
    messages: [],
    dealStatus: "none",
    createdAt: Date.now(),
  };

  await redis.set(threadKey(thread.id), thread);
  await redis.sadd(threadsByPostKey(postId), thread.id);
  await redis.sadd(threadsByUserKey(initiator.id), thread.id);
  await redis.sadd(threadsByUserKey(postAuthor.id), thread.id);

  return thread;
}

export async function addMessage(
  threadId: string,
  message: Omit<ChatThread["messages"][number], "id" | "createdAt">,
): Promise<ChatThread | null> {
  const thread = await getThread(threadId);
  if (!thread) return null;

  const updated: ChatThread = {
    ...thread,
    messages: [
      ...thread.messages,
      { id: crypto.randomUUID(), createdAt: Date.now(), ...message },
    ],
  };
  await redis.set(threadKey(threadId), updated);
  return updated;
}

export async function proposeDeal(
  threadId: string,
  proposerId: string,
): Promise<ChatThread | null> {
  const thread = await getThread(threadId);
  if (!thread || thread.dealStatus !== "none") return thread ?? null;

  const updated: ChatThread = { ...thread, dealStatus: "proposed", dealProposedBy: proposerId };
  await redis.set(threadKey(threadId), updated);
  return updated;
}

export async function acceptDeal(threadId: string): Promise<ChatThread | null> {
  const thread = await getThread(threadId);
  if (!thread || thread.dealStatus !== "proposed") return null;

  const updated: ChatThread = {
    ...thread,
    dealStatus: "confirmed",
    dealConfirmedAt: Date.now(),
  };
  await redis.set(threadKey(threadId), updated);

  // 게시글 상태도 confirmed 로 변경
  await updatePostStatus(thread.postId, "confirmed");

  return updated;
}

export async function rejectDeal(threadId: string): Promise<ChatThread | null> {
  const thread = await getThread(threadId);
  if (!thread || thread.dealStatus !== "proposed") return null;

  const updated: ChatThread = {
    ...thread,
    dealStatus: "none",
    dealProposedBy: undefined,
  };
  await redis.set(threadKey(threadId), updated);
  return updated;
}
