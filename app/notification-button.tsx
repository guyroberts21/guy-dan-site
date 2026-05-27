"use client";

import { useEffect, useState } from "react";
import type { Author } from "@/lib/types";

type State = "loading" | "unsupported" | "denied" | "unsubscribed" | "subscribed";


function BellIcon({ on }: { on: boolean }) {
  return on ? (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export default function NotificationButton({ currentUser }: { currentUser: Author }) {
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }
    navigator.serviceWorker.register("/sw.js").then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setState(sub ? "subscribed" : "unsubscribed");
    }).catch(() => setState("unsupported"));
  }, []);

  async function toggle() {
    if (state === "subscribed") {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
      }
      setState("unsubscribed");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setState("denied");
      return;
    }

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) return;

    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidKey,
    });

    const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ author: currentUser, subscription: json }),
    });
    setState("subscribed");
  }

  if (state === "unsupported") return null;

  const on = state === "subscribed";
  const title =
    state === "subscribed" ? "Notifications on — click to turn off" :
    state === "denied" ? "Notifications blocked in browser settings" :
    state === "loading" ? "Loading…" :
    "Turn on notifications";

  return (
    <button
      className="btn ghost"
      onClick={toggle}
      disabled={state === "loading" || state === "denied"}
      title={title}
      type="button"
      style={{ opacity: on ? 1 : 0.45, padding: "4px 6px", lineHeight: 1 }}
    >
      <BellIcon on={on} />
    </button>
  );
}
