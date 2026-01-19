/**
 * Files Settings Section
 *
 * File handling configuration including image settings.
 */

import { useState } from "react";
import { SettingRow, SettingsGroup, Toggle } from "./components";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useSettingsStore, type ImageAutoResizeOption } from "@/stores/settingsStore";
import { updateWorkspaceConfig } from "@/hooks/workspaceConfig";

const autoResizeOptions: { value: ImageAutoResizeOption; label: string }[] = [
  { value: 0, label: "Off" },
  { value: 800, label: "800px" },
  { value: 1200, label: "1200px" },
  { value: 1920, label: "1920px (Full HD)" },
  { value: 2560, label: "2560px (2K)" },
];

export function FilesSettings() {
  const [defaultDir, setDefaultDir] = useState("~/Documents");
  const [createBackups, setCreateBackups] = useState(true);
  const isWorkspaceMode = useWorkspaceStore((state) => state.isWorkspaceMode);
  const showHiddenFiles = useWorkspaceStore(
    (state) => state.config?.showHiddenFiles ?? false
  );

  // Image settings
  const autoResizeMax = useSettingsStore((state) => state.image.autoResizeMax);
  const copyToAssets = useSettingsStore((state) => state.image.copyToAssets);
  const cleanupOrphansOnClose = useSettingsStore((state) => state.image.cleanupOrphansOnClose);
  const updateImageSetting = useSettingsStore((state) => state.updateImageSetting);

  return (
    <div>
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
        Files
      </h2>
      <div className="space-y-1">
        <SettingRow
          label="Show hidden files"
          description="Include dotfiles and hidden system items in the file explorer"
          disabled={!isWorkspaceMode}
        >
          <Toggle
            checked={showHiddenFiles}
            onChange={(value) => {
              void updateWorkspaceConfig({ showHiddenFiles: value });
            }}
            disabled={!isWorkspaceMode}
          />
        </SettingRow>
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

      <SettingsGroup title="Images" className="mt-8">
        <SettingRow
          label="Auto-resize on paste"
          description="Automatically resize large images before saving to assets"
        >
          <select
            value={autoResizeMax}
            onChange={(e) =>
              updateImageSetting(
                "autoResizeMax",
                Number(e.target.value) as ImageAutoResizeOption
              )
            }
            className="px-2 py-1 rounded border border-gray-200 dark:border-gray-700
                       bg-[var(--bg-primary)] text-sm text-[var(--text-primary)]"
          >
            {autoResizeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </SettingRow>
        <SettingRow
          label="Copy to assets folder"
          description="Copy pasted/dropped images to the document's assets folder"
        >
          <Toggle
            checked={copyToAssets}
            onChange={(value) => updateImageSetting("copyToAssets", value)}
          />
        </SettingRow>
        <SettingRow
          label="Clean up unused images on close"
          description="Automatically delete images from assets folder that are no longer referenced in the document"
        >
          <Toggle
            checked={cleanupOrphansOnClose}
            onChange={(value) => updateImageSetting("cleanupOrphansOnClose", value)}
          />
        </SettingRow>
      </SettingsGroup>
    </div>
  );
}
