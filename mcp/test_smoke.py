"""In-memory smoke test of the skol MCP server against the running dev app.

Usage: SKOL_API_TOKEN=skol_… uv run --directory mcp python test_smoke.py
"""

import asyncio
import json
import sys

from fastmcp import Client

from server import mcp

failures = 0


def check(label: str, cond: bool, extra: str = "") -> None:
    global failures
    print(f"{'PASS' if cond else 'FAIL'}  {label}{f' — {extra}' if extra else ''}")
    if not cond:
        failures += 1


def data(result):
    text = result.content[0].text
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return text  # plain string results (e.g. ids)


async def main() -> None:
    async with Client(mcp) as client:
        tools = await client.list_tools()
        check("tool count (full feature set)", len(tools) >= 24, f"{len(tools)} tools")

        me = data(await client.call_tool("whoami", {}))
        check("whoami", me.get("email") == "smoke-test@example.com")

        event_id = data(
            await client.call_tool(
                "create_event",
                {
                    "name": "MCP-Test Fest",
                    "start_date": "2026-09-04",
                    "end_date": "2026-09-06",
                    "brief": "Vom Agenten angelegt.",
                },
            )
        )
        check("create_event", isinstance(event_id, str) and len(event_id) > 10)

        list_id = data(
            await client.call_tool(
                "create_list", {"event_id": event_id, "title": "Agenten-Liste"}
            )
        )
        entry_id = data(await client.call_tool("add_entry", {"list_id": list_id, "title": "Met"}))
        await client.call_tool("mark_entry", {"entry_id": entry_id, "comment": "2 Flaschen"})
        lists = data(await client.call_tool("get_lists", {"event_id": event_id}))
        check(
            "list -> entry -> mark roundtrip",
            lists[0]["entries"][0]["marks"][0]["comment"] == "2 Flaschen",
        )

        page_id = data(
            await client.call_tool(
                "create_page",
                {"event_id": event_id, "title": "Plan", "content": "# Hallo\n\nVom Agenten."},
            )
        )
        pages = data(await client.call_tool("get_pages", {"event_id": event_id}))
        check("create_page", any(p["_id"] == page_id for p in pages))

        # error surface: unknown member email must raise a ToolError
        try:
            await client.call_tool(
                "add_member", {"event_id": event_id, "email": "niemand@example.com"}
            )
            check("add_member error surfaced", False)
        except Exception as e:
            check("add_member error surfaced", "sign up" in str(e) or "400" in str(e), str(e)[:80])

        await client.call_tool("delete_event", {"event_id": event_id})
        events = data(await client.call_tool("list_events", {}))
        check("cleanup", all(e["_id"] != event_id for e in events))

    print("\nALL PASS" if failures == 0 else f"\n{failures} FAILURES")
    sys.exit(0 if failures == 0 else 1)


asyncio.run(main())
