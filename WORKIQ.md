# Microsoft Work IQ Integration

Korgix integrates **Microsoft Work IQ** as its Microsoft intelligence layer. Instead of embedding the integration deep inside the React UI, we expose Work IQ through the **Model Context Protocol (MCP)**, allowing AI assistants and agents to reason over the user's Microsoft 365 work context when helping plan and prioritize tasks.

## Why Work IQ?

Korgix is a productivity and focus application. Of the three Microsoft IQ layers:

- **Foundry IQ** is optimized for agentic knowledge retrieval across enterprise sources with permissions and citations. Korgix does not have multiple enterprise knowledge sources.
- **Fabric IQ** is optimized for semantic intelligence over Microsoft Fabric data estates and knowledge graphs. Korgix does not use Fabric or large enterprise data models.
- **Work IQ** understands **work context** — emails, meetings, chats, documents, people, and relationships. This directly maps to how Korgix users plan their day, find focus time, and decide what to work on next.

Work IQ is therefore the natural choice.

## How the Integration Works

The integration is implemented as an MCP server:

1. The `@microsoft/workiq` package is configured as an MCP server in `.vscode/mcp.json`.
2. When an AI assistant (such as GitHub Copilot, Kimi, or any MCP client) connects to the workspace, it can invoke Work IQ tools.
3. Those tools read Microsoft 365 Copilot data — calendar, emails, Teams, documents, org context — and return grounded, contextual information.
4. The assistant uses that context to help the user plan tasks in Korgix without the app needing to know anything about Microsoft Graph or Entra ID.

This keeps Korgix small, secure, and focused, while still satisfying the requirement to integrate a Microsoft IQ intelligence layer.

## MCP Configuration

The Work IQ MCP server is declared in `.vscode/mcp.json`:

```json
{
  "servers": {
    "workiq": {
      "command": "npx",
      "args": ["-y", "@microsoft/workiq", "mcp"],
      "type": "stdio"
    }
  }
}
```

## Available Work IQ MCP Tools

Once the MCP server is loaded, it exposes these tools:

- **`accept_eula`** — Accept the End User License Agreement. Must be called once before other tools can be used.
- **`ask_work_iq`** — Ask a natural-language question about Microsoft 365 data (emails, meetings, files, people, etc.). Returns a JSON object with the Copilot response and a `conversationId`.

Example `ask_work_iq` usage:
```json
{
  "question": "What meetings do I have today?"
}
```

You can also pass OneDrive/SharePoint file URLs for extra context:
```json
{
  "question": "Summarize this document",
  "fileUrls": ["https://contoso.sharepoint.com/.../doc.docx"]
}
```

## First-Time Setup

Before Work IQ tools can return data, you must authenticate with Microsoft 365.

1. Verify the MCP server is reachable:
   ```bash
   node scripts/list-workiq-tools.cjs
   ```
2. Accept the EULA:
   ```bash
   npx -y @microsoft/workiq accept-eula
   ```
3. Sign in and cache credentials:
   ```bash
   npx -y @microsoft/workiq ask
   ```
4. The first time the MCP server accesses your tenant data, you (or your tenant admin) must grant consent. See the [Microsoft Work IQ documentation](https://github.com/microsoft/work-iq-mcp) for admin-consent instructions.

## Example Work IQ Workflows for Korgix

Once authenticated, an AI assistant can use Work IQ to enhance Korgix planning:

### Focus-time suggestions
```
"What are my free calendar slots tomorrow?"
```
The assistant can then suggest those slots as task start/end times in Korgix.

### Meeting-conflict awareness
```
"Do I have any meetings between 2 PM and 4 PM today?"
```
If a meeting exists, the assistant can warn the user before scheduling a conflicting focus block.

### Prep-task suggestions
```
"What meetings do I have this afternoon and who is attending?"
```
The assistant can propose tasks like "Prep slides for Q3 review" or "Follow up with Sarah after budget sync."

### Action-item extraction
```
"What did my manager say about the project deadline?"
```
Work IQ can surface relevant emails or Teams messages so the user can turn them into Korgix tasks.

## Security Notes

- Work IQ uses the user's own Microsoft 365 identity. Korgix does not store Microsoft tokens.
- The MCP server runs locally via `npx` and communicates over stdio.
- Tenant data access requires user or admin consent, enforced by Microsoft Entra ID.

## References

- [Microsoft Work IQ MCP on npm](https://www.npmjs.com/package/@microsoft/workiq)
- [Microsoft Work IQ MCP GitHub](https://github.com/microsoft/work-iq-mcp)
- [Model Context Protocol](https://modelcontextprotocol.io/)
