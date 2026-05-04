"use client";

import { useState } from "react";
import { BROTHERS, type Author, type Comment, type Post } from "@/lib/types";

function Avatar({ who }: { who: Author }) {
  return <span className={"ava " + who}>{BROTHERS[who].initial}</span>;
}

function CommentRow({
  c,
  currentUser,
  fmtTime,
  onEdit,
}: {
  c: Comment;
  currentUser: Author;
  fmtTime: (s: string) => string;
  onEdit: (commentId: string, body: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(c.body);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      await onEdit(c.id, text.trim());
      setEditing(false);
    } finally {
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <div className="comment">
        <Avatar who={c.author} />
        <div className="c-body">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") { setText(c.body); setEditing(false); }
            }}
            autoFocus
          />
          <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
            <button className="btn" disabled={!text.trim() || busy} onClick={save} type="button">save</button>
            <button className="btn ghost" onClick={() => { setText(c.body); setEditing(false); }} type="button">cancel</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="comment">
      <Avatar who={c.author} />
      <div className="c-body">
        <div className="c-head">
          <b>{BROTHERS[c.author].name}</b> · {fmtTime(c.time)}
          {c.author === currentUser && (
            <button
              className="btn ghost"
              onClick={() => setEditing(true)}
              style={{ marginLeft: 8, padding: "0 4px", fontSize: "0.8em" }}
              type="button"
            >
              edit
            </button>
          )}
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
  onEdit,
  fmtTime,
}: {
  post: Post;
  currentUser: Author;
  onAdd: (postId: string, body: string) => Promise<void>;
  onEdit: (commentId: string, body: string) => Promise<void>;
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
      {post.comments.map((c) => (
        <CommentRow key={c.id} c={c} currentUser={currentUser} fmtTime={fmtTime} onEdit={onEdit} />
      ))}
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
  onEditPost,
  onEditComment,
  fmtTime,
}: {
  post: Post;
  currentUser: Author;
  onAddComment: (postId: string, body: string) => Promise<void>;
  onEditPost: (postId: string, fields: Partial<Pick<Post, "body" | "attribution" | "title" | "url" | "excerpt" | "source">>) => Promise<void>;
  onEditComment: (postId: string, commentId: string, body: string) => Promise<void>;
  fmtTime: (s: string) => string;
}) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(post.body ?? "");
  const [attribution, setAttribution] = useState(post.attribution ?? "");
  const [title, setTitle] = useState(post.title ?? "");
  const [url, setUrl] = useState(post.url ?? "");
  const [source, setSource] = useState(post.source ?? "");
  const [excerpt, setExcerpt] = useState(post.excerpt ?? "");
  const [busy, setBusy] = useState(false);

  function cancelEdit() {
    setBody(post.body ?? "");
    setAttribution(post.attribution ?? "");
    setTitle(post.title ?? "");
    setUrl(post.url ?? "");
    setSource(post.source ?? "");
    setExcerpt(post.excerpt ?? "");
    setEditing(false);
  }

  async function saveEdit() {
    if (busy) return;
    setBusy(true);
    try {
      await onEditPost(post.id, {
        body: body || undefined,
        attribution: attribution || undefined,
        title: title || undefined,
        url: url || undefined,
        source: source || undefined,
        excerpt: excerpt || undefined,
      });
      setEditing(false);
    } finally {
      setBusy(false);
    }
  }

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
        {post.author === currentUser && !editing && (
          <button
            className="btn ghost"
            onClick={() => setEditing(true)}
            style={{ marginLeft: "auto", padding: "2px 6px", fontSize: "0.8em" }}
            type="button"
          >
            edit
          </button>
        )}
      </div>

      {editing ? (
        <div className="body">
          {post.type === "text" && (
            <textarea value={body} onChange={(e) => setBody(e.target.value)} style={{ width: "100%" }} />
          )}
          {post.type === "quote" && (
            <>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} style={{ width: "100%" }} />
              <input
                className="text"
                value={attribution}
                onChange={(e) => setAttribution(e.target.value)}
                placeholder="attribution (e.g. — Author Name)"
                style={{ marginTop: 6 }}
              />
            </>
          )}
          {post.type === "link" && (
            <>
              <input className="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
              <input className="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" style={{ marginTop: 6 }} />
              <input className="text" value={source} onChange={(e) => setSource(e.target.value)} placeholder="Source" style={{ marginTop: 6 }} />
              <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Excerpt" style={{ marginTop: 6, minHeight: 50 }} />
            </>
          )}
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <button className="btn" disabled={busy} onClick={saveEdit} type="button">save</button>
            <button className="btn ghost" onClick={cancelEdit} type="button">cancel</button>
          </div>
        </div>
      ) : (
        <div className="body">
          {post.type === "text" && post.body && <p>{post.body}</p>}
          {post.type === "quote" && (
            <>
              <div className="quote">&ldquo;{post.body}&rdquo;</div>
              {post.attribution && <div className="quote-by">{post.attribution}</div>}
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
      )}

      {post.tags.length > 0 && (
        <div className="foot">
          <div className="tags">
            {post.tags.map((t) => <span key={t} className="tag">#{t}</span>)}
          </div>
        </div>
      )}
      <CommentBox
        post={post}
        currentUser={currentUser}
        onAdd={onAddComment}
        onEdit={(commentId, body) => onEditComment(post.id, commentId, body)}
        fmtTime={fmtTime}
      />
    </article>
  );
}
