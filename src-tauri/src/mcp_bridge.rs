/**
 * MCP Bridge - WebSocket server for AI assistant communication.
 *
 * Provides a WebSocket server that the MCP sidecar connects to.
 * Forwards requests to the frontend and returns responses.
 */

use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::net::SocketAddr;
use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::{mpsc, oneshot, Mutex, RwLock};
use tokio_tungstenite::{accept_async, tungstenite::Message};

/// Message format for WebSocket communication with the sidecar.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct WsMessage {
    pub id: String,
    #[serde(rename = "type")]
    pub msg_type: String,
    pub payload: serde_json::Value,
}

/// MCP request from the sidecar.
/// The request has a `type` field and other fields are the arguments.
/// We parse it as a generic JSON Value and extract the type separately.
#[derive(Clone, Debug)]
pub struct McpRequest {
    pub request_type: String,
    pub args: serde_json::Value,
}

impl McpRequest {
    /// Parse from JSON value, extracting type and collecting other fields as args.
    fn from_value(value: serde_json::Value) -> Result<Self, String> {
        let obj = value.as_object().ok_or("Request must be an object")?;

        let request_type = obj
            .get("type")
            .and_then(|v| v.as_str())
            .ok_or("Request must have a 'type' field")?
            .to_string();

        // Collect all other fields as args
        let mut args = serde_json::Map::new();
        for (key, val) in obj.iter() {
            if key != "type" {
                args.insert(key.clone(), val.clone());
            }
        }

        Ok(McpRequest {
            request_type,
            args: serde_json::Value::Object(args),
        })
    }
}

/// MCP response to send back to the sidecar.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct McpResponse {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// Event payload sent to frontend.
#[derive(Clone, Debug, Serialize)]
pub struct McpRequestEvent {
    pub id: String,
    #[serde(rename = "type")]
    pub request_type: String,
    pub args: serde_json::Value,
}

/// Response from frontend via command.
#[derive(Clone, Debug, Deserialize)]
pub struct McpResponsePayload {
    pub id: String,
    pub success: bool,
    pub data: Option<serde_json::Value>,
    pub error: Option<String>,
}

/// Bridge state shared across connections.
struct BridgeState {
    /// Pending requests waiting for responses from frontend.
    pending: HashMap<String, oneshot::Sender<McpResponse>>,
    /// Channel to send messages to the connected client.
    client_tx: Option<mpsc::UnboundedSender<String>>,
    /// Shutdown signal for the current connection (to close old connections when new one arrives).
    connection_shutdown: Option<oneshot::Sender<()>>,
}

/// Global bridge state.
static BRIDGE_STATE: std::sync::OnceLock<Arc<Mutex<BridgeState>>> = std::sync::OnceLock::new();

/// Server shutdown signal.
static SHUTDOWN_TX: std::sync::OnceLock<Arc<RwLock<Option<oneshot::Sender<()>>>>> =
    std::sync::OnceLock::new();

/// Initialize the bridge state.
fn get_bridge_state() -> Arc<Mutex<BridgeState>> {
    BRIDGE_STATE
        .get_or_init(|| {
            Arc::new(Mutex::new(BridgeState {
                pending: HashMap::new(),
                client_tx: None,
                connection_shutdown: None,
            }))
        })
        .clone()
}

/// Get or initialize the shutdown signal holder.
fn get_shutdown_holder() -> Arc<RwLock<Option<oneshot::Sender<()>>>> {
    SHUTDOWN_TX
        .get_or_init(|| Arc::new(RwLock::new(None)))
        .clone()
}

/// Start the MCP bridge WebSocket server.
pub async fn start_bridge(app: AppHandle, port: u16) -> Result<(), String> {
    let addr = format!("127.0.0.1:{}", port);
    let listener = TcpListener::bind(&addr)
        .await
        .map_err(|e| format!("Failed to bind to {}: {}", addr, e))?;

    #[cfg(debug_assertions)]
    eprintln!("[MCP Bridge] WebSocket server listening on {}", addr);

    // Create shutdown channel
    let (shutdown_tx, mut shutdown_rx) = oneshot::channel::<()>();
    {
        let holder = get_shutdown_holder();
        let mut guard = holder.write().await;
        *guard = Some(shutdown_tx);
    }

    let app_handle = app.clone();

    // Spawn the server loop
    tauri::async_runtime::spawn(async move {
        loop {
            tokio::select! {
                // Check for shutdown signal
                _ = &mut shutdown_rx => {
                    #[cfg(debug_assertions)]
                    eprintln!("[MCP Bridge] Shutdown signal received");
                    break;
                }
                // Accept new connections
                result = listener.accept() => {
                    match result {
                        Ok((stream, addr)) => {
                            let app = app_handle.clone();
                            tauri::async_runtime::spawn(handle_connection(stream, addr, app));
                        }
                        Err(e) => {
                            #[cfg(debug_assertions)]
                            eprintln!("[MCP Bridge] Accept error: {}", e);
                        }
                    }
                }
            }
        }
    });

    Ok(())
}

/// Stop the MCP bridge WebSocket server.
pub async fn stop_bridge() {
    // Send shutdown signal
    let holder = get_shutdown_holder();
    let mut guard = holder.write().await;
    if let Some(tx) = guard.take() {
        let _ = tx.send(());
    }
    drop(guard); // Release lock before acquiring bridge state lock

    // Clear client connection
    let state = get_bridge_state();
    let mut guard = state.lock().await;

    // Signal current connection to close
    if let Some(shutdown_tx) = guard.connection_shutdown.take() {
        let _ = shutdown_tx.send(());
    }

    guard.client_tx = None;

    // Reject all pending requests
    for (_, tx) in guard.pending.drain() {
        let _ = tx.send(McpResponse {
            success: false,
            data: None,
            error: Some("Bridge stopped".to_string()),
        });
    }
}

/// Handle a single WebSocket connection.
async fn handle_connection(stream: TcpStream, addr: SocketAddr, app: AppHandle) {
    // Check if there's already an active connection BEFORE accepting WebSocket
    {
        let state = get_bridge_state();
        let guard = state.lock().await;
        if guard.client_tx.is_some() {
            // Already have an active connection - reject this one silently
            // Don't even complete the WebSocket handshake to avoid triggering reconnect
            #[cfg(debug_assertions)]
            eprintln!("[MCP Bridge] Rejecting connection from {} - already have active client", addr);
            drop(stream); // Close the TCP connection
            return;
        }
    }

    let ws_stream = match accept_async(stream).await {
        Ok(ws) => ws,
        Err(e) => {
            #[cfg(debug_assertions)]
            eprintln!("[MCP Bridge] WebSocket handshake failed for {}: {}", addr, e);
            return;
        }
    };

    let (mut ws_sender, mut ws_receiver) = ws_stream.split();

    // Create channel for sending messages to this client
    let (tx, mut rx) = mpsc::unbounded_channel::<String>();

    // Create shutdown channel for this connection
    let (shutdown_tx, mut shutdown_rx) = oneshot::channel::<()>();

    // Store the sender in bridge state
    // Double-check no one else connected while we were doing the handshake
    {
        let state = get_bridge_state();
        let mut guard = state.lock().await;

        if guard.client_tx.is_some() {
            // Race condition: someone else connected while we were handshaking
            #[cfg(debug_assertions)]
            eprintln!("[MCP Bridge] Rejecting connection from {} - another client connected during handshake", addr);
            return;
        }

        guard.client_tx = Some(tx);
        guard.connection_shutdown = Some(shutdown_tx);
    }

    #[cfg(debug_assertions)]
    eprintln!("[MCP Bridge] Client connected from {}", addr);

    // Spawn task to forward messages from channel to WebSocket
    let send_task = tauri::async_runtime::spawn(async move {
        while let Some(msg) = rx.recv().await {
            if ws_sender.send(Message::Text(msg.into())).await.is_err() {
                break;
            }
        }
    });

    // Process incoming messages until disconnect or shutdown signal
    loop {
        tokio::select! {
            // Check for shutdown signal (bridge stopping)
            _ = &mut shutdown_rx => {
                #[cfg(debug_assertions)]
                eprintln!("[MCP Bridge] Connection {} closing due to bridge shutdown", addr);
                break;
            }
            // Process incoming messages
            result = ws_receiver.next() => {
                match result {
                    Some(Ok(Message::Text(text))) => {
                        if let Err(e) = handle_message(&text, &app).await {
                            #[cfg(debug_assertions)]
                            eprintln!("[MCP Bridge] Error handling message: {}", e);
                        }
                    }
                    Some(Ok(Message::Close(_))) => {
                        #[cfg(debug_assertions)]
                        eprintln!("[MCP Bridge] Client {} disconnected", addr);
                        break;
                    }
                    Some(Err(e)) => {
                        #[cfg(debug_assertions)]
                        eprintln!("[MCP Bridge] WebSocket error from {}: {}", addr, e);
                        break;
                    }
                    None => {
                        #[cfg(debug_assertions)]
                        eprintln!("[MCP Bridge] Connection {} stream ended", addr);
                        break;
                    }
                    _ => {}
                }
            }
        }
    }

    // Cleanup - clear state so new connections can be accepted
    {
        let state = get_bridge_state();
        let mut guard = state.lock().await;
        guard.client_tx = None;
        guard.connection_shutdown = None;

        #[cfg(debug_assertions)]
        eprintln!("[MCP Bridge] Connection slot released, ready for new client");
    }

    send_task.abort();
}

/// Handle an incoming WebSocket message.
async fn handle_message(text: &str, app: &AppHandle) -> Result<(), String> {
    let msg: WsMessage =
        serde_json::from_str(text).map_err(|e| format!("Invalid message format: {}", e))?;

    if msg.msg_type != "request" {
        return Ok(());
    }

    let request = McpRequest::from_value(msg.payload.clone())?;

    // Create a oneshot channel for the response
    let (response_tx, response_rx) = oneshot::channel();

    // Store the pending request
    {
        let state = get_bridge_state();
        let mut guard = state.lock().await;
        guard.pending.insert(msg.id.clone(), response_tx);
    }

    // Emit event to frontend
    let event = McpRequestEvent {
        id: msg.id.clone(),
        request_type: request.request_type,
        args: request.args,
    };

    app.emit("mcp-bridge:request", &event)
        .map_err(|e| format!("Failed to emit event: {}", e))?;

    // Wait for response with timeout
    let response = tokio::time::timeout(std::time::Duration::from_secs(30), response_rx)
        .await
        .map_err(|_| "Request timeout".to_string())?
        .map_err(|_| "Response channel closed".to_string())?;

    // Send response back to sidecar
    let ws_response = WsMessage {
        id: msg.id,
        msg_type: "response".to_string(),
        payload: serde_json::to_value(&response).unwrap_or_default(),
    };

    let response_json =
        serde_json::to_string(&ws_response).map_err(|e| format!("Failed to serialize: {}", e))?;

    let state = get_bridge_state();
    let guard = state.lock().await;
    if let Some(tx) = &guard.client_tx {
        tx.send(response_json)
            .map_err(|e| format!("Failed to send response: {}", e))?;
    }

    Ok(())
}

/// Tauri command to send a response from the frontend.
#[tauri::command]
pub async fn mcp_bridge_respond(payload: McpResponsePayload) -> Result<(), String> {
    let state = get_bridge_state();
    let mut guard = state.lock().await;

    if let Some(tx) = guard.pending.remove(&payload.id) {
        let response = McpResponse {
            success: payload.success,
            data: payload.data,
            error: payload.error,
        };
        tx.send(response).map_err(|_| "Response channel closed")?;
    }

    Ok(())
}

/// Check if the bridge has a connected client.
#[allow(dead_code)]
pub async fn is_client_connected() -> bool {
    let state = get_bridge_state();
    let guard = state.lock().await;
    guard.client_tx.is_some()
}
