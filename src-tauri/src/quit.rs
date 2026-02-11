use std::sync::{Mutex, LazyLock, atomic::{AtomicBool, Ordering}};
use tauri::{AppHandle, Emitter, Manager};

use crate::mcp_server;

static QUIT_IN_PROGRESS: AtomicBool = AtomicBool::new(false);
// IMPORTANT: A coordinated quit can be "in progress" while we still need to
// block OS quit requests until all windows have handled unsaved changes.
// This flag is only set to true immediately before calling `app.exit(0)`.
static EXIT_ALLOWED: AtomicBool = AtomicBool::new(false);
/// Ordered queue of windows remaining to process during quit.
/// Windows are processed sequentially (front-to-back) so that if the user
/// cancels the save dialog in one window, the remaining windows are untouched.
static QUIT_TARGETS: LazyLock<Mutex<Vec<String>>> =
    LazyLock::new(|| Mutex::new(Vec::new()));

/// Determine whether a window label is a document window.
pub fn is_document_window_label(label: &str) -> bool {
    label == "main" || label.starts_with("doc-")
}

/// Check if a coordinated quit is in progress.
/// Whether ExitRequested should be allowed through.
pub fn is_exit_allowed() -> bool {
    EXIT_ALLOWED.load(Ordering::SeqCst)
}

fn set_exit_allowed(allowed: bool) {
    EXIT_ALLOWED.store(allowed, Ordering::SeqCst);
}

fn set_quit_targets(targets: Vec<String>) {
    if let Ok(mut guard) = QUIT_TARGETS.lock() {
        *guard = targets;
    }
}

/// Remove a label from the quit targets queue.
/// Returns `true` if the queue is now empty (all targets processed).
fn remove_quit_target(label: &str) -> bool {
    if let Ok(mut guard) = QUIT_TARGETS.lock() {
        guard.retain(|l| l != label);
        return guard.is_empty();
    }
    false
}

/// Emit `app:quit-requested` to the next window in the queue (the first entry).
/// If the queue is empty, finalise quit.
fn process_next_quit_target(app: &AppHandle) {
    let next = {
        let guard = QUIT_TARGETS.lock();
        guard.ok().and_then(|g| g.first().cloned())
    };
    match next {
        Some(label) => {
            if let Some(window) = app.webview_windows().get(&label) {
                let _ = window.emit("app:quit-requested", &label);
            }
        }
        None => {
            // All targets already handled – finish quit
            set_exit_allowed(true);
            mcp_server::cleanup(app);
            app.exit(0);
        }
    }
}

/// Start coordinated quit: request close of document windows sequentially.
///
/// Builds an ordered queue of document windows and emits `app:quit-requested`
/// only to the **first** window.  When that window closes (or the frontend
/// calls `acknowledge_quit_window`), `process_next_quit_target` advances to
/// the next window.  If `cancel_quit` is called at any point the remaining
/// windows are left untouched.
pub fn start_quit(app: &AppHandle) {
    if QUIT_IN_PROGRESS.swap(true, Ordering::SeqCst) {
        return;
    }
    set_exit_allowed(false);

    let mut targets = Vec::new();
    for (label, window) in app.webview_windows() {
        if is_document_window_label(&label) {
            targets.push(label.clone());
        } else {
            // Close non-document windows immediately
            let _ = window.close();
        }
    }

    if targets.is_empty() {
        // Keep QUIT_IN_PROGRESS true so ExitRequested handler allows exit
        set_exit_allowed(true);
        mcp_server::cleanup(app);
        app.exit(0);
        return;
    }

    set_quit_targets(targets);
    // Emit only to the first window in the queue
    process_next_quit_target(app);
}

/// Cancel an in-progress quit (e.g., user cancelled save prompt).
#[tauri::command]
pub fn cancel_quit() {
    QUIT_IN_PROGRESS.store(false, Ordering::SeqCst);
    set_exit_allowed(false);
    set_quit_targets(Vec::new());
}

/// Called by the frontend after a window has been successfully closed during
/// a coordinated quit.  Advances to the next window in the queue.
#[tauri::command]
pub fn acknowledge_quit_window(app: AppHandle, label: String) {
    if !QUIT_IN_PROGRESS.load(Ordering::SeqCst) {
        return;
    }
    remove_quit_target(&label);
    process_next_quit_target(&app);
}

/// Handle a window being destroyed while quit is in progress.
///
/// Removes the window from the queue and advances to the next target.
/// If the queue is now empty, `process_next_quit_target` will finalise quit.
pub fn handle_window_destroyed(app: &AppHandle, label: &str) {
    let quit_in_progress = QUIT_IN_PROGRESS.load(Ordering::SeqCst);
    #[cfg(debug_assertions)]
    eprintln!("[Tauri] handle_window_destroyed: label={}, quit_in_progress={}", label, quit_in_progress);

    if !quit_in_progress {
        return;
    }

    if !is_document_window_label(label) {
        return;
    }

    remove_quit_target(label);
    process_next_quit_target(app);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_document_window_label() {
        assert!(is_document_window_label("main"));
        assert!(is_document_window_label("doc-0"));
        assert!(is_document_window_label("doc-123"));
        assert!(!is_document_window_label("settings"));
    }
}
