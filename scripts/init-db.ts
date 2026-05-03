import { ensureSchema, getChallenge, insertComment, insertPost, postsCount, setChallenge } from "../lib/db";
import { SEED_CHALLENGE, SEED_POSTS } from "../lib/seed";

async function main() {
  if (!process.env.POSTGRES_URL) {
    throw new Error("POSTGRES_URL is not set. Add it to .env.local or your shell.");
  }
  await ensureSchema();
  const existing = await getChallenge();
  if (!existing) await setChallenge(SEED_CHALLENGE);

  const n = await postsCount();
  if (n === 0) {
    for (const p of [...SEED_POSTS].reverse()) {
      await insertPost(p);
      for (const c of p.comments) await insertComment(p.id, c);
    }
    console.log(`Seeded ${SEED_POSTS.length} posts.`);
  } else {
    console.log(`Skipped seeding — ${n} posts already in db.`);
  }
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
