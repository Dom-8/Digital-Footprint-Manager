# Digital Footprint Manager

**Your past deserves context. Your future deserves opportunity.**

A complete browser-local SaaS demonstration for exploring historical online content through occupational context. All accounts, posts, analysis and monitoring are simulated. No credentials or employer access.

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

The production files are in `dist/`. Hash-based routing and relative assets support static hosting, including a GitHub Pages subdirectory. Hosting has not been enabled automatically.

## Included

- React, TypeScript, Vite, Tailwind foundation with custom accessible components, Lucide icons, Recharts and React Router.
- Eleven complete navigation pages, responsive sidebar, five-step onboarding and product tour.
- Four fictional personas, 116 individually authored posts (104 initial records and 12 monitoring records), nine demo platforms and ten industry profiles.
- Deterministic industry-aware analysis with category relevance, qualitative uncertainty, private visibility and historical timing.
- Context Lens with balanced interpretations, editable context, original versus revised priority, manual overrides and cautious next steps.
- Combinable search, platform, priority, relevance, date, type, category, status and visibility filters; sorting; bulk actions; confirmation; reversible simulated archive/delete.
- State-derived dashboard counts, clickable platform/year charts, chronological history and milestones.
- Industry comparison, readiness checklist, scenario considerations and editable CV/LinkedIn date consistency.
- One bounded demo scan per persona, notification history, simulated frequency preferences and reset.
- Filtered report previews, CSV export, browser printing / Save as PDF and JSON decision export.
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

The automated engine tests and TypeScript/Vite production build run remotely in GitHub Actions; see the latest [Prototype checks run](https://github.com/Dom-8/Digital-Footprint-Manager/actions). The authoring session has no executable workspace, so local browser verification was unavailable. Responsive rules target 375px mobile, 768px tablet and 1440px desktop; actual browser checks are still needed.

## Honest limitations

- Analysis uses authored metadata, not AI, NLP, actual social media or verified facts.
- Monitoring runs only when requested in the open app; frequency preferences are illustrative and create no real scheduled tasks.
- All posts are text-based examples, including records labelled video/repost. There are no actual media files.
- Context notes are unverified. They can moderate a context-needed item, but never automatically resolve privacy or credential concerns.
- Reports reflect current state and filters; PDF output uses the browser print dialog, not a dedicated PDF generator.
- Persistence is confined to the current browser and origin, without cloud accounts or cross-device sync.
- Undo restores the preceding profile action in the current session; removed samples can also be restored through Content Review.
- Digital identity and Connected Platforms share the same management workspace.
- Optional advanced features such as period-to-period comparisons and desktop quick-review shortcuts are not included.

## Fairness

Review priorities indicate possible manual-review questions. No hiring probabilities, character scores, protected-characteristic categories or invented professional rules are used. Employer practices differ. Historical content, lawful opinions and creative work must be considered with context.
