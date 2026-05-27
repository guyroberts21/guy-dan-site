import postgres from "postgres";
import type { Author, Challenge, Comment, Post, PostType } from "./types";

declare global {
  // eslint-disable-next-line no-var
  var __gd_sql: ReturnType<typeof postgres> | undefined;
}

function getSql() {
  if (global.__gd_sql) return global.__gd_sql;
  const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!url) throw new Error("POSTGRES_URL (or DATABASE_URL) is not set.");
  const sql = postgres(url, {
    ssl: "require",
    prepare: false,
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  global.__gd_sql = sql;
  return sql;
}

export async function ensureSchema() {
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS challenge (
      id INT PRIMARY KEY DEFAULT 1,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      started DATE NOT NULL,
      ends DATE NOT NULL,
      set_by TEXT NOT NULL,
      CONSTRAINT challenge_singleton CHECK (id = 1)
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      author TEXT NOT NULL,
      type TEXT NOT NULL,
      time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      body TEXT,
      attribution TEXT,
      title TEXT,
      url TEXT,
      excerpt TEXT,
      source TEXT,
      tags TEXT[] NOT NULL DEFAULT '{}'
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      author TEXT NOT NULL,
      time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      body TEXT NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id TEXT PRIMARY KEY,
      author TEXT NOT NULL,
      endpoint TEXT NOT NULL UNIQUE,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS posts_time_idx ON posts (time DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS comments_post_id_idx ON comments (post_id)`;
}

function isoDate(v: unknown): string {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "string") return v.slice(0, 10);
  return String(v);
}

function isoTime(v: unknown): string {
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "string") return new Date(v).toISOString();
  return String(v);
}

export async function getChallenge(): Promise<Challenge | null> {
  const sql = getSql();
  const rows = await sql<{ title: string; body: string; started: Date; ends: Date; set_by: string }[]>`
    SELECT title, body, started, ends, set_by FROM challenge WHERE id = 1
  `;
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    title: r.title,
    body: r.body,
    started: isoDate(r.started),
    ends: isoDate(r.ends),
    setBy: r.set_by as Author,
  };
}

export async function setChallenge(c: Challenge): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO challenge (id, title, body, started, ends, set_by)
    VALUES (1, ${c.title}, ${c.body}, ${c.started}, ${c.ends}, ${c.setBy})
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      body = EXCLUDED.body,
      started = EXCLUDED.started,
      ends = EXCLUDED.ends,
      set_by = EXCLUDED.set_by
  `;
}

type PostRow = {
  id: string; author: string; type: string; time: Date;
  body: string | null; attribution: string | null;
  title: string | null; url: string | null;
  excerpt: string | null; source: string | null;
  tags: string[] | null;
};
type CommentRow = {
  id: string; post_id: string; author: string; time: Date; body: string;
};

export async function listPosts(): Promise<Post[]> {
  const sql = getSql();
  const posts = await sql<PostRow[]>`
    SELECT id, author, type, time, body, attribution, title, url, excerpt, source, tags
    FROM posts ORDER BY time DESC
  `;
  if (posts.length === 0) return [];
  const ids = posts.map((p) => p.id);
  const comments = await sql<CommentRow[]>`
    SELECT id, post_id, author, time, body FROM comments
    WHERE post_id IN ${sql(ids)} ORDER BY time ASC
  `;

  const byPost = new Map<string, Comment[]>();
  for (const c of comments) {
    const arr = byPost.get(c.post_id) ?? [];
    arr.push({
      id: c.id,
      author: c.author as Author,
      time: isoTime(c.time),
      body: c.body,
    });
    byPost.set(c.post_id, arr);
  }
  return posts.map((p) => ({
    id: p.id,
    author: p.author as Author,
    type: p.type as PostType,
    time: isoTime(p.time),
    body: p.body ?? undefined,
    attribution: p.attribution ?? undefined,
    title: p.title ?? undefined,
    url: p.url ?? undefined,
    excerpt: p.excerpt ?? undefined,
    source: p.source ?? undefined,
    tags: p.tags ?? [],
    comments: byPost.get(p.id) ?? [],
  }));
}

export async function insertPost(p: Post): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO posts (id, author, type, time, body, attribution, title, url, excerpt, source, tags)
    VALUES (
      ${p.id}, ${p.author}, ${p.type}, ${p.time},
      ${p.body ?? null}, ${p.attribution ?? null},
      ${p.title ?? null}, ${p.url ?? null},
      ${p.excerpt ?? null}, ${p.source ?? null},
      ${p.tags}
    )
  `;
}

export async function insertComment(postId: string, c: Comment): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO comments (id, post_id, author, time, body)
    VALUES (${c.id}, ${postId}, ${c.author}, ${c.time}, ${c.body})
  `;
}

type PushSubRow = { id: string; author: string; endpoint: string; p256dh: string; auth: string };

export async function savePushSubscription(author: Author, sub: { endpoint: string; keys: { p256dh: string; auth: string } }): Promise<void> {
  const sql = getSql();
  const id = "ps" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  await sql`
    INSERT INTO push_subscriptions (id, author, endpoint, p256dh, auth)
    VALUES (${id}, ${author}, ${sub.endpoint}, ${sub.keys.p256dh}, ${sub.keys.auth})
    ON CONFLICT (endpoint) DO UPDATE SET author = EXCLUDED.author, p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth
  `;
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  const sql = getSql();
  await sql`DELETE FROM push_subscriptions WHERE endpoint = ${endpoint}`;
}

export async function getPushSubscriptionsFor(author: Author): Promise<{ endpoint: string; keys: { p256dh: string; auth: string } }[]> {
  const sql = getSql();
  const rows = await sql<PushSubRow[]>`SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE author = ${author}`;
  return rows.map((r) => ({ endpoint: r.endpoint, keys: { p256dh: r.p256dh, auth: r.auth } }));
}

export async function updatePost(id: string, fields: {
  body?: string;
  attribution?: string;
  title?: string;
  url?: string;
  excerpt?: string;
  source?: string;
}): Promise<void> {
  const sql = getSql();
  await sql`
    UPDATE posts SET
      body = ${fields.body ?? null},
      attribution = ${fields.attribution ?? null},
      title = ${fields.title ?? null},
      url = ${fields.url ?? null},
      excerpt = ${fields.excerpt ?? null},
      source = ${fields.source ?? null}
    WHERE id = ${id}
  `;
}

export async function updateComment(id: string, body: string): Promise<void> {
  const sql = getSql();
  await sql`UPDATE comments SET body = ${body} WHERE id = ${id}`;
}

export async function postsCount(): Promise<number> {
  const sql = getSql();
  const rows = await sql<{ n: number }[]>`SELECT COUNT(*)::int AS n FROM posts`;
  return rows[0].n;
}
