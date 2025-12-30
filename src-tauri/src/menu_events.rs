use tauri::{AppHandle, Emitter};

pub fn handle_menu_event(app: &AppHandle, event: tauri::menu::MenuEvent) {
    let id = event.id().as_ref();

    // Handle recent file clicks specially - extract index and emit with payload
    if let Some(index_str) = id.strip_prefix("recent-file-") {
        if let Ok(index) = index_str.parse::<usize>() {
            let _ = app.emit("menu:open-recent-file", index);
            return;
        }
    }

    // CRITICAL: Handle "new" and "new-window" the same way - create window directly
    if id == "new" || id == "new-window" {
        let _ = crate::window_manager::create_document_window(app, None);
        return;
    }

    // All other menu events are emitted to the frontend
    let event_name = format!("menu:{id}");
    let _ = app.emit(&event_name, ());
}
