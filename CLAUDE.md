# AutoComplaint

AI-powered complaint automation platform for UK citizens. Generates professional complaints from plain-language descriptions and routes them to the correct recipient (companies, MPs, regulators).

## VibeCodes

- **Idea ID:** `7e571896-fffb-4262-8019-d8929f7c8396`
- **Board status:** 31 backlog, 9 to do, 2 in progress, 5 in verify, 0 done
- **In progress:** Refactor email service from SendGrid to Resend (awaiting final sign-off), Set up email delivery infrastructure
- **In verify:** Validate MVP scope, Auth & profiles, Prompt templates, MP lookup, LLM integration

## Tech Stack

- **Framework:** Next.js 16 (App Router) with TypeScript
- **Styling:** Tailwind CSS v4
- **Package manager:** npm
- **Hosting:** Vercel — not yet deployed
- **Database:** Supabase (PostgreSQL)
- **AI:** Claude API (`@anthropic-ai/sdk`) for complaint generation
- **Email (MVP):** mailto/clipboard — user sends from their own email client
- **Email (future):** Resend (with svix for webhook verification) — direct sending as premium feature

## Project Structure

```
src/
├── app/
│   ├── (auth)/                    # Auth pages (login, register, password reset)
│   ├── (protected)/               # Authenticated routes (dashboard, profile)
│   ├── api/
│   │   ├── account/               # Account management
│   │   ├── complaints/
│   │   │   ├── generate/          # AI complaint generation
│   │   │   └── send/              # Email sending with rate limiting
│   │   ├── mp/                    # MP lookup by postcode
│   │   └── webhooks/resend/       # Resend email status webhooks
│   ├── auth/callback/             # Supabase auth callback
│   ├── page.tsx                   # Home page
│   └── layout.tsx                 # Root layout
├── components/
│   └── nav-bar.tsx
├── lib/supabase/                  # Supabase client/server/middleware
├── proxy.ts
└── services/
    ├── complaint-generator/       # LLM prompt templates and generation
    ├── email/                     # Resend email service with retry logic
    └── mp-lookup/                 # TheyWorkForYou API integration
supabase/
└── migrations/                    # Database schema migrations
```

## Commands

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run lint      # ESLint
```

## MVP Scope (Phase 1)

1. **Multi-step complaint input form** — category, description, desired outcome, tone preference
2. **AI complaint generation** — Claude API to produce professional complaint letters
3. **Recipient database** — UK companies (top 500) and MPs (postcode-to-constituency lookup)
4. **Complaint delivery** — mailto link / copy-to-clipboard (user sends from their own email)
5. **User auth & profiles** — account management, stored details, complaint history
6. **Complaint history dashboard** — track submitted complaints and status

### Key integrations
- TheyWorkForYou API / Parliament.uk — MP lookup by postcode
- Postcode.io — postcode validation and constituency lookup
- Resend — direct email delivery (future premium feature)
- Claude API — complaint text generation

## Current Status

Core backend services are built: auth, complaint generation, MP lookup, email delivery (Resend). Several features are in verify. The project is not yet deployed to Vercel. Next priorities from the board:

1. Set up Vercel deployment and configure environment variables
2. Design multi-step complaint input form
3. Create complaint submission workflow
4. Design and implement complaint history dashboard
