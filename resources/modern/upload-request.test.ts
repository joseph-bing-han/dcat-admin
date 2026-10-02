// @ts-expect-error 上传兼容模块保留 JavaScript 入口。
import Request from '../assets/dcat/extra/Upload/Request';

afterEach(() => vi.unstubAllGlobals());

it.each(['success', 'error', 'timeout'])('ends file deletion loading after %s without changing shared request options', (outcome) => {
    const loading = vi.fn();
    const error = vi.fn();
    vi.stubGlobal('Dcat', { token: 'csrf-test', loading, error, confirm: (_title: string, _content: string, callback: () => void) => callback() });
    const post = vi.fn();
    vi.stubGlobal('$', { extend: Object.assign, post });
    const callback = vi.fn();
    const deleteData = { flag: true };
    const parent = { options: { deleteData, deleteUrl: '/files/delete' }, uploader: {}, lang: { trans: () => 'Delete file' }, getColumn: () => 'avatar', helper: { showError: vi.fn() } };
    new Request(parent).delete({ serverId: 'file-id' }, callback);
    const options = post.mock.calls[0][0];
    expect(options.data._token).toBe('csrf-test');
    expect(options.data.key).toBe('file-id');
    expect(deleteData).toEqual({ flag: true });
    expect(options.timeout).toBe(30000);
    expect(loading).toHaveBeenLastCalledWith();
    if (outcome === 'success') options.success({ status: true });
    else options.error({ responseJSON: { message: 'Request failed' } }, outcome);
    options.complete();
    expect(loading).toHaveBeenLastCalledWith(false);
    expect(callback).toHaveBeenCalledTimes(outcome === 'success' ? 1 : 0);
    expect(error).toHaveBeenCalledTimes(outcome === 'success' ? 0 : 1);
});
