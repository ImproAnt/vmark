# AI Integration (MCP)

VMark includes a built-in MCP (Model Context Protocol) server that allows AI assistants like Claude to interact directly with your editor.

## What is MCP?

The [Model Context Protocol](https://modelcontextprotocol.io/) is an open standard that enables AI assistants to interact with external tools and applications. VMark's MCP server exposes its editor capabilities as tools that AI assistants can use to:

- Read and write document content
- Apply formatting and create structures
- Navigate and manage documents
- Insert special content (math, diagrams, wiki links)

## Setup for Claude Code

### Prerequisites

- VMark installed and running
- Claude Code CLI installed

### Configuration

Add VMark to your Claude Code MCP configuration file (`~/.claude.json` or project-level `.claude.json`):

```json
{
  "mcpServers": {
    "vmark": {
      "command": "/path/to/VMark.app/Contents/MacOS/vmark-mcp-server-aarch64-apple-darwin",
      "args": ["--port", "9223"]
    }
  }
}
```

::: tip Finding the Binary Path
On macOS, the MCP server binary is located at:
- **Apple Silicon**: `VMark.app/Contents/MacOS/vmark-mcp-server-aarch64-apple-darwin`
- **Intel**: `VMark.app/Contents/MacOS/vmark-mcp-server-x86_64-apple-darwin`

On Windows:
- `VMark/vmark-mcp-server-x86_64-pc-windows-msvc.exe`

On Linux:
- `VMark/vmark-mcp-server-x86_64-unknown-linux-gnu`
:::

### How It Works

1. **VMark starts a WebSocket bridge** on port 9223 when launched
2. **The MCP server** connects to this WebSocket bridge
3. **Claude Code** communicates with the MCP server via stdio
4. **Commands are relayed** to VMark's editor through the bridge

```
Claude Code <--stdio--> MCP Server <--WebSocket--> VMark Editor
```

## Verifying the Connection

Once configured, start Claude Code and ask it to interact with VMark:

```
> Get the content of my document
```

If properly connected, Claude will use the VMark MCP tools to read your document.

## Available Capabilities

When connected, Claude can:

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
- Check that the MCP bridge port (9223) is not blocked
- Restart VMark if the connection was interrupted

### Tools not appearing in Claude

- Restart Claude Code after updating the MCP configuration
- Verify the binary path is correct
- Check Claude Code logs for MCP connection errors

### Commands fail with "No active editor"

- Make sure a document tab is active in VMark
- Click in the editor area to focus it
- Some commands require text to be selected first

## Security Notes

- The MCP server only accepts local connections (localhost)
- No data is sent to external servers
- All processing happens on your machine
- The WebSocket bridge is only accessible locally

## Advanced Configuration

### Custom Port

If port 9223 is in use, specify a different port:

```json
{
  "mcpServers": {
    "vmark": {
      "command": "/path/to/vmark-mcp-server",
      "args": ["--port", "9224"]
    }
  }
}
```

Note: You'll also need to configure VMark to use the same port (settings coming soon).

## Next Steps

- Explore all [MCP Tools](/guide/mcp-tools) available
- Learn about [keyboard shortcuts](/guide/shortcuts)
- Check out other [features](/guide/features)
