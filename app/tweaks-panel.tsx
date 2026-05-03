"use client";

import { useState } from "react";

export type Theme = "light" | "dark";
export type Density = "cozy" | "compact";
export type AccentKey = "forest" | "ink" | "rust" | "marine" | "plum";

export type Tweaks = {
  theme: Theme;
  accent: AccentKey;
  density: Density;
};

export const DEFAULT_TWEAKS: Tweaks = {
  theme: "light",
  accent: "forest",
  density: "cozy",
};

export const ACCENTS: Record<
  AccentKey,
  { light: string; dark: string; soft_l: string; soft_d: string }
> = {
  forest: { light: "#2f5d50", dark: "#a4cbb9", soft_l: "#e7eee9", soft_d: "#1f2a25" },
  ink:    { light: "#1c1b18", dark: "#e8e6df", soft_l: "#ececea", soft_d: "#26261f" },
  rust:   { light: "#a0512c", dark: "#e7a37e", soft_l: "#f3e6db", soft_d: "#2a1e16" },
  marine: { light: "#2a4a78", dark: "#9eb6db", soft_l: "#e2e8f1", soft_d: "#1a2030" },
  plum:   { light: "#6b3a64", dark: "#cc9cc4", soft_l: "#efe5ed", soft_d: "#241a23" },
};

export function applyTweaks(t: Tweaks) {
  const root = document.documentElement;
  root.setAttribute("data-theme", t.theme);
  root.setAttribute("data-density", t.density);
  const a = ACCENTS[t.accent];
  if (t.theme === "dark") {
    root.style.setProperty("--accent", a.dark);
    root.style.setProperty("--accent-soft", a.soft_d);
  } else {
    root.style.setProperty("--accent", a.light);
    root.style.setProperty("--accent-soft", a.soft_l);
  }
}

export default function TweaksPanel({
  tweaks,
  onChange,
}: {
  tweaks: Tweaks;
  onChange: (t: Tweaks) => void;
}) {
  const [open, setOpen] = useState(false);
  const set = <K extends keyof Tweaks>(k: K, v: Tweaks[K]) => onChange({ ...tweaks, [k]: v });

  return (
    <div className="tweaks">
      {open && (
        <div className="panel">
          <div className="group">
            <h4>Theme</h4>
            <label>Mode</label>
            <div className="opts">
              {(["light", "dark"] as Theme[]).map((v) => (
                <button key={v} className={tweaks.theme === v ? "on" : ""} onClick={() => set("theme", v)} type="button">
                  {v === "light" ? "Light" : "Dark"}
                </button>
              ))}
            </div>
          </div>
          <div className="group">
            <label>Accent</label>
            <div className="accent-grid">
              {(Object.keys(ACCENTS) as AccentKey[]).map((k) => (
                <button
                  key={k}
                  className={tweaks.accent === k ? "on" : ""}
                  onClick={() => set("accent", k)}
                  title={k}
                  type="button"
                  style={{
                    background: tweaks.theme === "dark" ? ACCENTS[k].dark : ACCENTS[k].light,
                  }}
                />
              ))}
            </div>
          </div>
          <div className="group">
            <h4>Density</h4>
            <div className="opts">
              {(["cozy", "compact"] as Density[]).map((v) => (
                <button key={v} className={tweaks.density === v ? "on" : ""} onClick={() => set("density", v)} type="button">
                  {v === "cozy" ? "Cozy" : "Compact"}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <button className="tweaks-toggle" onClick={() => setOpen(!open)} type="button">
        {open ? "Close" : "Tweaks"}
      </button>
    </div>
  );
}
