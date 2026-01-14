use tauri::{AppHandle, Emitter, Manager};

pub fn handle_menu_event(app: &AppHandle, event: tauri::menu::MenuEvent) {
    let id = event.id().as_ref();

    // Handle recent file clicks specially - extract index and emit with payload
    // Emit to focused window with (index, windowLabel) tuple
    if let Some(index_str) = id.strip_prefix("recent-file-") {
        if let Ok(index) = index_str.parse::<usize>() {
            if let Some(focused) = app
                .webview_windows()
                .values()
                .find(|w| w.is_focused().unwrap_or(false))
            {
                let _ = focused.emit("menu:open-recent-file", (index, focused.label()));
            }
            return;
        }
    }

    // "new-window" creates a new window directly in Rust
    if id == "new-window" {
        let _ = crate::window_manager::create_document_window(app, None, None);
        return;
    }

    // "new" creates a tab in current window, but if no windows exist, create a new window
    // (Cmd+N when last window closed should open a new window)
    if id == "new" {
        let has_windows = app.webview_windows().values().any(|w| {
            w.label() != "settings" // Ignore settings window
        });
        if !has_windows {
            let _ = crate::window_manager::create_document_window(app, None, None);
            return;
        }
    }

    // "close" (Cmd+W) should only affect the focused window
    // Note: window.emit() broadcasts to all windows, so include target label in payload
    if id == "close" {
        if let Some(focused) = app
            .webview_windows()
            .values()
            .find(|w| w.is_focused().unwrap_or(false))
        {
            let _ = focused.emit("menu:close", focused.label());
        }
        return;
    }

    // All other menu events are emitted only to the focused window
    // Note: window.emit() broadcasts to all windows, so include target label in payload
    // Frontend filters by checking event.payload === windowLabel
    if let Some(focused) = app
        .webview_windows()
        .values()
        .find(|w| w.is_focused().unwrap_or(false))
    {
        let event_name = format!("menu:{id}");
        let _ = focused.emit(&event_name, focused.label());
    }
}
