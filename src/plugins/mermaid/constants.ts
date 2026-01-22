/**
 * Mermaid Plugin Constants
 *
 * Shared constants for mermaid diagram functionality.
 */

/**
 * Default mermaid diagram template used when inserting new diagrams.
 */
export const DEFAULT_MERMAID_DIAGRAM = `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Do something]
    B -->|No| D[Do another thing]
    C --> E[End]
    D --> E`;
