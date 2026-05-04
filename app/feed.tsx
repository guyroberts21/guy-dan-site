"use client";

import { useEffect, useMemo, useState } from "react";
import { BROTHERS, type Author, type Challenge, type Comment, type Post } from "@/lib/types";
import { fmtDate, fmtDateShort, fmtTime, daysLeft, matchesQuery } from "@/lib/format";
import Composer from "./composer";
import PostView from "./post";
import ChallengeBox from "./challenge-box";
import TweaksPanel, { applyTweaks, type Tweaks, DEFAULT_TWEAKS } from "./tweaks-panel";

function Avatar({ who }: { who: Author }) {
  return <span className={"ava " + who}>{BROTHERS[who].initial}</span>;
}

type Filter = "all" | "guy" | "dan" | "text" | "quote" | "link";

export default function Feed({
  initialChallenge,
  initialPosts,
}: {
  initialChallenge: Challenge | null;
  initialPosts: Post[];
}) {
  const [challenge, setChallenge] = useState<Challenge | null>(initialChallenge);
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [user, setUser] = useState<Author>("guy");
  const [tweaks, setTweaks] = useState<Tweaks>(DEFAULT_TWEAKS);

  useEffect(() => {
    const stored = localStorage.getItem("gd_tweaks");
    if (stored) {
      try { setTweaks({ ...DEFAULT_TWEAKS, ...JSON.parse(stored) }); } catch {}
    }
    const storedUser = localStorage.getItem("gd_user");
    if (storedUser === "guy" || storedUser === "dan") setUser(storedUser);
  }, []);

  useEffect(() => {
    applyTweaks(tweaks);
    localStorage.setItem("gd_tweaks", JSON.stringify(tweaks));
  }, [tweaks]);

  useEffect(() => {
    localStorage.setItem("gd_user", user);
  }, [user]);

  const filtered = useMemo(
    () =>
      posts.filter(
        (p) =>
          (filter === "all" || p.author === filter || p.type === filter) &&
          matchesQuery(p, query)
      ),
    [posts, filter, query]
  );

  const grouped = useMemo(() => {
    const groups: { day: string; items: Post[] }[] = [];
    let last: string | null = null;
    for (const p of filtered) {
      const day = new Date(p.time).toDateString();
      if (day !== last) { groups.push({ day, items: [] }); last = day; }
      groups[groups.length - 1].items.push(p);
    }
    return groups;
  }, [filtered]);

  const switchUser = () => setUser(user === "guy" ? "dan" : "guy");

  async function addPost(draft: Omit<Post, "id" | "time" | "comments">) {
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(draft),
    });
    if (!res.ok) throw new Error("Failed to post");
    const { post } = (await res.json()) as { post: Post };
    setPosts((cur) => [post, ...cur]);
  }

  async function addComment(postId: string, body: string) {
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ author: user, body }),
    });
    if (!res.ok) throw new Error("Failed to comment");
    const { comment } = (await res.json()) as { comment: Comment };
    setPosts((cur) =>
      cur.map((p) =>
        p.id === postId ? { ...p, comments: [...p.comments, comment] } : p
      )
    );
  }

  async function editPost(postId: string, fields: Partial<Pick<Post, "body" | "attribution" | "title" | "url" | "excerpt" | "source">>) {
    const res = await fetch(`/api/posts/${postId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(fields),
    });
    if (!res.ok) throw new Error("Failed to edit post");
    setPosts((cur) => cur.map((p) => p.id === postId ? { ...p, ...fields } : p));
  }

  async function editComment(postId: string, commentId: string, body: string) {
    const res = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body }),
    });
    if (!res.ok) throw new Error("Failed to edit comment");
    setPosts((cur) =>
      cur.map((p) =>
        p.id === postId
          ? { ...p, comments: p.comments.map((c) => c.id === commentId ? { ...c, body } : c) }
          : p
      )
    );
  }

  async function saveChallenge(next: Challenge) {
    const res = await fetch("/api/challenge", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(next),
    });
    if (!res.ok) throw new Error("Failed to save challenge");
    setChallenge(next);
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="app">
      <div className="top">
        <div className="brand">Guy <em>&</em> Dan</div>
        <div className="top-right">
          <button className="pill" onClick={switchUser} title="Click to switch">
            <Avatar who={user} />
            {BROTHERS[user].name}
          </button>
        </div>
      </div>

      <div className="search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3-3" />
        </svg>
        <input
          placeholder="Search thoughts, quotes, links, replies…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button className="btn ghost" onClick={() => setQuery("")}>clear</button>
        )}
      </div>

      <ChallengeBox
        challenge={challenge}
        onSave={saveChallenge}
        currentUser={user}
        daysLeft={challenge ? daysLeft(challenge.ends) : ""}
        fmtDate={fmtDate}
      />

      <Composer onSubmit={addPost} currentUser={user} onSwitchUser={switchUser} />

      <div className="feed-head">
        <h3>Reflections</h3>
        <div className="filter">
          {([
            ["all", "all"],
            ["guy", "Guy"],
            ["dan", "Dan"],
            ["text", "thoughts"],
            ["quote", "quotes"],
            ["link", "links"],
          ] as [Filter, string][]).map(([k, l]) => (
            <button
              key={k}
              className={k === filter ? "on" : ""}
              onClick={() => setFilter(k)}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {grouped.length === 0 && (
        <div className="empty">nothing here yet — try a different search.</div>
      )}
      {grouped.map((g) => (
        <div key={g.day}>
          <div className="day">{fmtDateShort(g.items[0].time)}</div>
          {g.items.map((p) => (
            <PostView
              key={p.id}
              post={p}
              currentUser={user}
              onAddComment={addComment}
              onEditPost={editPost}
              onEditComment={editComment}
              fmtTime={fmtTime}
            />
          ))}
        </div>
      ))}

      <footer>
        <span>Guy & Dan · a small shared room</span>
        <span style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <em>kept since April 2026</em>
          <button className="logout" onClick={logout}>log out</button>
        </span>
      </footer>

      <TweaksPanel tweaks={tweaks} onChange={setTweaks} />
    </div>
  );
}
