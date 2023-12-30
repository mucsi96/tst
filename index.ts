import { Plugin, build } from "esbuild";
import { promises } from "fs";
import { omit } from "lodash";
import { join } from "path";
import { rimrafSync } from "rimraf";
import svgr from "esbuild-plugin-svgr";
import {
  createProgram,
  flattenDiagnosticMessageText,
  getLineAndCharacterOfPosition,
  getPreEmitDiagnostics,
  parseJsonConfigFileContent,
  readConfigFile,
  sys,
} from "typescript";

const basePath = join(__dirname, "test-app");
const outdir = join(__dirname, "dist");

function emitTSDeclaration() {
  const tsConfigPath = join(basePath, "tsconfig.json");
  const tsConfig = readConfigFile(tsConfigPath, sys.readFile);
  const { options, fileNames } = parseJsonConfigFileContent(
    tsConfig.config,
    sys,
    basePath,
    {
      skipLibCheck: true,
      declaration: true,
      emitDeclarationOnly: true,
      declarationDir: outdir,
    },
    tsConfigPath
  );
  const program = createProgram(fileNames, omit(options, ["noEmit"]));
  const emitResult = program.emit();

  const allDiagnostics = getPreEmitDiagnostics(program).concat(
    emitResult.diagnostics
  );

  allDiagnostics.forEach((diagnostic) => {
    if (diagnostic.file) {
      const { line, character } = getLineAndCharacterOfPosition(
        diagnostic.file,
        diagnostic.start!
      );
      const message = flattenDiagnosticMessageText(
        diagnostic.messageText,
        "\n"
      );
      console.log(
        `${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`
      );
    } else {
      console.log(flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
    }
  });

  if (allDiagnostics.length) {
    process.exit(1);
  }
}

rimrafSync(outdir);

const StyleLoader: Plugin = {
  name: "inline-style",
  setup({ onLoad }) {
    const template = (css: string) =>
      `typeof document<'u'&&` +
      `document.head.appendChild(document.createElement('style'))` +
      `.appendChild(document.createTextNode(${JSON.stringify(css)}))`;
    onLoad({ filter: /\.css$/ }, async (args) => {
      let css = await promises.readFile(args.path, "utf8");
      return { contents: template(css) };
    });
  },
};

const makeAllPackagesExternalPlugin: Plugin = {
    name: 'make-all-packages-external',
    setup(build) {
      let filter = /^[^.\/]|^\.[^.\/]|^\.\.[^\/]/ // Must not start with "/" or "./" or "../"
      build.onResolve({ filter }, args => ({ path: args.path, external: true }))
    },
  }

build({
  bundle: true,
  minify: false,
  entryPoints: [join(basePath, "src")],
  outdir,
  format: "esm",
  sourcemap: false,
  platform: "browser",
  plugins: [makeAllPackagesExternalPlugin, StyleLoader, svgr()],
}).catch(() => process.exit(1));

emitTSDeclaration();
