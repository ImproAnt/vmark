# AI Integration (MCP)

VMark includes a built-in MCP (Model Context Protocol) server that allows AI assistants like Claude to interact directly with your editor.

## What is MCP?

The [Model Context Protocol](https://modelcontextprotocol.io/) is an open standard that enables AI assistants to interact with external tools and applications. VMark's MCP server exposes its editor capabilities as tools that AI assistants can use to:

- Read and write document content
- Apply formatting and create structures
- Navigate and manage documents
- Insert special content (math, diagrams, wiki links)

## Quick Setup

VMark makes it easy to connect AI assistants with one-click installation.

### 1. Enable MCP Server

Open **Settings → Integrations** and enable the MCP Server:

<div class="screenshot-container">
  <img src="/screenshots/mcp-settings-server.png" alt="VMark MCP Server Settings" />
</div>

- **Enable MCP Server** - Turn on to allow AI connections
- **WebSocket Port** - Default is 9223
- **Start on launch** - Auto-start when VMark opens

### 2. Install Configuration

Click **Install** for your AI assistant:

<div class="screenshot-container">
  <img src="/screenshots/mcp-settings-install.png" alt="VMark MCP Install Configuration" />
</div>

Supported AI assistants:
- **Claude Desktop** - Anthropic's desktop app
- **Claude Code** - CLI for developers
- **Codex CLI** - OpenAI's coding assistant
- **Gemini CLI** - Google's AI assistant

### 3. Restart Your AI Assistant

After installing, **restart your AI assistant** completely (quit and reopen) to load the new configuration.

### 4. Try It Out

In your AI assistant, try commands like:
- *"What's in my VMark document?"*
- *"Write a summary of quantum computing to VMark"*
- *"Add a table of contents to my document"*

## See It in Action

Ask Claude a question and have it write the answer directly to your VMark document:

<div class="screenshot-container">
  <img src="/screenshots/mcp-claude.png" alt="Claude Desktop using VMark MCP" />
  <p class="screenshot-caption">Claude Desktop calls <code>document_set_content</code> to write to VMark</p>
</div>

<div class="screenshot-container">
  <img src="/screenshots/mcp-result.png" alt="Content rendered in VMark" />
  <p class="screenshot-caption">The content appears instantly in VMark, fully formatted</p>
</div>

<style>
.screenshot-container {
  margin: 1.5rem 0;
}
.screenshot-container img {
  max-width: 100%;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.screenshot-caption {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  text-align: center;
}
</style>

## Manual Configuration

If you prefer to configure manually, here are the config file locations:

### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "vmark": {
      "command": "/Applications/VMark.app/Contents/MacOS/vmark-mcp-server-aarch64-apple-darwin",
      "args": ["--port", "9223"]
    }
  }
}
```

### Claude Code

Edit `~/.claude.json` or project `.claude.json`:

```json
{
  "mcpServers": {
    "vmark": {
      "command": "/Applications/VMark.app/Contents/MacOS/vmark-mcp-server-aarch64-apple-darwin",
      "args": ["--port", "9223"]
    }
  }
}
```

::: tip Finding the Binary Path
On macOS, the MCP server binary is inside VMark.app:
- **Apple Silicon**: `VMark.app/Contents/MacOS/vmark-mcp-server-aarch64-apple-darwin`
- **Intel**: `VMark.app/Contents/MacOS/vmark-mcp-server-x86_64-apple-darwin`

On Windows:
- `C:\Program Files\VMark\vmark-mcp-server-x86_64-pc-windows-msvc.exe`

On Linux:
- `/usr/bin/vmark-mcp-server-x86_64-unknown-linux-gnu` (or where you installed it)
:::

## How It Works

```
AI Assistant <--stdio--> MCP Server <--WebSocket--> VMark Editor
```

1. **VMark starts a WebSocket bridge** on port 9223 when launched
2. **The MCP server** connects to this WebSocket bridge
3. **AI assistant** communicates with the MCP server via stdio
4. **Commands are relayed** to VMark's editor through the bridge

## Available Capabilities

When connected, your AI assistant can:

| Category | Capabilities |
|----------|-------------|
| **Document** | Read/write content, search, replace |
| **Selection** | Get/set selection, replace selected text |
| **Formatting** | Bold, italic, code, links, and more |
| **Blocks** | Headings, paragraphs, code blocks, quotes |
| **Lists** | Bullet, ordered, and task lists |
| **Tables** | Insert, modify rows/columns |
| **Special** | Math equations, Mermaid diagrams, wiki links |
| **Workspace** | Open/save documents, manage windows |

See the [MCP Tools Reference](/guide/mcp-tools) for complete documentation.

## Troubleshooting

### "Connection refused" or "No active editor"

- Ensure VMark is running and has a document open
- Check that the MCP Server is enabled in Settings → Integrations
- Verify the MCP bridge shows "Running" status
- Restart VMark if the connection was interrupted

### Tools not appearing in AI assistant

- Restart your AI assistant after installing the configuration
- Verify the configuration was installed (check for green checkmark in Settings)
- Check your AI assistant's logs for MCP connection errors

### Commands fail with "No active editor"

- Make sure a document tab is active in VMark
- Click in the editor area to focus it
- Some commands require text to be selected first

## Security Notes

- The MCP server only accepts local connections (localhost)
- No data is sent to external servers
- All processing happens on your machine
- The WebSocket bridge is only accessible locally

## Next Steps

- Explore all [MCP Tools](/guide/mcp-tools) available
- Learn about [keyboard shortcuts](/guide/shortcuts)
- Check out other [features](/guide/features)
