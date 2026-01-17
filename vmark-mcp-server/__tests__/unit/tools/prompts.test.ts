/**
 * Tests for AI prompt tools.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { VMarkMcpServer } from '../../../src/server.js';
import { MockBridge } from '../../mocks/mockBridge.js';
import { registerPromptTools } from '../../../src/tools/prompts.js';

describe('Prompt Tools', () => {
  let bridge: MockBridge;
  let server: VMarkMcpServer;

  beforeEach(() => {
    bridge = new MockBridge();
    server = new VMarkMcpServer({ bridge });
    registerPromptTools(server);
  });

  describe('improve_writing', () => {
    it('should improve writing with style', async () => {
      bridge.setResponseHandler('ai.improveWriting', () => ({
        success: true,
        data: { improved: 'The quick brown fox jumps over the lazy dog.' },
      }));

      const result = await server.callTool('improve_writing', { style: 'formal' });

      expect(result.success).toBe(true);
      expect(result.content[0].text).toContain('Writing improved');
    });

    it('should send correct bridge request', async () => {
      bridge.setResponseHandler('ai.improveWriting', () => ({
        success: true,
        data: { improved: 'Improved text here' },
      }));

      await server.callTool('improve_writing', {
        style: 'concise',
        instructions: 'Remove redundancy',
      });

      const requests = bridge.getRequestsOfType('ai.improveWriting');
      expect(requests).toHaveLength(1);
      expect(requests[0].request).toMatchObject({
        style: 'concise',
        instructions: 'Remove redundancy',
        windowId: 'focused',
      });
    });

    it('should reject invalid style', async () => {
      const result = await server.callTool('improve_writing', { style: 'invalid' });

      expect(result.success).toBe(false);
      expect(result.content[0].text).toContain('Invalid style');
    });

    it('should accept all valid styles', async () => {
      bridge.setResponseHandler('ai.improveWriting', () => ({
        success: true,
        data: { improved: 'text' },
      }));

      const styles = ['formal', 'casual', 'concise', 'elaborate', 'academic'];
      for (const style of styles) {
        const result = await server.callTool('improve_writing', { style });
        expect(result.success).toBe(true);
      }
    });

    it('should handle bridge errors', async () => {
      bridge.setNextError(new Error('No text selected'));

      const result = await server.callTool('improve_writing', { style: 'formal' });

      expect(result.success).toBe(false);
      expect(result.content[0].text).toContain('No text selected');
    });
  });

  describe('fix_grammar', () => {
    it('should fix grammar', async () => {
      bridge.setResponseHandler('ai.fixGrammar', () => ({
        success: true,
        data: { fixed: 'Corrected text', changes: 3 },
      }));

      const result = await server.callTool('fix_grammar', {});

      expect(result.success).toBe(true);
      expect(result.content[0].text).toContain('Fixed 3 grammar issues');
    });

    it('should handle single issue', async () => {
      bridge.setResponseHandler('ai.fixGrammar', () => ({
        success: true,
        data: { fixed: 'text', changes: 1 },
      }));

      const result = await server.callTool('fix_grammar', {});

      expect(result.success).toBe(true);
      expect(result.content[0].text).toContain('Fixed 1 grammar issue');
      expect(result.content[0].text).not.toContain('issues');
    });

    it('should send correct bridge request', async () => {
      bridge.setResponseHandler('ai.fixGrammar', () => ({
        success: true,
        data: { fixed: 'text', changes: 0 },
      }));

      await server.callTool('fix_grammar', { windowId: 'editor' });

      const requests = bridge.getRequestsOfType('ai.fixGrammar');
      expect(requests).toHaveLength(1);
      expect(requests[0].request.windowId).toBe('editor');
    });

    it('should handle bridge errors', async () => {
      bridge.setNextError(new Error('No text selected'));

      const result = await server.callTool('fix_grammar', {});

      expect(result.success).toBe(false);
    });
  });

  describe('translate', () => {
    it('should translate text', async () => {
      bridge.setResponseHandler('ai.translate', () => ({
        success: true,
        data: { translated: '你好世界' },
      }));

      const result = await server.callTool('translate', { targetLanguage: 'zh' });

      expect(result.success).toBe(true);
      expect(result.content[0].text).toContain('Translated to zh');
    });

    it('should send correct bridge request', async () => {
      bridge.setResponseHandler('ai.translate', () => ({
        success: true,
        data: { translated: 'Bonjour' },
      }));

      await server.callTool('translate', { targetLanguage: 'fr' });

      const requests = bridge.getRequestsOfType('ai.translate');
      expect(requests).toHaveLength(1);
      expect(requests[0].request.targetLanguage).toBe('fr');
    });

    it('should reject empty targetLanguage', async () => {
      const result = await server.callTool('translate', { targetLanguage: '' });

      expect(result.success).toBe(false);
      expect(result.content[0].text).toContain('non-empty string');
    });

    it('should handle bridge errors', async () => {
      bridge.setNextError(new Error('Translation service unavailable'));

      const result = await server.callTool('translate', { targetLanguage: 'ja' });

      expect(result.success).toBe(false);
      expect(result.content[0].text).toContain('Translation service unavailable');
    });
  });

  describe('summarize', () => {
    it('should summarize text with default length', async () => {
      bridge.setResponseHandler('ai.summarize', () => ({
        success: true,
        data: { summary: 'This is a summary.' },
      }));

      const result = await server.callTool('summarize', {});

      expect(result.success).toBe(true);
      expect(result.content[0].text).toContain('Summary generated (medium)');
    });

    it('should accept valid lengths', async () => {
      bridge.setResponseHandler('ai.summarize', () => ({
        success: true,
        data: { summary: 'Summary' },
      }));

      for (const length of ['brief', 'medium', 'detailed']) {
        const result = await server.callTool('summarize', { length });
        expect(result.success).toBe(true);
        expect(result.content[0].text).toContain(`(${length})`);
      }
    });

    it('should reject invalid length', async () => {
      const result = await server.callTool('summarize', { length: 'short' });

      expect(result.success).toBe(false);
      expect(result.content[0].text).toContain('brief');
    });

    it('should send correct bridge request', async () => {
      bridge.setResponseHandler('ai.summarize', () => ({
        success: true,
        data: { summary: 'Summary' },
      }));

      await server.callTool('summarize', { length: 'detailed' });

      const requests = bridge.getRequestsOfType('ai.summarize');
      expect(requests).toHaveLength(1);
      expect(requests[0].request.length).toBe('detailed');
    });

    it('should handle bridge errors', async () => {
      bridge.setNextError(new Error('Text too short to summarize'));

      const result = await server.callTool('summarize', {});

      expect(result.success).toBe(false);
    });
  });

  describe('expand', () => {
    it('should expand text', async () => {
      bridge.setResponseHandler('ai.expand', () => ({
        success: true,
        data: { expanded: 'Expanded content with more details.' },
      }));

      const result = await server.callTool('expand', {});

      expect(result.success).toBe(true);
      expect(result.content[0].text).toContain('Text expanded');
    });

    it('should send correct bridge request with focus', async () => {
      bridge.setResponseHandler('ai.expand', () => ({
        success: true,
        data: { expanded: 'Expanded' },
      }));

      await server.callTool('expand', { focus: 'examples' });

      const requests = bridge.getRequestsOfType('ai.expand');
      expect(requests).toHaveLength(1);
      expect(requests[0].request.focus).toBe('examples');
    });

    it('should handle bridge errors', async () => {
      bridge.setNextError(new Error('No text selected'));

      const result = await server.callTool('expand', {});

      expect(result.success).toBe(false);
      expect(result.content[0].text).toContain('No text selected');
    });
  });
});
