# Root package build

This guide documents the minimum requirements needed to build the root `intl-tel-input` package from a fresh clone.

Before running the npm build scripts, bootstrap the repository with:

```sh
git submodule update --init --recursive
npm install
```

The submodule step is required for `third_party/libphonenumber`, which is used when generating `dist/js/utils.js` and validating metadata drift.

## Build steps

| step | command | output | notes |
| --- | --- | --- | --- |
| Initialize external sources | `git submodule update --init --recursive` | `third_party/libphonenumber/**` | Required before any utils build or metadata check |
| Install toolchain dependencies | `npm install` | `node_modules/**` | Installs the npm packages used by the build scripts |
| Generate flag sprite metadata and images | `npm run build:img:sprite` | `src/css/_metadata.scss`, `dist/img/**` | Implemented by `scripts/generate-sprite.js` |
| Build package CSS | `npm run build:css:main` | `dist/css/intlTelInput.css`, `dist/css/intlTelInput-no-assets.css` | Builds the published stylesheets |
| Build demo CSS | `npm run build:css:demo` | `demo/dist/demo.css` | Builds the shared demo stylesheet |
| Minify package CSS | `npm run build:css:min` | `dist/css/*.min.css` | Minifies the published stylesheets |
| Build all CSS | `npm run build:css` | `dist/css/**`, `demo/dist/demo.css` | Wrapper around the CSS build steps |
| Generate translations | `npm run build:translations:gen` | `src/js/i18n/index.ts` | Implemented by `scripts/translations.js` |
| Generate root TypeScript declarations | `npm run build:js:dts` | `dist/js/*.d.ts`, `dist/js/i18n.d.ts` | Implemented by `scripts/build-dts.js` |
| Build utils from libphonenumber | `npm run build:utils:closure` | `dist/js/utils.js` | Implemented by `scripts/build-utils.js` |
| Check libphonenumber metadata drift | `npm run build:utils:check` | `tmp/generated-rawCountryData.ts` | Implemented by `scripts/check-lpn-metadata.js` |
| Build root JS bundles | `npm run build:js:core` | `dist/js/*.js`, `dist/js/*.mjs`, `dist/js/i18n/**` | Implemented by `scripts/esbuild.js` |
| Build React package | `npm run build:react` | `react/dist/**` | Depends on root declarations and JS bundles |
| Build Vue package | `npm run build:vue` | `vue/dist/**` | Depends on root declarations and JS bundles |
| Build Angular package | `npm run build:angular` | `angular/dist/**` | Depends on root declarations and JS bundles |
| Build components | `npm run build:components` | `react/dist/**`, `vue/dist/**`, `angular/dist/**` | Wrapper around the component package builds |
| Build complete package | `npm run build` | root `dist/**` plus component outputs | Wrapper for the full distributable build |

## Step dependencies

| ID | step | depends on |
| --- | --- | --- |
| 1 | Initialize external sources | - |
| 2 | Install toolchain dependencies | - |
| 3 | Generate flag sprite metadata and images | 2 |
| 4 | Build package CSS | 3 |
| 5 | Build demo CSS | 3 |
| 6 | Minify package CSS | 4 |
| 7 | Build all CSS | 3, 4, 5, 6 |
| 8 | Generate translations | 2 |
| 9 | Generate root TypeScript declarations | 2 |
| 10 | Build utils from libphonenumber | 1, 2 |
| 11 | Check libphonenumber metadata drift | 1, 2 |
| 12 | Build root JS bundles | 8, 9, 10 |
| 13 | Build React package | 9, 12 |
| 14 | Build Vue package | 9, 12 |
| 15 | Build Angular package | 9, 12 |
| 16 | Build components | 13, 14, 15 |
| 17 | Build complete package | 7, 8, 9, 10, 12, 16 |

## Minimal required packages

### Dev dependencies

| name | where | type |
| --- | --- | --- |
| `typescript` | `npm run build:js:dts`, component TypeScript compilation | dev dependency |
| `dts-bundle-generator` | `scripts/build-dts.js` | dev dependency |
| `esbuild` | `scripts/esbuild.js`, `react/build.js`, `angular/build.js` | dev dependency |
| `google-closure-compiler` | `scripts/build-utils.js` | dev dependency |
| `google-closure-library` | `scripts/build-utils.js` | dev dependency |
| `fast-xml-parser` | `scripts/check-lpn-metadata.js` | dev dependency |
| `sass` | `npm run build:css:main`, `npm run build:css:demo` | dev dependency |
| `clean-css-cli` | `npm run build:css:min` | dev dependency |
| `flag-icons` | `scripts/generate-sprite.js` | dev dependency |
| `sharp` | `scripts/generate-sprite.js` | dev dependency |
| `rimraf` | `npm run clean:*` scripts used by the build wrappers | dev dependency |
| `react` | `react/src/**`, `react/demo/**` | dev dependency |
| `react-dom` | `react/demo/**` | dev dependency |
| `@types/react` | `react/src/**`, `react/demo/**` TypeScript compilation | dev dependency |
| `@types/react-dom` | `react/demo/**` TypeScript compilation | dev dependency |
| `vue` | `vue/src/**`, `vue/vite.config.mts` | dev dependency |
| `vite` | `npm run build:vue`, `vue/vite.config.mts` | dev dependency |
| `@vitejs/plugin-vue` | `vue/vite.config.mts` | dev dependency |
| `vite-plugin-dts` | `vue/vite.config.mts` | dev dependency |
| `@vue/tsconfig` | `vue/tsconfig.app.json` | dev dependency |
| `@angular/compiler-cli` | `npm run build:angular` | dev dependency |
| `@angular/compiler` | `npm run build:angular` | dev dependency |
| `@angular/core` | `angular/src/**`, `angular/demo/**` | dev dependency |
| `@angular/common` | `angular/src/**`, `angular/demo/**` | dev dependency |
| `@angular/forms` | `angular/src/**`, `angular/demo/**` | dev dependency |
| `@angular/platform-browser` | `angular/demo/**` | dev dependency |
| `rxjs` | Angular package compilation via `@angular/*` | dev dependency |
| `zone.js` | `angular/demo/**` | dev dependency |

### Runtime dependencies

| name | where | type |
| --- | --- | --- |
| None | The root package publishes standalone JS and CSS assets and declares no npm `dependencies` in `package.json` | N/A |
