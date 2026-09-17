# PennyPilot

Financial intelligence for MSMEs.

PennyPilot is a digital financial operating system designed for Micro, Small and Medium Enterprises (MSMEs).

Instead of treating expense management as simple record keeping, PennyPilot turns a business's real transaction ledger into an actionable financial workspace.

It helps businesses:

- Record and manage expenses
- Monitor monthly spending
- Set and track budgets
- Understand category-wise spending
- Identify important vendors
- Detect unusual spending patterns
- Analyze spending velocity
- Scan receipts using OCR
- Export transaction data
- Ask questions about their finances using an AI Copilot

Built for Hack2Ignite — FT-05: Develop a digital expense tracking and analytics platform for MSMEs.


## THE PROBLEM

For many MSMEs, financial information is distributed across spreadsheets, bills, payment applications, notebooks and accounting records.

This creates several practical problems:

- Expenses are difficult to track consistently.
- Business owners may not have a clear view of current spending.
- Budget overruns can be discovered too late.
- Large or unusual transactions can go unnoticed.
- Vendor spending is difficult to analyze.
- Historical transactions are recorded but rarely converted into useful insights.
- Financial analysis often requires manual spreadsheet work.

PennyPilot addresses this by creating a single workspace where transactions become the foundation for financial intelligence.


## OUR APPROACH

PennyPilot follows a simple progression:

RECORD
    ↓
UNDERSTAND
    ↓
DETECT
    ↓
ANALYZE
    ↓
ASK

Record

Capture real business expenses through manual entry or receipt scanning.

Understand

Break spending down by categories, vendors and time periods.

Detect

Watch for unusual transaction patterns and spending behavior.

Analyze

Calculate budgets, spending velocity, daily burn and other financial signals.

Ask

Use the AI Copilot to ask questions about the business's recorded financial data.


## CORE FEATURES

### 1. EXPENSE LEDGER

The ledger is the foundation of PennyPilot.

Users can:

- Add expenses
- Edit expenses
- Delete expenses
- Search transactions
- Filter by category
- View payment methods
- View transaction dates
- Export transactions as CSV

Each expense contains:

- Amount
- Vendor
- Category
- Payment Method
- Date
- Notes

The application operates on the user's actual stored transactions rather than relying on hardcoded financial values.


### 2. BUDGET GUARD

Businesses can define a monthly spending limit.

PennyPilot then calculates:

- Current monthly spending
- Budget utilization
- Remaining budget
- Spending pace
- Projected month-end spending

The workflow is:

Monthly Budget
      ↓
Real Transactions
      ↓
Current Spend
      ↓
Budget Utilization
      ↓
Remaining Budget
      ↓
Spending Projection

Budget Guard is designed to give business owners an early indication of their spending trajectory.


### 3. WATCHTOWER

Watchtower provides explainable transaction anomaly detection.

Rather than simply displaying an unexplained risk score, PennyPilot examines recorded transactions for unusual category-level spending patterns.

The current implementation establishes a baseline from historical transactions and identifies transactions that significantly exceed the historical average for their category.

Watchtower also communicates when there is not enough transaction history to establish a meaningful baseline.

This avoids presenting an anomaly signal when the system does not have enough data to support one.


### 4. SPENDING ANALYTICS

PennyPilot converts the expense ledger into financial analytics.

The dashboard provides:

- Monthly spend
- All-time spend
- Daily spending pace
- Projected monthly spending
- Category distribution
- Vendor distribution
- Transaction counts
- Budget utilization
- Watchtower signals

Charts and breakdowns are generated from the user's stored transaction data.


### 5. CATEGORY INTELLIGENCE

Expenses are organized into business-relevant categories:

- Raw Materials
- Salaries
- Logistics
- Utilities
- Rent
- Marketing
- Office
- Maintenance

PennyPilot calculates category totals from the actual ledger and identifies the categories contributing most to current spending.


### 6. VENDOR INTELLIGENCE

PennyPilot aggregates transactions by vendor.

This provides visibility into:

- Highest-spend vendors
- Vendor transaction totals
- Monthly vendor spending
- Vendor concentration
- Vendor-level spending patterns

Vendor names are normalized before aggregation so minor formatting differences do not unnecessarily create separate vendor records.


### 7. RECEIPT SCANNER

PennyPilot includes browser-based receipt scanning.

The receipt scanner uses OCR to extract information from an uploaded or captured receipt.

The extraction pipeline attempts to identify:

- Vendor
- Amount
- Date

The detected information is then passed into the expense form for review before being stored.

Receipt scanning can also use the extracted text to assist with:

- Expense category detection
- Payment method detection

The user remains in control of the final transaction before saving it.


### 8. AI FINANCIAL COPILOT

PennyPilot includes an AI-powered financial assistant.

The Copilot is designed around the business's recorded financial context rather than generic financial advice.

Users can ask questions such as:

- Why did I spend more this month?
- What is my largest expense?
- Where is most of my money going?
- Which vendor gets the most money?
- How much budget do I have left?
- Can I afford another expense?

The application prepares relevant financial context from the current workspace before sending the request to the AI model.

The Copilot can reason over information such as:

- Current-month spending
- Previous-month spending
- Categories
- Vendors
- Largest transactions
- Budget
- Budget utilization
- Daily spending pace
- Projected spending

This keeps the assistant grounded in the business's available transaction data.


## DATA PHILOSOPHY

PennyPilot is designed around a simple principle:

Financial intelligence should come from the business's actual data.

The application does not require a pre-populated fake financial dataset to operate.

When a workspace has no transactions, PennyPilot displays an empty state and explains what the user needs to do next.

As real transactions are added, the analytics and intelligence layer becomes progressively more useful.


## AUTHENTICATION

PennyPilot uses Supabase Authentication.

Users can:

- Create an account
- Sign in
- Sign out

During registration, business information is attached to the authenticated user.

A database trigger creates the corresponding business profile automatically.

This prevents the client application from needing to manually create the business record after authentication.


## SECURITY

PennyPilot uses Supabase Row Level Security (RLS).

Business records are associated with authenticated users.

Expenses are associated with a business.

Access is restricted so that authenticated users can only access the business and transactions associated with their account.

Architecture:

Authenticated User
       ↓
    Business
       ↓
    Expenses
       ↓
Financial Analytics

The application does not expose database service credentials to the browser.


## SYSTEM ARCHITECTURE

                         +----------------------+
                         |        USER          |
                         |   MSME BUSINESS      |
                         |       OWNER         |
                         +----------+-----------+
                                    |
                                    v
                         +----------------------+
                         |     PENNYPILOT       |
                         |      NEXT.JS UI      |
                         +----------+-----------+
                                    |
              +---------------------+---------------------+
              |                     |                     |
              v                     v                     v
       +-------------+      +---------------+      +--------------+
       |   EXPENSE   |      |   ANALYTICS   |      |   RECEIPT    |
       |   LEDGER    |      |    ENGINE     |      |     OCR      |
       +------+------+      +-------+-------+      +------+-------+
              |                     |                     |
              +---------------------+---------------------+
                                    |
                                    v
                         +----------------------+
                         |       SUPABASE       |
                         | AUTH + POSTGRESQL    |
                         +----------+-----------+
                                    |
                                    v
                         +----------------------+
                         |   FINANCIAL CONTEXT  |
                         +----------+-----------+
                                    |
                                    v
                         +----------------------+
                         |    AI COPILOT API    |
                         |   QWEN INFERENCE     |
                         +----------------------+


## APPLICATION ARCHITECTURE

pennypilot/
|
+-- app/
|   |
|   +-- api/
|   |   +-- copilot/
|   |       +-- route.ts
|   |
|   +-- components/
|   |   +-- CategoryBreakdown.tsx
|   |   +-- Copilot.tsx
|   |   +-- ExpenseModal.tsx
|   |   +-- ReceiptScanner.tsx
|   |   +-- SpendingChart.tsx
|   |   +-- Watchtower.tsx
|   |   +-- WelcomeGuide.tsx
|   |
|   +-- auth.tsx
|   +-- dashboard.tsx
|   +-- globals.css
|   +-- layout.tsx
|   +-- page.tsx
|
+-- lib/
|   +-- cashFlowEngine.ts
|   +-- csvExport.ts
|   +-- financialEngine.ts
|   +-- supabase.ts
|   +-- vendorEngine.ts
|
+-- public/
|   +-- icon.svg
|
+-- package.json
+-- tsconfig.json
+-- README.md


## TECHNOLOGY STACK

### FRONTEND

- Next.js
- React
- TypeScript
- Tailwind CSS
- Lucide React
- Recharts

### BACKEND AND DATA

- Next.js API Routes
- Supabase
- PostgreSQL
- Supabase Authentication
- PostgreSQL Row Level Security

### ARTIFICIAL INTELLIGENCE

- Hugging Face Inference
- Qwen 2.5 7B Instruct
- Context-grounded financial question answering

### OCR

- Tesseract.js

### DEPLOYMENT

The application is designed for modern web deployment and can be deployed using platforms such as Vercel.


## DATABASE MODEL

### BUSINESSES

businesses
|
+-- id
+-- owner_id
+-- business_name
+-- enterprise_type
+-- monthly_budget
+-- created_at


### EXPENSES

expenses
|
+-- id
+-- business_id
+-- amount
+-- category
+-- vendor
+-- payment_method
+-- expense_date
+-- notes
+-- created_at


### RELATIONSHIP

auth.users
     |
     | owner_id
     v
businesses
     |
     | business_id
     v
expenses


## GETTING STARTED

### PREREQUISITES

Make sure you have:

- Node.js
- npm
- A Supabase project
- A Hugging Face API token for Copilot functionality


### 1. CLONE THE REPOSITORY

    git clone https://github.com/rohansablecs/pennypilot.git
    cd pennypilot


### 2. INSTALL DEPENDENCIES

    npm install


### 3. CONFIGURE ENVIRONMENT VARIABLES

Create:

    .env.local

Add:

    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    HF_TOKEN=your_huggingface_token

Never commit .env.local to GitHub.


## SUPABASE SETUP

The application requires a Supabase PostgreSQL database.

The core tables are:

    create table public.businesses (
      id uuid primary key default gen_random_uuid(),
      owner_id uuid references auth.users(id) on delete cascade not null unique,
      business_name text not null,
      enterprise_type text not null,
      monthly_budget numeric(12,2),
      created_at timestamptz default now()
    );

    create table public.expenses (
      id uuid primary key default gen_random_uuid(),
      business_id uuid references public.businesses(id) on delete cascade not null,
      amount numeric(12,2) not null check (amount > 0),
      category text not null,
      vendor text not null,
      payment_method text not null,
      expense_date date not null default current_date,
      notes text,
      created_at timestamptz default now()
    );

Row Level Security should be enabled and configured so authenticated users can only access their own business data.

The application also uses a database trigger to automatically create the business profile after a new authenticated user is created.


## RUN LOCALLY

Start the development server:

    npm run dev

Then open:

    http://localhost:3000


## TYPICAL USER FLOW

Create Account
      ↓
Create Business Workspace
      ↓
Add Real Expense
      ↓
Set Monthly Budget
      ↓
Review Dashboard
      ↓
Inspect Categories and Vendors
      ↓
Monitor Watchtower
      ↓
Review Spending Velocity
      ↓
Ask Copilot


## DESIGN PHILOSOPHY

PennyPilot intentionally uses a restrained financial operations interface.

The design focuses on:

- Clear hierarchy
- High information density
- Readable financial values
- Minimal visual noise
- Fast transaction entry
- Explainable intelligence
- Real business data

The interface avoids turning financial management into a decorative dashboard.

The objective is to make important financial information visible without overwhelming the business owner.


## INTELLIGENCE LAYER

PennyPilot's intelligence layer is built around deterministic calculations and AI-assisted interpretation.

                    REAL TRANSACTIONS
                           |
                           v
                  +-----------------+
                  | FINANCIAL LOGIC |
                  +--------+--------+
                           |
          +----------------+----------------+
          |                |                |
          v                v                v
      Categories        Vendors        Spending Pace
          |                |                |
          +----------------+----------------+
                           |
                           v
                    FINANCIAL SIGNALS
                           |
              +------------+------------+
              |                         |
              v                         v
         DASHBOARD                  COPILOT

Deterministic calculations are used wherever a direct calculation is sufficient.

The AI layer is used for natural-language interpretation and question answering.

This separation helps keep numerical calculations transparent while allowing users to interact with their financial information conversationally.


## WHY PENNYPILOT?

Traditional expense tracking answers:

"What did I spend?"

PennyPilot is designed to move toward:

"What is happening to my business spending?"

and:

"What should I understand about my financial position?"

The platform combines transaction management, analytics, anomaly detection, budgeting and natural-language interaction into one workspace.


## CURRENT IMPLEMENTATION

Implemented:

- [x] Supabase authentication
- [x] Business workspace creation
- [x] Expense CRUD
- [x] Expense search
- [x] Category filtering
- [x] CSV export
- [x] Monthly spending calculations
- [x] Budget Guard
- [x] Category analytics
- [x] Vendor analytics
- [x] Spending charts
- [x] Watchtower anomaly detection
- [x] Receipt OCR
- [x] AI Copilot
- [x] Dark / light theme
- [x] Responsive dashboard
- [x] First-time user guidance


## FUTURE SCOPE

Potential future extensions include:

- Recurring expense detection
- Cash-flow forecasting
- Advanced vendor intelligence
- Automated monthly financial reports
- Invoice processing
- Multi-user business workspaces
- Role-based permissions
- Accounting software integrations
- Bank transaction imports
- More advanced anomaly detection
- Financial trend analysis
- Business-specific AI financial workflows

These features can be added without replacing the core ledger architecture.


## PRIVACY

PennyPilot is designed around account-isolated financial workspaces.

Financial records are associated with a business and authenticated user.

Users should never commit:

    .env.local
    API keys
    Supabase service-role keys
    Hugging Face tokens
    private credentials

to the repository.


## HACK2IGNITE

PennyPilot was developed for the Hack2Ignite problem statement:

FT-05 — Develop a digital expense tracking and analytics platform for MSMEs.

The project extends the basic expense-tracking requirement with:

- Budget monitoring
- Explainable anomaly detection
- Vendor intelligence
- Financial analytics
- Receipt OCR
- AI-powered financial interaction

The objective is to transform expense records into a practical financial decision-support workspace for MSMEs.


## TEAM

Team Celestia

Project:
PennyPilot

Problem Statement:
FT-05


## LICENSE

This project is developed as a hackathon/academic project.

Add an appropriate open-source license before publicly distributing or modifying the project for commercial use.


---

PennyPilot

Record the money.
Understand the business.
