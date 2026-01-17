/**
 * Tests for list tools.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { VMarkMcpServer } from '../../../src/server.js';
import { MockBridge } from '../../mocks/mockBridge.js';
import { registerListTools } from '../../../src/tools/lists.js';

describe('List Tools', () => {
  let bridge: MockBridge;
  let server: VMarkMcpServer;

  beforeEach(() => {
    bridge = new MockBridge();
    server = new VMarkMcpServer({ bridge });
    registerListTools(server);
  });

  describe('list_toggle', () => {
    it('should toggle bullet list', async () => {
      const result = await server.callTool('list_toggle', { type: 'bullet' });

      expect(result.success).toBe(true);
      expect(result.content[0].text).toContain('Toggled bullet list');
    });

    it('should toggle ordered list', async () => {
      const result = await server.callTool('list_toggle', { type: 'ordered' });

      expect(result.success).toBe(true);
      expect(result.content[0].text).toContain('Toggled ordered list');
    });

    it('should toggle task list', async () => {
      const result = await server.callTool('list_toggle', { type: 'task' });

      expect(result.success).toBe(true);
      expect(result.content[0].text).toContain('Toggled task list');
    });

    it('should reject invalid list type', async () => {
      const result = await server.callTool('list_toggle', { type: 'invalid' });

      expect(result.success).toBe(false);
      expect(result.content[0].text).toContain('Invalid list type');
    });

    it('should send correct bridge request', async () => {
      await server.callTool('list_toggle', { type: 'bullet' });

      const requests = bridge.getRequestsOfType('list.toggle');
      expect(requests).toHaveLength(1);
      expect(requests[0].request).toMatchObject({
        type: 'list.toggle',
        listType: 'bullet',
        windowId: 'focused',
      });
    });

    it('should handle bridge errors', async () => {
      bridge.setNextError(new Error('Cannot create list'));

      const result = await server.callTool('list_toggle', { type: 'bullet' });

      expect(result.success).toBe(false);
      expect(result.content[0].text).toContain('Cannot create list');
    });

    it('should use specified windowId', async () => {
      await server.callTool('list_toggle', { type: 'ordered', windowId: 'editor' });

      const requests = bridge.getRequestsOfType('list.toggle');
      expect(requests[0].request.windowId).toBe('editor');
    });
  });

  describe('list_indent', () => {
    it('should indent list item', async () => {
      const result = await server.callTool('list_indent', {});

      expect(result.success).toBe(true);
      expect(result.content[0].text).toContain('List item indented');
    });

    it('should send correct bridge request', async () => {
      await server.callTool('list_indent', {});

      const requests = bridge.getRequestsOfType('list.increaseIndent');
      expect(requests).toHaveLength(1);
      expect(requests[0].request).toMatchObject({
        type: 'list.increaseIndent',
        windowId: 'focused',
      });
    });

    it('should handle bridge errors', async () => {
      bridge.setNextError(new Error('Not in a list'));

      const result = await server.callTool('list_indent', {});

      expect(result.success).toBe(false);
      expect(result.content[0].text).toContain('Not in a list');
    });

    it('should use specified windowId', async () => {
      await server.callTool('list_indent', { windowId: 'main' });

      const requests = bridge.getRequestsOfType('list.increaseIndent');
      expect(requests[0].request.windowId).toBe('main');
    });
  });

  describe('list_outdent', () => {
    it('should outdent list item', async () => {
      const result = await server.callTool('list_outdent', {});

      expect(result.success).toBe(true);
      expect(result.content[0].text).toContain('List item outdented');
    });

    it('should send correct bridge request', async () => {
      await server.callTool('list_outdent', {});

      const requests = bridge.getRequestsOfType('list.decreaseIndent');
      expect(requests).toHaveLength(1);
      expect(requests[0].request).toMatchObject({
        type: 'list.decreaseIndent',
        windowId: 'focused',
      });
    });

    it('should handle bridge errors', async () => {
      bridge.setNextError(new Error('Already at top level'));

      const result = await server.callTool('list_outdent', {});

      expect(result.success).toBe(false);
      expect(result.content[0].text).toContain('Already at top level');
    });

    it('should use specified windowId', async () => {
      await server.callTool('list_outdent', { windowId: 'draft' });

      const requests = bridge.getRequestsOfType('list.decreaseIndent');
      expect(requests[0].request.windowId).toBe('draft');
    });
  });
});
