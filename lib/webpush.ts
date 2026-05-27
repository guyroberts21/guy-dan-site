import webpush from "web-push";
import { deletePushSubscription } from "./db";

export function configurePush(): typeof webpush | null {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:noreply@example.com";
  if (!publicKey || !privateKey) return null;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return webpush;
}

export async function sendPushToSubscriptions(
  subscriptions: { endpoint: string; keys: { p256dh: string; auth: string } }[],
  payload: { title: string; body: string }
): Promise<void> {
  const wp = configurePush();
  if (!wp || subscriptions.length === 0) return;

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await wp.sendNotification(sub as webpush.PushSubscription, JSON.stringify(payload));
      } catch (err: unknown) {
        // Remove expired or invalid subscriptions
        if (err && typeof err === "object" && "statusCode" in err) {
          const status = (err as { statusCode: number }).statusCode;
          if (status === 404 || status === 410) {
            await deletePushSubscription(sub.endpoint).catch(() => {});
          }
        }
      }
    })
  );
}
