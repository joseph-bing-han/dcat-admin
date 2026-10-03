# Modern View Layer

The modern View layer is the only renderer. It combines a React runtime with the existing PHP Controller, Blade, PJAX and extension ecosystem, preserving established PHP/HTTP contracts while modernizing presentation.

## Runtime model

Existing PHP builders remain the business-state and HTTP-contract authority. Grid queries, Form names/uploads, Show/Tree actions, extension Blade output and declared Dcat APIs remain available. The modern runtime adds a versioned `window.DcatReact` bridge, scoped design tokens and controlled React primitives. When compatibility requires an existing DOM/plugin instance, React moves the exact node into a Dcat-owned compat island and restores the same node on unmount; it does not clone the transport DOM. This island does not restore the old page renderer or promise Bootstrap/AdminLTE styling.

The build is a single content-hashed IIFE plus scoped CSS and `manifest.json` under `resources/dist/modern`. Consumers use published package assets and do not need Node.js.

## Configuration

The package default is:

```php
'modern' => [
    'manifest' => null,
    'csp_nonce' => null,
    'telemetry' => true,
    'diagnostics' => null,
],
```

- `manifest` points at the published modern manifest; `null` uses the package default path.
- `csp_nonce` is a string or closure applied to every injected `script`/`link`.
- `telemetry` toggles the `dcat:modern:telemetry` event.
- `diagnostics` toggles the compat migration diagnostics; `null` follows `app.debug`.

There is no `enabled` switch, route/family/capability allowlist or forced-fallback query marker. The modern renderer is the only renderer, so a missing manifest degrades to the Dcat compat shell instead of selecting the removed Bootstrap/AdminLTE UI. Legacy fixed asset URLs (`adminlte/*`, `dcat/css/dcat-app*`, `dcat/js/dcat-app.js`, `dcat/plugins/vendors*`) still resolve, but now to Dcat-owned compatibility facades rather than Bootstrap/AdminLTE bundles.

To recover from a bad release, roll the package version back and republish assets with `php artisan vendor:publish --tag=dcat-admin-assets --force`; no database migration and no frontend rebuild are involved.

## Implemented families

- Layout: structured React menu/header inside safe child boundaries. Frozen navigation/navbar/footer/full-page anchors remain in their exact legacy parent/sibling positions and receive React lifecycle enhancement in place, preserving selector relationships, root identity, custom slots and root-bound listeners/data.
- Grid: structured React table/pagination for safe cells and links. Custom displayers and the existing filter/search/selection/action/export/tree transports are retained as exact compat islands, preserving query parameters, methods and handlers. Unsupported quick-create row forms remain within the modern compat boundary.
- Form: React field layout and accessible Tabs while the original form controls remain the submitted nodes. Upload/editor/Select2/HasMany and unclassified plugin fields are explicit compat islands, preserving plugin instances and multipart/nested protocols.
- Show: standard field label/value layout is React-owned; formatter nodes, relations and custom Row/Panel layouts remain exact islands.
- Tree: React owns the toolbar/body composition while the initialized nestable tree and actions remain exact nodes.
- Widgets/Dashboard: the exact Box/Card/DataCard root remains in place and receives scoped React lifecycle enhancement; root-bound listeners/data and arbitrary content stay compat-owned.
- System: exact Login, exception and permission/session-feedback roots remain in place and receive scoped React lifecycle enhancement; authentication/error transport stays server-owned.
- Extension islands: optional React registration with automatic compat-node restoration.

Unclassified arbitrary HTML/Blade can remain in a Dcat-owned compat island. It never selects a separate old page renderer.

## Lifecycle and verification

`window.DcatReact` is version `1.0.0`. It unmounts managed roots before PJAX replacement and mounts after the new fragment is loaded. Structural React boundaries (menu/header/Grid/Form/Show/Tree/extension islands) detach their compat content after a successful commit so ids/forms/selectors cannot be duplicated; unmount restores the same compat node. Frozen Layout/Widget/System anchors are never reparented and are enhanced in place. The modern browser floor is Chrome/Edge 111, Firefox 114 and Safari 16.4; the artifact gate forbids `:has()` to preserve that floor.

Run `npm ci` followed by `npm run verify`. This checks the M0 baseline, PHP/Blade static contracts, strict TypeScript, Vitest, production Vite output, CSS isolation, IIFE topology, bundle size observations and a real system-Chrome/axe harness self-test. The maintainer's current scope excludes other version combinations and GitHub Actions; the project uses local verification scripts and has no `.github` configuration. Record the actual environment for any optional browser investigation; the required local gates are the ones included in `verify`.
