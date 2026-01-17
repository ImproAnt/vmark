/**
 * Tests for formatting tools.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { VMarkMcpServer } from '../../../src/server.js';
import { MockBridge } from '../../mocks/mockBridge.js';
import { registerFormattingTools } from '../../../src/tools/formatting.js';

describe('Formatting Tools', () => {
  let bridge: MockBridge;
  let server: VMarkMcpServer;

  beforeEach(() => {
    bridge = new MockBridge();
    server = new VMarkMcpServer({ bridge });
    registerFormattingTools(server);
  });

  describe('format_toggle', () => {
    it('should toggle bold formatting', async () => {
      const result = await server.callTool('format_toggle', { mark: 'bold' });

      expect(result.success).toBe(true);
      expect(result.content[0].text).toContain('Toggled bold');
    });

    it('should toggle italic formatting', async () => {
      const result = await server.callTool('format_toggle', { mark: 'italic' });

      expect(result.success).toBe(true);
      expect(result.content[0].text).toContain('Toggled italic');
    });

    it('should toggle code formatting', async () => {
      const result = await server.callTool('format_toggle', { mark: 'code' });

      expect(result.success).toBe(true);
      expect(result.content[0].text).toContain('Toggled code');
    });

    it('should toggle strike formatting', async () => {
      const result = await server.callTool('format_toggle', { mark: 'strike' });

      expect(result.success).toBe(true);
      expect(result.content[0].text).toContain('Toggled strike');
    });

    it('should toggle underline formatting', async () => {
      const result = await server.callTool('format_toggle', { mark: 'underline' });

      expect(result.success).toBe(true);
      expect(result.content[0].text).toContain('Toggled underline');
    });

    it('should toggle highlight formatting', async () => {
      const result = await server.callTool('format_toggle', { mark: 'highlight' });

      expect(result.success).toBe(true);
      expect(result.content[0].text).toContain('Toggled highlight');
    });

    it('should reject invalid mark type', async () => {
      const result = await server.callTool('format_toggle', { mark: 'invalid' });

      expect(result.success).toBe(false);
      expect(result.content[0].text).toContain('Invalid mark type');
    });

    it('should send correct bridge request', async () => {
      await server.callTool('format_toggle', { mark: 'bold' });

      const requests = bridge.getRequestsOfType('format.toggle');
      expect(requests).toHaveLength(1);
      expect(requests[0].request).toMatchObject({
        type: 'format.toggle',
        mark: 'bold',
        windowId: 'focused',
      });
    });

    it('should handle bridge errors', async () => {
      bridge.setNextError(new Error('Editor not ready'));

      const result = await server.callTool('format_toggle', { mark: 'bold' });

      expect(result.success).toBe(false);
      expect(result.content[0].text).toContain('Editor not ready');
    });

    it('should use specified windowId', async () => {
      await server.callTool('format_toggle', { mark: 'bold', windowId: 'secondary' });

      const requests = bridge.getRequestsOfType('format.toggle');
      expect(requests[0].request.windowId).toBe('secondary');
    });
  });

  describe('format_set_link', () => {
    it('should set a link with href only', async () => {
      const result = await server.callTool('format_set_link', {
        href: 'https://example.com',
      });

      expect(result.success).toBe(true);
      expect(result.content[0].text).toContain('Link set');
      expect(result.content[0].text).toContain('https://example.com');
    });

    it('should set a link with href and title', async () => {
      const result = await server.callTool('format_set_link', {
        href: 'https://example.com',
        title: 'Example Website',
      });

      expect(result.success).toBe(true);
      expect(result.content[0].text).toContain('Link set');
    });

    it('should send correct bridge request', async () => {
      await server.callTool('format_set_link', {
        href: 'https://example.com',
        title: 'My Link',
      });

      const requests = bridge.getRequestsOfType('format.setLink');
      expect(requests).toHaveLength(1);
      expect(requests[0].request).toMatchObject({
        type: 'format.setLink',
        href: 'https://example.com',
        title: 'My Link',
        windowId: 'focused',
      });
    });

    it('should reject empty href', async () => {
      const result = await server.callTool('format_set_link', { href: '' });

      expect(result.success).toBe(false);
      expect(result.content[0].text).toContain('href must be a non-empty string');
    });

    it('should handle bridge errors', async () => {
      bridge.setNextError(new Error('No selection'));

      const result = await server.callTool('format_set_link', {
        href: 'https://example.com',
      });

      expect(result.success).toBe(false);
      expect(result.content[0].text).toContain('No selection');
    });

    it('should use specified windowId', async () => {
      await server.callTool('format_set_link', {
        href: 'https://example.com',
        windowId: 'main',
      });

      const requests = bridge.getRequestsOfType('format.setLink');
      expect(requests[0].request.windowId).toBe('main');
    });
  });

  describe('format_remove_link', () => {
    it('should remove link', async () => {
      const result = await server.callTool('format_remove_link', {});

      expect(result.success).toBe(true);
      expect(result.content[0].text).toContain('Link removed');
    });

    it('should send correct bridge request', async () => {
      await server.callTool('format_remove_link', {});

      const requests = bridge.getRequestsOfType('format.removeLink');
      expect(requests).toHaveLength(1);
      expect(requests[0].request).toMatchObject({
        type: 'format.removeLink',
        windowId: 'focused',
      });
    });

    it('should handle bridge errors', async () => {
      bridge.setNextError(new Error('No link found'));

      const result = await server.callTool('format_remove_link', {});

      expect(result.success).toBe(false);
      expect(result.content[0].text).toContain('No link found');
    });

    it('should use specified windowId', async () => {
      await server.callTool('format_remove_link', { windowId: 'editor' });

      const requests = bridge.getRequestsOfType('format.removeLink');
      expect(requests[0].request.windowId).toBe('editor');
    });
  });

  describe('format_clear', () => {
    it('should clear all formatting', async () => {
      const result = await server.callTool('format_clear', {});

      expect(result.success).toBe(true);
      expect(result.content[0].text).toContain('Formatting cleared');
    });

    it('should send correct bridge request', async () => {
      await server.callTool('format_clear', {});

      const requests = bridge.getRequestsOfType('format.clear');
      expect(requests).toHaveLength(1);
      expect(requests[0].request).toMatchObject({
        type: 'format.clear',
        windowId: 'focused',
      });
    });

    it('should handle bridge errors', async () => {
      bridge.setNextError(new Error('Editor locked'));

      const result = await server.callTool('format_clear', {});

      expect(result.success).toBe(false);
      expect(result.content[0].text).toContain('Editor locked');
    });

    it('should use specified windowId', async () => {
      await server.callTool('format_clear', { windowId: 'draft' });

      const requests = bridge.getRequestsOfType('format.clear');
      expect(requests[0].request.windowId).toBe('draft');
    });
  });
});
