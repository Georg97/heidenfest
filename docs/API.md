# skol REST API v1

Base URL: `{app-origin}/api/v1` · All responses: `{ "ok": true, "data": … }` or an error
`{ "message": "…" }` with a matching HTTP status (400/401/403/404).

## Authentication

One of:

- **API token** (for agents / the MCP server): `Authorization: Bearer skol_…`
  Minted in the web app under *Profil → API-Schlüssel*. A token acts with the
  full rights of its user. Tokens cannot manage tokens.
- **Session cookie** — same as the web app (useful from the browser/dev tools).

## Conventions

- Dates (`startDate`, `endDate`) accept ms-epoch numbers or `"YYYY-MM-DD"`.
- IDs are Convex document ids (strings), as returned by the API.
- Roles: app admins implicitly hold event-admin rights everywhere.

## Routes

### Me
| Method | Path | Notes |
|---|---|---|
| GET | `/me` | Current user (`401` if token invalid) |

### Events
| Method | Path | Body |
|---|---|---|
| GET | `/events` | — (my events, app admin: all) |
| POST | `/events` | `name`, `startDate`, `endDate`, `brief?` — creator becomes event admin |
| GET | `/events/:id` | — (includes `role`) |
| PATCH | `/events/:id` | any of `name`, `brief`, `startDate`, `endDate` |
| DELETE | `/events/:id` | cascades lists, entries, marks, pages, members |
| POST | `/events/:id/duplicate` | `startDate`, `endDate`, `name?` — copies lists+pages, not marks/members |

### Lists & entries
| Method | Path | Body |
|---|---|---|
| GET | `/events/:id/lists` | — (lists with entries and marks incl. user names) |
| POST | `/events/:id/lists` | `title`, `description?` (event admin) |
| PATCH | `/lists/:id` | `title?`, `description?` (event admin) |
| DELETE | `/lists/:id` | (event admin) |
| POST | `/lists/:id/copy` | `targetEventId` — raw copy without marks (admin of target) |
| POST | `/lists/:id/entries` | `title` (event admin) |
| PATCH | `/entries/:id` | `title` (event admin) |
| DELETE | `/entries/:id` | (event admin) |
| POST | `/entries/:id/mark` | `comment?` — "I bring this" for the acting user; re-marking updates the comment |
| DELETE | `/marks/:id` | own mark, or any mark as event admin |

### Pages (markdown)
| Method | Path | Body |
|---|---|---|
| GET | `/events/:id/pages` | — |
| POST | `/events/:id/pages` | `title`, `content?` (event admin) |
| PATCH | `/pages/:id` | `title?`, `content?` (event admin) |
| DELETE | `/pages/:id` | (event admin) |

### Members & invites
| Method | Path | Body |
|---|---|---|
| GET | `/events/:id/members` | — |
| POST | `/events/:id/members` | `email` (event admin). Registered user → joins as guest (`{status:"added"}`); unknown email → invitation email, joins on signup (`{status:"invited"}`) |
| PATCH | `/members/:id` | `role`: `"guest"` \| `"admin"` (event admin) |
| DELETE | `/members/:id` | not yourself (event admin) |
| GET | `/events/:id/invites` | pending email invites (empty for non-admins) |
| DELETE | `/invites/:id` | withdraw a pending invite (event admin) |

### Notifications
| Method | Path | Body |
|---|---|---|
| GET | `/notifications` | — → `{ notifications: […], unreadCount }`, newest first (50) |
| POST | `/notifications/:id/read` | — |
| POST | `/notifications/read-all` | — |
| PATCH | `/me/settings` | `notifyInApp?`, `notifyEmail?` (booleans; defaults: in-app on, email off) |

Notifications are created for: invites, event updates, new lists and new info
pages — always for everyone in the event except the acting user. Email copies
are sent from Convex (scheduler) when the user opted in; invitation emails to
not-yet-registered people are always sent.

### App admin
| Method | Path | Body |
|---|---|---|
| GET | `/users` | — |
| PATCH | `/users/:id` | `isAppAdmin: boolean` |
| DELETE | `/users/:id/participation` | removes all memberships + marks, keeps the account |

### API tokens (session-only)
| Method | Path | Body |
|---|---|---|
| GET | `/tokens` | — (no hashes) |
| POST | `/tokens` | `name` → returns the raw token **once** |
| DELETE | `/tokens/:id` | — |
