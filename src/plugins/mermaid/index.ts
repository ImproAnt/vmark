/**
 * Mermaid Plugin
 *
 * Adds mermaid diagram support to the editor.
 * Renders ```mermaid code blocks as diagrams.
 */

import mermaid from "mermaid";

// Initialize mermaid with default config
let mermaidInitialized = false;

function initMermaid() {
  if (mermaidInitialized) return;

  mermaid.initialize({
    startOnLoad: false,
    theme: "default",
    securityLevel: "strict",
    fontFamily: "inherit",
  });

  mermaidInitialized = true;
}

/**
 * Render mermaid diagram content to SVG HTML.
 * Returns null if rendering fails.
 */
export async function renderMermaid(
  content: string,
  id?: string
): Promise<string | null> {
  initMermaid();

  const diagramId = id ?? `mermaid-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  try {
    const { svg } = await mermaid.render(diagramId, content);
    return svg;
  } catch (error) {
    console.warn("[Mermaid] Failed to render diagram:", error);
    return null;
  }
}

/**
 * Synchronous check if content looks like valid mermaid syntax.
 * Used for quick validation before attempting render.
 */
export function isMermaidSyntax(content: string): boolean {
  const trimmed = content.trim();
  // Common mermaid diagram types
  const diagramTypes = [
    "graph",
    "flowchart",
    "sequenceDiagram",
    "classDiagram",
    "stateDiagram",
    "erDiagram",
    "gantt",
    "pie",
    "gitGraph",
    "mindmap",
    "timeline",
    "quadrantChart",
    "xychart",
    "block-beta",
    "packet-beta",
    "kanban",
    "architecture-beta",
  ];

  return diagramTypes.some(
    (type) =>
      trimmed.startsWith(type) ||
      trimmed.startsWith(`%%{`) // mermaid directives
  );
}
