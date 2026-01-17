/**
 * Document resources - Read-only document data.
 */

import { VMarkMcpServer, resolveWindowId } from '../server.js';
import type { DocumentMetadata, Heading, WindowInfo } from '../bridge/types.js';

/**
 * Register all document resources on the server.
 */
export function registerDocumentResources(server: VMarkMcpServer): void {
  // vmark://document/outline - Get document outline (headings)
  server.registerResource(
    {
      uri: 'vmark://document/outline',
      name: 'Document Outline',
      description:
        'Get the document outline (headings hierarchy). ' +
        'Returns an array of headings with their level, text, and position.',
      mimeType: 'application/json',
    },
    async (_uri: string) => {
      try {
        const outline = await server.sendBridgeRequest<Heading[]>({
          type: 'outline.get',
          windowId: resolveWindowId(undefined),
        });

        return VMarkMcpServer.resourceResult(
          'vmark://document/outline',
          JSON.stringify(outline, null, 2),
          'application/json'
        );
      } catch (error) {
        throw new Error(
          `Failed to get outline: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  // vmark://document/metadata - Get document metadata
  server.registerResource(
    {
      uri: 'vmark://document/metadata',
      name: 'Document Metadata',
      description:
        'Get document metadata including file path, title, word count, ' +
        'character count, modification status, and last modified time.',
      mimeType: 'application/json',
    },
    async (_uri: string) => {
      try {
        const metadata = await server.sendBridgeRequest<DocumentMetadata>({
          type: 'metadata.get',
          windowId: resolveWindowId(undefined),
        });

        return VMarkMcpServer.resourceResult(
          'vmark://document/metadata',
          JSON.stringify(metadata, null, 2),
          'application/json'
        );
      } catch (error) {
        throw new Error(
          `Failed to get metadata: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  // vmark://windows/list - Get list of open windows
  server.registerResource(
    {
      uri: 'vmark://windows/list',
      name: 'Window List',
      description:
        'Get the list of open VMark windows that are exposed to AI. ' +
        'Each window has a label, title, file path, and focus state.',
      mimeType: 'application/json',
    },
    async (_uri: string) => {
      try {
        const windows = await server.sendBridgeRequest<WindowInfo[]>({
          type: 'windows.list',
        });

        return VMarkMcpServer.resourceResult(
          'vmark://windows/list',
          JSON.stringify(windows, null, 2),
          'application/json'
        );
      } catch (error) {
        throw new Error(
          `Failed to get windows: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  // vmark://windows/focused - Get focused window label
  server.registerResource(
    {
      uri: 'vmark://windows/focused',
      name: 'Focused Window',
      description:
        'Get the label of the currently focused window. ' +
        'Use this label as windowId in tool calls to target that window.',
      mimeType: 'text/plain',
    },
    async (_uri: string) => {
      try {
        const focused = await server.sendBridgeRequest<string>({
          type: 'windows.getFocused',
        });

        return VMarkMcpServer.resourceResult(
          'vmark://windows/focused',
          focused,
          'text/plain'
        );
      } catch (error) {
        throw new Error(
          `Failed to get focused window: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );
}
