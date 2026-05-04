"use client";

import { useState } from "react";
import { BROTHERS, type Author, type Post, type PostType } from "@/lib/types";

function Avatar({ who }: { who: Author }) {
  return <span className={"ava " + who}>{BROTHERS[who].initial}</span>;
}

type Draft = Omit<Post, "id" | "time" | "comments">;

export default function Composer({
  onSubmit,
  currentUser,
  onSwitchUser,
}: {
  onSubmit: (p: Draft) => Promise<void>;
  currentUser: Author;
  onSwitchUser: () => void;
}) {
  const [type, setType] = useState<PostType>("text");
  const [body, setBody] = useState("");
  const [attribution, setAttribution] = useState("");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [source, setSource] = useState("");
  const [busy, setBusy] = useState(false);

  const ready =
    type === "text"
      ? body.trim().length > 0
      : type === "quote"
        ? body.trim().length > 0
        : title.trim().length > 0 && url.trim().length > 0;

  const reset = () => {
    setBody(""); setAttribution(""); setTitle(""); setUrl(""); setExcerpt(""); setSource("");
  };

  async function submit() {
    if (!ready || busy) return;
    setBusy(true);
    try {
      await onSubmit({
        author: currentUser,
        type,
        body: body || undefined,
        attribution: attribution || undefined,
        title: title || undefined,
        url: url || undefined,
        excerpt: excerpt || undefined,
        source: source || undefined,
        tags: [],
      });
      reset();
    } finally {
      setBusy(false);
    }
  }

  const placeholders = {
    text: `What's on your mind, ${BROTHERS[currentUser].name}?`,
    quote: "Paste or type a quote…",
    link: "A short note about this link (optional)",
  };

  return (
    <div className="composer">
      <div className="row">
        <div className="seg">
          {(["text", "quote", "link"] as PostType[]).map((t) => (
            <button
              key={t}
              className={t === type ? "on" : ""}
              onClick={() => setType(t)}
              type="button"
            >
              {t === "text" ? "Thought" : t === "quote" ? "Quote" : "Link"}
            </button>
          ))}
        </div>
      </div>

      {type === "link" && (
        <>
          <input className="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input className="text" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} style={{ marginTop: 6 }} />
          <input className="text" placeholder="Source (e.g. The Marginalian)" value={source} onChange={(e) => setSource(e.target.value)} style={{ marginTop: 6 }} />
          <textarea placeholder={placeholders.link} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} style={{ marginTop: 6, minHeight: 50 }} />
        </>
      )}
      {type === "text" && (
        <textarea placeholder={placeholders.text} value={body} onChange={(e) => setBody(e.target.value)} />
      )}
      {type === "quote" && (
        <>
          <textarea placeholder={placeholders.quote} value={body} onChange={(e) => setBody(e.target.value)} />
          <input className="text" placeholder="attribution (e.g. — Author Name)" value={attribution} onChange={(e) => setAttribution(e.target.value)} style={{ marginTop: 6 }} />
        </>
      )}

      <div className="actions">
        <button className="as pill" onClick={onSwitchUser} title="Switch author" type="button">
          <Avatar who={currentUser} />
          posting as {BROTHERS[currentUser].name}
        </button>
        <div style={{ display: "flex", gap: 6 }}>
          {(body || title) && (
            <button className="btn ghost" onClick={reset} type="button">clear</button>
          )}
          <button className="btn" disabled={!ready || busy} onClick={submit} type="button">
            {busy ? "…" : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
}
