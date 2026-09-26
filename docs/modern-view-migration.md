# Modern View Migration and Operations

The modern View layer is the only renderer. Installing or upgrading publishes the prebuilt modern runtime and serves it on every Admin route. Registered Dcat asset facades and HTTP/Controller contracts remain available; production consumers do not need Node.js. The old Bootstrap/AdminLTE page renderer is not supported.

## What changed

The package ships a content-hashed React IIFE, scoped CSS and a Vite manifest under `resources/dist/modern`. The server exposes a modern manager that has no switch back to the removed Bootstrap/AdminLTE renderer, and the browser exposes the versioned `window.DcatReact` bridge. M4-M10 capability boundaries are documented in `codestable/epics/001-o-view-layer-modernization/m4-m10-rendering-contract.json`.

React owns supported structure where it can do so without changing public behavior. Existing HTTP/form contracts remain the transport authority. When a Controller output carries required listeners, jQuery data, a third-party instance or arbitrary extension HTML, the exact node is moved into a React-owned compat island and restored on unmount; it is never cloned into a second live form/id/plugin instance. This does not provide an alternate old page renderer or guarantee old Bootstrap/AdminLTE styling.

## Upgrade path

1. Upgrade/install the package and publish normal package assets. The modern runtime is prebuilt, so the consuming application does not need Node.js.
2. Clear Laravel configuration/view caches after publishing the new package configuration and assets.
3. Validate representative Grid/Form/Show/Tree/plugin-heavy pages. Unsupported or unclassified structures stay in a Dcat compatibility island rather than reverting to the old UI.
4. Review `dcat:modern:telemetry` and the compat migration diagnostics for structures that still need a native implementation.
5. Validate the current PHP/Laravel environment recorded in `m0/support-matrix.json` with the local `npm run modern:browser` script. Other version combinations and GitHub Actions are not required by the maintainer's 2026-09-26 decisions; do not recreate `.github` or require workflow installation. Record the actual versions with the results.

`config/admin.php` only contains renderer settings now:

```php
'modern' => [
    'manifest' => null,
    'csp_nonce' => null,
    'telemetry' => true,
    'diagnostics' => null,
],
```

There is no `enabled` flag, route/family/capability allowlist or forced-fallback query marker. Custom extension DOM may stay compat-owned inside the modern page; arbitrary old View templates and Bootstrap/AdminLTE page styling are not promised.

## Rollback

Rollback never requires a database migration or frontend rebuild.

The old Bootstrap/AdminLTE renderer was removed from the core package, so there is no per-page, per-route or per-request switch back to it. The supported recovery path is a package-level rollback:

1. Replace the `joseph-bing-han/laravel-admin` dependency with Packagist's exact `dcat/laravel-admin:2.2.3-beta` release, and remove any local repository override that shadows `dcat/laravel-admin`. This release supports Laravel 10; `2.2.2-beta` does not.
2. Update the lock file with `composer update dcat/laravel-admin --with-dependencies`.
3. Republish assets: `php artisan vendor:publish --tag=dcat-admin-assets --force`.
4. Clear configuration/view/route caches with the deployment's normal procedure.

Composer's `config` settings are root-only and are not inherited by consuming applications. An application that intentionally disables advisory blocking must set that policy in its own root `composer.json`; `composer audit` will continue to report matching advisories.

If the manifest or a referenced JS/CSS artifact is missing, the server loads the Dcat compat shell. If the runtime itself fails to load, the browser emits telemetry and a recoverable error notice; it does not navigate to an old renderer. If a component-level extension render fails, its compat island remains live without a full-page write replay.

## Telemetry

When `admin.modern.telemetry=true`, the bridge emits `dcat:modern:telemetry` on `window`. The event contains a non-sensitive `code` plus bounded diagnostic fields. Do not add form values, CSRF tokens, uploaded content, user identifiers or arbitrary server payloads to telemetry.

Important codes include:

- `BRIDGE_STARTED` — eligible runtime started successfully.
- `PAYLOAD_MAJOR_MISMATCH` — payload major version is incompatible and is ignored.
- `PAYLOAD_INVALID_JSON` — an embedded payload could not be parsed.
- `CAPABILITY_MOUNT_FAILED` / `CAPABILITY_RENDER_FAILED` — a capability failed before/while rendering.
- `CAPABILITY_PAGE_FALLBACK` — a non-component capability failed; the page keeps its server-rendered structure and only reports the failure.

## Compatibility islands

Compatibility islands are intentional boundaries, not unfinished hidden migrations. The current contract uses them for custom Grid displayers/actions, existing Grid query/action transport, original Form controls, advanced Form plugins, Show formatter/custom Row content, the initialized nestable Tree, arbitrary widget content, authentication/error transport and undeclared extension HTML.

An island may be replaced by a future native React adapter only when the adapter preserves the existing HTTP/payload/lifecycle contract and has its own failure-first tests. Removing an island merely to increase the percentage of React-owned DOM is not a valid migration goal.

## Long-term support policy

The removed Bootstrap/AdminLTE renderer is not supported and will not return. Existing PHP Controller/API calls, `Renderable` values, Sections, Navbar/Menu slots, `window.Dcat`, and declared jQuery/PJAX lifecycle remain input contracts for the modern View. Custom Blade output can render inside a Dcat compat island; the package does not preserve old page templates, Bootstrap styling or arbitrary private selectors.

Unsupported or unclassified custom DOM stays compat-owned instead of being force-migrated to React. Any future removal of those compat surfaces must be a separate compatibility/release decision with migration guidance and evidence for extensions that cannot use native rendering.

## Release evidence

Before a capability is promoted from `experimental` to `verified`, retain all evidence required by `docs/modern-view-release-checklist.md` for the current PHP/Laravel environment: clean-checkout frontend verification, resource publication without Node, system-Chrome/PJAX contracts, full official Demo Controller/page coverage, five-viewport geometry/screenshots, automated semantic DOM/keyboard/focus/reduced-motion and 200% reflow checks, and package rollback rehearsal. Other PHP/Laravel combinations and the historical PHP 8.0 Dusk setup are not required by the maintainer's 2026-09-26 decision; results apply only to the recorded current environment.
