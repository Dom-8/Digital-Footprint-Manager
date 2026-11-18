# Real connection setup and verified limits

The browser app now supports separate demo, imported and connected data sources. Mastodon integration code is implemented; live OAuth has **not** been verified with an actual user and deployment credentials. Automated tests use mocked provider and storage responses.

## Why you might see “Account connections aren't ready”

The website can be deployed successfully while account connections are still unconfigured. This is an owner setup task, not a problem with the visitor's social account.

Three things are needed:
- **A Mastodon app:** choose the server and register the app to get its client ID and secret.
- **Secure storage:** create private Redis storage and an encryption key so access credentials can stay on the server.
- **The website address:** register the callback URL and add the server settings in Vercel.

The app now keeps variable names under optional technical details. It offers archive import while setup is incomplete, and only shows authorisation when the server reports that configuration is present. Presence alone does not verify that the credentials work.

Private credentials cannot be inferred from the GitHub repository. Add them directly in Vercel; do not paste passwords or secrets into chat. Follow the exact steps below.

## Vercel setup

1. Keep the Vite preset, build command `npm run build`, output `dist`. Vercel discovers `api/connection.mjs` as a server function. GitHub Pages remains usable for demo/import/report features but cannot run OAuth.
2. Choose one trusted Mastodon 4.3+ server. Users must have an account on this configured server. No user-supplied server URLs are fetched.
3. Register an app on that server in Preferences → Development, or through the official [app registration API](https://docs.joinmastodon.org/methods/apps/). Register these scopes exactly: `read:accounts read:statuses`.
4. Register the exact redirect URI `https://YOUR-VERCEL-DOMAIN/api/connection?action=callback`. It must match APP_ORIGIN, including production versus preview domain. Do not use an out-of-band redirect.
5. Create a private Upstash Redis database and obtain its REST URL and token. Session data uses encrypted values with a seven-day expiry; pending OAuth requests expire in ten minutes.
6. Add the variables from `.env.example` in Vercel → Project → Settings → Environment Variables. Generate SESSION_ENCRYPTION_KEY from at least 32 random bytes, e.g. `openssl rand -base64 32`. All variables are server-only; never use VITE_ prefixes or commit values.
7. Redeploy. On Connected Platforms, check status, consent, authorise with Mastodon, then explicitly Load latest posts. The app never asks for a social password.
8. Verify the live journey: cancel consent, reconnect, load multiple pages, inspect scope labels/reports, disconnect, confirm Authorised apps and Redis session deletion. Real-world rate-limit behaviour still needs provider verification.

| Variable | Purpose |
|---|---|
| APP_ORIGIN | Exact production HTTPS origin; no trailing path |
| MASTODON_BASE_URL | Trusted fixed server HTTPS origin |
| MASTODON_CLIENT_ID / MASTODON_CLIENT_SECRET | Registered read-only app |
| SESSION_ENCRYPTION_KEY | High-entropy encryption key; rotate to invalidate stored sessions |
| UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN | Private server-side session store |

## What is retrieved

Authenticated profile ID/handle plus the user's own statuses returned by `GET /api/v1/accounts/:id/statuses`, 40 at a time, excluding boosts, including replies. Text, date, visibility and post link are exposed to the browser. The API can include non-public posts the token is authorised to see: review the consent notice before connecting. No inbox, follower lists, attachments, video transcription, other accounts or deleted posts are collected. Only pages explicitly loaded are in coverage.

Only explicit labelled secret cues and explicit inconsistent-date statements are currently classified in real/imported text. A missing flag is not a clean bill of health. The broader demo rules use authored categories and are clearly labelled. No external AI is called.

OAuth uses state bound to an HttpOnly browser cookie, one-use Redis GETDEL, S256 PKCE, exact registered redirect, fixed HTTPS upstreams, short request timeouts and no redirects on upstream fetches. Tokens and account metadata are encrypted with AES-256-GCM in Redis; the browser receives only an opaque secure HttpOnly SameSite session cookie. Tokens are never returned to frontend code or logged. POST disconnect checks Origin and a custom request header. Rate limits preserve loaded posts and show a retry delay. Pagination accepts only numeric cursors on the fixed account endpoint.

Disconnect attempts token revocation and deletes the local Redis session even when revocation fails. The UI then instructs the user to revoke the app on Mastodon manually. Loaded posts and connected review decisions are deleted. Session expiry alone removes app storage but does not revoke Mastodon's non-expiring token; use Authorised apps to revoke it. Browser-local imports have a separate delete action. Resetting demo data is not a replacement for disconnecting a real account.

## Official platform research (17 November 2026)

| Platform | Available access and restrictions | Prototype status |
|---|---|---|
| Mastodon | OAuth code flow; PKCE since 4.3. Read account and own authorised statuses. Server registration and instance policies apply. No central platform paid tier is required by these endpoints; hosting/store costs depend on provider plan. | Genuine server code; credentials and real-account verification outstanding |
| Instagram | Instagram professional (business/creator) accounts; basic business permission and app access level/review affect use beyond app roles. Ordinary personal-account history is not provided by the professional API. | Not implemented |
| TikTok | Login Kit + Display API approval, user.info.basic and video.list; public-video metadata, not arbitrary historical posts/private content. Review includes a demonstration of the use case. | Not implemented |
| LinkedIn | Community Management has approved Development/Standard tiers. r_member_social is closed to new requests in current documentation; basic sign-in is not post-history access. | Not implemented |

Official references:
- [Mastodon OAuth and PKCE](https://docs.joinmastodon.org/spec/oauth/)
- [Mastodon OAuth endpoints and revocation](https://docs.joinmastodon.org/methods/oauth/)
- [Account verification and statuses](https://docs.joinmastodon.org/methods/accounts/)
- [Pagination](https://docs.joinmastodon.org/api/guidelines/) and [rate limits](https://docs.joinmastodon.org/api/rate-limits/)
- [Mastodon archives](https://docs.joinmastodon.org/user/moving/)
- [Instagram account requirements](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/)
- [TikTok Display API setup](https://developers.tiktok.com/docs/en/display-api-get-started)
- [LinkedIn Community Management](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/community-management-overview)

## Import fallback

Download the official Mastodon archive, extract outbox.json and select it in the app. Supports ActivityStreams OrderedCollection / OrderedCollectionPage with orderedItems containing Create activities whose objects are Notes. Up to 5 MB / 5,000 entries. Invalid supported records reject the entire import; unsupported activity types are skipped and the UI states that boosts and media are omitted. Raw HTML is stripped and never rendered. Imports remain in localStorage with explicit source labels. They never represent a live connection.

## Local development

`npm run dev` runs the frontend only. Use a Vercel development environment for the API, with server variables configured. Do not put server variables in frontend Vite environment variables. Backend transport tests run with `npm run test:server`; these mock OAuth and Redis and do not claim real provider access.

## Career assistant

Add server-only `OPENAI_API_KEY` and `OPENAI_MODEL` in Vercel, with `APP_ORIGIN` set to the exact production origin (no trailing slash) and the existing Upstash Redis variables. Redeploy. Use a Responses API compatible model available to your API project. Never use VITE_ for secrets.

The sidebar Career assistant uses the selected role and industry. A submitted question, selected career checklist and up to six recent chat messages are sent to OpenAI. An optional post excerpt is included only after the user selects it and checks the send-post box. Email and account tokens are never included automatically. Answers stay in component memory and clear when the career changes or the panel closes. `store:false` is requested; provider data handling still applies. Five questions per IP per minute and 300 daily requests across the deployment cap usage; upstream billing is required. Redis failures fail closed.

Without configuration, curated role checklists remain available and AI is clearly marked unavailable. Automated tests mock AI and storage; no live paid API call has been verified. API reference: https://developers.openai.com/api/reference/resources/responses/methods/create

### Current interface

The default Career assistant uses local guided chat and does not call `/api/assistant`. No API settings are needed for it. The optional AI endpoint above remains available for future development; configuring it does not turn the guided interface into a live AI chat.
