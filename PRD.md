# Product Requirements Document (PRD)

## Project: SmartForms & Sarkari Exams India

> [!NOTE]
> This document is structured explicitly for consumption by AI code assistant agents (e.g., Google Antigravity). It serves as the master blueprint. Agents must follow the tech stack, rules, schema, and acceptance criteria rigorously.

---

## 1. Executive Summary & Target Audience

**Vision:**  
A multi-tenant SaaS platform aimed at empowering CSC (Common Service Centers) and Internet centers (B2B) to directly serve citizens and students (B2C). The platform enables operators to offer AI-generated letters, legally compliant forms, fast passport photo generation, and mock tests efficiently under a white-label setup.

**Target Audience:**
- **B2B:** Local operators, internet cafe owners, CSC operators looking to monetize digital services.
- **B2C:** Students, job seekers, and regular citizens requiring administrative and educational services.

---

## 2. Tech Stack & Agent Tooling Strategy

The agent must rigorously use the following approved technologies to build the application:

### Core Tech Stack
- **Frontend:** Next.js (App Router), Tailwind CSS, Shadcn UI
- **Backend & Database:** Supabase (Auth, PostgreSQL, Row Level Security - RLS, Storage)
- **Payments & Commission Engine:** Razorpay Route (for wallet recharges, split payments, auto-associating affiliate commissions)
- **AI & Media:** Google Gemini API (for AI document generation), Cloudinary (for optimized image hosting and background removal)

### Agent Tooling & Workflows
- **UI/UX Workflow:** Google Stitch 2.0. Base designs will be fetched and implemented via Stitch MCP. Custom UI design should be pixel-perfect based on Stitch mockups when provided.
- **Automated QA Testing:** TestSprite MCP. Adopt a Shift-Left QA approach to automatically test user auth flows, multi-tenant sub-routing, wallet deductions, and commission distributions.

---

## 3. Core Features & Business Logic (Workflows)

### 3.1 Dynamic Multi-Tenant Sub-Routing
- **Logic:** Operators are provisioned a globally unique `shop_slug`.
- **Routing:** Accessing `/[shop_slug]` loads a customized landing page for that specific CSC. 
- **White-Labeling:** The sub-route dynamic page fetches the operator's specific logo, shop name, banner, and theme colors directly from Supabase to provide a localized B2C experience. B2C user signup under this sub-route tags the user with the corresponding `referred_by_tenant_id`.

### 3.2 Affiliate Wallet Engine
- **Logic:** A dual-wallet system handling direct top-ups and commission distributions.
- **Workflow:** When a B2C user purchases a service (e.g., Mock Test, Premium Form) through an operator's affiliate link/sub-route:
  - Total payment goes through Razorpay Route.
  - The system automatically splits the transaction: `20%` flat rate is deposited directly into the operator's (tenant's) Supabase wallet balance as a commission, and `80%` routes to the main Admin.

### 3.3 Sarkari Pariksha CMS (Admin)
- **Logic:** A WordPress-style Content Management System exclusively for global Admins.
- **Workflow:** Built using TipTap classic editor. The system allows Admins to draft and publish Jobs, Results, and Admit Cards. 
- **Distribution:** Published resources automatically generate parameterized URLs to seamlessly embed the active referring operator's ID (e.g., `/[shop_slug]/jobs/[job_id]`) so any B2C conversions from standard job browsing still credit the local operator.

### 3.4 SaaS Tools Suite
- **Dynamic HTML Uploader:** 
  - Admin uploads raw HTML containing handlebars-style `{{tags}}` for form inputs. 
  - System parses variables, auto-generates a user-facing form. Upon submission, it swaps out `{{tags}}` with user input and compiles the output to PDF strictly utilizing `html2pdf.js`.
- **AI MRO Letter Generator:** 
  - Consumes user intent/topic fields and passes parameters to the Google Gemini API. 
  - Outputs formal administrative letters (such as petitions to the MRO - Mandal Revenue Officer) in supported languages: Telugu, English, and Hindi.
- **Resume Builder & Passport Photo Maker:** 
  - Leverages image background removal APIs (Cloudinary/external). 
  - Aligns and formats 8 copies of a 2x2 passport-sized photo symmetrically onto a standard A4 scale PDF layout ready for direct printing.

### 3.5 Mock Tests & Subscriptions
- **Logic:** A Computer Based Test (CBT) portal replicating official government UI testing standards.
- **Workflow:** 
  - Strict UI state execution (countdown timer, automated native submission on timer expiration, tracking of positive and negative marking metrics). 
  - **Admin feature:** Ability to bulk upload question banks (JSON or CSV mapping).
  - **Subscriptions:** Grants access limits based on tiers.
    - Basic Plan: 1-month validity.
    - Combo Plan: 6-month validity.
    - Pro Plan: 12-month validity.

---

## 4. Database Schema (Supabase PostgreSQL)

The implementation must enforce strict Row Level Security (RLS). The foundational SQL schema design expects the following primary collections and relationships:

- **`users`**
  - `id` (UUID, PK)
  - `role` (ENUM: 'admin', 'b2b_operator', 'b2c_user')
  - `wallet_balance` (NUMERIC, default 0)
  - `referred_by_tenant_id` (UUID, FK -> references `users.id`, NULL allowed)
  
- **`tenant_branding`**
  - `tenant_id` (UUID, PK, FK -> references `users.id`)
  - `shop_slug` (VARCHAR, UNIQUE)
  - `logo_url` (VARCHAR)
  - `theme_colors` (JSONB)
  - `shop_name` (VARCHAR)

- **`wallet_transactions`**
  - `id` (UUID, PK)
  - `user_id` (UUID, FK -> references `users.id`)
  - `amount` (NUMERIC, positive for credit, negative for debit)
  - `transaction_type` (ENUM: 'recharge', 'service_deduction', 'affiliate_commission')
  - `reference_id` (VARCHAR - Razorpay payment ID or related entity ID)
  - `created_at` (TIMESTAMP)

- **`html_templates`**
  - `id` (UUID, PK)
  - `title` (VARCHAR)
  - `raw_html` (TEXT)
  - `parsed_fields` (JSONB)
  - `price` (NUMERIC)

- **`govt_posts`**
  - `id` (UUID, PK)
  - `title` (VARCHAR)
  - `category` (ENUM: 'job', 'result', 'admit_card')
  - `content_html` (TEXT, from TipTap)
  - `published_at` (TIMESTAMP)

- **`mock_tests` & `subscription_plans`**
  - `mock_tests`: `id`, `title`, `duration_minutes`, `negative_marking_ratio`, `questions_payload` (JSONB/FK reference)
  - `subscription_plans`: `id`, `name` (Basic, Combo, Pro), `validity_months`, `price`

---

## 5. Required Agent Skills (.agents/skills)

As the AI coding agent steps through the repository, initialize and rigorously adhere to these domain skill definitions:

- `[x] nextjs-app-router-expert`
- `[x] supabase-database-architect`
- `[x] stitch-ui-integrator`
- `[x] testsprite-qa-automation`

> [!IMPORTANT]
> The agent must prioritize server components where possible, offload mutations to Server Actions, and cleanly abstract data-fetching logic inside route handlers or server functions depending on state requirements.

---

## 6. Acceptance Criteria (Given/When/Then Logic)

Automated testing scripts and QA validation must verify the following critical business logic branches:

**Scenario: Multi-Tenant Branding Resolution**
- **Given** an active tenant `Operator A` has configured `shop_slug` as "my-csc" with a custom teal logo.
- **When** a B2C user navigates to `/[shop_slug]`.
- **Then** the page must resolve without a 404, the UI must replace the primary header logo with the exact custom teal logo from `tenant_branding`, and any subsequent user registrations must securely record `Operator A`'s user ID into `referred_by_tenant_id`.

**Scenario: Digital Service Wallet Deduction**
- **Given** a B2B operator has 50.00 INR in their `wallet_balance`.
- **When** the operator generates an AI MRO Letter costing 10.00 INR.
- **Then** the application triggers a Supabase RPC or Server Action. The `wallet_balance` must immediately reflect 40.00 INR, a `wallet_transactions` record of type `service_deduction` must be committed, and only then is the PDF payload returned.

**Scenario: Affiliate Commission Splitting**
- **Given** a B2C user registers under `Operator A` and purchases a Combo Mock Test for 100.00 INR.
- **When** the Razorpay routing webhook confirms capturing the payment logic.
- **Then** exactly 20.00 INR must hit `Operator A`'s wallet as an `affiliate_commission` transaction, and the user must immediately gain active access to the `Combo Plan` roles/permissions.

**Scenario: Headless CMS Job Publication**
- **Given** the global Admin creates a new "Bank PO" job opening using the internal TipTap editor.
- **When** the Admin clicks "Publish".
- **Then** the job state converts to live, dynamic SEO-friendly metadata is populated on the backend, and navigating to any `/[shop_slug]/jobs/bank-po` renders the exact same content wrapped in that specific shop's navigational theme.
