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
    try {
      await this.ensureTempDir();

      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const fileName = `temp_${timestamp}_${random}.txt`;
      const filePath = path.join(this.tempDir, fileName);

      await fs.writeFile(filePath, text, "utf-8");

      const sourceFlag = options.sourceLocale
        ? `--source-locale ${options.sourceLocale}`
        : "--source-locale auto";
      const targetFlag = `--target-locale ${options.targetLocale}`;

      const command = `lingo translate ${filePath} ${sourceFlag} ${targetFlag} --output ${filePath}.translated`;

      await execAsync(command, {
        cwd: process.cwd(),
        timeout: 30000, 
      });

      const translatedPath = `${filePath}.translated`;
      const translatedText = await fs.readFile(translatedPath, "utf-8");

      await this.cleanupFiles(filePath, translatedPath);

      return translatedText.trim();
    } catch (error: any) {
      console.error("Lingo CLI translation error:", error);
      throw new Error(`Translation failed: ${error.message}`);
    }
  }


  async localizeTexts(
    texts: string[],
    options: TranslateOptions
  ): Promise<string[]> {
    try {
      await this.ensureTempDir();

      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const batchFileName = `batch_${timestamp}_${random}.txt`;
      const batchFilePath = path.join(this.tempDir, batchFileName);

      const SEPARATOR = "\n<<<LINGO_SEPARATOR>>>\n";
      const batchContent = texts.join(SEPARATOR);

      await fs.writeFile(batchFilePath, batchContent, "utf-8");

      const sourceFlag = options.sourceLocale
        ? `--source-locale ${options.sourceLocale}`
        : "--source-locale auto";
      const targetFlag = `--target-locale ${options.targetLocale}`;

      const command = `lingo translate ${batchFilePath} ${sourceFlag} ${targetFlag} --output ${batchFilePath}.translated`;

      await execAsync(command, {
        cwd: process.cwd(),
        timeout: 60000, 
      });

      const translatedPath = `${batchFilePath}.translated`;
      const translatedContent = await fs.readFile(translatedPath, "utf-8");
      const translations = translatedContent.split(SEPARATOR);

      await this.cleanupFiles(batchFilePath, translatedPath);

      return translations.map((t) => t.trim());
    } catch (error: any) {
      console.error("Lingo CLI batch translation error:", error);
      throw new Error(`Batch translation failed: ${error.message}`);
    }
  }


  private async cleanupFiles(...files: string[]): Promise<void> {
    for (const file of files) {
      try {
        await fs.unlink(file);
      } catch (err) {
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
