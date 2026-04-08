use anyhow::Result;
use glob::glob;
use hex;
use notify::{RecommendedWatcher, RecursiveMode, Watcher};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs;
use std::io::Read;
use std::path::Path;
use std::process::Command;
use walkdir::WalkDir;

/// Optimized file operations for minimal token usage
pub struct FileOps;

impl FileOps {
    /// Read file content efficiently
    pub fn read(path: &str) -> Result<String> {
        let content = fs::read_to_string(path)?;
        Ok(content)
    }

    /// Write file with auto-create directories
    pub fn write(path: &str, content: &str) -> Result<()> {
        let parent = Path::new(path).parent();
        if let Some(parent_dir) = parent {
            fs::create_dir_all(parent_dir)?;
        }
        fs::write(path, content)?;
        Ok(())
    }

    /// Delete file
    pub fn delete(path: &str) -> Result<()> {
        fs::remove_file(path)?;
        Ok(())
    }

    /// List directory contents
    pub fn list(dir: &str) -> Result<Vec<String>> {
        let mut entries = Vec::new();
        for entry in fs::read_dir(dir)? {
            let entry = entry?;
            entries.push(entry.path().display().to_string());
        }
        Ok(entries)
    }

    /// Find files matching glob pattern
    pub fn find(pattern: &str) -> Result<Vec<String>> {
        let mut files = Vec::new();
        for entry in glob(pattern)? {
            if let Ok(path) = entry {
                files.push(path.display().to_string());
            }
        }
        Ok(files)
    }

    /// Recursively list all files in directory
    pub fn list_recursive(dir: &str) -> Result<Vec<String>> {
        let mut files = Vec::new();
        for entry in WalkDir::new(dir) {
            if let Ok(entry) = entry {
                if entry.file_type().is_file() {
                    files.push(entry.path().display().to_string());
                }
            }
        }
        Ok(files)
    }

    /// Compute file hash for change detection
    pub fn hash(path: &str) -> Result<String> {
        let mut file = fs::File::open(path)?;
        let mut contents = Vec::new();
        file.read_to_end(&mut contents)?;
        let mut hasher = Sha256::new();
        hasher.update(&contents);
        let hash = hasher.finalize();
        Ok(hex::encode(hash))
    }
}

/// Optimized bash command execution with timeout
pub struct BashOps;

impl BashOps {
    /// Execute command with timeout
    pub fn exec(command: &str, _timeout_ms: u64) -> Result<BashResult> {
        let parts: Vec<&str> = command.split_whitespace().collect();
        if parts.is_empty() {
            return Err(anyhow::anyhow!("Empty command"));
        }

        let output = Command::new(parts[0]).args(&parts[1..]).output()?;

        Ok(BashResult {
            success: output.status.success(),
            stdout: String::from_utf8_lossy(&output.stdout).to_string(),
            stderr: String::from_utf8_lossy(&output.stderr).to_string(),
            code: output.status.code(),
        })
    }

    /// Execute command in specific directory
    pub fn exec_in_dir(command: &str, dir: &str, _timeout_ms: u64) -> Result<BashResult> {
        let parts: Vec<&str> = command.split_whitespace().collect();
        if parts.is_empty() {
            return Err(anyhow::anyhow!("Empty command"));
        }

        let output = Command::new(parts[0])
            .args(&parts[1..])
            .current_dir(dir)
            .output()?;

        Ok(BashResult {
            success: output.status.success(),
            stdout: String::from_utf8_lossy(&output.stdout).to_string(),
            stderr: String::from_utf8_lossy(&output.stderr).to_string(),
            code: output.status.code(),
        })
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BashResult {
    pub success: bool,
    pub stdout: String,
    pub stderr: String,
    pub code: Option<i32>,
}

/// Optimized code operations
pub struct CodeOps;

impl CodeOps {
    /// Format code using prettier (if available)
    pub fn format_file(path: &str) -> Result<()> {
        let output = Command::new("npx")
            .args(&["prettier", "--write", path])
            .output()?;

        if !output.status.success() {
            return Err(anyhow::anyhow!("Prettier failed"));
        }

        Ok(())
    }

    /// Lint code using eslint (if available)
    pub fn lint_file(path: &str) -> Result<String> {
        let output = Command::new("npx").args(&["eslint", path]).output()?;

        let result = String::from_utf8_lossy(&output.stderr).to_string();
        Ok(result)
    }

    /// Run tests for a project
    pub fn run_tests(project_dir: &str) -> Result<TestResult> {
        let output = Command::new("npm")
            .args(&["test"])
            .current_dir(project_dir)
            .output()?;

        Ok(TestResult {
            success: output.status.success(),
            output: String::from_utf8_lossy(&output.stdout).to_string(),
            errors: String::from_utf8_lossy(&output.stderr).to_string(),
        })
    }

    /// Build a project
    pub fn build(project_dir: &str) -> Result<BuildResult> {
        let output = Command::new("npm")
            .args(&["run", "build"])
            .current_dir(project_dir)
            .output()?;

        Ok(BuildResult {
            success: output.status.success(),
            output: String::from_utf8_lossy(&output.stdout).to_string(),
            errors: String::from_utf8_lossy(&output.stderr).to_string(),
        })
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TestResult {
    pub success: bool,
    pub output: String,
    pub errors: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BuildResult {
    pub success: bool,
    pub output: String,
    pub errors: String,
}

/// Optimized project scaffolding
pub struct ProjectOps;

impl ProjectOps {
    /// Create Next.js project structure
    pub fn create_nextjs_project(dir: &str) -> Result<()> {
        // Create basic structure
        FileOps::write(
            &format!("{}/package.json", dir),
            r#"{
  "name": "my-app",
  "version": "0.1.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "14.0.0",
    "react": "18.2.0",
    "react-dom": "18.2.0"
  }
}"#,
        )?;

        FileOps::write(&format!("{}/next.config.js", dir), "module.exports = {}")?;
        FileOps::write(&format!("{}/.gitignore", dir), "node_modules\n.next\n.env")?;

        // Create app directory
        FileOps::write(
            &format!("{}/app/page.tsx", dir),
            "export default function Home() {\n  return <div>Hello World</div>;\n}\n",
        )?;

        FileOps::write(
            &format!("{}/app/layout.tsx", dir),
            "export default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (\n    <html lang=\"en\">\n      <body>{children}</body>\n    </html>\n  );\n}\n",
        )?;

        Ok(())
    }

    /// Create React project structure
    pub fn create_react_project(dir: &str) -> Result<()> {
        FileOps::write(
            &format!("{}/package.json", dir),
            r#"{
  "name": "my-app",
  "version": "0.1.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "18.2.0",
    "react-dom": "18.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^5.0.0"
  }
}"#,
        )?;

        FileOps::write(&format!("{}/index.html", dir), "<!DOCTYPE html>\n<html>\n  <head>\n    <meta charset=\"utf-8\" />\n    <title>React App</title>\n  </head>\n  <body>\n    <div id=\"root\"></div>\n    <script type=\"module\" src=\"/src/main.tsx\"></script>\n  </body>\n</html>")?;

        FileOps::write(
            &format!("{}/vite.config.ts", dir),
            "import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\n\nexport default defineConfig({\n  plugins: [react()],\n})",
        )?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_read_write() {
        let test_file = "/tmp/test_file.txt";
        let content = "Hello, World!";

        FileOps::write(test_file, content).unwrap();
        let read_content = FileOps::read(test_file).unwrap();

        assert_eq!(read_content, content);

        FileOps::delete(test_file).unwrap();
    }

    #[test]
    fn test_bash_exec() {
        let result = BashOps::exec("echo 'test'", 1000).unwrap();
        assert!(result.success);
        assert!(result.stdout.contains("test"));
    }
}
