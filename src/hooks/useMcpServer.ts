/**
 * MCP Bridge Control Hook
 *
 * Provides React state and controls for the VMark MCP bridge (WebSocket server).
 * AI clients (Claude Code, Codex, etc.) spawn their own sidecars that connect to this bridge.
 */

import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

interface McpServerStatus {
  running: boolean;
  port: number | null;
}

interface UseMcpServerResult {
  /** Whether the server is currently running */
  running: boolean;
  /** Whether an operation is in progress */
  loading: boolean;
  /** Error message if the last operation failed */
  error: string | null;
  /** Start the MCP bridge on the given port */
  start: (port: number) => Promise<void>;
  /** Stop the MCP bridge */
  stop: () => Promise<void>;
  /** Refresh the bridge status */
  refresh: () => Promise<void>;
}

/**
 * Hook to control the VMark MCP bridge.
 *
 * The bridge is a WebSocket server that AI client sidecars connect to.
 * VMark only starts the bridge; AI clients spawn their own sidecars.
 *
 * Usage:
 * ```tsx
 * const { running, loading, error, start, stop } = useMcpServer();
 *
 * // Start the bridge
 * await start(9223);
 *
 * // Stop the bridge
 * await stop();
 * ```
 */
export function useMcpServer(): UseMcpServerResult {
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial status
  const refresh = useCallback(async () => {
    try {
      const status = await invoke<McpServerStatus>("mcp_server_status");
      setRunning(status.running);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  // Start the bridge (not the sidecar - AI clients spawn their own)
  const start = useCallback(async (port: number) => {
    setLoading(true);
    setError(null);
    try {
      const status = await invoke<McpServerStatus>("mcp_bridge_start", { port });
      setRunning(status.running);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Stop the bridge
  const stop = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const status = await invoke<McpServerStatus>("mcp_bridge_stop");
      setRunning(status.running);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Subscribe to server events
  useEffect(() => {
    refresh();

    const unlistenStarted = listen<number>("mcp-server:started", () => {
      setRunning(true);
      setError(null);
    });

    const unlistenStopped = listen("mcp-server:stopped", () => {
      setRunning(false);
    });

    return () => {
      unlistenStarted.then((fn) => fn());
      unlistenStopped.then((fn) => fn());
    };
  }, [refresh]);

  return {
    running,
    loading,
    error,
    start,
    stop,
    refresh,
  };
}
