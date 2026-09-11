# Vercel deployment

Import `Dayanand-MK/FeedSight-AI` into Vercel with production branch `main`.

| Setting | Value |
|---|---|
| Root directory | `frontend` |
| Framework | Vite |
| Install | `npm ci` |
| Build | `npm run build` |
| Output | `dist` |

Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from the local frontend configuration as Vercel environment variables before deploying. Use only the public publishable/anon key, never a service-role/secret key. Vite embeds these public values at build time; changing them requires redeployment. Do not upload `.env.local` to GitHub.

`frontend/vercel.json` supplies SPA routing and disables stale caching for the service worker. The deployment serves the offline farmer PWA, including the browser FQI model. The optional Python/FastAPI service is retained in the repository but is not deployed by this configuration. Farmer assessment, goals and direct Supabase synchronization do not depend on it.

After deployment, open the HTTPS URL, allow initial caching, then test offline reload. Sign in with a FeedSight user account to test synchronization. Existing localhost IndexedDB records do not automatically move to the new domain: synchronize from localhost, then sign into the same account on the hosted site. For email confirmation/recovery links, configure the hosted URL in the Supabase Auth URL settings.

References: [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite), [Vercel project configuration](https://vercel.com/docs/project-configuration).
