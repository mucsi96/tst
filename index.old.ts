import { build, transform } from "esbuild";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync } from "fs";
import { join, resolve } from "path";
import {
  SourceFile,
  createCompilerHost,
  createProgram,
  formatDiagnosticsWithColorAndContext,
} from "typescript";

async function transpileWithESBuild(
  inputFile: string,
  outputFile: string
): Promise<void> {
  await build({
    entryPoints: [inputFile],
    outfile: outputFile,
    bundle: false,
    platform: "node",
  });
}

function emitTypeDefinitions(inputFile: string, outputFile: string): void {
  const host = createCompilerHost({});
  const program = createProgram([inputFile], {});
  const emitResult = program.emit(undefined, undefined, undefined, undefined, {
    before: [() => emitDeclaration],
  });

  if (emitResult.diagnostics.length > 0) {
    console.error(
      formatDiagnosticsWithColorAndContext(emitResult.diagnostics, host)
    );
  }
}

function emitDeclaration(file: SourceFile): SourceFile {
  console.log(file.fileName, file.getFullText());

  return file;
}

function processFiles(inputDir: string, outputDir: string): void {
  readdirSync(inputDir).forEach((file) => {
    const inputFile = join(inputDir, file);
    const isDirectory = statSync(inputFile).isDirectory();

    if (file === "node_modules" || inputFile === "public") {
      return;
    }

    if (isDirectory) {
      const nestedOutputDir = join(outputDir, file);
      if (!existsSync(nestedOutputDir)) {
        mkdirSync(nestedOutputDir);
      }
      processFiles(inputFile, nestedOutputDir);
    } else if (
      (file.endsWith(".ts") &&
        !file.endsWith(".d.ts") &&
        !file.endsWith(".test.ts")) ||
      (file.endsWith(".tsx") && !file.endsWith(".test.tsx")) ||
      file.endsWith(".css")
    ) {
      const outputFile = join(outputDir, file.replace(/\.tsx?$/, ".js"));
      transpileWithESBuild(inputFile, outputFile).then(() => {
        emitTypeDefinitions(inputFile, outputFile);
      });
    }
  });
}

const inputDir = join(__dirname, "test-app");
const outputDir = join(__dirname, "dist");

if (!existsSync(outputDir)) {
  mkdirSync(outputDir);
}

processFiles(inputDir, outputDir);
