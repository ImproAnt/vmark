/**
 * List tools - Manage list elements.
 */

import { VMarkMcpServer, resolveWindowId } from '../server.js';

/**
 * Valid list types.
 */
const VALID_LIST_TYPES = ['bullet', 'ordered', 'task'] as const;
type ListType = (typeof VALID_LIST_TYPES)[number];

function isValidListType(type: string): type is ListType {
  return VALID_LIST_TYPES.includes(type as ListType);
}

/**
 * Register all list tools on the server.
 */
export function registerListTools(server: VMarkMcpServer): void {
  // list_toggle - Toggle a list type
  server.registerTool(
    {
      name: 'list_toggle',
      description:
        'Toggle a list type at the current cursor position. ' +
        'If already in a list of the same type, converts back to paragraph. ' +
        'If in a different list type, converts to the new type.',
      inputSchema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: [...VALID_LIST_TYPES],
            description: 'The list type to toggle (bullet, ordered, task).',
          },
          windowId: {
            type: 'string',
            description: 'Optional window identifier. Defaults to focused window.',
          },
        },
        required: ['type'],
      },
    },
    async (args) => {
      const type = args.type as string;
      const windowId = resolveWindowId(args.windowId as string | undefined);

      if (!isValidListType(type)) {
        return VMarkMcpServer.errorResult(
          `Invalid list type: ${type}. Valid types: ${VALID_LIST_TYPES.join(', ')}`
        );
      }

      try {
        await server.sendBridgeRequest<null>({
          type: 'list.toggle',
          listType: type,
          windowId,
        });

        return VMarkMcpServer.successResult(`Toggled ${type} list`);
      } catch (error) {
        return VMarkMcpServer.errorResult(
          `Failed to toggle list: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  // list_indent - Increase list indentation
  server.registerTool(
    {
      name: 'list_indent',
      description:
        'Increase the indentation level of the current list item. ' +
        'This nests the item under the previous item. ' +
        'Only works when inside a list.',
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
          type: 'list.increaseIndent',
          windowId,
        });

        return VMarkMcpServer.successResult('List item indented');
      } catch (error) {
        return VMarkMcpServer.errorResult(
          `Failed to indent list item: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  // list_outdent - Decrease list indentation
  server.registerTool(
    {
      name: 'list_outdent',
      description:
        'Decrease the indentation level of the current list item. ' +
        'This moves the item up one level in the list hierarchy. ' +
        'If at the top level, this may convert the item to a paragraph.',
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
          type: 'list.decreaseIndent',
          windowId,
        });

        return VMarkMcpServer.successResult('List item outdented');
      } catch (error) {
        return VMarkMcpServer.errorResult(
          `Failed to outdent list item: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );
}
