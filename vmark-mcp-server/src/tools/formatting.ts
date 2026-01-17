/**
 * Formatting tools - Apply text formatting marks.
 */

import { VMarkMcpServer, resolveWindowId } from '../server.js';

/**
 * Valid mark types for formatting.
 */
const VALID_MARKS = ['bold', 'italic', 'code', 'strike', 'underline', 'highlight'] as const;
type MarkType = (typeof VALID_MARKS)[number];

function isValidMark(mark: string): mark is MarkType {
  return VALID_MARKS.includes(mark as MarkType);
}

/**
 * Register all formatting tools on the server.
 */
export function registerFormattingTools(server: VMarkMcpServer): void {
  // format_toggle - Toggle a formatting mark
  server.registerTool(
    {
      name: 'format_toggle',
      description:
        'Toggle a formatting mark on the current selection. ' +
        'If the selection already has the mark, it will be removed. ' +
        'If no selection, toggles the mark for future typing.',
      inputSchema: {
        type: 'object',
        properties: {
          mark: {
            type: 'string',
            enum: [...VALID_MARKS],
            description: 'The mark type to toggle (bold, italic, code, strike, underline, highlight).',
          },
          windowId: {
            type: 'string',
            description: 'Optional window identifier. Defaults to focused window.',
          },
        },
        required: ['mark'],
      },
    },
    async (args) => {
      const mark = args.mark as string;
      const windowId = resolveWindowId(args.windowId as string | undefined);

      if (!isValidMark(mark)) {
        return VMarkMcpServer.errorResult(
          `Invalid mark type: ${mark}. Valid marks: ${VALID_MARKS.join(', ')}`
        );
      }

      try {
        await server.sendBridgeRequest<null>({
          type: 'format.toggle',
          mark,
          windowId,
        });

        return VMarkMcpServer.successResult(`Toggled ${mark} formatting`);
      } catch (error) {
        return VMarkMcpServer.errorResult(
          `Failed to toggle format: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  // format_set_link - Set a link on the selection
  server.registerTool(
    {
      name: 'format_set_link',
      description:
        'Set a hyperlink on the current selection. ' +
        'If no text is selected, this will have no effect. ' +
        'The href is required, title is optional.',
      inputSchema: {
        type: 'object',
        properties: {
          href: {
            type: 'string',
            description: 'The URL for the link.',
          },
          title: {
            type: 'string',
            description: 'Optional title attribute for the link.',
          },
          windowId: {
            type: 'string',
            description: 'Optional window identifier. Defaults to focused window.',
          },
        },
        required: ['href'],
      },
    },
    async (args) => {
      const href = args.href as string;
      const title = args.title as string | undefined;
      const windowId = resolveWindowId(args.windowId as string | undefined);

      if (typeof href !== 'string' || href.length === 0) {
        return VMarkMcpServer.errorResult('href must be a non-empty string');
      }

      try {
        await server.sendBridgeRequest<null>({
          type: 'format.setLink',
          href,
          title,
          windowId,
        });

        return VMarkMcpServer.successResult(`Link set: ${href}`);
      } catch (error) {
        return VMarkMcpServer.errorResult(
          `Failed to set link: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  // format_remove_link - Remove a link from the selection
  server.registerTool(
    {
      name: 'format_remove_link',
      description:
        'Remove the hyperlink from the current selection or cursor position. ' +
        'If the cursor is inside a link, that link will be removed.',
      inputSchema: {
        type: 'object',
        properties: {
          windowId: {
            type: 'string',
            description: 'Optional window identifier. Defaults to focused window.',
          },
        },
      },
    },
    async (args) => {
      const windowId = resolveWindowId(args.windowId as string | undefined);

      try {
        await server.sendBridgeRequest<null>({
          type: 'format.removeLink',
          windowId,
        });

        return VMarkMcpServer.successResult('Link removed');
      } catch (error) {
        return VMarkMcpServer.errorResult(
          `Failed to remove link: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  // format_clear - Clear all formatting from selection
  server.registerTool(
    {
      name: 'format_clear',
      description:
        'Clear all formatting marks from the current selection. ' +
        'This removes bold, italic, code, links, and all other marks, ' +
        'leaving plain text.',
      inputSchema: {
        type: 'object',
        properties: {
          windowId: {
            type: 'string',
            description: 'Optional window identifier. Defaults to focused window.',
          },
        },
      },
    },
    async (args) => {
      const windowId = resolveWindowId(args.windowId as string | undefined);

      try {
        await server.sendBridgeRequest<null>({
          type: 'format.clear',
          windowId,
        });

        return VMarkMcpServer.successResult('Formatting cleared');
      } catch (error) {
        return VMarkMcpServer.errorResult(
          `Failed to clear formatting: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );
}
