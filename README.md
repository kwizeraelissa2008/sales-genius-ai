# 🚀 SalesGenius AI

> **Know who to contact. Know what to say. Know what to do next.**

SalesGenius AI is an AI-powered sales assistant designed for founders, freelancers, small businesses, and growing sales teams. It helps users organize leads, research public prospect information, prioritize opportunities, generate personalized outreach, and turn sales data into clear next actions — all from one workspace.

The product is built around a simple idea:

**Less guessing. Less manual work. More focused selling.**

---

# ✨ Why SalesGenius AI?

Sales teams often lose opportunities not because they lack leads, but because they struggle to answer:

- 🎯 Which leads are worth pursuing?
- ⏱️ Who should I contact first?
- ✍️ What should I say?
- 🔥 Which opportunities are showing strong intent?
- 📅 Who needs a follow-up?
- 📉 Which opportunities are going cold?
- 💰 Where could potential revenue be getting lost?

Spreadsheets and disconnected tools make these decisions harder as the number of leads grows.

**SalesGenius AI turns raw lead data into practical sales priorities and actions.**

---

# 🧠 What SalesGenius AI Does

SalesGenius acts as an intelligent sales assistant around three core questions:

### 1. Who should I contact?

Lead information and sales signals are used to help identify high-priority opportunities.

### 2. What should I say?

AI-assisted outreach helps create personalized messages based on available prospect, company, role, and sales context.

### 3. What should I do next?

Sales insights help users identify opportunities that need attention, follow-ups that are due, and areas of the pipeline that may be losing momentum.

---

# 🎯 Core Features

## Lead Management

Manage leads in one workspace instead of relying on disconnected spreadsheets.

Supported workflows include:

- Lead creation and management
- CSV/XLSX import
- Search
- Filtering
- Sorting
- Lead prioritization
- Status tracking
- Company and role information
- Sales signals
- Public-link enrichment

---

## 🔥 Lead Prioritization

Not every lead deserves the same amount of attention.

SalesGenius helps evaluate leads and assign priority signals so users can focus their limited time on opportunities that matter most.

Example signals include:

- Priority
- Lead score
- Intent
- Status
- Company context
- Available prospect information
- Pipeline activity

---

## ✍️ AI-Powered Personalized Outreach

Instead of starting every sales email from a blank page, SalesGenius can generate tailored outreach using available lead context.

The goal is to produce messages that are:

- Relevant
- Personalized
- Concise
- Sales-oriented
- Grounded in available prospect information

The system supports **EjoLabs-powered outreach drafts** with a reliable local fallback.

Outbound delivery is supported through **Resend**.

---

## 📊 Sales Dashboard & Insights

The dashboard is designed to answer:

> **"What should I do next?"**

Example dashboard indicators can include:

```text
1,284
Leads

94
High-priority opportunities

37
High-intent prospects

12
Follow-ups due

The dashboard is not intended to be a collection of vanity metrics. Its purpose is to surface actionable sales opportunities.

🔎 Lead Intelligence

SalesGenius helps users understand their leads beyond basic contact information.

The system can organize and surface:

Public profile information
Company information
Role
Sales signals
Priority
Lead score
Pipeline status
Available sales context
🤖 AI-Assisted Decision Making

SalesGenius uses AI to reduce repetitive sales analysis and support faster decision-making.

AI supports the salesperson — it does not replace the salesperson.

🏗️ How It Works
                     SALES LEADS
                         │
                         ▼
              ┌────────────────────┐
              │    SalesGenius AI  │
              └──────────┬─────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
      PRIORITIZE      UNDERSTAND     GENERATE
        LEADS         OPPORTUNITY    OUTREACH
          │              │              │
          └──────────────┼──────────────┘
                         ▼
                 ACTIONABLE TASKS
                         │
                         ▼
                    SALES ACTION
                         │
                         ▼
                 BETTER OPPORTUNITIES

The product is designed to transform lead data into practical actions rather than simply displaying information.

🖥️ Product Experience

SalesGenius follows one important UX principle:

Users shouldn't have to understand the technology to get the value.

The interface focuses on the questions salespeople already have:

Who should I contact?
Who is most likely to buy?
What should I say?
Who needs a follow-up?
Where should I focus today?
🧩 Product Areas
Dashboard

A high-level view of sales activity, lead health, priorities, and opportunities requiring attention.

Lead Management

A central workspace for searching, filtering, sorting, importing, and organizing leads.

AI Outreach

Generate personalized sales messages using available lead and company context.

Sales Analytics

Understand:

Lead volume
High-priority opportunities
Lead scores
Conversion performance
Pipeline activity
Lead health
Pipeline movement
Areas requiring attention
Business Profile

Guided business-profile onboarding helps establish the context required for more relevant sales workflows and outreach.

🛠️ Technology Stack
Frontend
React
TypeScript
Vite
Tailwind CSS
shadcn/ui
Lucide React
Backend & Data
Node.js API
PostgreSQL
Redis
Supabase
Supabase Authentication
Supabase Edge Functions
AI
EjoLabs
Llama 3
Groq API
Local AI outreach fallback
Email
Resend
Development
Git
GitHub
Lovable
VS Code
Cursor
🏛️ Architecture
┌───────────────────────────────┐
│          React Client         │
│   React + TypeScript + Vite   │
└───────────────┬───────────────┘
                │
                │ API requests
                ▼
┌───────────────────────────────┐
│          API / Server         │
│ Authentication • Leads • AI   │
│ Outreach • Sales Intelligence │
└───────┬─────────┬─────────────┘
        │         │
        ▼         ▼
┌─────────────┐  ┌────────────────┐
│ PostgreSQL  │  │     Redis      │
│ Application │  │ Future jobs &  │
│    data     │  │ rate limiting  │
└─────────────┘  └────────────────┘
        │
        ├───────────────► AI Providers
        │
        └───────────────► Resend
                         Email delivery
📁 Project Structure
salesgenius-ai/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── lib/
│   ├── integrations/
│   └── App.tsx
│
├── public/
│
├── supabase/
│   ├── functions/
│   └── migrations/
│
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── .env.example
└── README.md
🚀 Getting Started
Prerequisites

Install:

Node.js
npm
Git
Docker Desktop
1. Clone the Repository
git clone https://github.com/YOUR_USERNAME/salesgenius-ai.git
cd salesgenius-ai
2. Install Dependencies
npm install
3. Configure Environment Variables

Create your environment file:

cp .env.example .env

Windows PowerShell:

Copy-Item .env.example .env

Example:

VITE_API_URL=http://localhost:3000

POSTGRES_PASSWORD=your_strong_password

EJOLABS_API_KEY=your_ejolabs_api_key

RESEND_API_KEY=your_resend_api_key

SENDER_EMAIL=you@example.com

VITE_SUPABASE_URL=your_supabase_url

VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

⚠️ Never commit API keys, passwords, database credentials, or other secrets to GitHub.

🐳 Start Local Services
docker compose up -d

Check services:

docker compose ps

Stop services:

docker compose down
💻 Run the Application

Start the API:

npm run api

In another terminal:

npm run dev

Open the URL displayed by Vite.

🔐 Security

SalesGenius is designed with security in mind.

The application uses:

Authentication
Secure server-side sessions
Password resets
Database access controls
Environment variables
Server-side API credentials
Row-level security where appropriate
Never expose private credentials

Never put these in frontend code:

EJOLABS_API_KEY
RESEND_API_KEY
POSTGRES_PASSWORD

Private provider credentials must remain on the server.

📥 Lead Import

SalesGenius supports:

CSV import
XLSX import

Workflow:

CSV / XLSX
    ↓
Import
    ↓
Validation
    ↓
Lead Records
    ↓
Enrichment
    ↓
Lead Intelligence
    ↓
Prioritization
    ↓
Outreach
📧 AI Outreach
Lead
 ↓
Lead Context
 ↓
AI Outreach Generation
 ↓
Review
 ↓
Resend
 ↓
Prospect

SalesGenius separates AI message generation from outbound email delivery.

🧠 AI Philosophy

SalesGenius is not designed to generate AI content for its own sake.

The focus is actionable intelligence.

Instead of:

"Here is some information about this lead."

The goal is:

"This lead deserves attention. Here is why. Here is what you could say. Here is what you should consider doing next."

The AI supports:

Prioritization
Context understanding
Personalization
Recommendations
Sales execution
📈 Roadmap
Current
 Modern sales dashboard
 Lead management
 Lead prioritization
 AI-assisted outreach
 Sales analytics
 Authentication
 Business-profile onboarding
 CSV/XLSX import
 Public-link enrichment
 EjoLabs outreach drafts
 Local outreach fallback
 Resend email delivery
 PostgreSQL
 Redis infrastructure
Next
 Smarter lead intelligence
 Improved AI recommendations
 Automated follow-up suggestions
 Advanced sales insights
 CRM integrations
 More email integrations
 Team collaboration
 Advanced reporting
 Mobile experience
 Background job processing
 Advanced lead enrichment
 Pipeline forecasting
🗺️ Long-Term Vision

Small businesses should not need a large sales department to sell intelligently.

SalesGenius aims to become an AI sales assistant that does more than display sales data.

The long-term goal is to help users:

UNDERSTAND
     ↓
PRIORITIZE
     ↓
PERSONALIZE
     ↓
ACT
     ↓
FOLLOW UP
     ↓
LEARN
     ↓
GROW
🤝 Contributing

Contributions, ideas, feedback, and improvements are welcome.

Create a feature branch:

git checkout -b feature/your-feature

Make changes:

git add .
git commit -m "Add your feature"

Push:

git push origin feature/your-feature

Then open a Pull Request.

Contribution Guidelines
Keep changes focused
Follow the existing project structure
Never commit secrets
Test changes locally
Keep the UI responsive
Keep accessibility in mind
Document important architectural changes
Prefer maintainable code over unnecessary complexity
🧪 Development Checklist

Before submitting a feature:

 Authentication works
 Protected pages require authentication
 Leads can be created
 Leads can be searched
 Lead filtering works
 Lead prioritization works
 AI outreach works
 Local fallback works
 Email delivery works
 API keys are protected
 Production build succeeds
 Responsive design works
 Errors are handled properly
📄 License

SalesGenius AI is currently under development.

License information will be added when the project is prepared for public distribution.

👨‍💻 Creator

KWIZERA Elissa

AI Engineer & Product Builder

SalesGenius AI is being developed with the goal of turning AI into practical tools that create measurable value for businesses.

⭐ Support the Project

If you find SalesGenius AI interesting:

⭐ Star the repository
🐛 Report issues
💡 Share ideas
🤝 Contribute
📣 Share the project
🔥 SalesGenius AI
Know who to contact.
Know what to say.
Know what to do next.

Turn your sales pipeline into your next opportunity.

📌 Quick Reference
Area	Technology
Frontend	React + TypeScript + Vite
Styling	Tailwind CSS + shadcn/ui
Icons	Lucide React
Backend	Node.js
Database	PostgreSQL
Cache / Jobs	Redis
Platform	Supabase
Authentication	Secure Sessions / Supabase Auth
AI	EjoLabs + Llama 3 + Groq
Email	Resend
Lead Import	CSV / XLSX
Development	Git + GitHub + Lovable + VS Code + Cursor
🎯 Product North Star

SalesGenius AI should help a salesperson move from a large list of leads to the right action with as little unnecessary work as possible.

LEADS
  ↓
UNDERSTAND
  ↓
PRIORITIZE
  ↓
PERSONALIZE
  ↓
ACT
  ↓
FOLLOW UP
  ↓
LEARN
  ↓
MORE OPPORTUNITIES

### 💡 To use it

1. Open your project folder.
2. Find `README.md`.
3. Open it in VS Code.
4. **Delete everything inside it.**
5. Paste the Markdown above.
6. Save with `Ctrl + S`.
7. Push it to GitHub:

```bash
git add README.md
git commit -m "Update professional README"
git push
