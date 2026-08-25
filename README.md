# 🚀 SalesGenius AI

> **Know who to contact. Know what to say. Know what to do next.**

SalesGenius AI is an AI-powered sales assistant designed for founders, freelancers, small businesses, and growing sales teams.

It helps users organize leads, research public prospect information, prioritize opportunities, generate personalized outreach, and turn sales data into clear next actions — all from one workspace.

The product is built around a simple idea:

> **Less guessing. Less manual work. More focused selling.**

---

## 📋 Table of Contents

- [✨ Overview](#-overview)
- [🎯 The Problem](#-the-problem)
- [💡 The Solution](#-the-solution)
- [🧠 How SalesGenius AI Works](#-how-salesgenius-ai-works)
- [🎯 Core Features](#-core-features)
- [🖥️ Product Experience](#️-product-experience)
- [🏗️ Architecture](#️-architecture)
- [🛠️ Technology Stack](#️-technology-stack)
- [📁 Project Structure](#-project-structure)
- [🚀 Getting Started](#-getting-started)
- [🔐 Environment Variables](#-environment-variables)
- [🐳 Docker & Local Services](#-docker--local-services)
- [💻 Running the Application](#-running-the-application)
- [📥 Lead Import](#-lead-import)
- [✍️ AI Outreach](#️-ai-outreach)
- [📊 Sales Intelligence](#-sales-intelligence)
- [🔐 Security](#-security)
- [🧪 Development](#-development)
- [🗺️ Roadmap](#️-roadmap)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [👨‍💻 Creator](#-creator)
- [⭐ Support](#-support)
- [🎯 Product North Star](#-product-north-star)

---

# ✨ Overview

SalesGenius AI helps sales teams move from a large list of prospects to a focused list of opportunities that deserve attention.

Instead of forcing salespeople to manually analyze spreadsheets, research prospects, write emails, and remember follow-ups, SalesGenius brings these workflows into one intelligent workspace.

The platform focuses on three simple questions:

### 1. Who should I contact?

Identify leads and opportunities that deserve attention first.

### 2. What should I say?

Generate personalized outreach based on available prospect and company context.

### 3. What should I do next?

Use sales insights and signals to determine the next action.

---

# 🎯 The Problem

Sales teams often lose opportunities not because they have no leads, but because they don't know:

- Which leads are actually worth pursuing
- Who should be contacted first
- What message to send
- Which opportunities are going cold
- When a follow-up is needed
- Where potential revenue is being lost
- Which prospects are showing strong intent

As the number of leads grows, spreadsheets and disconnected tools make these decisions increasingly difficult.

Salespeople can spend significant amounts of time:

```text
Finding prospects
      ↓
Researching prospects
      ↓
Organizing spreadsheets
      ↓
Scoring leads manually
      ↓
Writing outreach
      ↓
Tracking follow-ups
      ↓
Analyzing results

This creates unnecessary operational work.

💡 The Solution

SalesGenius AI was built to simplify this decision-making process.

The platform transforms raw lead information into actionable sales opportunities.

Instead of simply showing a database of leads, SalesGenius aims to help users understand:

WHO?
 ↓
Which prospect deserves attention?

WHY?
 ↓
Why is this opportunity important?

WHAT?
 ↓
What should I say?

NEXT?
 ↓
What should I do now?

The goal is:

Less guessing. Less manual work. More focused selling.

🧠 How SalesGenius AI Works

At a high level:

                         SALES LEADS
                              │
                              ▼
                  ┌──────────────────────┐
                  │    SALES GENIUS AI   │
                  └──────────┬───────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
        PRIORITIZE       UNDERSTAND      GENERATE
           LEADS         OPPORTUNITY     OUTREACH
              │              │              │
              └──────────────┼──────────────┘
                             ▼
                    ACTIONABLE INSIGHTS
                             │
                             ▼
                       SALES ACTION
                             │
                             ▼
                    BETTER OPPORTUNITIES

The system is designed to turn lead data into practical actions instead of simply displaying information.

🎯 Core Features
👥 Lead Management

SalesGenius provides a central workspace for managing sales leads.

Users can work with:

Lead records
Companies
Roles
Lead status
Priority
Lead scores
Sales signals
Public profile information
Additional sales context
Supported workflows
Create leads
Search leads
Filter leads
Sort leads
Import leads
Organize leads
Prioritize leads
Enrich lead information
📥 CSV & XLSX Import

SalesGenius supports importing lead data from common spreadsheet formats.

Supported formats:

CSV
XLSX

Typical workflow:

CSV / XLSX
    │
    ▼
IMPORT
    │
    ▼
VALIDATION
    │
    ▼
LEAD RECORDS
    │
    ▼
ENRICHMENT
    │
    ▼
INTELLIGENCE
    │
    ▼
PRIORITIZATION
    │
    ▼
OUTREACH

This allows teams to move existing lead lists into SalesGenius without manually entering every record.

🔎 Public-Link Enrichment

SalesGenius can work with available public links and profile information to provide additional context around a lead.

This can help users understand:

Prospect identity
Company
Role
Public information
Available business context

The objective is to reduce repetitive manual research.

🔥 Lead Prioritization

Not every lead deserves the same amount of attention.

SalesGenius helps users identify high-priority opportunities.

Potential prioritization signals include:

Lead score
Intent
Priority
Status
Company information
Role
Sales signals
Pipeline activity
Available prospect context

Example:

┌───────────────────────────────┐
│ HIGH PRIORITY                 │
│                               │
│ Acme Corporation              │
│ CTO                           │
│                               │
│ Lead Score: 92                │
│ Intent: High                  │
│ Status: Active                │
│                               │
│ Recommended Action: Contact   │
└───────────────────────────────┘

The purpose is to help salespeople spend their time where it has the highest potential value.

✍️ AI-Powered Personalized Outreach

Writing personalized outreach for every lead can be repetitive.

SalesGenius uses AI-assisted workflows to help generate relevant sales messages based on available context.

The system can consider information such as:

Prospect
Company
Role
Lead context
Sales signals
Available public information

The objective is to produce outreach that is:

Relevant
Personalized
Concise
Context-aware
Sales-oriented
🤖 AI Outreach Architecture
                  LEAD
                   │
                   ▼
             LEAD CONTEXT
                   │
                   ▼
          ┌─────────────────┐
          │   AI ENGINE     │
          └────────┬────────┘
                   │
          ┌────────┴────────┐
          ▼                 ▼
      EjoLabs           Local Fallback
          │                 │
          └────────┬────────┘
                   ▼
              DRAFT MESSAGE
                   │
                   ▼
                 REVIEW
                   │
                   ▼
                RESEND
                   │
                   ▼
               PROSPECT

The system supports EjoLabs-powered outreach drafts with a local fallback.

Outbound delivery is handled through Resend.

📊 Sales Dashboard

The dashboard provides a high-level view of sales activity and opportunities.

Example metrics:

┌─────────────────────────────────────┐
│               DASHBOARD             │
├─────────────────────────────────────┤
│                                     │
│  1,284        94        37       12  │
│  Leads      Priority   High     Follow │
│                       Intent     Ups │
│                                     │
└─────────────────────────────────────┘

Example insights:

Total leads
High-priority opportunities
High-intent prospects
Follow-ups due
Pipeline activity
Lead health
Conversion performance

The dashboard should not simply show statistics.

Its purpose is to answer:

"What should I do next?"

📈 Sales Analytics

SalesGenius provides visibility into sales activity.

Users can analyze:

Lead volume
High-priority opportunities
Lead scores
Conversion performance
Pipeline activity
Lead health
Pipeline movement
Areas requiring attention

Analytics are intended to help salespeople make better decisions.

🧩 Product Areas
Dashboard

Provides a high-level overview of:

Sales activity
Lead health
Priority opportunities
High-intent prospects
Follow-ups
Pipeline activity
Lead Management

Central workspace for:

Searching
Filtering
Sorting
Importing
Organizing
Prioritizing leads
AI Outreach

Generate personalized sales messages using available lead and company context.

Sales Analytics

Provides visibility into:

Opportunities
Conversion trends
Lead health
Pipeline movement
Areas requiring attention
Business Profile

Guided business-profile onboarding establishes business context that can be used to make sales workflows and outreach more relevant.

🖥️ Product Experience

SalesGenius follows a simple UX principle:

Users shouldn't have to understand the technology to get the value.

The interface focuses on the questions salespeople already have:

Who should I contact?
Who is most likely to buy?
What should I say?
Who needs a follow-up?
Where should I focus today?

The goal is to make AI-powered sales intelligence feel practical rather than complicated.

🏗️ Architecture

SalesGenius is designed around several core layers:

┌────────────────────────────────────┐
│          FRONTEND CLIENT           │
│                                    │
│ React + TypeScript + Vite          │
│ Tailwind CSS + shadcn/ui           │
└──────────────────┬─────────────────┘
                   │
                   │ API Requests
                   ▼
┌────────────────────────────────────┐
│            API / SERVER            │
│                                    │
│ Authentication                     │
│ Lead Management                     │
│ AI Outreach                         │
│ Sales Intelligence                  │
│ Business Profiles                   │
└───────────────┬───────────┬────────┘
                │           │
                ▼           ▼
       ┌─────────────┐ ┌─────────────┐
       │ PostgreSQL  │ │    Redis    │
       │             │ │             │
       │ App Data    │ │ Jobs /      │
       │ Leads       │ │ Rate Limit  │
       │ Sessions    │ │             │
       └─────────────┘ └─────────────┘
                │
                ▼
       ┌──────────────────┐
       │   AI PROVIDERS   │
       │                  │
       │ EjoLabs          │
       │ Groq             │
       │ Llama 3          │
       └──────────────────┘
                │
                ▼
       ┌──────────────────┐
       │      RESEND      │
       │  Email Delivery  │
       └──────────────────┘
🛠️ Technology Stack

SalesGenius AI uses modern web technologies.

Frontend
Technology	Purpose
React	UI framework
TypeScript	Type-safe development
Vite	Development/build tooling
Tailwind CSS	Styling
shadcn/ui	UI components
Lucide React	Icons
Backend
Technology	Purpose
Node.js	Server/API runtime
PostgreSQL	Application database
Redis	Future background jobs and rate limiting
Supabase	Platform/backend services
Supabase Auth	Authentication
Supabase Edge Functions	Server-side functions
AI
Technology	Purpose
EjoLabs	Outreach generation
Llama 3	AI model
Groq API	AI inference
Local fallback	Reliable outreach generation
Email
Technology	Purpose
Resend	Outbound email delivery
Development Tools
Git
GitHub
Lovable
VS Code
Cursor
📁 Project Structure
salesgenius-ai/
│
├── src/
│   │
│   ├── components/
│   │   └── Reusable UI components
│   │
│   ├── pages/
│   │   └── Application pages
│   │
│   ├── hooks/
│   │   └── Custom React hooks
│   │
│   ├── lib/
│   │   └── Utilities and shared logic
│   │
│   ├── integrations/
│   │   └── External integrations
│   │
│   └── App.tsx
│
├── public/
│   └── Static assets
│
├── supabase/
│   │
│   ├── functions/
│   │   └── Edge Functions
│   │
│   └── migrations/
│       └── Database migrations
│
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── .env.example
└── README.md

The exact structure may evolve as the project develops.

🚀 Getting Started
Prerequisites

Before running SalesGenius locally, install:

Node.js
npm
Git
Docker Desktop

You will also need the API credentials required by the services enabled in your environment.

1️⃣ Clone the Repository
git clone https://github.com/YOUR_USERNAME/salesgenius-ai.git

Move into the project:

cd salesgenius-ai

Replace YOUR_USERNAME with the GitHub account that owns the repository.

2️⃣ Install Dependencies
npm install
3️⃣ Configure Environment Variables

Create your environment file:

cp .env.example .env
Windows PowerShell
Copy-Item .env.example .env

Then configure your environment variables.

Example:

# ==========================================
# Application
# ==========================================

VITE_API_URL=http://localhost:3000


# ==========================================
# PostgreSQL
# ==========================================

POSTGRES_PASSWORD=your_strong_password


# ==========================================
# AI / Outreach
# ==========================================

EJOLABS_API_KEY=your_ejolabs_api_key


# ==========================================
# Email
# ==========================================

RESEND_API_KEY=your_resend_api_key
SENDER_EMAIL=you@example.com


# ==========================================
# Supabase
# ==========================================

VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
🔐 Environment Variable Safety

Never expose private secrets in frontend/browser code.

❌ Never expose:
EJOLABS_API_KEY
RESEND_API_KEY
POSTGRES_PASSWORD
✅ Client-side configuration may contain:
VITE_API_URL

Private provider credentials should be handled by the server/API layer or appropriate server-side functions.

🐳 Docker & Local Services

SalesGenius uses Docker for local infrastructure.

Start the services:

docker compose up -d

Check the services:

docker compose ps

Stop the services:

docker compose down

View logs:

docker compose logs

Follow logs:

docker compose logs -f
💻 Running the Application

SalesGenius uses separate processes for the API and frontend during local development.

Terminal 1 — API
npm run api
Terminal 2 — Frontend
npm run dev

Open the local URL displayed by Vite.

The MVP configuration may use:

http://localhost:3000

If Vite reports a different port, use the URL shown in your terminal.

🏭 Production Build

Create a production build:

npm run build

Preview the production build:

npm run preview
🔐 Security

Security is an important part of the SalesGenius architecture.

The system is designed around:

Authentication
Secure server-side sessions
Password resets
Database access controls
Environment variables
Server-side API credentials
Row-level security where appropriate
Protected provider integrations
🔑 Secret Management

Never commit:

.env

or private credentials to GitHub.

Use:

.env.example

for documenting required environment variables without exposing their values.

Example:

EJOLABS_API_KEY=
RESEND_API_KEY=
POSTGRES_PASSWORD=
👤 Authentication

SalesGenius supports account-based workflows.

The MVP architecture includes:

Email/password accounts
Secure server-side sessions
Password resets
Protected application areas

Authentication should always be handled through secure server-side or trusted authentication infrastructure.

🗄️ Database

PostgreSQL is used for core application data.

The database can contain information related to:

Accounts
Sessions
Business profiles
Leads
Message history
Sales activity

Conceptually:

USERS
  │
  ├──── BUSINESS PROFILE
  │
  └──── LEADS
          │
          ├──── SALES SIGNALS
          │
          ├──── PRIORITY
          │
          ├──── STATUS
          │
          └──── MESSAGE HISTORY
⚡ Redis

Redis is provisioned for future infrastructure needs such as:

Rate limiting
Background jobs
Queues
Temporary caching
Asynchronous processing

The architecture allows Redis capabilities to expand as SalesGenius grows.

📊 Sales Intelligence Flow

A typical lead intelligence workflow:

                    LEAD
                     │
                     ▼
              COLLECT CONTEXT
                     │
                     ▼
                ENRICH DATA
                     │
                     ▼
             ANALYZE SIGNALS
                     │
                     ▼
              SCORE / PRIORITY
                     │
                     ▼
              SALES INSIGHT
                     │
                     ▼
             RECOMMENDED ACTION

The purpose is to help users move from information to action.

📧 Email Delivery

Outbound email delivery is handled through Resend.

Typical workflow:

Lead
 │
 ▼
AI-generated draft
 │
 ▼
User review
 │
 ▼
Email service
 │
 ▼
Prospect

Email provider credentials should remain server-side.

🧠 AI Philosophy

SalesGenius is not designed to generate AI content simply because AI is available.

The product focuses on useful sales intelligence.

Instead of:

"Here is information about your lead."

The product aims toward:

"This lead deserves attention. Here is why. Here is what you could say. Here is what you should consider doing next."

The AI layer is intended to support:

Lead prioritization
Context understanding
Personalization
Recommendations
Sales execution
🧑‍💼 Human + AI

SalesGenius is designed to support salespeople rather than replace them.

                 AI
                  │
        ┌─────────┴─────────┐
        │                   │
   Analyze data        Generate ideas
        │                   │
        └─────────┬─────────┘
                  ▼
             SALESPERSON
                  │
                  ▼
              DECISION
                  │
                  ▼
               ACTION

The human remains responsible for the final sales decision.

🧪 Development
Install dependencies
npm install
Start development
npm run dev
Run API
npm run api
Build production
npm run build
Preview production
npm run preview
🔄 Git Workflow

Check the current state:

git status

Stage changes:

git add .

Commit:

git commit -m "Describe your changes"

Push:

git push
🌿 Feature Branch Workflow

Create a feature branch:

git checkout -b feature/your-feature

Make changes.

Stage:

git add .

Commit:

git commit -m "Add your feature"

Push:

git push origin feature/your-feature

Then open a Pull Request.

🧪 Development Checklist

Before pushing a significant change, verify:

 Application starts successfully
 API starts successfully
 Authentication works
 Protected pages require authentication
 Leads can be created
 Leads can be viewed
 Lead search works
 Lead filtering works
 Lead sorting works
 Lead prioritization works
 CSV import works
 XLSX import works
 AI outreach works
 Local outreach fallback works
 Email delivery works
 API credentials remain private
 Database operations work
 Production build succeeds
 Responsive layouts work
 Errors are handled clearly
🐛 Troubleshooting
npm install fails

Try:

npm cache verify

Then:

npm install
Docker services are not running

Check:

docker compose ps

Then:

docker compose logs

Restart:

docker compose down
docker compose up -d
Environment variables are not working

Check that:

.env exists
Variable names are correct
The development server was restarted
Frontend variables use the expected VITE_ prefix
Private keys are not being accessed directly from browser code
AI outreach is not working

Check:

EJOLABS_API_KEY

Verify that the API key exists in the server environment.

If the provider is unavailable, the local fallback should be used where implemented.

Email is not being sent

Check:

RESEND_API_KEY
SENDER_EMAIL

Also verify that email delivery is configured correctly in the Resend environment.

🗺️ Roadmap
✅ Current / MVP
 Modern sales dashboard
 Lead management
 Lead prioritization
 AI-assisted outreach
 Sales analytics
 Authentication
 Guided business-profile onboarding
 CSV/XLSX import
 Public-link enrichment
 EjoLabs-powered outreach drafts
 Local outreach fallback
 Resend outbound delivery
 PostgreSQL-backed application data
 Redis infrastructure
 Server-side API architecture
🚧 Next
 Smarter lead intelligence
 Improved AI recommendations
 Automated follow-up suggestions
 More detailed sales insights
 CRM integrations
 Additional email provider integrations
 Team collaboration
 Advanced reporting
 Mobile experience
 Background job processing
 Advanced lead enrichment
 Pipeline forecasting
🔮 Future Vision

Future versions of SalesGenius could evolve toward a more proactive sales assistant.

Instead of waiting for users to ask what to do, the platform could surface recommendations such as:

🔥 3 high-intent leads need attention today.

📧 7 prospects have not received a follow-up.

⚠️ 4 opportunities may be going cold.

🎯 2 leads match your ideal customer profile.

💡 Suggested action:
Contact the CTO at Acme Corporation.

The long-term objective is to make the platform increasingly useful as a daily sales operating system.

🌍 Long-Term Vision

Small businesses should not need a large sales department to sell intelligently.

Many businesses already have potential customers in their pipeline.

The problem is often knowing:

Which opportunities matter most
Why they matter
What action to take
When to follow up
How to personalize the conversation

SalesGenius aims to become an AI sales assistant that doesn't simply display sales data.

It should help users:

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

Contribution Guidelines

When contributing:

Keep changes focused
Follow the existing project structure
Never commit secrets
Test changes locally
Keep the UI responsive
Consider accessibility
Document important architectural changes
Use meaningful commit messages
Prefer maintainable code over unnecessary complexity
💡 Ideas & Feature Requests

Have an idea for SalesGenius?

Consider opening an issue describing:

Problem

What problem does the feature solve?

Proposed Solution

What would the feature do?

User Value

How would it help salespeople or businesses?

Example

Provide a real-world example of the workflow.

🐛 Bug Reports

When reporting a bug, include:

Operating system
Browser
Node.js version
Steps to reproduce
Expected behavior
Actual behavior
Error message
Relevant logs
Screenshots where useful

Please do not include API keys or other secrets in bug reports.

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
🐛 Report bugs
💡 Share ideas
🤝 Contribute
📣 Share the project
🚀 Help improve the product
📌 Quick Reference
Area	Technology / Capability
Frontend	React
Language	TypeScript
Build Tool	Vite
Styling	Tailwind CSS
UI	shadcn/ui
Icons	Lucide React
Backend	Node.js
Database	PostgreSQL
Cache / Jobs	Redis
Platform	Supabase
Authentication	Secure Sessions / Supabase Auth
Edge Functions	Supabase Edge Functions
AI	EjoLabs
AI Model	Llama 3
AI Inference	Groq API
AI Fallback	Local fallback
Email	Resend
Lead Import	CSV / XLSX
Version Control	Git
Repository	GitHub
Development	Lovable / VS Code / Cursor
🧭 Product Philosophy

SalesGenius is built around a simple product philosophy:

Don't overwhelm the salesperson with data.

Give them:

THE RIGHT LEAD
      +
THE RIGHT CONTEXT
      +
THE RIGHT MESSAGE
      +
THE RIGHT TIME
      =
THE RIGHT ACTION

The platform should continuously move toward making sales work simpler, faster, and more intelligent.

🎯 Product North Star

SalesGenius AI should help a salesperson move from a large list of leads to the right action with as little unnecessary work as possible.

                    SALES PIPELINE
                         │
                         ▼
                       LEADS
                         │
                         ▼
                    UNDERSTAND
                         │
                         ▼
                    PRIORITIZE
                         │
                         ▼
                   PERSONALIZE
                         │
                         ▼
                       ACT
                         │
                         ▼
                    FOLLOW UP
                         │
                         ▼
                      LEARN
                         │
                         ▼
                  MORE OPPORTUNITIES
🔥 SalesGenius AI
Know who to contact.
Know what to say.
Know what to do next.
Turn your sales pipeline into your next opportunity.
<p align="center"> Built with ❤️ and AI by <strong>KWIZERA Elissa</strong> </p> ```
