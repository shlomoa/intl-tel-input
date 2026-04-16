# Angular integration

This guide is for **consuming** the published Angular component in an Angular app that already uses Angular Material.

Inside this repository, the demos import from `angular/src/*` because they are building the component locally. In your own app, use the published package entry points instead:

- `intl-tel-input/angular` → Angular component **without** bundled utils
- `intl-tel-input/angularWithUtils` → Angular component **with** bundled utils for validation/formatting

## Choose the Angular entry point

| Entry point | Use when | Validation / formatting |
| --- | --- | --- |
| `intl-tel-input/angularWithUtils` | You want the simplest integration and you need validation immediately | Included automatically |
| `intl-tel-input/angular` | You want the lighter component entry and do not need utils up front | Not available unless you also provide `loadUtils` |

> All current Angular demos in `/home/runner/work/intl-tel-input/intl-tel-input/angular/demo` use the **with-utils** entry point.

## 1. Install the package

```sh
npm install intl-tel-input
```

## 2. Load the stylesheet globally

The component renders global `.iti*` classes, so load the stylesheet once for the whole app.

For an Angular Material workspace, the safest option is to add it to `angular.json`:

```json
{
  "projects": {
    "your-app": {
      "architect": {
        "build": {
          "options": {
            "styles": [
              "src/styles.scss",
              "node_modules/intl-tel-input/dist/css/intlTelInput.css"
            ]
          }
        }
      }
    }
  }
}
```

You can also import it in `src/main.ts`:

```ts
import "intl-tel-input/styles";
```

## What the repo demos import that your app may already have

Each demo `main.ts` in `/home/runner/work/intl-tel-input/intl-tel-input/angular/demo/*/main.ts` imports:

- `zone.js`
- `@angular/compiler`
- `bootstrapApplication` from `@angular/platform-browser`

Those imports are needed because the demos are bundled as standalone HTML pages from inside this repository. In a normal Angular Material app created with the Angular CLI, you already have your own app bootstrap, so the part you normally copy from these docs is the component import (`intl-tel-input/angular` or `intl-tel-input/angularWithUtils`) plus your chosen Angular Forms / Angular Material modules.

## 3. Import the standalone component

The Angular component is standalone, so import it directly into your standalone page/component.

### Recommended: `angularWithUtils`

This matches the repo demos:

- `/home/runner/work/intl-tel-input/intl-tel-input/angular/demo/simple/simple.component.ts`
- `/home/runner/work/intl-tel-input/intl-tel-input/angular/demo/validation/validation.component.ts`
- `/home/runner/work/intl-tel-input/intl-tel-input/angular/demo/form/form.component.ts`
- `/home/runner/work/intl-tel-input/intl-tel-input/angular/demo/set-number/set-number.component.ts`
- `/home/runner/work/intl-tel-input/intl-tel-input/angular/demo/toggle-disabled/toggle-disabled.component.ts`

```ts
import { Component } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import IntlTelInput from "intl-tel-input/angularWithUtils";

@Component({
  standalone: true,
  selector: "app-phone-card",
  imports: [ReactiveFormsModule, MatButtonModule, MatCardModule, IntlTelInput],
  template: `
    <mat-card>
      <mat-card-content>
        <label class="mat-body-medium" for="phone">Phone number</label>

        <form [formGroup]="form">
          <intl-tel-input
            formControlName="phone"
            initialCountry="us"
            [inputAttributes]="{ id: 'phone', autocomplete: 'tel' }"
          />
        </form>

        @if (phone.touched && phone.errors?.["required"]) {
          <div class="mat-mdc-form-field-error">Phone number is required.</div>
        } @else if (phone.touched && phone.errors?.["invalidPhone"]) {
          <div class="mat-mdc-form-field-error">Phone number is invalid.</div>
        }
      </mat-card-content>

      <mat-card-actions>
        <button mat-raised-button color="primary" [disabled]="form.invalid">
          Save
        </button>
      </mat-card-actions>
    </mat-card>
  `,
})
export class PhoneCardComponent {
  readonly form = new FormGroup({
    phone: new FormControl("", { nonNullable: true, validators: [Validators.required] }),
  });

  get phone() {
    return this.form.controls.phone;
  }
}
```

Why this version is easiest:

- `IntlTelInputWithUtils.ts` imports both `intl-tel-input` and `intl-tel-input/utils`
- `invalidPhone` validation works out of the box
- `validityChange` and `errorCodeChange` are immediately useful
- it maps directly to every current Angular demo in this repo

### Lighter entry: `angular`

Use this when you want the component without bundled utils:

```ts
import { Component } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import IntlTelInput from "intl-tel-input/angular";

@Component({
  standalone: true,
  selector: "app-phone-basic",
  imports: [MatButtonModule, IntlTelInput],
  template: `
    <intl-tel-input
      initialCountry="us"
      [inputAttributes]="{ autocomplete: 'tel' }"
      (numberChange)="number = $event"
    />

    <button mat-raised-button color="primary" type="button">
      {{ number || "Enter a number" }}
    </button>
  `,
})
export class PhoneBasicComponent {
  number = "";
}
```

Without utils:

- dropdown and number entry still work
- utils-backed validation/formatting methods are not available
- `invalidPhone` validation is not useful until utils are loaded

If you want to start with `intl-tel-input/angular` and lazy-load utils later, pass the normal plugin `loadUtils` option:

```ts
loadUtils = () => import("intl-tel-input/utils");
```

```html
<intl-tel-input [loadUtils]="loadUtils" />
```

## Angular Material notes

- `IntlTelInput` is a standalone component, not a `MatFormFieldControl`.
- Do **not** expect `<intl-tel-input>` to behave like `<input matInput>`.
- Use Angular Material for surrounding layout/actions (`mat-card`, `mat-button`, dialogs, stepper, etc.), and let `intl-tel-input` render its own input.
- Keep the stylesheet global; component-scoped styles are not enough.
- The repo demos use Bootstrap-specific classes such as `form-control` via `inputAttributes.class` and `searchInputClass`. In a Material app, remove those or replace them with your own global classes.

## Inputs and outputs you will use most often

The component in `/home/runner/work/intl-tel-input/intl-tel-input/angular/src/IntlTelInput.ts` exposes:

- form integration via `ControlValueAccessor`
- validation via `Validator`
- key inputs such as `initialValue`, `disabled`, `readonly`, `inputAttributes`, `usePreciseValidation`
- all core plugin options as individual Angular inputs, e.g. `initialCountry`, `nationalMode`, `separateDialCode`, `showFlags`, `loadUtils`
- outputs such as `numberChange`, `countryChange`, `validityChange`, `errorCodeChange`

## Mapping the repo demos to real app use cases

| Demo folder | File | What it shows |
| --- | --- | --- |
| `angular/demo/simple` | `simple.component.ts` | Smallest standalone integration |
| `angular/demo/validation` | `validation.component.ts` | Validation with `numberChange`, `validityChange`, `errorCodeChange` |
| `angular/demo/form` | `form.component.ts` | `ReactiveFormsModule`, `formControlName`, `invalidPhone` validator |
| `angular/demo/set-number` | `set-number.component.ts` | Calling `getInstance().setNumber(...)` through `ViewChild` |
| `angular/demo/toggle-disabled` | `toggle-disabled.component.ts` | Toggling the `disabled` input |

## Accessing the plugin instance

The Angular wrapper exposes:

- `getInstance()` → the underlying intl-tel-input instance
- `getInput()` → the rendered `<input>`

Use `ViewChild` and wait until `ngAfterViewInit` before calling them.
