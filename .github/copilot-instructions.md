# SkillSwap – Agent Instructions

Context and guidelines for AI-assisted development of the SkillSwap capstone project.

## Project Overview

**SkillSwap** is a multi-page web platform where users exchange skills: they publish what they can teach and what they want to learn, browse other users' skills, and send swap requests.

- **Course:** Software Technologies with AI (SoftUni)
- **Live stack:** Vanilla JS + Bootstrap 5 + Vite + Supabase
- **Supabase project ref:** `xsmzmmvtdrvfobljimym`
- **Supabase URL:** `https://xsmzmmvtdrvfobljimym.supabase.co`

## Strict Architectural Rules

1. **Multi-page application (MPA)** – each screen is a separate HTML file. Do **not** build a Single Page Application (SPA) or client-side router.
2. **No UI frameworks** – do not use React, Vue, Angular, or TypeScript.
3. **Vanilla ES6+ JavaScript** only for application logic.
4. **Bootstrap 5** for UI components (modals, dropdowns, alerts, grid, forms). Reuse Bootstrap patterns instead of custom UI widgets.
5. **Separation of concerns** – HTML for structure, CSS for styling, JS for behavior. Supabase/API logic lives in `services/`, not inline in HTML.

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML, CSS, Vanilla JS, Bootstrap 5, Bootstrap Icons |
| Build | Node.js, npm, Vite (multi-page) |
| Backend | Supabase (PostgreSQL, Auth, Storage, RLS) |
| Deployment | Netlify / Vercel (static `dist/`) |

## Folder Structure

```
skill-swap/
├── index.html              # Home – browse skills
├── login.html              # Login
├── register.html           # Registration
├── profile.html            # User profile + avatar upload
├── skill-form.html         # Create / edit skill
├── swap-requests.html      # Swap request management
├── admin.html              # Admin panel (role: admin)
├── css/
│   └── main.css            # Global custom styles
├── js/
│   ├── app.js              # Shared imports (Bootstrap, main.css)
│   ├── components/         # Reusable UI helpers (e.g. navbar)
│   └── pages/              # One JS entry per HTML page
├── services/               # Business logic & Supabase integration
│   ├── supabaseClient.js   # Supabase client singleton
│   ├── authService.js      # register, login, logout, session, roles
│   ├── skillsService.js    # CRUD for skills
│   ├── swapService.js      # Swap requests
│   └── storageService.js   # File upload / download
├── public/                 # Static assets (favicon, etc.)
├── supabase/
│   ├── config.toml         # Supabase CLI config
│   └── migrations/         # SQL migration files (version controlled)
├── .env                    # Local secrets (NOT committed)
├── .env.example            # Env template
└── vite.config.js          # Multi-page build entries
```

## Vite Multi-Page Setup

Each HTML page is a separate Vite entry in `vite.config.js`:

- `index.html` → `js/pages/home.js`
- `login.html` → `js/pages/login.js`
- `register.html` → `js/pages/register.js`
- `profile.html` → `js/pages/profile.js`
- `skill-form.html` → `js/pages/skill-form.js`
- `swap-requests.html` → `js/pages/swap-requests.js`
- `admin.html` → `js/pages/admin.js`

Page scripts should:

1. Import `../app.js` (Bootstrap + global CSS).
2. Import and render shared components (navbar).
3. Import services for data operations.
4. Keep DOM-specific logic in the page file only.

## Supabase Integration

### Environment Variables

```env
VITE_SUPABASE_URL=https://xsmzmmvtdrvfobljimym.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

Access in JS via `import.meta.env.VITE_SUPABASE_*`.

Always use `services/supabaseClient.js` – do not create multiple Supabase clients.

### Planned Database Schema (Phase 1+)

| Table | Purpose |
|-------|---------|
| `profiles` | User profile (username, bio, avatar_url) – 1:1 with `auth.users` |
| `user_roles` | RBAC: `user` or `admin` |
| `categories` | Skill categories |
| `skills` | Skills to teach or learn (`type`: `teach` / `learn`) |
| `swap_requests` | Swap proposals between users |

Relationships:

- `auth.users` → `profiles`, `user_roles`
- `profiles` → `skills`, `swap_requests`
- `categories` → `skills`

### Migrations Workflow

- **Always** change schema via SQL files in `supabase/migrations/`.
- Name format: `YYYYMMDDHHMMSS_description.sql`
- Apply to remote with Supabase MCP `apply_migration` or CLI `npx supabase db push`.
- Keep migration history synced in Git – migrations are committed; `.env` is not.

```bash
# Local Supabase (optional)
npx supabase start
npx supabase db reset

# Link to remote project (one-time, requires access token)
npx supabase link --project-ref xsmzmmvtdrvfobljimym
```

### Row-Level Security (RLS)

- Enable RLS on all public tables.
- Public read for profiles and skills where appropriate.
- Users may only update their own profile, skills, and swap requests.
- Admin access via `user_roles.role = 'admin'` helper function or policy subquery.

### Storage Buckets (planned)

| Bucket | Purpose |
|--------|---------|
| `avatars` | Profile pictures |
| `skill-images` | Optional skill cover images |

Upload/download logic belongs in `services/storageService.js`.

## Authentication & Authorization

- Supabase Auth with email/password (JWT).
- On register: trigger creates `profiles` + `user_roles` (default `user`).
- Protected pages: check session in page JS; redirect to `login.html` if unauthenticated.
- Admin pages: verify `user_roles.role === 'admin'` before rendering admin UI.

## UI / UX Guidelines

- Language: English UI text.
- Responsive layout with Bootstrap grid (`container`, `row`, `col-*`).
- Use Bootstrap Icons (`bi-*`) for visual cues.
- Feedback: Bootstrap alerts or toasts for success/error.
- Loading and empty states on all data-driven lists.

## Coding Conventions

- ES modules (`import` / `export`).
- `async/await` for Supabase calls.
- Descriptive function names: `fetchSkills`, `createSwapRequest`, `uploadAvatar`.
- Handle errors from Supabase `{ data, error }` and show user-friendly messages.
- No inline SQL in frontend – use Supabase client `.from()`, `.auth`, `.storage`.

## Do Not

- Do not convert to SPA or add a JS router.
- Do not add React, Vue, TypeScript, or jQuery.
- Do not put Supabase keys in committed files.
- Do not bypass RLS with service role key in frontend code.
- Do not create monolithic JS files – split by page and service.

## Local Development

```bash
npm install
cp .env.example .env   # fill in Supabase credentials
npm run dev            # http://localhost:5173
npm run build          # output to dist/
```

## Deployment Notes

- Build command: `npm run build`
- Publish directory: `dist`
- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in hosting env vars.
- Add production URL to Supabase Auth → URL Configuration (Site URL + Redirect URLs).

## Demo Credentials (planned)

- Regular user: created via register flow
- Admin: `demo@skillswap.bg` / `demo123` (seed in Phase 1)
