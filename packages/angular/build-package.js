import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import packageJson from "../../package.json" with { type: "json" };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const angularDistDir = path.join(repoRoot, "angular/dist");
const angularTempDir = path.join(angularDistDir, "temp");

const shared = {
  bundle: true,
  define: { "process.env.VERSION": JSON.stringify(packageJson.version) },
  external: ["@angular/core", "@angular/forms"],
  logLevel: "info",
  minify: false,
};

await build({
  ...shared,
  entryPoints: [path.join(angularTempDir, "IntlTelInput.js")],
  format: "esm",
  outfile: path.join(angularDistDir, "IntlTelInput.js"),
});

await build({
  ...shared,
  entryPoints: [path.join(angularTempDir, "IntlTelInputWithUtils.js")],
  format: "esm",
  outfile: path.join(angularDistDir, "IntlTelInputWithUtils.js"),
});

fs.rmSync(angularTempDir, { recursive: true, force: true });
