/**
 * MCP Bridge Types
 */

export interface McpRequestEvent {
  id: string;
  type: string;
  args: Record<string, unknown>;
}

export interface McpResponse {
  id: string;
  success: boolean;
  data?: unknown;
  error?: string;
}
