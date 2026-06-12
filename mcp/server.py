"""skol MCP server — full feature access to the skol event planning app.

Wraps the skol REST API (docs/API.md) so an agent (e.g. in a group chat) can
plan events: manage "who brings what" lists, write info pages, invite guests.

Configuration via environment variables:
    SKOL_API_TOKEN  (required) — minted in the skol web app under Profil → API-Schlüssel.
                    The agent acts with the full rights of the token's user.
    SKOL_API_URL    (optional) — app origin, default http://localhost:5173

Run:  uv run --directory mcp skol-mcp   (or: uv run mcp/server.py)
"""

import os

import httpx
from fastmcp import FastMCP
from fastmcp.exceptions import ToolError

mcp = FastMCP(
    "skol",
    instructions=(
        "skol is an event planning app for groups of friends. The main entity is "
        "the event (name, timeframe, brief). Events have resource lists "
        "('who brings what') whose entries users can mark with an optional "
        "comment, markdown info pages, and members (guests / event admins). "
        "You act as the user who owns the API token. Dates are 'YYYY-MM-DD' "
        "strings or millisecond timestamps; returned timestamps are ms epoch."
    ),
)


def _client() -> httpx.Client:
    token = os.environ.get("SKOL_API_TOKEN")
    if not token:
        raise ToolError("SKOL_API_TOKEN is not set")
    base = os.environ.get("SKOL_API_URL", "http://localhost:5173").rstrip("/")
    return httpx.Client(
        base_url=f"{base}/api/v1",
        headers={"authorization": f"Bearer {token}"},
        timeout=30,
    )


def _call(method: str, path: str, body: dict | None = None):
    payload = None
    if body is not None:
        payload = {k: v for k, v in body.items() if v is not None}
    with _client() as client:
        res = client.request(method, path, json=payload)
    if res.status_code >= 400:
        try:
            message = res.json().get("message", res.text)
        except ValueError:
            message = res.text
        raise ToolError(f"{res.status_code}: {message}")
    return res.json().get("data")


# ---- me ----


@mcp.tool
def whoami() -> dict:
    """The user this token acts as (name, email, isAppAdmin)."""
    return _call("GET", "/me")


# ---- events ----


@mcp.tool
def list_events() -> list:
    """All events visible to the user, newest first, each with the user's role."""
    return _call("GET", "/events")


@mcp.tool
def get_event(event_id: str) -> dict:
    """A single event with the user's role ('guest' or 'admin')."""
    return _call("GET", f"/events/{event_id}")


@mcp.tool
def create_event(name: str, start_date: str, end_date: str, brief: str = "") -> str:
    """Create an event; the user becomes its first event admin. Returns the event id.

    Dates: 'YYYY-MM-DD'. The brief is a short description shown on the event card.
    """
    return _call(
        "POST",
        "/events",
        {"name": name, "startDate": start_date, "endDate": end_date, "brief": brief},
    )


@mcp.tool
def update_event(
    event_id: str,
    name: str | None = None,
    brief: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
) -> None:
    """Update event fields (event admin only). Only provided fields change."""
    _call(
        "PATCH",
        f"/events/{event_id}",
        {"name": name, "brief": brief, "startDate": start_date, "endDate": end_date},
    )


@mcp.tool
def delete_event(event_id: str) -> None:
    """Delete an event and everything in it (lists, pages, members). Irreversible."""
    _call("DELETE", f"/events/{event_id}")


@mcp.tool
def duplicate_event(
    event_id: str, start_date: str, end_date: str, name: str | None = None
) -> str:
    """Create a sequel of an event: copies lists (entries, not marks) and pages.

    Members are not copied; the user becomes the new event's admin. The new
    timeframe may equal the old one. Returns the new event id.
    """
    return _call(
        "POST",
        f"/events/{event_id}/duplicate",
        {"startDate": start_date, "endDate": end_date, "name": name},
    )


# ---- lists, entries, marks ----


@mcp.tool
def get_lists(event_id: str) -> list:
    """All lists of an event, with entries and marks (who brings what, comments)."""
    return _call("GET", f"/events/{event_id}/lists")


@mcp.tool
def create_list(event_id: str, title: str, description: str | None = None) -> str:
    """Create a resource list (event admin only), e.g. 'Wer bringt was zum Grillen?'."""
    return _call(
        "POST", f"/events/{event_id}/lists", {"title": title, "description": description}
    )


@mcp.tool
def update_list(list_id: str, title: str | None = None, description: str | None = None) -> None:
    """Rename a list or change its description (event admin only)."""
    _call("PATCH", f"/lists/{list_id}", {"title": title, "description": description})


@mcp.tool
def delete_list(list_id: str) -> None:
    """Delete a list with all entries and marks (event admin only)."""
    _call("DELETE", f"/lists/{list_id}")


@mcp.tool
def copy_list(list_id: str, target_event_id: str) -> str:
    """Copy a list (entries, no marks) into another event the user administers.

    Returns the new list id. This is a raw copy — no syncing afterwards.
    """
    return _call("POST", f"/lists/{list_id}/copy", {"targetEventId": target_event_id})


@mcp.tool
def add_entry(list_id: str, title: str) -> str:
    """Add an entry to a list (event admin only), e.g. 'Feuerholz'. Returns its id."""
    return _call("POST", f"/lists/{list_id}/entries", {"title": title})


@mcp.tool
def update_entry(entry_id: str, title: str) -> None:
    """Rename a list entry (event admin only)."""
    _call("PATCH", f"/entries/{entry_id}", {"title": title})


@mcp.tool
def delete_entry(entry_id: str) -> None:
    """Delete a list entry including its marks (event admin only)."""
    _call("DELETE", f"/entries/{entry_id}")


@mcp.tool
def mark_entry(entry_id: str, comment: str | None = None) -> str:
    """Mark an entry as 'I bring this' for the acting user, with an optional comment.

    Marking an entry the user already marked updates the comment. Several
    users may mark the same entry. Returns the mark id.
    """
    return _call("POST", f"/entries/{entry_id}/mark", {"comment": comment})


@mcp.tool
def unmark(mark_id: str) -> None:
    """Remove a mark (own mark; event admins may remove any). Mark ids come from get_lists."""
    _call("DELETE", f"/marks/{mark_id}")


# ---- pages ----


@mcp.tool
def get_pages(event_id: str) -> list:
    """All markdown info pages of an event (meeting point, schedule, …)."""
    return _call("GET", f"/events/{event_id}/pages")


@mcp.tool
def create_page(event_id: str, title: str, content: str) -> str:
    """Create a markdown info page (event admin only). Returns its id."""
    return _call("POST", f"/events/{event_id}/pages", {"title": title, "content": content})


@mcp.tool
def update_page(page_id: str, title: str | None = None, content: str | None = None) -> None:
    """Update a page's title and/or markdown content (event admin only)."""
    _call("PATCH", f"/pages/{page_id}", {"title": title, "content": content})


@mcp.tool
def delete_page(page_id: str) -> None:
    """Delete an info page (event admin only)."""
    _call("DELETE", f"/pages/{page_id}")


# ---- members ----


@mcp.tool
def get_members(event_id: str) -> list:
    """Members of an event with name, email and role ('guest' or 'admin')."""
    return _call("GET", f"/events/{event_id}/members")


@mcp.tool
def add_member(event_id: str, email: str) -> dict:
    """Invite someone to an event by email (event admin only).

    Registered users are added as guests right away (status 'added');
    unknown emails get an invitation email and join automatically once they
    sign up with that address (status 'invited').
    """
    return _call("POST", f"/events/{event_id}/members", {"email": email})


@mcp.tool
def list_invites(event_id: str) -> list:
    """Pending email invites of an event (people who have not signed up yet)."""
    return _call("GET", f"/events/{event_id}/invites")


@mcp.tool
def revoke_invite(invite_id: str) -> None:
    """Withdraw a pending email invite (event admin only)."""
    _call("DELETE", f"/invites/{invite_id}")


@mcp.tool
def set_member_role(member_id: str, role: str) -> None:
    """Promote a guest to event admin or demote back; role is 'guest' or 'admin'."""
    _call("PATCH", f"/members/{member_id}", {"role": role})


@mcp.tool
def remove_member(member_id: str) -> None:
    """Remove a member from an event (event admin only, not yourself)."""
    _call("DELETE", f"/members/{member_id}")


# ---- notifications ----


@mcp.tool
def list_notifications() -> dict:
    """The user's latest notifications (newest first) plus the unread count."""
    return _call("GET", "/notifications")


@mcp.tool
def mark_notification_read(notification_id: str) -> None:
    """Mark one notification as read."""
    _call("POST", f"/notifications/{notification_id}/read")


@mcp.tool
def mark_all_notifications_read() -> None:
    """Mark all of the user's notifications as read."""
    _call("POST", "/notifications/read-all")


@mcp.tool
def update_notification_settings(
    notify_in_app: bool | None = None, notify_email: bool | None = None
) -> None:
    """Change the user's notification settings (defaults: in-app on, email off)."""
    _call(
        "PATCH",
        "/me/settings",
        {"notifyInApp": notify_in_app, "notifyEmail": notify_email},
    )


# ---- app admin ----


@mcp.tool
def list_users() -> list:
    """All registered users (app admin only)."""
    return _call("GET", "/users")


def main() -> None:
    mcp.run()


if __name__ == "__main__":
    main()
