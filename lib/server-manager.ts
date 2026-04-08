import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

interface ServerInfo {
  port: number;
  pid: number;
}

export class ServerManager {
  private servers: Map<string, ServerInfo> = new Map();

  async startNextjsServer(projectDir: string, customPort?: number): Promise<{ success: boolean; port?: number; error?: string }> {
    try {
      const packageJsonPath = path.join(projectDir, 'package.json');
      
      let port = customPort || await this.findFreePort(3000);
      
      let command: string;
      let isNextDev = false;

      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        if (packageJson.scripts?.dev) {
          isNextDev = true;
          command = `cd "${projectDir}" && PORT=${port} npm run dev`;
        } else {
          command = `cd "${projectDir}" && npx --yes serve -p ${port} -s .`;
        }
      } else {
        command = `cd "${projectDir}" && npx --yes serve -p ${port} -s .`;
      }
      
      const child = exec(command, {
        shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/bash',
      });

      let output = '';
      child.stdout?.on('data', (data: Buffer) => {
        output += data.toString();
        const dataStr = data.toString();
        console.log(`Server output: ${dataStr.trim()}`);
        const match = dataStr.match(/localhost:(\d+)/);
        if (match) {
          const serverPort = parseInt(match[1]);
          console.log(`Detected port: ${serverPort}`);
          this.servers.set(projectDir, {
            port: serverPort,
            pid: child.pid || 0,
          });
        }
      });

      child.stderr?.on('data', (data: Buffer) => {
        console.error(`Server error: ${data}`);
      });

      child.on('error', (err) => {
        console.error('Failed to start server:', err);
      });

      // Wait a bit for server to start
      await new Promise(resolve => setTimeout(resolve, 8000));

      const serverInfo = this.servers.get(projectDir);
      if (serverInfo) {
        console.log(`Server started successfully on port ${serverInfo.port}`);
        return { success: true, port: serverInfo.port };
      }

      console.log(`Server failed to start. Output: ${output}`);
      return { success: false, error: 'Server failed to start' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async stopServer(projectDir: string): Promise<{ success: boolean; error?: string }> {
    try {
      const serverInfo = this.servers.get(projectDir);
      if (serverInfo && serverInfo.pid) {
        process.kill(serverInfo.pid);
        this.servers.delete(projectDir);
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private async findFreePort(startPort: number): Promise<number> {
    let port = startPort;
    while (port < 65535) {
      if (await this.isPortAvailable(port)) {
        return port;
      }
      port++;
    }
    throw new Error('No free ports available');
  }

  private async isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = require('net').createServer();
      server.listen(port, () => {
        server.close();
        resolve(true);
      });
      server.on('error', () => {
        resolve(false);
      });
    });
  }

  getServerUrl(projectDir: string): string | null {
    const serverInfo = this.servers.get(projectDir);
    if (serverInfo) {
      return `http://localhost:${serverInfo.port}`;
    }
    return null;
  }
}

export const serverManager = new ServerManager();
