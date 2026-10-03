# Modern View Release Checklist

The modern View layer is the only renderer and has no switch back to the removed Bootstrap/AdminLTE UI. Release validation therefore treats package-version rollback plus the Dcat compat layer as the supported recovery path, without weakening the compatibility or evidence requirements below.

Operational upgrade, pilot, telemetry, rollback and long-term support guidance lives in [`modern-view-migration.md`](modern-view-migration.md).

Required gates:

These are local verification gates. GitHub Actions and `.github` configuration are intentionally absent by the maintainer's 2026-09-26 decision.

- `npm ci && npm run verify` succeeds from a clean checkout.
- Published `resources/dist/modern/manifest.json` resolves one hashed IIFE entry plus scoped CSS.
- Report modern JS/CSS/total raw and gzip measurements; no absolute, relative, per-asset or incremental-chunk size limit applies.
- No modern source uses dynamic `import()`, runtime ESM chunks, `:has()`, external fonts or unscoped CSS.
- The package passes resource publication, modern native/compat smoke, shared contracts and the system-Chrome self-test included in the local verification command. Other version combinations are outside the maintained validation scope.
- Five M0 viewports pass DOM/geometry runtime fixtures.
- Existing representative Controller/API feature suites remain green in the current environment.
- Accessibility evidence comes from automated axe, semantic DOM/landmark order, keyboard/focus and 200% reflow checks at the prescribed viewports. Record the browser emulation method and reject overflow or unreachable controls; do not label simulated reflow as native browser UI zoom or screen-reader output.
- A rollback rehearsal installs the exact Packagist artifact `dcat/laravel-admin:2.2.3-beta` on Laravel 10 and proves that republishing assets restores service without a database change or frontend rebuild.
- `m11-release-status.json` has no remaining automated gate and the capability matrix records the verified commit before any promotion decision.

Validation sequence: publish the prebuilt assets; verify the full official Demo Controller/page set through the modern View; assert automated telemetry and compat diagnostics contracts; keep unsupported third-party Form fields and unclassified extension surfaces inside their Dcat-owned compat islands.

Rollback: there is no renderer switch or fallback marker. Roll the package version back, republish assets with `php artisan vendor:publish --tag=dcat-admin-assets --force`, and clear configuration/view caches.
