"use client";

import { useState } from "react";
import { BROTHERS, type Author, type Comment, type Post } from "@/lib/types";

function Avatar({ who }: { who: Author }) {
  return <span className={"ava " + who}>{BROTHERS[who].initial}</span>;
}

function CommentRow({ c, fmtTime }: { c: Comment; fmtTime: (s: string) => string }) {
  return (
    <div className="comment">
      <Avatar who={c.author} />
      <div className="c-body">
        <div className="c-head">
          <b>{BROTHERS[c.author].name}</b> · {fmtTime(c.time)}
        </div>
        <div className="c-text">{c.body}</div>
      </div>
    </div>
  );
}

function CommentBox({
  post,
  currentUser,
  onAdd,
  fmtTime,
}: {
  post: Post;
  currentUser: Author;
  onAdd: (postId: string, body: string) => Promise<void>;
  fmtTime: (s: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      await onAdd(post.id, text.trim());
      setText("");
    } finally {
      setBusy(false);
    }
  }

  if (!open && post.comments.length === 0) {
    return (
      <div style={{ marginTop: 8 }}>
        <button className="btn ghost" onClick={() => setOpen(true)} style={{ padding: "4px 0" }} type="button">
          + reply
        </button>
      </div>
    );
  }
  return (
    <div className="comments">
      {post.comments.map((c) => <CommentRow key={c.id} c={c} fmtTime={fmtTime} />)}
      <div className="add-comment">
        <input
          placeholder={`reply as ${BROTHERS[currentUser].name}…`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
        />
        <button className="btn" disabled={!text.trim() || busy} onClick={submit} type="button">
          send
        </button>
      </div>
    </div>
  );
}

export default function PostView({
  post,
  currentUser,
  onAddComment,
  fmtTime,
}: {
  post: Post;
  currentUser: Author;
  onAddComment: (postId: string, body: string) => Promise<void>;
  fmtTime: (s: string) => string;
}) {
  return (
    <article className="post">
      <div className="head">
        <Avatar who={post.author} />
        <span className="author">{BROTHERS[post.author].name}</span>
        <span className="sep">·</span>
        <span>{fmtTime(post.time)}</span>
        {post.type !== "text" && (
          <>
            <span className="sep">·</span>
            <span className="kind">{post.type}</span>
          </>
        )}
      </div>
      <div className="body">
        {post.type === "text" && post.body && <p>{post.body}</p>}
        {post.type === "quote" && (
          <>
            <div className="quote">&ldquo;{post.body}&rdquo;</div>
            {post.attribution && <div className="quote-by">— {post.attribution}</div>}
          </>
        )}
        {post.type === "link" && post.url && (
          <a className="link-card" href={post.url} target="_blank" rel="noopener noreferrer">
            {post.source && <div className="lc-source">{post.source}</div>}
            <div className="lc-title">{post.title}</div>
            {post.excerpt && <div className="lc-excerpt">{post.excerpt}</div>}
          </a>
        )}
      </div>
      {post.tags.length > 0 && (
        <div className="foot">
          <div className="tags">
            {post.tags.map((t) => <span key={t} className="tag">#{t}</span>)}
          </div>
        </div>
      )}
      <CommentBox post={post} currentUser={currentUser} onAdd={onAddComment} fmtTime={fmtTime} />
    </article>
  );
}
