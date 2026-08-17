# Sales Genius AI

Act as an Expert Full-Stack Developer, UI/UX Designer, and SaaS Product Manager. Build a complete, production-ready, multi-tenant SaaS application called "SalesGenius AI" using the Lovable tech stack: React, TypeScript, Tailwind CSS, shadcn/ui, Lucide Icons, and Supabase (Auth, Database, Edge Functions).

This app is an AI-powered sales intelligence platform that scores leads, generates personalized emails using Groq AI, and processes payments. It must look stunning, function flawlessly, and be ready to deploy and monetize immediately.

##  UI/UX DESIGN SYSTEM

- **Theme:** Modern, clean, professional SaaS dashboard. Support Dark/Light mode.

- **Colors:** Primary: `#3B82F6` (Blue), Background: `#F8FAFC` (Light) / `#0F172A` (Dark), Cards: White / `#1E293B`.

- **Layout:** Fixed left sidebar navigation (collapsible on mobile), top header with user profile/notifications, main content area with generous padding.

- **Components:** Use shadcn/ui for all UI elements (Buttons, Cards, Tables, Dialogs, Toasts, Dropdowns, Badges).

- **Charts:** Use Recharts for analytics dashboards.

- **Micro-interactions:** Add hover states, smooth transitions, loading skeletons, and toast notifications for all actions.

## 🗄️ SUPABASE DATABASE SCHEMA

Create the following tables with Row Level Security (RLS) enabled:

1. `profiles`: id (uuid, references auth.users), full_name, company_name, role, created_at.

2. `leads`: id, user_id (references profiles), name, email, company, job_title, lead_score (int), status (new, contacted, interested, closed), notes, created_at.

3. `email_templates`: id, lead_id, subject, body, ai_mode_used, created_at.

4. `payments`: id, user_id, amount, currency, provider (stripe, mtn_momo), status, transaction_id, receiver_phone, created_at.

5. `subscriptions`: id, user_id, plan (free, pro, business), status, current_period_end.

##  AI & EDGE FUNCTIONS (GROQ API)

Create Supabase Edge Functions for AI features. Use Groq API (Llama 3 70B) for speed. 

*CRITICAL:* Implement a Mock Fallback. If Groq API fails, return heuristic-based scores (e.g., CEO = 95) and template emails.

1. `score-lead`: Takes lead data, calls Groq, returns 0-100 score and strategy.

2. `generate-email`: Takes lead data, calls Groq, returns personalized email subject and body.

Include an `"ai_mode"` flag in responses ("groq" or "mock").

## 💳 PAYMENT INTEGRATION (GETTING PAID)

Integrate Stripe for global cards and Flutterwave/MTN MoMo for Africa.

*CRITICAL:* All mobile money settlements and owner payouts must route to `+250738481289` (Rwanda).

1. Create a beautiful Pricing Page with 3 tiers: Free ($0), Pro ($49/mo), Business ($199/mo).

2. Implement a Checkout flow that handles Stripe Checkout and Mobile Money prompts.

3. Create a Webhook Edge Function to handle payment success, update the `subscriptions` table, and log the `payment`.

##  PAGES & ROUTES

1. **Landing Page (`/`)**: Beautiful marketing page. Hero section with "Close 3x more deals with AI", feature grid, pricing table, and "Get Started" CTA.

2. **Auth (`/login`, `/signup`)**: Clean, centered forms using Supabase Auth.

3. **Dashboard (`/dashboard`)**: 

   - 4 Metric Cards: Total Leads, High Priority, Avg Score, Conversion Rate.

   - Recharts Bar Chart: Leads by Status.

   - Recent Activity List.

4. **Leads (`/leads`)**: 

   - Data table with search, filter by status, and sort.

   - "Add Lead" button opens a Dialog form.

   - "Import CSV" button for bulk upload.

   - Action buttons per row: View, Edit, Generate Email, Delete.

5. **AI Assistant (`/ai`)**: 

   - Chat-like interface. User selects a lead from a dropdown, clicks "Generate Email", and the AI streams the response.

   - Show "AI Mode: Groq" or "AI Mode: Mock" badge.

6. **Billing (`/billing`)**: 

   - Current plan status.

   - Upgrade/Downgrade buttons.

   - Payment history table.

7. **Settings (`/settings`)**: Profile update, change password, API keys management.

## 🚀 EXECUTION PLAN FOR LOVABLE

**Step 1: Setup & Auth**

- Initialize the project with the design system.

- Setup Supabase Auth (Login/Signup pages).

- Create the `profiles` table and auto-create profile on signup.

**Step 2: Core Features (Leads)**

- Create the `leads` table.

- Build the `/leads` page with the data table, add/edit dialogs, and search/filter.

- Build the `/dashboard` page with metrics and charts.

**Step 3: AI Integration**

- Create the Supabase Edge Functions for Groq AI (with Mock fallback).

- Build the `/ai` page to call these functions and display results.

**Step 4: Payments & Billing**

- Create `payments` and `subscriptions` tables.

- Build the `/billing` page with pricing cards.

- Implement the checkout flow (Stripe + Mobile Money routing to +250738481289).

**Step 5: Polish & Landing Page**

- Build the public Landing Page (`/`).

- Add loading skeletons, toast notifications, and error handling.

- Ensure mobile responsiveness.

## ⚠️ CRITICAL RULES

1. Write 100% complete, working code. Do not use placeholders.

2. Ensure all Supabase queries use the authenticated user's ID for security.

3. Make the UI look like a premium $100/mo SaaS (Linear/Vercel style).

4. Ensure the AI fallback works perfectly if the Groq API key is missing.

5. Hardcode the payment receiver phone number as `+250738481289` in the payment logic.

Start building Step 1 now. Create the project structure, setup Supabase, and build the Landing Page and Auth flows.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/09a3badd-5bc3-4ace-aeea-ab353118a842).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
