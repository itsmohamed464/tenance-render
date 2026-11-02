# Buffer accounts in cloud sessions

`.mcp.json` loads three Buffer servers (names match the tool names used before:
`buffer-de-extra`, `buffer-global-main`, `buffer-global-extra`). The German main
account comes from the claude.ai Buffer connector.

Keys are never stored in the repo. Add them once as environment variables
(environment menu in the session title bar, then Edit):

| Variable | Account |
|---|---|
| `BUFFER_DE_EXTRA_KEY` | German extra |
| `BUFFER_GLOBAL_MAIN_KEY` | Global main |
| `BUFFER_GLOBAL_EXTRA_KEY` | Global extra |

Each value is the account's API key from Buffer, Settings, API
(https://publish.buffer.com/settings/api), created with posting permission.
Start a new session afterwards; servers are read at session start.
Then open `/mcp` to check all three show as connected.

Server: `https://mcp.buffer.com/mcp`, header `Authorization: Bearer <key>`
(per https://developers.buffer.com/guides/integrations/other-ai-tools.md).
