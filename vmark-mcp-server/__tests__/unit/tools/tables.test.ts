/**
 * Tests for table tools.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { VMarkMcpServer } from '../../../src/server.js';
import { MockBridge } from '../../mocks/mockBridge.js';
import { registerTableTools } from '../../../src/tools/tables.js';

describe('Table Tools', () => {
  let bridge: MockBridge;
  let server: VMarkMcpServer;

  beforeEach(() => {
    bridge = new MockBridge();
    server = new VMarkMcpServer({ bridge });
    registerTableTools(server);
  });

  describe('table_insert', () => {
    it('should insert a table', async () => {
      const result = await server.callTool('table_insert', { rows: 3, cols: 4 });

      expect(result.success).toBe(true);
      expect(result.content[0].text).toContain('Table inserted (3x4)');
    });

    it('should insert table with header row by default', async () => {
      await server.callTool('table_insert', { rows: 2, cols: 2 });

      const requests = bridge.getRequestsOfType('table.insert');
      expect(requests[0].request.withHeaderRow).toBe(true);
    });

    it('should allow disabling header row', async () => {
      await server.callTool('table_insert', {
        rows: 2,
        cols: 2,
        withHeaderRow: false,
      });

      const requests = bridge.getRequestsOfType('table.insert');
      expect(requests[0].request.withHeaderRow).toBe(false);
    });

    it('should validate rows is positive', async () => {
      const result = await server.callTool('table_insert', { rows: 0, cols: 2 });

      expect(result.success).toBe(false);
      expect(result.content[0].text).toContain('rows must be at least 1');
    });

    it('should validate cols is positive', async () => {
      const result = await server.callTool('table_insert', { rows: 2, cols: 0 });

      expect(result.success).toBe(false);
      expect(result.content[0].text).toContain('cols must be at least 1');
    });

    it('should validate rows is integer', async () => {
      const result = await server.callTool('table_insert', { rows: 2.5, cols: 2 });

      expect(result.success).toBe(false);
      expect(result.content[0].text).toContain('must be an integer');
    });

    it('should validate cols is integer', async () => {
      const result = await server.callTool('table_insert', { rows: 2, cols: 2.5 });

      expect(result.success).toBe(false);
      expect(result.content[0].text).toContain('must be an integer');
    });

    it('should send correct bridge request', async () => {
      await server.callTool('table_insert', { rows: 3, cols: 4, withHeaderRow: true });

      const requests = bridge.getRequestsOfType('table.insert');
      expect(requests).toHaveLength(1);
      expect(requests[0].request).toMatchObject({
        type: 'table.insert',
        rows: 3,
        cols: 4,
        withHeaderRow: true,
        windowId: 'focused',
      });
    });

    it('should handle bridge errors', async () => {
      bridge.setNextError(new Error('Cannot insert table here'));

      const result = await server.callTool('table_insert', { rows: 2, cols: 2 });

      expect(result.success).toBe(false);
      expect(result.content[0].text).toContain('Cannot insert table here');
    });
  });

  describe('table_delete', () => {
    it('should delete table', async () => {
      const result = await server.callTool('table_delete', {});

      expect(result.success).toBe(true);
      expect(result.content[0].text).toContain('Table deleted');
    });

    it('should send correct bridge request', async () => {
      await server.callTool('table_delete', {});

      const requests = bridge.getRequestsOfType('table.delete');
      expect(requests).toHaveLength(1);
    });

    it('should handle bridge errors', async () => {
      bridge.setNextError(new Error('Not in a table'));

      const result = await server.callTool('table_delete', {});

      expect(result.success).toBe(false);
      expect(result.content[0].text).toContain('Not in a table');
    });
  });

  describe('table_add_row', () => {
    it('should add row before', async () => {
      const result = await server.callTool('table_add_row', { position: 'before' });

      expect(result.success).toBe(true);
      expect(result.content[0].text).toContain('Row added before');
    });

    it('should add row after', async () => {
      const result = await server.callTool('table_add_row', { position: 'after' });

      expect(result.success).toBe(true);
      expect(result.content[0].text).toContain('Row added after');
    });

    it('should reject invalid position', async () => {
      const result = await server.callTool('table_add_row', { position: 'invalid' });

      expect(result.success).toBe(false);
      expect(result.content[0].text).toContain('position must be');
    });

    it('should send correct bridge request for before', async () => {
      await server.callTool('table_add_row', { position: 'before' });

      const requests = bridge.getRequestsOfType('table.addRowBefore');
      expect(requests).toHaveLength(1);
    });

    it('should send correct bridge request for after', async () => {
      await server.callTool('table_add_row', { position: 'after' });

      const requests = bridge.getRequestsOfType('table.addRowAfter');
      expect(requests).toHaveLength(1);
    });

    it('should handle bridge errors', async () => {
      bridge.setNextError(new Error('Not in a table'));

      const result = await server.callTool('table_add_row', { position: 'after' });

      expect(result.success).toBe(false);
      expect(result.content[0].text).toContain('Not in a table');
    });
  });

  describe('table_delete_row', () => {
    it('should delete row', async () => {
      const result = await server.callTool('table_delete_row', {});

      expect(result.success).toBe(true);
      expect(result.content[0].text).toContain('Row deleted');
    });

    it('should send correct bridge request', async () => {
      await server.callTool('table_delete_row', {});

      const requests = bridge.getRequestsOfType('table.deleteRow');
      expect(requests).toHaveLength(1);
    });

    it('should handle bridge errors', async () => {
      bridge.setNextError(new Error('Cannot delete last row'));

      const result = await server.callTool('table_delete_row', {});

      expect(result.success).toBe(false);
      expect(result.content[0].text).toContain('Cannot delete last row');
    });
  });

  describe('table_add_column', () => {
    it('should add column before', async () => {
      const result = await server.callTool('table_add_column', { position: 'before' });

      expect(result.success).toBe(true);
      expect(result.content[0].text).toContain('Column added before');
    });

    it('should add column after', async () => {
      const result = await server.callTool('table_add_column', { position: 'after' });

      expect(result.success).toBe(true);
      expect(result.content[0].text).toContain('Column added after');
    });

    it('should reject invalid position', async () => {
      const result = await server.callTool('table_add_column', { position: 'middle' });

      expect(result.success).toBe(false);
      expect(result.content[0].text).toContain('position must be');
    });

    it('should send correct bridge request for before', async () => {
      await server.callTool('table_add_column', { position: 'before' });

      const requests = bridge.getRequestsOfType('table.addColumnBefore');
      expect(requests).toHaveLength(1);
    });

    it('should send correct bridge request for after', async () => {
      await server.callTool('table_add_column', { position: 'after' });

      const requests = bridge.getRequestsOfType('table.addColumnAfter');
      expect(requests).toHaveLength(1);
    });
  });

  describe('table_delete_column', () => {
    it('should delete column', async () => {
      const result = await server.callTool('table_delete_column', {});

      expect(result.success).toBe(true);
      expect(result.content[0].text).toContain('Column deleted');
    });

    it('should send correct bridge request', async () => {
      await server.callTool('table_delete_column', {});

      const requests = bridge.getRequestsOfType('table.deleteColumn');
      expect(requests).toHaveLength(1);
    });

    it('should handle bridge errors', async () => {
      bridge.setNextError(new Error('Cannot delete last column'));

      const result = await server.callTool('table_delete_column', {});

      expect(result.success).toBe(false);
      expect(result.content[0].text).toContain('Cannot delete last column');
    });
  });

  describe('table_toggle_header_row', () => {
    it('should toggle header row', async () => {
      const result = await server.callTool('table_toggle_header_row', {});

      expect(result.success).toBe(true);
      expect(result.content[0].text).toContain('Header row toggled');
    });

    it('should send correct bridge request', async () => {
      await server.callTool('table_toggle_header_row', {});

      const requests = bridge.getRequestsOfType('table.toggleHeaderRow');
      expect(requests).toHaveLength(1);
    });

    it('should handle bridge errors', async () => {
      bridge.setNextError(new Error('Not in a table'));

      const result = await server.callTool('table_toggle_header_row', {});

      expect(result.success).toBe(false);
      expect(result.content[0].text).toContain('Not in a table');
    });

    it('should use specified windowId', async () => {
      await server.callTool('table_toggle_header_row', { windowId: 'editor' });

      const requests = bridge.getRequestsOfType('table.toggleHeaderRow');
      expect(requests[0].request.windowId).toBe('editor');
    });
  });
});
