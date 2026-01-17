/**
 * Table tools - Manage table elements.
 */

import { VMarkMcpServer, resolveWindowId, validateNonNegativeInteger } from '../server.js';

/**
 * Register all table tools on the server.
 */
export function registerTableTools(server: VMarkMcpServer): void {
  // table_insert - Insert a new table
  server.registerTool(
    {
      name: 'table_insert',
      description:
        'Insert a new table at the current cursor position. ' +
        'Creates a table with the specified number of rows and columns.',
      inputSchema: {
        type: 'object',
        properties: {
          rows: {
            type: 'number',
            description: 'Number of rows (must be at least 1).',
          },
          cols: {
            type: 'number',
            description: 'Number of columns (must be at least 1).',
          },
          withHeaderRow: {
            type: 'boolean',
            description: 'Whether to include a header row. Defaults to true.',
          },
          windowId: {
            type: 'string',
            description: 'Optional window identifier. Defaults to focused window.',
          },
        },
        required: ['rows', 'cols'],
      },
    },
    async (args) => {
      const rows = args.rows as number;
      const cols = args.cols as number;
      const withHeaderRow = (args.withHeaderRow as boolean) ?? true;
      const windowId = resolveWindowId(args.windowId as string | undefined);

      const rowsError = validateNonNegativeInteger(rows, 'rows');
      if (rowsError) {
        return VMarkMcpServer.errorResult(rowsError);
      }
      if (rows < 1) {
        return VMarkMcpServer.errorResult('rows must be at least 1');
      }

      const colsError = validateNonNegativeInteger(cols, 'cols');
      if (colsError) {
        return VMarkMcpServer.errorResult(colsError);
      }
      if (cols < 1) {
        return VMarkMcpServer.errorResult('cols must be at least 1');
      }

      try {
        await server.sendBridgeRequest<null>({
          type: 'table.insert',
          rows,
          cols,
          withHeaderRow,
          windowId,
        });

        return VMarkMcpServer.successResult(`Table inserted (${rows}x${cols})`);
      } catch (error) {
        return VMarkMcpServer.errorResult(
          `Failed to insert table: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  // table_delete - Delete the current table
  server.registerTool(
    {
      name: 'table_delete',
      description:
        'Delete the table containing the cursor. ' +
        'If the cursor is not inside a table, this has no effect.',
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
          type: 'table.delete',
          windowId,
        });

        return VMarkMcpServer.successResult('Table deleted');
      } catch (error) {
        return VMarkMcpServer.errorResult(
          `Failed to delete table: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  // table_add_row - Add a row to the table
  server.registerTool(
    {
      name: 'table_add_row',
      description:
        'Add a row to the table at the specified position. ' +
        'Use "before" to add above the current row, "after" to add below.',
      inputSchema: {
        type: 'object',
        properties: {
          position: {
            type: 'string',
            enum: ['before', 'after'],
            description: 'Where to add the row relative to the current row.',
          },
          windowId: {
            type: 'string',
            description: 'Optional window identifier. Defaults to focused window.',
          },
        },
        required: ['position'],
      },
    },
    async (args) => {
      const position = args.position as string;
      const windowId = resolveWindowId(args.windowId as string | undefined);

      if (position !== 'before' && position !== 'after') {
        return VMarkMcpServer.errorResult('position must be "before" or "after"');
      }

      try {
        await server.sendBridgeRequest<null>({
          type: position === 'before' ? 'table.addRowBefore' : 'table.addRowAfter',
          windowId,
        });

        return VMarkMcpServer.successResult(`Row added ${position} current row`);
      } catch (error) {
        return VMarkMcpServer.errorResult(
          `Failed to add row: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  // table_delete_row - Delete the current row
  server.registerTool(
    {
      name: 'table_delete_row',
      description: 'Delete the current table row containing the cursor.',
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
          type: 'table.deleteRow',
          windowId,
        });

        return VMarkMcpServer.successResult('Row deleted');
      } catch (error) {
        return VMarkMcpServer.errorResult(
          `Failed to delete row: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  // table_add_column - Add a column to the table
  server.registerTool(
    {
      name: 'table_add_column',
      description:
        'Add a column to the table at the specified position. ' +
        'Use "before" to add to the left, "after" to add to the right.',
      inputSchema: {
        type: 'object',
        properties: {
          position: {
            type: 'string',
            enum: ['before', 'after'],
            description: 'Where to add the column relative to the current column.',
          },
          windowId: {
            type: 'string',
            description: 'Optional window identifier. Defaults to focused window.',
          },
        },
        required: ['position'],
      },
    },
    async (args) => {
      const position = args.position as string;
      const windowId = resolveWindowId(args.windowId as string | undefined);

      if (position !== 'before' && position !== 'after') {
        return VMarkMcpServer.errorResult('position must be "before" or "after"');
      }

      try {
        await server.sendBridgeRequest<null>({
          type: position === 'before' ? 'table.addColumnBefore' : 'table.addColumnAfter',
          windowId,
        });

        return VMarkMcpServer.successResult(`Column added ${position} current column`);
      } catch (error) {
        return VMarkMcpServer.errorResult(
          `Failed to add column: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  // table_delete_column - Delete the current column
  server.registerTool(
    {
      name: 'table_delete_column',
      description: 'Delete the current table column containing the cursor.',
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
          type: 'table.deleteColumn',
          windowId,
        });

        return VMarkMcpServer.successResult('Column deleted');
      } catch (error) {
        return VMarkMcpServer.errorResult(
          `Failed to delete column: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  // table_toggle_header_row - Toggle header row
  server.registerTool(
    {
      name: 'table_toggle_header_row',
      description: 'Toggle the header row in the current table.',
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
          type: 'table.toggleHeaderRow',
          windowId,
        });

        return VMarkMcpServer.successResult('Header row toggled');
      } catch (error) {
        return VMarkMcpServer.errorResult(
          `Failed to toggle header row: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );
}
