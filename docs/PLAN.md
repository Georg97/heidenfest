# skol — Event Planning App

> *Skål!* — the Nordic toast. Good vibes, social gatherings, shared fires.

skol turns the Heidenfest landing page into a small, self-hosted event planning
app for groups of friends: events, "who brings what" lists, markdown info pages,
and an MCP server so an AI agent can help plan from inside a group chat.

This document is the living plan. Checklists get updated as work progresses.

---

## 1. Architecture decisions

| Decision | Choice | Why |
|---|---|---|
| Frontend | SvelteKit 2 + Svelte 5 + Tailwind 4 + bits-ui (existing) | Already in place, works well |
| Backend | **Convex** (free tier) | Great DX, realtime subscriptions for free |
| Auth | **Better Auth** running *inside* Convex via `@convex-dev/better-auth` component | Official integration; SvelteKit proxies `/api/auth/*` so cookies + Google OAuth redirect URIs stay on the app origin |
| Svelte bindings | `convex-svelte` / `@mmailaender/convex-svelte` + `@mmailaender/convex-better-auth-svelte` | The official SvelteKit guide path (labs.convex.dev/better-auth) |
| Images | **Cloudflare R2** via presigned URLs from SvelteKit server routes | Convex storage avoided (free tier); R2 bucket provided |
| Machine API | REST under `/api/v1` in SvelteKit, Bearer token auth | Clean surface for the MCP server; tokens hashed in Convex |
| MCP server | Python **fastmcp** in `mcp/`, wraps the REST API | Per requirement; agent-friendly planning tools |

KISS principles apply throughout: no premature abstraction, one obvious way to
do each thing, features stay small and composable.

### Free-tier guardrails
- No Convex file storage, no crons, no scheduled functions.
- Queries use indexes (no table scans on hot paths).
- Images go to R2; Convex only stores object keys.

## 2. Domain model

The **event** is the main entity.

```
users          mirror of Better Auth users + app fields
               { authId, name, email, image?, isAppAdmin }
events         { name, brief, startDate, endDate, imageKey?, createdBy }
eventMembers   { eventId, userId, role: "guest" | "admin" }   // event admin
lists          { eventId, title, description?, sortKey }
listEntries    { listId, title, sortKey }
entryMarks     { entryId, listId, userId, comment?, createdAt }
pages          { eventId, title, content (markdown), sortKey, updatedBy, updatedAt }
apiTokens      { userId, name, tokenHash, prefix, createdAt, lastUsedAt? }
```

Notes:
- Multiple users may mark the same entry (two people can bring veggies); each
  mark can carry a comment.
- Lists are **copyable** into any event the actor administers (raw copy of the
  list + entries, no marks, no sync).
- Events are **duplicatable** (copies event fields + lists + pages, not marks
  or members; prompts for a new timeframe, keeping it is allowed). Duplicator
  becomes creator + first event admin of the copy.
- The creator of an event is automatically its first event admin.

### Roles
| Capability | Guest | Event admin | App admin |
|---|---|---|---|
| See events they're a member of | ✓ | ✓ | ✓ (all) |
| Mark/unmark list entries + comment | ✓ | ✓ | ✓ |
| Create events | ✓ | ✓ | ✓ |
| Edit/delete event, lists, entries, pages | | ✓ | ✓ |
| Manage guests, promote to event admin | | ✓ | ✓ |
| Duplicate event / copy lists in | | ✓ | ✓ |
| Manage users globally, grant app admin | | | ✓ |

App admins are flagged on the user; event admins are per-event memberships.
First registered user becomes app admin (bootstrap).

## 3. Surfaces

- **Web app** (mobile-first): landing page (kept, rethemed to skol), login,
  events overview, event detail (brief, pages, lists), list marking UX,
  markdown page editor, profile (name + picture), admin settings.
- **REST API** `/api/v1/*`: full feature parity, Bearer token.
- **MCP** `mcp/`: fastmcp tools over the REST API; token via env var. Intended
  use: a chat agent (e.g. in the event's group chat) plans via these tools.

## 4. Phases & checklists

### Phase 0 — Research & plan
- [x] Read existing codebase
- [x] Research Convex + Better Auth + SvelteKit integration
- [x] Write this plan

### Phase 1 — Convex migration (commit checkpoint: "move to convex successful")
- [x] Install convex + better-auth component packages
- [x] Provision Convex dev deployment (`skol-870a8` / `healthy-gazelle-742`, eu-west-1)
- [x] `convex/` setup: convex.config.ts, auth.config.ts, auth.ts, http.ts, schema.ts
- [x] Convex env vars set (SITE_URL, BETTER_AUTH_SECRET, GOOGLE_*)
- [x] SvelteKit wiring: auth proxy route, hooks.server.ts, auth-client.ts, +layout.svelte
- [x] Users mirrored into app `users` table on signup (first user → app admin)
- [x] Email/password sign-up + sign-in + SSR session verified end-to-end
      (Google OAuth config-identical via proxy; verify once in browser)
- [x] Turso/Drizzle removed (deps, src/db, src/index.ts, drizzle.config.ts)
- [x] svelte-check green → **commit**

> Note: a `smoke-test@example.com` user exists in the dev deployment from
> automated verification and currently holds the bootstrap app-admin flag.
> Wipe it before real use so the first real signup becomes app admin.

### Phase 2 — skol rebrand
- [ ] package.json name, titles, favicon, nav branding
- [ ] Landing page generalized (skol identity, campfire theme retained)
- [ ] App shell: mobile-first nav (frontend-design skill)

### Phase 3 — Core features
- [ ] Convex schema for domain tables + indexes
- [ ] Authorization helpers (requireUser, requireEventMember, requireEventAdmin, requireAppAdmin)
- [ ] Events: CRUD, duplicate (new timeframe prompt), member management, promote admin
- [ ] Lists: CRUD, copy into event, entries CRUD, mark/unmark with comment
- [ ] Pages: CRUD with markdown editor + sanitized rendering
- [ ] R2 presigned upload + image display (profile picture, event image)
- [ ] Profile page; admin settings page
- [ ] Realtime: convex-svelte useQuery on event detail/lists

### Phase 4 — API + MCP
- [ ] apiTokens table + token mint/revoke UI (hashed storage, shown once)
- [ ] `/api/v1` REST routes with Bearer auth (events, lists, entries, marks, pages, members)
- [ ] OpenAPI-ish route summary in docs/API.md
- [ ] `mcp/` fastmcp server with tools for all features, SKOL_API_TOKEN env
- [ ] MCP smoke test against running dev server

### Phase 5 — Verification
- [ ] svelte-check clean
- [ ] vite build clean
- [ ] Manual run-through of main flows (mobile viewport)
- [ ] PLAN.md checklists updated, final commit

## 5. Environment variables

| Var | Where | Purpose |
|---|---|---|
| `CONVEX_DEPLOYMENT` | `.env.local` (CLI-managed) | Dev deployment ref |
| `PUBLIC_CONVEX_URL` | `.env.local` | Convex cloud URL (client) |
| `PUBLIC_CONVEX_SITE_URL` | `.env.local` | Convex HTTP actions URL (auth proxy target) |
| `SITE_URL`, `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID/SECRET` | Convex deployment env | Better Auth runs inside Convex |
| `R2_ENDPOINT`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | `.env` | Presigned uploads (server only) |

## 6. Open questions / needs from Georg

- Convex login/team selection if CLI auth is missing (interactive browser step).
- Google OAuth redirect URI stays `http://localhost:5173/api/auth/callback/google`
  thanks to the proxy — production domain needs adding later.
- R2 public access: bucket needs either a public dev URL or we proxy GETs
  through SvelteKit (start with proxy; zero config).
