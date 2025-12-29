import { useState } from "react";
import { Settings, Type, FolderOpen, Zap } from "lucide-react";

type Section = "general" | "editor" | "files" | "advanced";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

function NavItem({ icon, label, active, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      data-active={active}
      className="flex w-full items-center gap-2.5 rounded-md px-3 py-2
                 text-sm font-medium transition-colors
                 text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]
                 data-[active=true]:bg-[var(--accent-bg)]
                 data-[active=true]:text-[var(--accent-text)]"
    >
      {icon}
      {label}
    </button>
  );
}

interface SettingRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

function SettingRow({ label, description, children }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
      <div className="flex-1">
        <div className="text-sm font-medium text-[var(--text-primary)]">
          {label}
        </div>
        {description && (
          <div className="text-xs text-[var(--text-tertiary)] mt-0.5">
            {description}
          </div>
        )}
      </div>
      <div className="ml-4">{children}</div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-6 rounded-full transition-colors
                  ${checked ? "bg-[var(--accent-primary)]" : "bg-[var(--bg-tertiary)]"}`}
    >
      <span
        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow
                    transition-transform ${checked ? "translate-x-4" : ""}`}
      />
    </button>
  );
}

function GeneralSettings() {
  const [focusDefault, setFocusDefault] = useState(false);
  const [typewriterDefault, setTypewriterDefault] = useState(false);
  const [autoSave, setAutoSave] = useState(true);

  return (
    <div>
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
        General
      </h2>
      <div className="space-y-1">
        <SettingRow
          label="Focus mode by default"
          description="Start with focus mode enabled"
        >
          <Toggle checked={focusDefault} onChange={setFocusDefault} />
        </SettingRow>
        <SettingRow
          label="Typewriter mode by default"
          description="Keep cursor centered vertically"
        >
          <Toggle checked={typewriterDefault} onChange={setTypewriterDefault} />
        </SettingRow>
        <SettingRow label="Auto-save" description="Save files automatically">
          <Toggle checked={autoSave} onChange={setAutoSave} />
        </SettingRow>
      </div>
    </div>
  );
}

function EditorSettings() {
  const [fontSize, setFontSize] = useState("16");
  const [fontFamily, setFontFamily] = useState("system");
  const [lineHeight, setLineHeight] = useState("1.6");

  return (
    <div>
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
        Editor
      </h2>
      <div className="space-y-1">
        <SettingRow label="Font size">
          <select
            value={fontSize}
            onChange={(e) => setFontSize(e.target.value)}
            className="px-2 py-1 rounded border border-gray-200 dark:border-gray-700
                       bg-[var(--bg-primary)] text-sm text-[var(--text-primary)]"
          >
            <option value="14">14px</option>
            <option value="16">16px</option>
            <option value="18">18px</option>
            <option value="20">20px</option>
          </select>
        </SettingRow>
        <SettingRow label="Font family">
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className="px-2 py-1 rounded border border-gray-200 dark:border-gray-700
                       bg-[var(--bg-primary)] text-sm text-[var(--text-primary)]"
          >
            <option value="system">System Default</option>
            <option value="serif">Serif</option>
            <option value="mono">Monospace</option>
          </select>
        </SettingRow>
        <SettingRow label="Line height">
          <select
            value={lineHeight}
            onChange={(e) => setLineHeight(e.target.value)}
            className="px-2 py-1 rounded border border-gray-200 dark:border-gray-700
                       bg-[var(--bg-primary)] text-sm text-[var(--text-primary)]"
          >
            <option value="1.4">Compact</option>
            <option value="1.6">Normal</option>
            <option value="1.8">Relaxed</option>
            <option value="2.0">Spacious</option>
          </select>
        </SettingRow>
      </div>
    </div>
  );
}

function FilesSettings() {
  const [defaultDir, setDefaultDir] = useState("~/Documents");
  const [createBackups, setCreateBackups] = useState(true);

  return (
    <div>
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
        Files
      </h2>
      <div className="space-y-1">
        <SettingRow
          label="Default directory"
          description="Where new files are saved"
        >
          <input
            type="text"
            value={defaultDir}
            onChange={(e) => setDefaultDir(e.target.value)}
            className="w-48 px-2 py-1 rounded border border-gray-200 dark:border-gray-700
                       bg-[var(--bg-primary)] text-sm text-[var(--text-primary)]"
          />
        </SettingRow>
        <SettingRow
          label="Create backups"
          description="Save backup copies of files"
        >
          <Toggle checked={createBackups} onChange={setCreateBackups} />
        </SettingRow>
      </div>
    </div>
  );
}

function AdvancedSettings() {
  const [devTools, setDevTools] = useState(false);
  const [hardwareAccel, setHardwareAccel] = useState(true);

  return (
    <div>
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
        Advanced
      </h2>
      <div className="space-y-1">
        <SettingRow label="Developer tools" description="Enable developer mode">
          <Toggle checked={devTools} onChange={setDevTools} />
        </SettingRow>
        <SettingRow
          label="Hardware acceleration"
          description="Use GPU for rendering"
        >
          <Toggle checked={hardwareAccel} onChange={setHardwareAccel} />
        </SettingRow>
      </div>
    </div>
  );
}

export function SettingsPage() {
  const [section, setSection] = useState<Section>("general");

  const navItems = [
    { id: "general" as const, icon: <Settings className="w-4 h-4" />, label: "General" },
    { id: "editor" as const, icon: <Type className="w-4 h-4" />, label: "Editor" },
    { id: "files" as const, icon: <FolderOpen className="w-4 h-4" />, label: "Files" },
    { id: "advanced" as const, icon: <Zap className="w-4 h-4" />, label: "Advanced" },
  ];

  return (
    <div className="relative flex h-screen bg-[var(--bg-primary)]">
      {/* Sidebar - full height */}
      <div
        className="w-52 shrink-0 border-r border-gray-200 dark:border-gray-700
                   bg-[var(--bg-secondary)] flex flex-col"
      >
        {/* Drag region for sidebar area */}
        <div data-tauri-drag-region className="h-12 shrink-0" />
        {/* Nav items */}
        <div className="flex-1 overflow-auto px-3 pb-3">
          <div className="space-y-1">
            {navItems.map((item) => (
              <NavItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                active={section === item.id}
                onClick={() => setSection(item.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col">
        {/* Drag region for content area */}
        <div data-tauri-drag-region className="h-12 shrink-0" />
        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {section === "general" && <GeneralSettings />}
          {section === "editor" && <EditorSettings />}
          {section === "files" && <FilesSettings />}
          {section === "advanced" && <AdvancedSettings />}
        </div>
      </div>

      {/* Centered title overlay */}
      <div
        data-tauri-drag-region
        className="absolute top-0 left-0 right-0 h-12 flex items-center justify-center pointer-events-none"
      >
        <span className="text-sm font-medium text-[var(--text-primary)]">
          Settings
        </span>
      </div>
    </div>
  );
}
