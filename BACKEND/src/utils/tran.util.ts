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

/**
 * Translates text using Lingo.dev CLI instead of API
 */
export class LingoCliEngine {
  private tempDir: string;

  constructor() {
    this.tempDir = path.join(os.tmpdir(), "lingo-translations");
  }

  /**
   * Initialize temp directory for translation files
   */
  private async ensureTempDir(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (err) {
      console.error("Failed to create temp directory:", err);
    }
  }

  /**
   * Translate a single text using Lingo CLI
   */
  async localizeText(text: string, options: TranslateOptions): Promise<string> {
    try {
      await this.ensureTempDir();

      // Create a unique temp file for this translation
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const fileName = `temp_${timestamp}_${random}.txt`;
      const filePath = path.join(this.tempDir, fileName);

      // Write source text to temp file
      await fs.writeFile(filePath, text, "utf-8");

      // Build CLI command
      const sourceFlag = options.sourceLocale
        ? `--source-locale ${options.sourceLocale}`
        : "--source-locale auto";
      const targetFlag = `--target-locale ${options.targetLocale}`;

      // Execute Lingo CLI translation
      const command = `lingo translate ${filePath} ${sourceFlag} ${targetFlag} --output ${filePath}.translated`;

      await execAsync(command, {
        cwd: process.cwd(),
        timeout: 30000, // 30 second timeout
      });

      // Read translated content
      const translatedPath = `${filePath}.translated`;
      const translatedText = await fs.readFile(translatedPath, "utf-8");

      // Cleanup temp files
      await this.cleanupFiles(filePath, translatedPath);

      return translatedText.trim();
    } catch (error: any) {
      console.error("Lingo CLI translation error:", error);
      throw new Error(`Translation failed: ${error.message}`);
    }
  }

  /**
   * Batch translate multiple texts efficiently
   */
  async localizeTexts(
    texts: string[],
    options: TranslateOptions
  ): Promise<string[]> {
    try {
      await this.ensureTempDir();

      // Create batch file with all texts separated by markers
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const batchFileName = `batch_${timestamp}_${random}.txt`;
      const batchFilePath = path.join(this.tempDir, batchFileName);

      // Use special markers to separate texts
      const SEPARATOR = "\n<<<LINGO_SEPARATOR>>>\n";
      const batchContent = texts.join(SEPARATOR);

      await fs.writeFile(batchFilePath, batchContent, "utf-8");

      // Build CLI command
      const sourceFlag = options.sourceLocale
        ? `--source-locale ${options.sourceLocale}`
        : "--source-locale auto";
      const targetFlag = `--target-locale ${options.targetLocale}`;

      const command = `lingo translate ${batchFilePath} ${sourceFlag} ${targetFlag} --output ${batchFilePath}.translated`;

      await execAsync(command, {
        cwd: process.cwd(),
        timeout: 60000, // 60 second timeout for batch
      });

      // Read and split translated content
      const translatedPath = `${batchFilePath}.translated`;
      const translatedContent = await fs.readFile(translatedPath, "utf-8");
      const translations = translatedContent.split(SEPARATOR);

      // Cleanup temp files
      await this.cleanupFiles(batchFilePath, translatedPath);

      return translations.map((t) => t.trim());
    } catch (error: any) {
      console.error("Lingo CLI batch translation error:", error);
      throw new Error(`Batch translation failed: ${error.message}`);
    }
  }

  /**
   * Clean up temporary files
   */
  private async cleanupFiles(...files: string[]): Promise<void> {
    for (const file of files) {
      try {
        await fs.unlink(file);
      } catch (err) {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Clean up all temp files in the temp directory
   */
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

// Export singleton instance
export const lingo = new LingoCliEngine();
