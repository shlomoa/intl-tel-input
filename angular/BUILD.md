# Angular build

This guide documents how the Angular package in this repository is built.

It covers:

- the Angular package outputs in `angular/dist`
- the Angular demos in `angular/demo`
- the shared root build steps that Angular depends on

## Fresh clone bootstrap

From a fresh clone, run these first:

```sh
git submodule update --init --recursive
npm install
```

Why both are required:

- `third_party/libphonenumber` is a git submodule used by `scripts/build-utils.js` and `scripts/check-lpn-metadata.js`
- `flag-icons`, Angular, esbuild, sass, Closure Compiler, and the other build tools come from `node_modules`

## Angular outputs

The Angular package has two source entry points:

| Angular source | Consumer import | Output | Validation / utils |
| --- | --- | --- | --- |
| `angular/src/IntlTelInput.ts` | `intl-tel-input/angular` | `angular/dist/IntlTelInput.js` + `angular/dist/IntlTelInput.d.ts` | No bundled utils |
| `angular/src/IntlTelInputWithUtils.ts` | `intl-tel-input/angularWithUtils` | `angular/dist/IntlTelInputWithUtils.js` + `angular/dist/IntlTelInputWithUtils.d.ts` | Bundles `intl-tel-input/utils` |

Both are compiled together by `ngc -p angular/tsconfig.json` and then bundled by `node angular/build.js`.

## Recommended commands

| Goal | Command | Notes |
| --- | --- | --- |
| Build everything published by the repo | `npm run build` | Full production build, including images, CSS, core JS, and framework components |
| Build the core JS package and all framework components | `npm run build:js` | Smallest reliable command that also produces the Angular package outputs |
| Rebuild only the Angular package and Angular demos | `npm run build:angular` | Works only after the required core JS files already exist in `dist/js/` |
| Watch Angular source and demo files | `npm run watch` | `scripts/watch.js` reruns `build:angular` when `angular/src` or `angular/demo` changes |

## Generation and build processes

| purpose | input | output | script | command | details |
| --- | --- | --- | --- | --- | --- |
| Initialise external sources | `.gitmodules`, remote `google/libphonenumber` repo | `third_party/libphonenumber/**` | n/a | `git submodule update --init --recursive` | Required before any utils build that reads libphonenumber files |
| Install toolchain dependencies | `package.json`, `package-lock.json` | `node_modules/**` | n/a | `npm install` | Installs Angular, esbuild, sass, flag-icons, Closure Compiler, etc. |
| Generate root TypeScript declarations | `src/js/intl-tel-input.ts`, `src/js/data.ts`, `src/js/i18n/index.ts`, `src/js/types/utils.d.ts`, `tsconfig.json` | `dist/js/intlTelInput.d.ts`, `dist/js/data.d.ts`, `dist/js/i18n.d.ts`, `dist/js/utils.d.ts` | `build:js:dts` | `npm run build:js:dts` | Implemented by `scripts/build-dts.js`; also used indirectly by `ensure:dts` |
| Ensure root declarations exist | `dist/js/intlTelInput.d.ts` | existing or regenerated `dist/js/intlTelInput.d.ts` | `ensure:dts` | `npm run ensure:dts` | `build:angular` calls this first, but it does **not** build `dist/js/intlTelInput.mjs` |
| Build utils from libphonenumber | `src/js/utils.js`, `third_party/libphonenumber/javascript/i18n/phonenumbers/**`, `node_modules/google-closure-library/**` | `dist/js/utils.js` | `build:utils:closure` | `npm run build:utils:closure` | Implemented by `scripts/build-utils.js` using Google Closure Compiler |
| Check libphonenumber metadata drift | `third_party/libphonenumber/resources/PhoneNumberMetadata.xml`, `src/js/data.ts` | `tmp/generated-rawCountryData.ts` | `build:utils:check` | `npm run build:utils:check` | Implemented by `scripts/check-lpn-metadata.js`; exits non-zero when curated country data needs manual review |
| Build and verify utils together | same as previous two rows | `dist/js/utils.js`, `tmp/generated-rawCountryData.ts` | `build:utils` | `npm run build:utils` | Convenience wrapper: `clean:utils` → `build:utils:closure` → `build:utils:check` |
| Build root JS bundles needed by Angular | `src/js/intl-tel-input.ts`, `src/js/intlTelInputWithUtils.ts`, `src/js/data.ts`, `src/js/i18n/**/*.ts`, `dist/js/utils.js` | `dist/js/intlTelInput.js`, `dist/js/intlTelInput.min.js`, `dist/js/intlTelInput.mjs`, `dist/js/intlTelInputWithUtils.js`, `dist/js/intlTelInputWithUtils.min.js`, `dist/js/intlTelInputWithUtils.mjs`, `dist/js/data.js`, `dist/js/data.min.js`, `dist/js/data.mjs`, `dist/js/i18n/**` | `build:js:core` | `npm run build:js:core` | Implemented by `scripts/esbuild.js`; Angular packaging depends on `dist/js/intlTelInput.mjs` existing |
| Generate flag sprite metadata and images | `src/js/data.ts`, `node_modules/flag-icons/flags/4x3/**` | `src/css/_metadata.scss`, `dist/img/flags.webp`, `dist/img/flags@2x.webp`, `dist/img/flags.png`, `dist/img/flags@2x.png` | `build:img:sprite` | `npm run build:img:sprite` | Implemented by `scripts/generate-sprite.js`; shared by all framework demos through the CSS |
| Build package CSS | `src/css/intlTelInput.scss`, `src/css/intlTelInputWithAssets.scss`, `src/css/_metadata.scss` | `dist/css/intlTelInput-no-assets.css`, `dist/css/intlTelInput.css` | `build:css:main` | `npm run build:css:main` | Generates the published stylesheets |
| Build demo CSS | `demo/src/demo.scss`, `src/css/intlTelInputWithAssets.scss`, `src/css/_metadata.scss`, Bootstrap SCSS | `demo/dist/demo.css` | `build:css:demo` | `npm run build:css:demo` | Angular demo HTML files all reference `../../../demo/dist/demo.css` |
| Minify package CSS | `dist/css/intlTelInput.css`, `dist/css/intlTelInput-no-assets.css` | `dist/css/intlTelInput.min.css`, `dist/css/intlTelInput-no-assets.min.css` | `build:css:min` | `npm run build:css:min` | Final CSS minification step |
| Build all CSS | sprite metadata, SCSS sources, demo SCSS | `dist/css/**`, `demo/dist/demo.css`, `dist/css/styles.d.ts` | `build:css` | `npm run build:css` | Wrapper around clean + main CSS + demo CSS + minification |
| Build images and then CSS | `src/js/data.ts`, `flag-icons`, SCSS sources | `dist/img/**`, `src/css/_metadata.scss`, `dist/css/**`, `demo/dist/demo.css` | `build:img` | `npm run build:img` | `build:img` runs `build:img:sprite` and then `build:css` |
| Compile Angular TypeScript sources | `angular/src/IntlTelInput.ts`, `angular/src/IntlTelInputWithUtils.ts`, `angular/tsconfig.json`, `dist/js/intlTelInput.mjs`, `dist/js/utils.js` | `angular/dist/temp/*.js`, `angular/dist/*.d.ts` | part of `build:angular` | `ngc -p angular/tsconfig.json` | Produces temporary JS for bundling plus the published Angular `.d.ts` files |
| Bundle Angular package outputs | `angular/dist/temp/IntlTelInput.js`, `angular/dist/temp/IntlTelInputWithUtils.js` | `angular/dist/IntlTelInput.js`, `angular/dist/IntlTelInputWithUtils.js` | part of `build:angular` | `node angular/build.js` | `angular/build.js` removes `angular/dist/temp` after bundling |
| Bundle Angular demos | `angular/demo/*/main.ts`, each demo component, Angular runtime imports | `angular/demo/simple/simple-bundle.js`, `angular/demo/validation/validation-bundle.js`, `angular/demo/set-number/set-number-bundle.js`, `angular/demo/toggle-disabled/toggle-disabled-bundle.js`, `angular/demo/form/form-bundle.js` | part of `build:angular` | `node angular/build.js` | Each demo `index.html` file loads its matching bundle |
| Build Angular package and demos | Angular sources + root JS declarations + root JS runtime bundles | `angular/dist/**`, `angular/demo/*/*-bundle.js` | `build:angular` | `npm run build:angular` | Actual script is `ensure:dts && clean:angular && ngc -p angular/tsconfig.json && node angular/build.js`; on a fresh clone you still need the root JS bundles first |
| Build all framework components | root JS bundles + framework source folders | `react/dist/**`, `vue/dist/**`, `angular/dist/**` | `build:components` | `npm run build:components` | Wrapper for React, Vue, and Angular component builds |
| Build JS package plus framework components | root JS sources, utils, declarations, framework source folders | `dist/js/**`, `react/dist/**`, `vue/dist/**`, `angular/dist/**` | `build:js` | `npm run build:js` | This is the smallest end-to-end build path that reliably produces Angular outputs |

## Minimal files required to build

| file_name | required from file | source | Dependency |
| --- | --- | --- | --- |
| `package.json` | npm scripts, package exports, version injection | repository root | internal |
| `package-lock.json` | `npm install` reproducibility | repository root | internal |
| `.gitmodules` | `git submodule update --init --recursive` | repository root | internal |
| `tsconfig.json` | `scripts/build-dts.js`, `scripts/esbuild.js` | repository root | internal |
| `angular/tsconfig.json` | `npm run build:angular` | repository root | internal |
| `angular/build.js` | `npm run build:angular` | repository root | internal |
| `angular/src/IntlTelInput.ts` | `angular/tsconfig.json`, `angular/build.js` | repository root | internal |
| `angular/src/IntlTelInputWithUtils.ts` | `angular/tsconfig.json`, `angular/build.js` | repository root | internal |
| `angular/demo/simple/main.ts` | `angular/build.js` | repository root | internal |
| `angular/demo/simple/simple.component.ts` | `angular/demo/simple/main.ts` | repository root | internal |
| `angular/demo/simple/index.html` | manual demo page load | repository root | internal |
| `angular/demo/validation/main.ts` | `angular/build.js` | repository root | internal |
| `angular/demo/validation/validation.component.ts` | `angular/demo/validation/main.ts` | repository root | internal |
| `angular/demo/validation/index.html` | manual demo page load | repository root | internal |
| `angular/demo/form/main.ts` | `angular/build.js` | repository root | internal |
| `angular/demo/form/form.component.ts` | `angular/demo/form/main.ts` | repository root | internal |
| `angular/demo/form/index.html` | manual demo page load | repository root | internal |
| `angular/demo/set-number/main.ts` | `angular/build.js` | repository root | internal |
| `angular/demo/set-number/set-number.component.ts` | `angular/demo/set-number/main.ts` | repository root | internal |
| `angular/demo/set-number/index.html` | manual demo page load | repository root | internal |
| `angular/demo/toggle-disabled/main.ts` | `angular/build.js` | repository root | internal |
| `angular/demo/toggle-disabled/toggle-disabled.component.ts` | `angular/demo/toggle-disabled/main.ts` | repository root | internal |
| `angular/demo/toggle-disabled/index.html` | manual demo page load | repository root | internal |
| `scripts/build-dts.js` | `npm run build:js:dts`, `npm run ensure:dts` | repository root | internal |
| `scripts/esbuild.js` | `npm run build:js:core` | repository root | internal |
| `scripts/build-utils.js` | `npm run build:utils:closure` | repository root | internal |
| `scripts/check-lpn-metadata.js` | `npm run build:utils:check` | repository root | internal |
| `scripts/generate-sprite.js` | `npm run build:img:sprite` | repository root | internal |
| `scripts/watch.js` | `npm run watch` | repository root | internal |
| `src/js/intl-tel-input.ts` | `scripts/esbuild.js`, Angular package runtime dependency | repository root | internal |
| `src/js/intlTelInputWithUtils.ts` | `scripts/esbuild.js` | repository root | internal |
| `src/js/data.ts` | `scripts/build-dts.js`, `scripts/esbuild.js`, `scripts/check-lpn-metadata.js`, `scripts/generate-sprite.js` | repository root | internal |
| `src/js/utils.js` | `scripts/build-utils.js` | repository root | internal |
| `src/js/i18n/index.ts` | `scripts/build-dts.js`, `scripts/esbuild.js` | repository root | internal |
| `src/js/types/utils.d.ts` | `scripts/build-dts.js` | repository root | internal |
| `src/css/intlTelInput.scss` | `src/css/intlTelInputWithAssets.scss`, `npm run build:css:main` | repository root | internal |
| `src/css/intlTelInputWithAssets.scss` | `npm run build:css:main`, `demo/src/demo.scss` | repository root | internal |
| `src/css/_metadata.scss` | `src/css/intlTelInput.scss` | generated by `scripts/generate-sprite.js` | internal |
| `demo/src/demo.scss` | `npm run build:css:demo`, Angular demo HTML pages | repository root | internal |
| `demo/src/theme.js` | Angular demo `index.html` files | repository root | internal |
| `third_party/libphonenumber/resources/PhoneNumberMetadata.xml` | `scripts/check-lpn-metadata.js` | git submodule | external |
| `third_party/libphonenumber/javascript/i18n/phonenumbers/phonenumberutil.js` | `scripts/build-utils.js` | git submodule | external |
| `node_modules/flag-icons/package.json` | `scripts/generate-sprite.js` | npm package install | external |
| `node_modules/google-closure-library/package.json` | `scripts/build-utils.js` | npm package install | external |
| `node_modules/google-closure-compiler/package.json` | `scripts/build-utils.js` | npm package install | external |
| `node_modules/@angular/compiler-cli/package.json` | `ngc -p angular/tsconfig.json` | npm package install | external |
| `node_modules/esbuild/package.json` | `scripts/esbuild.js`, `angular/build.js` | npm package install | external |
| `node_modules/sass/package.json` | `npm run build:css:main`, `npm run build:css:demo` | npm package install | external |
| `node_modules/sharp/package.json` | `scripts/generate-sprite.js` | npm package install | external |

## What actually builds `IntlTelInput` vs `IntlTelInputWithUtils`

There is no separate npm script per Angular entry point. The split is defined by the source files:

- `angular/src/IntlTelInput.ts`
  - imports `intl-tel-input`
  - outputs `angular/dist/IntlTelInput.js`
  - consumer import: `intl-tel-input/angular`

- `angular/src/IntlTelInputWithUtils.ts`
  - imports `intl-tel-input`
  - imports `intl-tel-input/utils`
  - assigns `intlTelInput.utils = utils`
  - outputs `angular/dist/IntlTelInputWithUtils.js`
  - consumer import: `intl-tel-input/angularWithUtils`

So the Angular build always produces both files together; the difference is in the entry source and the runtime dependencies each one bundles.
