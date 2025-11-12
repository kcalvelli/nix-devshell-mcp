import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { TemplateRenderer } from '../../src/templates/TemplateRenderer.js';
import { McpError } from '../../src/utils/errors.js';

describe('TemplateRenderer', () => {
  let renderer: TemplateRenderer;
  let tempDir: string;

  beforeEach(async () => {
    renderer = new TemplateRenderer();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'template-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('renderTemplate', () => {
    it('should render template from file', async () => {
      const templatePath = path.join(tempDir, 'template.hbs');
      const templateContent = 'Hello, {{name}}!';
      await fs.writeFile(templatePath, templateContent);

      const context = { name: 'World' };
      const result = await renderer.renderTemplate(templatePath, context);

      expect(result).toBe('Hello, World!');
    });

    it('should throw McpError when template file not found', async () => {
      const templatePath = path.join(tempDir, 'nonexistent.hbs');
      const context = {};

      await expect(renderer.renderTemplate(templatePath, context)).rejects.toThrow(McpError);
    });

    it('should render with nested context', async () => {
      const templatePath = path.join(tempDir, 'nested.hbs');
      const templateContent = '{{project.name}} - {{project.version}}';
      await fs.writeFile(templatePath, templateContent);

      const context = {
        project: {
          name: 'test-project',
          version: '1.0.0',
        },
      };

      const result = await renderer.renderTemplate(templatePath, context);
      expect(result).toBe('test-project - 1.0.0');
    });
  });

  describe('renderString', () => {
    it('should render template from string', () => {
      const template = 'Hello, {{name}}!';
      const context = { name: 'World' };

      const result = renderer.renderString(template, context);
      expect(result).toBe('Hello, World!');
    });

    it('should throw McpError on invalid template syntax', () => {
      const template = 'Invalid {{#if}}';
      const context = {};

      expect(() => renderer.renderString(template, context)).toThrow(McpError);
    });
  });

  describe('Helper: indent', () => {
    it('should indent text by specified spaces', () => {
      const template = '{{indent 4 text}}';
      const context = { text: 'line1\nline2\nline3' };

      const result = renderer.renderString(template, context);
      expect(result).toBe('    line1\n    line2\n    line3');
    });

    it('should not indent empty lines', () => {
      const template = '{{indent 2 text}}';
      const context = { text: 'line1\n\nline3' };

      const result = renderer.renderString(template, context);
      expect(result).toBe('  line1\n\n  line3');
    });
  });

  describe('Helper: toJson', () => {
    it('should convert object to JSON', () => {
      const template = '{{{toJson obj}}}'; // Use triple braces to avoid HTML escaping
      const context = {
        obj: {
          name: 'test',
          value: 123,
        },
      };

      const result = renderer.renderString(template, context);
      const parsed = JSON.parse(result.trim());
      expect(parsed).toEqual(context.obj);
    });

    it('should accept custom indent', () => {
      const template = '{{{toJson obj 4}}}'; // Use triple braces to avoid HTML escaping
      const context = { obj: { key: 'value' } };

      const result = renderer.renderString(template, context);
      expect(result).toContain('    ');
    });
  });

  describe('Helper: ifEquals', () => {
    it('should render block when values are equal', () => {
      const template = '{{#ifEquals a b}}equal{{else}}not equal{{/ifEquals}}';
      const context = { a: 'test', b: 'test' };

      const result = renderer.renderString(template, context);
      expect(result).toBe('equal');
    });

    it('should render else block when values are not equal', () => {
      const template = '{{#ifEquals a b}}equal{{else}}not equal{{/ifEquals}}';
      const context = { a: 'test', b: 'other' };

      const result = renderer.renderString(template, context);
      expect(result).toBe('not equal');
    });
  });

  describe('Helper: joinWith', () => {
    it('should join array with separator', () => {
      const template = '{{joinWith ", " items}}';
      const context = { items: ['a', 'b', 'c'] };

      const result = renderer.renderString(template, context);
      expect(result).toBe('a, b, c');
    });

    it('should return empty string for non-array', () => {
      const template = '{{joinWith ", " items}}';
      const context = { items: 'not an array' };

      const result = renderer.renderString(template, context);
      expect(result).toBe('');
    });
  });

  describe('Helper: ifCond', () => {
    it('should handle == operator', () => {
      const template = '{{#ifCond a "==" b}}true{{else}}false{{/ifCond}}';
      const context = { a: 5, b: 5 };

      const result = renderer.renderString(template, context);
      expect(result).toBe('true');
    });

    it('should handle > operator', () => {
      const template = '{{#ifCond a ">" b}}true{{else}}false{{/ifCond}}';
      const context = { a: 10, b: 5 };

      const result = renderer.renderString(template, context);
      expect(result).toBe('true');
    });

    it('should handle && operator', () => {
      const template = '{{#ifCond a "&&" b}}true{{else}}false{{/ifCond}}';
      const context = { a: true, b: true };

      const result = renderer.renderString(template, context);
      expect(result).toBe('true');
    });
  });

  describe('Helper: default', () => {
    it('should return value when truthy', () => {
      const template = '{{default value "fallback"}}';
      const context = { value: 'actual' };

      const result = renderer.renderString(template, context);
      expect(result).toBe('actual');
    });

    it('should return default when value is falsy', () => {
      const template = '{{default value "fallback"}}';
      const context = { value: null };

      const result = renderer.renderString(template, context);
      expect(result).toBe('fallback');
    });
  });

  describe('Helper: case converters', () => {
    it('should convert to lowercase', () => {
      const template = '{{lowercase text}}';
      const context = { text: 'HELLO' };

      const result = renderer.renderString(template, context);
      expect(result).toBe('hello');
    });

    it('should convert to uppercase', () => {
      const template = '{{uppercase text}}';
      const context = { text: 'hello' };

      const result = renderer.renderString(template, context);
      expect(result).toBe('HELLO');
    });

    it('should convert to kebab-case', () => {
      const template = '{{kebabCase text}}';
      const context = { text: 'helloWorld' };

      const result = renderer.renderString(template, context);
      expect(result).toBe('hello-world');
    });

    it('should convert to camelCase', () => {
      const template = '{{camelCase text}}';
      const context = { text: 'hello-world' };

      const result = renderer.renderString(template, context);
      expect(result).toBe('helloWorld');
    });

    it('should convert to PascalCase', () => {
      const template = '{{pascalCase text}}';
      const context = { text: 'hello-world' };

      const result = renderer.renderString(template, context);
      expect(result).toBe('HelloWorld');
    });
  });
});
