# Digital Footprint Manager

**Your past deserves context. Your future deserves opportunity.**

A career-focused review workspace with separate demo, archive-import and connected-account sources. Demo posts are fictional; imported and connected text is analysed by narrow transparent rules. Mastodon backend code is implemented, but a live account connection requires deployment configuration and has not yet been verified. No employer access.

## Run

Requires Node.js 22 and npm.

```sh
npm install
npm run dev
```

Open the localhost address Vite prints. To create a production bundle:

```sh
npm run build
npm run preview
```

The production files are in `dist/`. Hash-based routing and relative assets support static hosting, including a GitHub Pages subdirectory. The workflow publishes the verified production bundle to GitHub Pages after all engine, build and browser checks pass on `main`. Pull requests run checks without deploying.

## Website deployment

One-time setup: open [Settings → Pages](https://github.com/Dom-8/Digital-Footprint-Manager/settings/pages), then under **Build and deployment → Source** select **GitHub Actions**. The GitHub connector cannot change this repository setting.

After enabling Pages, open [Prototype checks and deployment](https://github.com/Dom-8/Digital-Footprint-Manager/actions/workflows/ci.yml), choose **Run workflow**, select `main`, and run it. If the initial automatic run already failed because Pages was disabled, you can instead rerun its failed jobs.

After **Publish website** succeeds, open https://dom-8.github.io/Digital-Footprint-Manager/. Later pushes to `main` update the website automatically after successful checks. No hosting token or external hosting account is needed. The deployed site uses sample data and stores decisions only in the visitor's browser.

## Context Studio update

- 18 career fields, searchable roles, students/apprentices/graduates, and custom roles with saved descriptions.
- Role responsibilities change relevance, priority, explanation and next actions. Latest-only reassessment displays loading/completion and changed assessments while preserving decisions and overrides.
- Red/amber/blue priority outlines with visible labels/icons; reviewed/dismissed items use neutral grey.
- Current-scope report preview, structured downloadable PDF with repeating table headers/page numbers, CSV and print styles. Review filters transfer directly to reports.
- Mastodon OAuth code flow with state and S256 PKCE, encrypted Redis sessions, read-only account/status retrieval, cursor pagination, rate-limit recovery and revocation/deletion.
- Validated official Mastodon outbox.json imports, processed locally. Separate sources never silently fall back to demo posts.
- Navy, warm white and teal identity, career summary, connection controls and responsive layouts.

**Deployment:** the frontend remains compatible with static hosting. The real connection requires the Vercel backend and all server variables in [.env.example](.env.example). Follow [connection setup and platform restrictions](docs/CONNECTIONS.md). No credentials have been configured by this change. The repository-connected Vercel deployment should rebuild on pushes to main.

## Included

- React, TypeScript, Vite, Tailwind foundation with custom accessible components, Lucide icons, Recharts and React Router.
- Eleven complete navigation pages, responsive sidebar, five-step onboarding and product tour.
- Four fictional personas, 116 individually authored posts (104 initial records and 12 monitoring records), nine demo platforms and eighteen industry profiles.
- Deterministic industry-aware analysis with category relevance, qualitative uncertainty, private visibility and historical timing.
- Context Lens with balanced interpretations, editable context, original versus revised priority, manual overrides and cautious next steps.
- Combinable search, platform, priority, relevance, date, type, category, status and visibility filters; sorting; bulk actions; confirmation; reversible simulated archive/delete.
- State-derived dashboard counts, clickable platform/year charts, chronological history and milestones.
- Industry comparison, readiness checklist, scenario considerations and editable CV/LinkedIn date consistency.
- One bounded demo scan per persona, notification history, simulated frequency preferences and reset.
- Filtered report previews, direct PDF download, CSV export, browser printing and JSON decision export.
- Versioned localStorage with malformed-state recovery, per-persona decisions, light/dark appearance, density and reduced motion preferences.

## Best demonstration route

1. Complete onboarding as **Alex Morgan**, Education, Graduate Teacher.
2. Open **Content Review**, choose High priority, and open the classroom reflection.
3. Read Context Lens and add a note. Notice that a privacy concern remains pending verification.
4. Mark it reviewed. Return to Dashboard and see the unresolved count decrease.
5. Open the historical classroom quotation, add quotation context, and compare original and revised priority.
6. Visit **Industry Analysis** and compare Education with Creative Industries or Trades for the same content.
7. Explore **Historical Timeline**, then tick preparation tasks and align the sample CV/LinkedIn dates.
8. Run **Demo Scan** in Monitoring Centre. Three predefined posts unlock without duplication.
9. Generate a report, export CSV or print to PDF, then refresh to see decisions persist.
10. Switch to Jordan, Taylor or Casey for healthcare, safety and artistic-expression scenarios.

## Architecture

- `src/data.ts`: individually authored post records, personas, industries and category definitions.
- `src/engine.ts`: transparent analysis, scope and metrics.
- `src/store.tsx`: validated persisted state and undo.
- `src/Review.tsx`: filtering, bulk decisions, Context Lens and timeline.
- `src/Dashboard.tsx`: derived charts, priorities and activity.
- `src/Pages.tsx`: complete supporting workspaces.
- `src/components.tsx`: shared cards, accessible native dialogs and selectors.
- `src/App.tsx`, `src/Onboarding.tsx`: shell, routes and introduction.
- `tests/engine.test.ts`: meaningful engine and reconciliation checks.
- `.github/workflows/ci.yml`: tests, TypeScript build and downloadable build artifact.

## Verification

`npm test` covers dataset integrity, industry differences, serious concern handling, review count reconciliation, platform scope, monitoring and reversible hiding. GitHub Actions runs these checks and builds TypeScript/Vite on main pushes.

The [verified source run](https://github.com/Dom-8/Digital-Footprint-Manager/actions/runs/43974275290) passed all four engine tests, strict TypeScript compilation, the Vite production build and an automated Chromium browser journey. Browser checks cover onboarding, context entry, review-count updates, persistence after refresh, every page route, mobile navigation and horizontal-overflow checks at 375px, 768px and 1440px. Dashboard screenshots and the production bundle are available in that run’s artifacts. Human visual review and broader cross-browser testing remain useful.

To repeat the browser checks locally:

```sh
npx playwright install chromium
npm run test:e2e
```

The workflow uses actions with Node.js 24 runtimes. Earlier failed runs were resolved by explicit navigation types and accessible names on review selectors.

## Honest limitations

- Demo analysis uses authored metadata. Real/imported text uses narrow explicit cues. No AI or verified-fact service is called; unflagged content is not verified.
- Monitoring runs only when requested in the open app; frequency preferences are illustrative and create no real scheduled tasks.
- Demo posts are text-based examples, including video/repost labels. Imported/connected media is not downloaded or analysed.
- Context notes are unverified. They can moderate a context-needed item, but never automatically resolve privacy or credential concerns.
- Reports reflect current state and filters; PDF uses jsPDF/AutoTable with pagination. Media, deleted posts and unloaded API pages are not included.
- Persistence is confined to the current browser and origin, without cloud accounts or cross-device sync.
- Undo restores the preceding profile action in the current session; removed samples can also be restored through Content Review.
- Digital identity and Connected Platforms share the same management workspace.
- Optional advanced features such as period-to-period comparisons and desktop quick-review shortcuts are not included.

## Fairness

Review priorities indicate possible manual-review questions. No hiring probabilities, character scores, protected-characteristic categories or invented professional rules are used. Employer practices differ. Historical content, lawful opinions and creative work must be considered with context.

## Checks for this update

`npm test` covers career relevance, source isolation, import validation and filtered report models.
`npm run test:server` exercises mocked OAuth, PKCE, encrypted storage, state replay/tampering, cursor restrictions, rate-limit handling, CSRF rejection and disconnect.
`npm run test:e2e` exercises the existing demo journey and the new picker, saved decisions, priority outlines, source isolation, archive import/delete, connection failure recovery and PDF/CSV downloads.
These automated checks do not verify live Mastodon authorisation or platform permissions. Follow the real-account checklist in docs/CONNECTIONS.md after configuration.

## Clearer navigation and tutorial

The dashboard presents the priority wheel first, with a direct next-review action. Platforms and timeline charts are always visible; chart scopes use buttons, and the dashboard/header contain no selects or disclosure dropdowns. The five primary destinations are Dashboard, Content Review, Accounts & Data, Career & Industry and Reports. Timeline, readiness and monitoring remain under More tools. All previous routes, including the identity alias, remain available.

The sidebar collapses to an icon rail on desktop, remembers its width preference, and becomes a keyboard-contained drawer on mobile. Its motion respects both reduced-motion preferences and the browser setting. Page headers and workspace context use separate, stronger boundaries.

The old multi-step startup configuration and Product Tour are replaced by Tutorial: a short purpose-first welcome, followed by choosing a career, reviewing an actual sample post and seeing the saved decision in Reports. Tutorial progress survives refresh. It temporarily uses demo data, preserves decisions and restores the previous data source when finished or exited. Demo profile switching is in Settings. Tutorial can be replayed from the sidebar or page header.

## Career guidance and assistant

Every listed role has a maintained publication-review example in `src/roleExamples.ts`, combined with shared responsibilities in `src/careers.ts`. Dashboard shows one role tip; Career & Industry holds the fuller checklist. Custom roles use matching responsibilities and selected-field guidance.

Open **Career assistant** in the sidebar for the current role's checklist and optional AI questions. AI uses the server-only `/api/assistant` endpoint; configure `OPENAI_API_KEY`, `OPENAI_MODEL`, `APP_ORIGIN` and Upstash Redis in Vercel. See [setup](docs/CONNECTIONS.md#career-assistant). No live AI call has been verified. Without credentials, the checklist works and the AI button is disabled. Questions include career context and up to six recent chat messages; a post excerpt is included only with explicit consent. Prepared guide tools work without AI. Chats are held in memory, with stop, retry, copy and clear controls.

## Guided chat (default)

Career assistant is now a local guided chat: visitors can type messages or use four prompts. Replies match supported topics to the selected career checklist and prepared templates. Follow-ups such as “make it shorter”, review actions, account imports and report help are supported. Unsupported requests explain the scope. No API key, assistant network request or post upload is required. AI backend code remains dormant for future development; it is not used by this interface.
