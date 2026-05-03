# Guy & Dan

A small shared space for Guy and Dan — current challenge, chronological reflections (thoughts, quotes, links), comments, search.

Next.js 15 + Vercel Postgres. Shared-password gate. Deploys to Vercel.

## Local dev

1. Install deps:
   ```
   npm install
   ```
2. Copy env file and fill it in:
   ```
   cp .env.example .env.local
   ```
   - `SITE_PASSWORD` — the password Guy & Dan type once to enter.
   - `SESSION_SECRET` — any long random string. `openssl rand -hex 32` works.
   - `POSTGRES_URL` — a Postgres connection string. Use a free Neon/Vercel/Supabase DB.
3. (optional) Initialize the schema and seed:
   ```
   npm run db:init
   ```
   The app also self-initializes on first request, so you can skip this.
4. Run:
   ```
   npm run dev
   ```

## Deploy to Vercel

1. Push this directory to a GitHub repo (private is fine).
2. In Vercel, **Add New → Project** and import the repo.
3. **Storage tab → Create → Postgres** (or Neon). Connect it to the project. This sets `POSTGRES_URL` automatically.
4. **Settings → Environment Variables**, add:
   - `SITE_PASSWORD` — the shared password.
   - `SESSION_SECRET` — long random string.
5. Deploy. First page load auto-creates the tables and seeds them.

That's it — visit the URL, type the password, start posting.

## How it works

- The "posting as Guy / Dan" pill in the header (and on the composer) toggles author per click. There's no separate auth per person — the shared password gates the whole site.
- Posts and comments persist in Postgres. The Tweaks panel (theme / accent / density) is stored per-device in `localStorage`.
- Search filters across post bodies, titles, attributions, sources, tags, and replies.
- Sessions last 90 days. The `log out` link in the footer clears the cookie.
