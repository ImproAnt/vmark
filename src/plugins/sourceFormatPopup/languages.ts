/**
 * Language Data for Code Fence Picker
 *
 * Provides language list with aliases for search/filtering.
 */

export interface Language {
  name: string;
  aliases: string[];
}

/**
 * Quick access languages shown as buttons.
 */
export const QUICK_LANGUAGES: Language[] = [
  { name: "javascript", aliases: ["js"] },
  { name: "typescript", aliases: ["ts"] },
  { name: "python", aliases: ["py"] },
  { name: "rust", aliases: ["rs"] },
  { name: "go", aliases: ["golang"] },
];

/**
 * All supported languages with aliases.
 * Sorted alphabetically by name.
 */
export const LANGUAGES: Language[] = [
  { name: "bash", aliases: ["sh", "shell", "zsh"] },
  { name: "c", aliases: [] },
  { name: "cpp", aliases: ["c++"] },
  { name: "csharp", aliases: ["c#", "cs"] },
  { name: "css", aliases: [] },
  { name: "dockerfile", aliases: ["docker"] },
  { name: "go", aliases: ["golang"] },
  { name: "graphql", aliases: ["gql"] },
  { name: "html", aliases: ["htm"] },
  { name: "java", aliases: [] },
  { name: "javascript", aliases: ["js"] },
  { name: "json", aliases: [] },
  { name: "kotlin", aliases: ["kt"] },
  { name: "latex", aliases: ["tex"] },
  { name: "lua", aliases: [] },
  { name: "markdown", aliases: ["md"] },
  { name: "matlab", aliases: [] },
  { name: "mermaid", aliases: [] },
  { name: "nginx", aliases: [] },
  { name: "php", aliases: [] },
  { name: "python", aliases: ["py"] },
  { name: "r", aliases: [] },
  { name: "ruby", aliases: ["rb"] },
  { name: "rust", aliases: ["rs"] },
  { name: "scss", aliases: ["sass"] },
  { name: "sql", aliases: [] },
  { name: "swift", aliases: [] },
  { name: "toml", aliases: [] },
  { name: "typescript", aliases: ["ts"] },
  { name: "xml", aliases: [] },
  { name: "yaml", aliases: ["yml"] },
];

/**
 * Get display label for quick button (uppercase abbreviation).
 */
export function getQuickLabel(name: string): string {
  const labels: Record<string, string> = {
    javascript: "JS",
    typescript: "TS",
    python: "PY",
    rust: "RS",
    go: "GO",
  };
  return labels[name] || name.toUpperCase().slice(0, 2);
}

/**
 * Filter languages by search query.
 * Matches name or any alias.
 */
export function filterLanguages(query: string): Language[] {
  if (!query) return LANGUAGES;

  const lower = query.toLowerCase();
  return LANGUAGES.filter(
    (lang) =>
      lang.name.toLowerCase().includes(lower) ||
      lang.aliases.some((alias) => alias.toLowerCase().includes(lower))
  );
}

// Recent languages storage
const STORAGE_KEY = "vmark:recent-languages";
const MAX_RECENT = 5;

/**
 * Get recently used languages from localStorage.
 */
export function getRecentLanguages(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Add a language to recent history.
 */
export function addRecentLanguage(lang: string): void {
  const recent = getRecentLanguages();
  const updated = [lang, ...recent.filter((l) => l !== lang)].slice(
    0,
    MAX_RECENT
  );
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore localStorage errors
  }
}
