import { ensureSchema, getChallenge, listPosts } from "@/lib/db";
import Feed from "./feed";

export const dynamic = "force-dynamic";

export default async function Home() {
  await ensureSchema();
  const [challenge, posts] = await Promise.all([getChallenge(), listPosts()]);
  return <Feed initialChallenge={challenge} initialPosts={posts} />;
}
