import { legacyFieldHelpers } from './compat-fields';
import { executePageScripts, loadScript } from './navigation';

vi.mock('./navigation', () => ({ loadScript: vi.fn().mockResolvedValue(undefined), executePageScripts: vi.fn().mockResolvedValue(undefined) }));

afterEach(() => { vi.unstubAllGlobals(); document.body.innerHTML = ''; });

it('loads async form dependencies before inserting fields, then runs initialization and ready', async () => {
    const order: string[] = [];
    vi.mocked(loadScript).mockImplementation(async () => { order.push('dependency'); });
    vi.mocked(executePageScripts).mockImplementation(async (scripts) => {
        expect(document.querySelector('#avatar')).not.toBeNull();
        expect(scripts.isConnected).toBe(true);
        expect(scripts.querySelector('script')!.textContent).toBe('initializeAvatar()');
        order.push('initialize');
    });
    vi.stubGlobal('Dcat', { triggerReady: () => order.push('ready') });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: async () => '<input id="avatar"><script src="/uploader.js"></script><script>initializeAvatar()</script><script type="application/json">{"field":"avatar"}</script>' }));
    await legacyFieldHelpers.asyncRender('/form', (html) => {
        order.push('insert');
        document.body.innerHTML = html;
    });
    expect(order).toEqual(['dependency', 'insert', 'initialize', 'ready']);
    expect(document.querySelector('script[src]')).toBeNull();
    expect(document.querySelector('script[type="application/json"]')).not.toBeNull();
    expect(document.querySelector('[hidden]')).toBeNull();
});
