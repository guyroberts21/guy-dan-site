"use client";

import { useState } from "react";
import { BROTHERS, type Author, type Challenge } from "@/lib/types";

const EMPTY_DRAFT: Challenge = {
  title: "",
  body: "",
  started: new Date().toISOString().slice(0, 10),
  ends: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  setBy: "guy",
};

export default function ChallengeBox({
  challenge,
  onSave,
  currentUser,
  daysLeft,
  fmtDate,
}: {
  challenge: Challenge | null;
  onSave: (c: Challenge) => Promise<void>;
  currentUser: Author;
  daysLeft: string;
  fmtDate: (s: string) => string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Challenge>(challenge ?? { ...EMPTY_DRAFT, setBy: currentUser });
  const [busy, setBusy] = useState(false);

  function start() {
    setDraft(challenge ? { ...challenge, setBy: currentUser } : { ...EMPTY_DRAFT, setBy: currentUser });
    setEditing(true);
  }

  async function save() {
    if (!draft.title.trim() || !draft.body.trim()) return;
    setBusy(true);
    try {
      await onSave(draft);
      setEditing(false);
    } finally {
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <section className="challenge">
        <div className="label">
          <span className="dot" />
          <span className="who-set">Editing challenge — saved by {BROTHERS[currentUser].name}</span>
        </div>
        <div className="edit-form">
          <input
            placeholder="title"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
          <textarea
            placeholder="what is it, and why?"
            value={draft.body}
            onChange={(e) => setDraft({ ...draft, body: e.target.value })}
          />
          <div className="edit-row">
            <input
              type="date"
              value={draft.started}
              onChange={(e) => setDraft({ ...draft, started: e.target.value })}
            />
            <input
              type="date"
              value={draft.ends}
              onChange={(e) => setDraft({ ...draft, ends: e.target.value })}
            />
          </div>
          <div className="edit-actions">
            <button className="btn ghost" onClick={() => setEditing(false)} type="button">cancel</button>
            <button className="btn" onClick={save} disabled={busy || !draft.title.trim() || !draft.body.trim()} type="button">
              {busy ? "…" : "save"}
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (!challenge) {
    return (
      <section className="challenge">
        <div className="label">
          <span className="dot" />
          <span className="who-set">No challenge yet</span>
        </div>
        <p style={{ margin: "6px 0 12px" }}>Set a challenge for the two of you to work on.</p>
        <button className="btn" onClick={start} type="button">Set first challenge</button>
      </section>
    );
  }

  return (
    <section className="challenge">
      <div className="label">
        <span className="dot" />
        <span className="who-set">Current challenge · set by {BROTHERS[challenge.setBy].name}</span>
        <span className="left">{daysLeft}</span>
      </div>
      <h2>{challenge.title}</h2>
      <p>{challenge.body}</p>
      <div className="meta">
        <span><b>started</b> {fmtDate(challenge.started)}</span>
        <span><b>ends</b> {fmtDate(challenge.ends)}</span>
        <span style={{ marginLeft: "auto" }}>
          <button className="edit-link" onClick={start} type="button">edit</button>
        </span>
      </div>
    </section>
  );
}
