# Modern View Extension API

Existing Blade/Renderable extension output remains supported without changes inside the single modern View runtime. Modern extension UI is optional and must keep a complete Dcat-owned compat path.

## Server-side island

```php
$html = Admin::modern()->island(
    'sample-card',
    ['title' => 'Example', 'count' => 12],
    '<div class="card">Legacy extension output</div>'
);
```

The capability id is `extension.sample-card`. The island is always hosted by the modern View runtime. If the native extension registration is unavailable, the Dcat-owned compat content remains visible inside the same modern page; there is no old full-page renderer or allowlist switch.

## Browser registration

```javascript
window.DcatReact.registerReact({
    id: 'extension.sample-card',
    family: 'extension',
    selector: '[data-dcat-react-component="sample-card"]',
    fallbackScope: 'component',
    render: ({ context }) => {
        const data = context.payloads[0]?.payload || {};
        return window.DcatReact.createElement(
            'div',
            { className: 'my-extension-modern-card' },
            `${data.title}: ${data.count}`
        );
    },
});
```

The bridge owns the React root. After a successful React commit the fallback node is physically detached from the live DOM (rather than merely CSS-hidden), preventing duplicate ids/forms/selectors. The exact same node is restored after unregister or PJAX unmount. A failed render never detaches the fallback.

Extension registrations are isolated from core capabilities. Browser registrations must use `family: 'extension'` and an `extension.*` capability id. Duplicate ids are rejected, and the public `unregister()` API cannot remove core capabilities. Extensions must unregister their own id before replacing an implementation.

Extensions must not overwrite `window.Dcat`, mutate jQuery prototypes or hijack the global PJAX handler. Components unable to preserve existing HTTP, DOM or lifecycle contracts must remain inside a declared compat island until a native adapter is implemented; they must not introduce an old whole-page renderer.

An extension can recover at component scope by unregistering its own capability, allowing the exact compat node to be restored. If the package runtime itself must be reverted, use the documented package-version rollback and republish the modern assets; there is no route, family, global renderer switch or classic fallback. No database change is required.
