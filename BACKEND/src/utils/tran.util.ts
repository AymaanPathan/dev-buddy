import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";

const execAsync = promisify(exec);

interface TranslateOptions {
  sourceLocale?: string | null;
  targetLocale: string;
}

export class LingoCliEngine {
  private tempDir: string;

  constructor() {
    this.tempDir = path.join(os.tmpdir(), "lingo-translations");
  }

  private async ensureTempDir(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (err) {
      console.error("Failed to create temp directory:", err);
    }
  }

  async localizeText(text: string, options: TranslateOptions): Promise<string> {
    let filePath: string | null = null;

    try {
      await this.ensureTempDir();

      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const fileName = `temp_${timestamp}_${random}.txt`;
      filePath = path.join(this.tempDir, fileName);

      await fs.writeFile(filePath, text, "utf-8");

      const sourceFlag = options.sourceLocale
        ? `--source-locale ${options.sourceLocale}`
        : "--source-locale auto";
      const targetFlag = `--target-locale ${options.targetLocale}`;

      const command = `npx lingo.dev@latest translate "${filePath}" ${sourceFlag} ${targetFlag}`;

      console.log("Executing command:", command);

      const { stdout, stderr } = await execAsync(command, {
        cwd: process.cwd(),
        timeout: 60000,
      });

      if (stdout) console.log("stdout:", stdout);
      if (stderr) console.log("stderr:", stderr);

      // The CLI translates in-place, so read from the same file
      const translatedText = await fs.readFile(filePath, "utf-8");

      await this.cleanupFiles(filePath);

      return translatedText.trim();
    } catch (error: any) {
      console.error("Lingo CLI translation error:", error);
      
      if (filePath) await this.cleanupFiles(filePath);

      throw new Error(`Translation failed: ${error.message}`);
    }
  }

  async localizeTexts(
    texts: string[],
    options: TranslateOptions
  ): Promise<string[]> {
    let batchFilePath: string | null = null;

    try {
      await this.ensureTempDir();

      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const batchFileName = `batch_${timestamp}_${random}.txt`;
      batchFilePath = path.join(this.tempDir, batchFileName);

      const SEPARATOR = "\n<<<LINGO_SEPARATOR>>>\n";
      const batchContent = texts.join(SEPARATOR);

      await fs.writeFile(batchFilePath, batchContent, "utf-8");

      const sourceFlag = options.sourceLocale
        ? `--source-locale ${options.sourceLocale}`
        : "--source-locale auto";
      const targetFlag = `--target-locale ${options.targetLocale}`;

      const command = `npx lingo.dev@latest translate "${batchFilePath}" ${sourceFlag} ${targetFlag}`;

      console.log("Executing batch command:", command);

      const { stdout, stderr } = await execAsync(command, {
        cwd: process.cwd(),
        timeout: 60000,
      });

      if (stdout) console.log("stdout:", stdout);
      if (stderr) console.log("stderr:", stderr);

      // Read from the same file (in-place translation)
      const translatedContent = await fs.readFile(batchFilePath, "utf-8");
      const translations = translatedContent.split(SEPARATOR);

      await this.cleanupFiles(batchFilePath);

      return translations.map((t) => t.trim());
    } catch (error: any) {
      console.error("Lingo CLI batch translation error:", error);
      
      if (batchFilePath) await this.cleanupFiles(batchFilePath);

      throw new Error(`Batch translation failed: ${error.message}`);
    }
  }

  private async cleanupFiles(...files: string[]): Promise<void> {
    for (const file of files) {
      try {
        await fs.unlink(file);
      } catch (err) {
        // Ignore cleanup errors
      }
    }
  }

  async cleanupTempDir(): Promise<void> {
    try {
      const files = await fs.readdir(this.tempDir);
      await Promise.all(
        files.map((file) => fs.unlink(path.join(this.tempDir, file)))
      );
    } catch (err) {
      console.error("Failed to cleanup temp directory:", err);
    }
  }
}

export const lingo = new LingoCliEngine();