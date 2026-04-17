import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageDir = __dirname;
const repoRoot = path.resolve(packageDir, "../..");
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

function run(command, args, cwd = repoRoot) {
  execFileSync(command, args, {
    cwd,
    env: process.env,
    stdio: "inherit",
  });
}

function relativeFromRoot(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
}

function assertExists(stepName, relativePaths) {
  const missing = relativePaths.filter((relativePath) => !fs.existsSync(path.join(repoRoot, relativePath)));
  if (missing.length) {
    throw new Error(`${stepName} did not create the expected outputs:\n- ${missing.join("\n- ")}`);
  }
}

function assertMissing(stepName, relativePaths) {
  const unexpected = relativePaths.filter((relativePath) => fs.existsSync(path.join(repoRoot, relativePath)));
  if (unexpected.length) {
    throw new Error(`${stepName} should have removed these outputs before rebuilding:\n- ${unexpected.join("\n- ")}`);
  }
}

const steps = [
  {
    name: "Validate bootstrap prerequisites",
    run() {},
    validate() {
      assertExists(this.name, [
        "node_modules/@angular/compiler-cli/package.json",
        "node_modules/esbuild/package.json",
        "node_modules/google-closure-compiler/package.json",
        "third_party/libphonenumber/javascript/i18n/phonenumbers/phonenumberutil.js",
      ]);
    },
  },
  {
    name: "Reset shared JS and Angular package outputs",
    run() {
      run(npmCmd, ["--prefix", repoRoot, "run", "clean:dist:js"]);
      run(npmCmd, ["--prefix", repoRoot, "run", "clean:angular"]);
    },
    validate() {
      assertMissing(this.name, [
        "dist/js/intlTelInput.d.ts",
        "dist/js/utils.js",
        "dist/js/intlTelInput.mjs",
        "angular/dist/IntlTelInput.js",
        "angular/dist/IntlTelInputWithUtils.js",
      ]);
    },
  },
  {
    name: "Generate root declarations required by Angular",
    run() {
      run(npmCmd, ["--prefix", repoRoot, "run", "build:js:dts"]);
    },
    validate() {
      assertExists(this.name, [
        "dist/js/intlTelInput.d.ts",
        "dist/js/data.d.ts",
        "dist/js/i18n.d.ts",
        "dist/js/utils.d.ts",
      ]);
    },
  },
  {
    name: "Build utils runtime required by Angular with-utils entrypoint",
    run() {
      run(npmCmd, ["--prefix", repoRoot, "run", "build:utils:closure"]);
    },
    validate() {
      assertExists(this.name, ["dist/js/utils.js"]);
    },
  },
  {
    name: "Build root JS bundles consumed by Angular sources",
    run() {
      run(npmCmd, ["--prefix", repoRoot, "run", "build:js:core"]);
    },
    validate() {
      assertExists(this.name, [
        "dist/js/intlTelInput.mjs",
        "dist/js/intlTelInputWithUtils.mjs",
        "dist/js/data.mjs",
      ]);
    },
  },
  {
    name: "Compile Angular package sources",
    run() {
      run(npmCmd, ["--prefix", repoRoot, "exec", "--", "ngc", "-p", "angular/tsconfig.json"]);
    },
    validate() {
      assertExists(this.name, [
        "angular/dist/temp/IntlTelInput.js",
        "angular/dist/temp/IntlTelInputWithUtils.js",
        "angular/dist/IntlTelInput.d.ts",
        "angular/dist/IntlTelInputWithUtils.d.ts",
      ]);
    },
  },
  {
    name: "Bundle the separated Angular package outputs",
    run() {
      run(process.execPath, [path.join(packageDir, "build-package.js")]);
    },
    validate() {
      assertExists(this.name, [
        "angular/dist/IntlTelInput.js",
        "angular/dist/IntlTelInputWithUtils.js",
        "angular/dist/IntlTelInput.d.ts",
        "angular/dist/IntlTelInputWithUtils.d.ts",
      ]);
      assertMissing(this.name, ["angular/dist/temp"]);
    },
  },
];

console.log(`Building Angular package from ${relativeFromRoot(packageDir)}`);

for (const step of steps) {
  console.log(`\n=== ${step.name} ===`);
  step.run();
  step.validate();
}

console.log("\nAngular package build and validation completed successfully.");
