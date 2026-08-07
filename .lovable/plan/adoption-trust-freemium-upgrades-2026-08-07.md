# Adoption, Trust & Freemium Upgrades

Four workstreams: faster first value, transparent AI, plan limits, and safer sending.

## 1. Onboarding & time-to-value

**Getting-started checklist** — a new card at the top of the Dashboard, shown until all steps are done (dismissible after completion):
- Complete your company profile → links to `/onboarding`
- Add or import your first lead → links to `/leads`
- Generate your first AI email → links to `/ai`

Each step is derived from real data (company profile `onboarded`, lead count, any saved email template), so it self-completes as the user works. A progress bar shows "2 of 3 done".

**Load sample demo data** — a button in the checklist (and in the empty state on Leads) that inserts ~8 realistic demo leads spread across pipeline stages with varied scores, deal values, notes and social links, so the Dashboard, Pipeline and Analytics pages are immediately populated. Demo leads are tagged so a "Remove demo data" button can clear them in one click. Inserted only on explicit click — never automatically.

## 2. Explainable AI

**Score breakdown** — the scoring heuristic gets a companion function that returns the reasoning: base points, job-title seniority weight, business-domain email bonus, company-present bonus. Hovering (or tapping) any score badge on Leads, Pipeline and the lead detail sheet shows a small popover listing each factor with its point contribution and the total.

**Two tone variations** — the AI email generator returns two drafts side by side:
- "Short & Direct" — brief, one clear ask
- "Value & Storytelling" — warmer, references product value and a pain point

The user picks a variant with a tab/toggle, edits it, then sends. Both variants come from a single generation call, and both work with the existing smart-fallback path when no AI key is present.

## 3. Freemium usage limits

Monthly, soft limits enforced server-side and mirrored in the UI:

| | Free | Pro | Business |
|---|---|---|---|
| AI email generations / month | 20 | 500 | unlimited |
| Lead enrichments / month | 10 | 200 | unlimited |

- The server checks the user's plan and current-month usage before generating or enriching; over the limit it returns a friendly "you've used your monthly Free allowance — upgrade to continue" instead of an error, and the UI links to Billing.
- Billing page gains a "Usage this month" panel with progress bars for both quotas plus renewal date.
- The AI and Enrich screens show a small "12 / 20 generations used this month" line so limits never surprise anyone.

## 4. Deliverability guidance

Near the Send action: a compact notice with cold-email best practices — keep daily volume modest (a suggested ~30–50/day per mailbox for a warmed domain), personalize every send, always include an opt-out, and verify domain authentication (SPF/DKIM/DMARC) before scaling. Plus a soft in-app daily send counter that warns (does not block) past 50 sends in a day.

Everything keeps current fallback behaviour when the AI or email keys are missing, uses existing shadcn components and design tokens, and stays keyboard/screen-reader accessible.

## Technical notes

- Migration: `usage_events` table (`user_id`, `kind` enum: `ai_email` | `enrichment` | `email_send`, `created_at`) with GRANTs, RLS scoped to `auth.uid()`, and an index on `(user_id, kind, created_at)`. A `demo` boolean flag on `leads` for sample-data cleanup.
- New `src/lib/usage.server.ts` with plan quotas and a `assertWithinQuota()` helper; called at the top of `generateEmail`, `enrichLinks` and `sendLeadEmail` handlers, which then log a usage event. Plan is read from `subscriptions` via the authenticated client (RLS), not from client input.
- `src/lib/usage.functions.ts` exposes a `getUsageSummary` server fn for the Billing/AI/Enrich UI.
- `src/lib/leads.ts`: add `scoreBreakdown()` returning `{ label, points }[]`; `heuristicScore` reuses it so the number and the explanation can never diverge.
- `src/lib/ai.functions.ts`: `generateEmail` returns `variants: [{ tone, subject, body }, ...]`; single Groq call requesting a JSON array, fallback generates two heuristic tones. Persists the selected variant on send.
- `src/lib/demo-data.functions.ts`: `seedDemoLeads` / `clearDemoLeads` server fns (idempotent, user-scoped).
- New components: `src/components/onboarding-checklist.tsx`, `src/components/score-breakdown.tsx`, `src/components/usage-meter.tsx`, `src/components/deliverability-note.tsx`.
