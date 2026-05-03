import type { Post } from "./types";

export const fmtTime = (iso: string): string => {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return Math.floor(diff / 60) + "m";
  if (diff < 86400) return Math.floor(diff / 3600) + "h";
  if (diff < 86400 * 7) return Math.floor(diff / 86400) + "d";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

export const fmtDate = (iso: string): string =>
  new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export const fmtDateShort = (iso: string): string =>
  new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });

export const daysLeft = (endIso: string): string => {
  const end = new Date(endIso);
  const now = new Date();
  const ms = end.getTime() - now.getTime();
  if (ms <= 0) return "wrapping up";
  const d = Math.ceil(ms / (1000 * 60 * 60 * 24));
  return d === 1 ? "1 day left" : d + " days left";
};

export const matchesQuery = (post: Post, q: string): boolean => {
  if (!q) return true;
  const s = q.toLowerCase();
  const haystacks = [
    post.body,
    post.title,
    post.excerpt,
    post.attribution,
    post.source,
    ...(post.tags || []),
    ...(post.comments || []).map((c) => c.body),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystacks.includes(s);
};
