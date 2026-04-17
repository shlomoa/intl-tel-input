# Separated Angular package build

This guide documents the Angular-only build flow from `packages/angular`.

It is based on `angular/BUILD.md`, but wraps the required Angular prerequisites into a single package-local run so you do **not** need to execute any root build steps manually first.

## Single-run command

From `packages/angular`, run:

```sh
npm run build
```

That command executes `build.js`, which runs the required build steps in order, bootstraps missing prerequisites, and validates the outputs after each step.

## Fresh clone behavior

No manual root bootstrap steps are required before running `npm run build` in `packages/angular`.

If prerequisites are missing, `build.js` bootstraps them automatically by running:

- `npm install` in the repository root when the shared build dependencies are missing
- `git submodule update --init --recursive` in the repository root when `third_party/libphonenumber` has not been initialized yet

Those prerequisites are still needed because:

- `third_party/libphonenumber` is needed to build `dist/js/utils.js`
- the build tools (`typescript`, `@angular/compiler-cli`, `esbuild`, `google-closure-compiler`, etc.) come from the shared root `node_modules`

## Atomic build steps

`npm run build` runs these steps in order:

| step | command used internally | required outputs validated before moving on |
| --- | --- | --- |
| Bootstrap prerequisites | installs missing shared dependencies with `npm install` and initializes missing submodules with `git submodule update --init --recursive` | confirms `node_modules` contains the required build tools and `third_party/libphonenumber/javascript/i18n/phonenumbers/phonenumberutil.js` exists |
| Reset shared JS and Angular package outputs | `npm --prefix ../.. run clean:dist:js` + `npm --prefix ../.. run clean:angular` | confirms old `dist/js/*` and `angular/dist/*` package outputs are gone |
| Generate root declarations required by Angular | `npm --prefix ../.. run build:js:dts` | `dist/js/intlTelInput.d.ts`, `dist/js/data.d.ts`, `dist/js/i18n.d.ts`, `dist/js/utils.d.ts` |
| Build utils runtime required by Angular with-utils entrypoint | `npm --prefix ../.. run build:utils:closure` | `dist/js/utils.js` |
| Build root JS bundles consumed by Angular sources | `npm --prefix ../.. run build:js:core` | `dist/js/intlTelInput.mjs`, `dist/js/intlTelInputWithUtils.mjs`, `dist/js/data.mjs` |
| Compile Angular package sources | `npm --prefix ../.. exec -- ngc -p angular/tsconfig.json` | `angular/dist/temp/IntlTelInput.js`, `angular/dist/temp/IntlTelInputWithUtils.js`, `angular/dist/IntlTelInput.d.ts`, `angular/dist/IntlTelInputWithUtils.d.ts` |
| Bundle the separated Angular package outputs | `node build-package.js` | `angular/dist/IntlTelInput.js`, `angular/dist/IntlTelInputWithUtils.js`, and confirms `angular/dist/temp` was removed |

## Dependency order

The steps above form this dependency chain:

1. Bootstrap prerequisites
2. Reset shared JS and Angular package outputs
3. Generate root declarations required by Angular
4. Build utils runtime required by Angular with-utils entrypoint
5. Build root JS bundles consumed by Angular sources
6. Compile Angular package sources
7. Bundle the separated Angular package outputs

Each step is validated before the next step runs.

## Final package outputs

The separated build produces the Angular package files in `angular/dist`:

- `IntlTelInput.js`
- `IntlTelInput.d.ts`
- `IntlTelInputWithUtils.js`
- `IntlTelInputWithUtils.d.ts`

## Validation

To rerun the same ordered build with output checks:

```sh
npm run validate
```

From the repository root, the same validation is also exposed as:

```sh
npm run test:packages:angular
```
