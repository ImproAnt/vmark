/**
 * Tests for VMark-specific tools.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { VMarkMcpServer } from '../../../src/server.js';
import { MockBridge } from '../../mocks/mockBridge.js';
import { registerVMarkTools } from '../../../src/tools/vmark.js';

describe('VMark Tools', () => {
  let bridge: MockBridge;
  let server: VMarkMcpServer;

  beforeEach(() => {
    bridge = new MockBridge();
    server = new VMarkMcpServer({ bridge });
    registerVMarkTools(server);
  });

  describe('insert_math_inline', () => {
    it('should insert inline math', async () => {
      const result = await server.callTool('insert_math_inline', { latex: 'E = mc^2' });

      expect(result.success).toBe(true);
      expect(result.content[0].text).toContain('Inserted inline math');
      expect(result.content[0].text).toContain('E = mc^2');
    });

    it('should send correct bridge request', async () => {
      await server.callTool('insert_math_inline', { latex: 'x^2 + y^2' });

      const requests = bridge.getRequestsOfType('vmark.insertMathInline');
      expect(requests).toHaveLength(1);
      expect(requests[0].request).toMatchObject({
        type: 'vmark.insertMathInline',
        latex: 'x^2 + y^2',
        windowId: 'focused',
      });
    });

    it('should reject empty latex', async () => {
      const result = await server.callTool('insert_math_inline', { latex: '' });

      expect(result.success).toBe(false);
      expect(result.content[0].text).toContain('non-empty string');
    });

    it('should handle bridge errors', async () => {
      bridge.setNextError(new Error('Invalid LaTeX'));

      const result = await server.callTool('insert_math_inline', { latex: 'test' });

      expect(result.success).toBe(false);
      expect(result.content[0].text).toContain('Invalid LaTeX');
    });
  });

  describe('insert_math_block', () => {
    it('should insert block math', async () => {
      const result = await server.callTool('insert_math_block', {
        latex: '\\int_0^\\infty e^{-x^2} dx',
      });

      expect(result.success).toBe(true);
      expect(result.content[0].text).toContain('Inserted block math');
    });

    it('should send correct bridge request', async () => {
      await server.callTool('insert_math_block', { latex: '\\sum_{n=1}^{\\infty}' });

      const requests = bridge.getRequestsOfType('vmark.insertMathBlock');
      expect(requests).toHaveLength(1);
      expect(requests[0].request.latex).toBe('\\sum_{n=1}^{\\infty}');
    });

    it('should reject empty latex', async () => {
      const result = await server.callTool('insert_math_block', { latex: '' });

      expect(result.success).toBe(false);
    });
  });

  describe('insert_mermaid', () => {
    it('should insert mermaid diagram', async () => {
      const code = 'graph TD\nA-->B';
      const result = await server.callTool('insert_mermaid', { code });

      expect(result.success).toBe(true);
      expect(result.content[0].text).toContain('Inserted Mermaid diagram');
    });

    it('should send correct bridge request', async () => {
      const code = 'sequenceDiagram\nA->>B: Hello';
      await server.callTool('insert_mermaid', { code });

      const requests = bridge.getRequestsOfType('vmark.insertMermaid');
      expect(requests).toHaveLength(1);
      expect(requests[0].request.code).toBe(code);
    });

    it('should reject empty code', async () => {
      const result = await server.callTool('insert_mermaid', { code: '' });

      expect(result.success).toBe(false);
      expect(result.content[0].text).toContain('non-empty string');
    });

    it('should handle bridge errors', async () => {
      bridge.setNextError(new Error('Invalid diagram syntax'));

      const result = await server.callTool('insert_mermaid', { code: 'invalid' });

      expect(result.success).toBe(false);
      expect(result.content[0].text).toContain('Invalid diagram syntax');
    });
  });

  describe('insert_wiki_link', () => {
    it('should insert wiki link with target only', async () => {
      const result = await server.callTool('insert_wiki_link', { target: 'My Document' });

      expect(result.success).toBe(true);
      expect(result.content[0].text).toContain('[[My Document]]');
    });

    it('should insert wiki link with display text', async () => {
      const result = await server.callTool('insert_wiki_link', {
        target: 'My Document',
        displayText: 'Link Text',
      });

      expect(result.success).toBe(true);
      expect(result.content[0].text).toContain('[[My Document|Link Text]]');
    });

    it('should send correct bridge request', async () => {
      await server.callTool('insert_wiki_link', {
        target: 'Target#Section',
        displayText: 'Display',
      });

      const requests = bridge.getRequestsOfType('vmark.insertWikiLink');
      expect(requests).toHaveLength(1);
      expect(requests[0].request).toMatchObject({
        target: 'Target#Section',
        displayText: 'Display',
      });
    });

    it('should reject empty target', async () => {
      const result = await server.callTool('insert_wiki_link', { target: '' });

      expect(result.success).toBe(false);
    });
  });

  describe('cjk_punctuation_convert', () => {
    it('should convert to fullwidth', async () => {
      const result = await server.callTool('cjk_punctuation_convert', {
        direction: 'to-fullwidth',
      });

      expect(result.success).toBe(true);
      expect(result.content[0].text).toContain('to-fullwidth');
    });

    it('should convert to halfwidth', async () => {
      const result = await server.callTool('cjk_punctuation_convert', {
        direction: 'to-halfwidth',
      });

      expect(result.success).toBe(true);
      expect(result.content[0].text).toContain('to-halfwidth');
    });

    it('should reject invalid direction', async () => {
      const result = await server.callTool('cjk_punctuation_convert', {
        direction: 'invalid',
      });

      expect(result.success).toBe(false);
    });

    it('should send correct bridge request', async () => {
      await server.callTool('cjk_punctuation_convert', { direction: 'to-fullwidth' });

      const requests = bridge.getRequestsOfType('vmark.cjkPunctuationConvert');
      expect(requests).toHaveLength(1);
      expect(requests[0].request.direction).toBe('to-fullwidth');
    });
  });

  describe('cjk_spacing_fix', () => {
    it('should add spacing', async () => {
      const result = await server.callTool('cjk_spacing_fix', { action: 'add' });

      expect(result.success).toBe(true);
      expect(result.content[0].text).toContain('Added CJK spacing');
    });

    it('should remove spacing', async () => {
      const result = await server.callTool('cjk_spacing_fix', { action: 'remove' });

      expect(result.success).toBe(true);
      expect(result.content[0].text).toContain('Removed CJK spacing');
    });

    it('should reject invalid action', async () => {
      const result = await server.callTool('cjk_spacing_fix', { action: 'toggle' });

      expect(result.success).toBe(false);
    });

    it('should send correct bridge request', async () => {
      await server.callTool('cjk_spacing_fix', { action: 'add' });

      const requests = bridge.getRequestsOfType('vmark.cjkSpacingFix');
      expect(requests).toHaveLength(1);
      expect(requests[0].request.action).toBe('add');
    });
  });
});
