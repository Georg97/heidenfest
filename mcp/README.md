# skol MCP server

Gives an AI agent full access to skol: events, "who brings what" lists,
markdown info pages and member management. Intended use: hook an agent
(e.g. OpenClaw/Hermes in the event's group chat) up to skol so it can keep
lists tidy, answer "wer bringt eigentlich Bier?" and prepare the next event.

## Setup

1. In the skol web app, open **Profil → API-Schlüssel** and create a token
   (e.g. "WhatsApp-Agent"). The agent acts with the rights of your account.
2. Run the server (stdio transport, [uv](https://docs.astral.sh/uv/) required):

```bash
SKOL_API_TOKEN=skol_…  SKOL_API_URL=https://your-skol-domain  uv run --directory mcp skol-mcp
```

`SKOL_API_URL` defaults to `http://localhost:5173`.

Example client config (Claude Desktop / any MCP client):

```json
{
  "mcpServers": {
    "skol": {
      "command": "uv",
      "args": ["run", "--directory", "<repo>/mcp", "skol-mcp"],
      "env": {
        "SKOL_API_TOKEN": "skol_…",
        "SKOL_API_URL": "http://localhost:5173"
      }
    }
  }
}
```

## Tools

Full feature parity with the app (26 tools): `whoami`, `list_events`,
`get_event`, `create_event`, `update_event`, `delete_event`,
`duplicate_event`, `get_lists`, `create_list`, `update_list`, `delete_list`,
`copy_list`, `add_entry`, `update_entry`, `delete_entry`, `mark_entry`,
`unmark`, `get_pages`, `create_page`, `update_page`, `delete_page`,
`get_members`, `add_member`, `set_member_role`, `remove_member`,
`list_users`.

Permissions mirror the app: guests mark entries, event admins manage
lists/pages/members, app admins everything.

## Test

With the dev server running and a valid token:

```bash
SKOL_API_TOKEN=skol_… uv run --directory mcp python test_smoke.py
```
