/**
 * Tests for document resources.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { VMarkMcpServer } from '../../../src/server.js';
import { MockBridge } from '../../mocks/mockBridge.js';
import { registerDocumentResources } from '../../../src/resources/document.js';

describe('Document Resources', () => {
  let bridge: MockBridge;
  let server: VMarkMcpServer;

  beforeEach(() => {
    bridge = new MockBridge();
    server = new VMarkMcpServer({ bridge });
    registerDocumentResources(server);
  });

  describe('vmark://document/outline', () => {
    it('should return document outline', async () => {
      bridge.setContent('# Title\n\nParagraph\n\n## Section 1\n\n### Subsection');

      const result = await server.readResource('vmark://document/outline');

      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].uri).toBe('vmark://document/outline');
      expect(result.contents[0].mimeType).toBe('application/json');

      const outline = JSON.parse(result.contents[0].text!);
      expect(outline).toHaveLength(3);
      expect(outline[0]).toMatchObject({ level: 1, text: 'Title' });
      expect(outline[1]).toMatchObject({ level: 2, text: 'Section 1' });
      expect(outline[2]).toMatchObject({ level: 3, text: 'Subsection' });
    });

    it('should return empty array for document without headings', async () => {
      bridge.setContent('Just a paragraph without any headings.');

      const result = await server.readResource('vmark://document/outline');
      const outline = JSON.parse(result.contents[0].text!);

      expect(outline).toEqual([]);
    });

    it('should handle bridge errors', async () => {
      bridge.setNextError(new Error('Document not loaded'));

      await expect(server.readResource('vmark://document/outline')).rejects.toThrow(
        'Failed to get outline'
      );
    });
  });

  describe('vmark://document/metadata', () => {
    it('should return document metadata', async () => {
      bridge.setContent('Hello world');
      bridge.setMetadata({
        filePath: '/path/to/file.md',
        title: 'My Document',
        isModified: true,
      });

      const result = await server.readResource('vmark://document/metadata');

      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].uri).toBe('vmark://document/metadata');
      expect(result.contents[0].mimeType).toBe('application/json');

      const metadata = JSON.parse(result.contents[0].text!);
      expect(metadata.filePath).toBe('/path/to/file.md');
      expect(metadata.title).toBe('My Document');
      expect(metadata.isModified).toBe(true);
      expect(metadata.wordCount).toBeGreaterThan(0);
      expect(metadata.characterCount).toBeGreaterThan(0);
    });

    it('should return default metadata for new document', async () => {
      const result = await server.readResource('vmark://document/metadata');
      const metadata = JSON.parse(result.contents[0].text!);

      expect(metadata.filePath).toBeNull();
      expect(metadata.title).toBe('Untitled');
      expect(metadata.wordCount).toBe(0);
    });

    it('should handle bridge errors', async () => {
      bridge.setNextError(new Error('Document not found'));

      await expect(server.readResource('vmark://document/metadata')).rejects.toThrow(
        'Failed to get metadata'
      );
    });
  });

  describe('vmark://windows/list', () => {
    it('should return list of windows', async () => {
      bridge.addWindow('secondary', { title: 'Second Window', isFocused: false });

      const result = await server.readResource('vmark://windows/list');

      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].uri).toBe('vmark://windows/list');
      expect(result.contents[0].mimeType).toBe('application/json');

      const windows = JSON.parse(result.contents[0].text!);
      expect(windows).toHaveLength(2);
      expect(windows.map((w: { label: string }) => w.label)).toContain('main');
      expect(windows.map((w: { label: string }) => w.label)).toContain('secondary');
    });

    it('should only include AI-exposed windows', async () => {
      bridge.addWindow('hidden', { isAiExposed: false });

      const result = await server.readResource('vmark://windows/list');
      const windows = JSON.parse(result.contents[0].text!);

      expect(windows.map((w: { label: string }) => w.label)).not.toContain('hidden');
    });

    it('should include window metadata', async () => {
      bridge.setMetadata({ filePath: '/path/to/doc.md', title: 'My Doc' });

      const result = await server.readResource('vmark://windows/list');
      const windows = JSON.parse(result.contents[0].text!);
      const mainWindow = windows.find((w: { label: string }) => w.label === 'main');

      expect(mainWindow.title).toBe('My Doc');
      expect(mainWindow.filePath).toBe('/path/to/doc.md');
      expect(mainWindow.isFocused).toBe(true);
    });

    it('should handle bridge errors', async () => {
      bridge.setNextError(new Error('Cannot list windows'));

      await expect(server.readResource('vmark://windows/list')).rejects.toThrow(
        'Failed to get windows'
      );
    });
  });

  describe('vmark://windows/focused', () => {
    it('should return focused window label', async () => {
      const result = await server.readResource('vmark://windows/focused');

      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].uri).toBe('vmark://windows/focused');
      expect(result.contents[0].mimeType).toBe('text/plain');
      expect(result.contents[0].text).toBe('main');
    });

    it('should return correct label when focus changes', async () => {
      bridge.addWindow('secondary');
      bridge.setFocusedWindow('secondary');

      const result = await server.readResource('vmark://windows/focused');

      expect(result.contents[0].text).toBe('secondary');
    });

    it('should handle bridge errors', async () => {
      bridge.setNextError(new Error('No focused window'));

      await expect(server.readResource('vmark://windows/focused')).rejects.toThrow(
        'Failed to get focused window'
      );
    });
  });
});
