import Handlebars from 'handlebars';
import * as fs from 'fs/promises';
import { ErrorCode, McpError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import type { RenderContext } from '../types.js';

export class TemplateRenderer {
  private handlebars: typeof Handlebars;

  constructor() {
    this.handlebars = Handlebars.create();
    this.registerHelpers();
  }

  async renderTemplate(templatePath: string, context: RenderContext): Promise<string> {
    try {
      // Load template content
      logger.debug(`Loading template: ${templatePath}`);
      const templateContent = await fs.readFile(templatePath, 'utf-8');

      // Compile template
      const template = this.handlebars.compile(templateContent, {
        noEscape: false,
        strict: false,
      });

      // Render template
      const rendered = template(context);
      logger.debug(`Template rendered successfully: ${templatePath}`);

      return rendered;
    } catch (error: unknown) {
      const err = error as Error;
      if ('code' in err && (err as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new McpError(
          ErrorCode.TEMPLATE_ERROR,
          `Template file not found: ${templatePath}`,
          { templatePath },
        );
      }

      throw new McpError(
        ErrorCode.RENDER_ERROR,
        `Failed to render template: ${err.message}`,
        { templatePath, error: err.message },
      );
    }
  }

  renderString(templateString: string, context: RenderContext): string {
    try {
      const template = this.handlebars.compile(templateString, {
        noEscape: false,
        strict: false,
      });
      return template(context);
    } catch (error: unknown) {
      const err = error as Error;
      throw new McpError(
        ErrorCode.RENDER_ERROR,
        `Failed to render template string: ${err.message}`,
        { error: err.message },
      );
    }
  }

  private registerHelpers(): void {
    // Helper: {{indent n text}} - Indents each line of text by n spaces
    this.handlebars.registerHelper('indent', function (count: number, text: string): string {
      if (typeof count !== 'number' || typeof text !== 'string') {
        return '';
      }
      const indentation = ' '.repeat(count);
      return text
        .split('\n')
        .map((line) => (line.trim() ? indentation + line : line))
        .join('\n');
    });

    // Helper: {{toJson obj [indent]}} - Converts object to JSON string
    this.handlebars.registerHelper('toJson', function (obj: unknown, indent?: number): string {
      try {
        const indentValue = typeof indent === 'number' ? indent : 2;
        return JSON.stringify(obj, null, indentValue);
      } catch {
        return '{}';
      }
    });

    // Helper: {{ifEquals a b}} - Conditional comparison
    this.handlebars.registerHelper(
      'ifEquals',
      function (this: unknown, a: unknown, b: unknown, options: Handlebars.HelperOptions) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (a === b) {
          return options.fn(this as any);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return options.inverse(this as any);
      },
    );

    // Helper: {{joinWith separator array}} - Joins array with separator
    this.handlebars.registerHelper('joinWith', function (separator: string, array: unknown[]): string {
      if (!Array.isArray(array)) {
        return '';
      }
      return array.join(separator);
    });

    // Helper: {{ifCond a operator b}} - More flexible conditional
    this.handlebars.registerHelper(
      'ifCond',
      function (
        this: unknown,
        a: unknown,
        operator: string,
        b: unknown,
        options: Handlebars.HelperOptions,
      ) {
        let result = false;
        switch (operator) {
          case '==':
            // eslint-disable-next-line eqeqeq
            result = a == b;
            break;
          case '===':
            result = a === b;
            break;
          case '!=':
            // eslint-disable-next-line eqeqeq
            result = a != b;
            break;
          case '!==':
            result = a !== b;
            break;
          case '<':
            result = (a as number) < (b as number);
            break;
          case '<=':
            result = (a as number) <= (b as number);
            break;
          case '>':
            result = (a as number) > (b as number);
            break;
          case '>=':
            result = (a as number) >= (b as number);
            break;
          case '&&':
            result = !!(a && b);
            break;
          case '||':
            result = !!(a || b);
            break;
          default:
            result = false;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return result ? options.fn(this as any) : options.inverse(this as any);
      },
    );

    // Helper: {{default value defaultValue}} - Returns defaultValue if value is falsy
    this.handlebars.registerHelper('default', function (value: unknown, defaultValue: unknown): unknown {
      return value || defaultValue;
    });

    // Helper: {{lowercase str}} - Converts string to lowercase
    this.handlebars.registerHelper('lowercase', function (str: string): string {
      return typeof str === 'string' ? str.toLowerCase() : '';
    });

    // Helper: {{uppercase str}} - Converts string to uppercase
    this.handlebars.registerHelper('uppercase', function (str: string): string {
      return typeof str === 'string' ? str.toUpperCase() : '';
    });

    // Helper: {{kebabCase str}} - Converts string to kebab-case
    this.handlebars.registerHelper('kebabCase', function (str: string): string {
      if (typeof str !== 'string') return '';
      return str
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .toLowerCase();
    });

    // Helper: {{camelCase str}} - Converts string to camelCase
    this.handlebars.registerHelper('camelCase', function (str: string): string {
      if (typeof str !== 'string') return '';
      return str
        .replace(/[-_\s](.)/g, (_, c) => c.toUpperCase())
        .replace(/^(.)/, (c) => c.toLowerCase());
    });

    // Helper: {{pascalCase str}} - Converts string to PascalCase
    this.handlebars.registerHelper('pascalCase', function (str: string): string {
      if (typeof str !== 'string') return '';
      return str
        .replace(/[-_\s](.)/g, (_, c) => c.toUpperCase())
        .replace(/^(.)/, (c) => c.toUpperCase());
    });

    logger.debug('Handlebars helpers registered');
  }
}
