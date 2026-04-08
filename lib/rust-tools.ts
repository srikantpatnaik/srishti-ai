/**
 * Rust Tools - Optimized file operations and bash execution
 * Provides file operations, bash execution, and project management
 */

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class RustTools {
  /**
   * Read file content
   */
  async read(filePath: string): Promise<{ success: boolean; content?: string; error?: string }> {
    try {
      // @ts-ignore
      const content = fs.readFileSync(filePath, 'utf-8');
      return { success: true, content };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Write file content
   */
  async write(filePath: string, content: string): Promise<{ success: boolean; error?: string }> {
    try {
      const dir = path.dirname(filePath);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, content, 'utf-8');
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete file
   */
  async delete(filePath: string): Promise<{ success: boolean; error?: string }> {
    try {
      fs.unlinkSync(filePath);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * List directory contents
   */
  async list(dirPath: string): Promise<{ success: boolean; files?: string[]; error?: string }> {
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      const files = entries.map((e: any) => e.isDirectory() ? `${e.name}/` : e.name);
      return { success: true, files };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Find files matching glob pattern
   */
  async find(pattern: string): Promise<{ success: boolean; files?: string[]; error?: string }> {
    try {
      const fg = await import('fast-glob');
      const files = await fg.default(pattern);
      return { success: true, files };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Execute bash command
   */
  async bash(command: string, timeout: number = 30000): Promise<{ success: boolean; output?: string; error?: string }> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        resolve({ success: false, error: `Command timed out after ${timeout}ms` });
      }, timeout);

      execAsync(command, { timeout })
        .then(({ stdout, stderr }: { stdout: string; stderr: string }) => {
          clearTimeout(timer);
          resolve({ success: true, output: stdout, error: stderr });
        })
        .catch((err: any) => {
          clearTimeout(timer);
          resolve({ success: false, error: err.message });
        });
    });
  }

  /**
   * Compute file hash
   */
  async hash(filePath: string): Promise<{ success: boolean; hash?: string; error?: string }> {
    try {
      const crypto = await import('crypto');
      // @ts-ignore
      const content = fs.readFileSync(filePath);
      const hash = crypto.createHash('sha256').update(content).digest('hex');
      return { success: true, hash };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Format code using prettier
   */
  async format(filePath: string): Promise<{ success: boolean; error?: string }> {
    return this.bash(`npx prettier --write "${filePath}"`, 60000);
  }

  /**
   * Lint code using eslint
   */
  async lint(filePath: string): Promise<{ success: boolean; output?: string; error?: string }> {
    const result = await this.bash(`npx eslint "${filePath}"`, 60000);
    return result;
  }

  /**
   * Create Next.js project structure
   */
  async createNextjs(dir: string): Promise<{ success: boolean; error?: string }> {
    const packageJson = {
      name: path.basename(dir),
      version: '0.1.0',
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start'
      },
      dependencies: {
        next: '14.2.5',
        react: '18.2.0',
        'react-dom': '18.2.0'
      }
    };

    const files = [
      {
        path: `${dir}/package.json`,
        content: JSON.stringify(packageJson, null, 2)
      },
      {
        path: `${dir}/next.config.js`,
        content: 'module.exports = {}'
      },
      {
        path: `${dir}/.gitignore`,
        content: 'node_modules\n.next\n.env'
      },
      {
        path: `${dir}/app/page.tsx`,
        content: 'export default function Home() {\n  return <div>Hello World</div>;\n}\n'
      },
      {
        path: `${dir}/app/layout.tsx`,
        content: 'export default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (\n    <html lang="en">\n      <body>{children}</body>\n    </html>\n  );\n}\n'
      }
    ];

    for (const file of files) {
      const result = await this.write(file.path, file.content);
      if (!result.success) {
        return result;
      }
    }

    return { success: true };
  }
}