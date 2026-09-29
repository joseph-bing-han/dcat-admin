/*
 * Untitled UI React 组件 vendor 工具（Epic 002 / S2）。
 *
 * 作用：按固定上游 revision 拉取被选中的组件源码到 resources/modern/ui/（镜像上游路径），
 * 并刷新 resources/modern/vendor/untitled-ui/PROVENANCE.json 的逐文件 sha256 与裁剪清单。
 *
 * 这是维护工具，不是构建步骤：产物提交进仓库，构建不需要网络。
 *
 * 用法：
 *   node scripts/view-modernization-vendor-untitled-ui.mjs            # 拉取并更新 provenance
 *   node scripts/view-modernization-vendor-untitled-ui.mjs --check    # 离线校验本地与 provenance 一致（门禁用）
 *   node scripts/view-modernization-vendor-untitled-ui.mjs --check-upstream  # 额外比对上游文件树（需网络）
 *
 * 约束（对应 compatibility-contract 5.0.0「组件来源与 provenance」）：
 * - 只取 MIT 开源部分；PRO 组件、页面示例与源码不在任何 allow 规则内。
 * - 每个文件保持上游原样写入，本地修改必须在 PATCHES.md 中登记。
 * - 排除项必须写明原因，不允许无理由扩大 vendor 面。
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import crypto from 'node:crypto';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const provenancePath = path.join(root, 'resources/modern/vendor/untitled-ui/PROVENANCE.json');
const provenance = JSON.parse(fs.readFileSync(provenancePath, 'utf8'));
const revision = provenance.revision;
const targetRoot = path.join(root, 'resources/modern/ui');
const checkOnly = process.argv.includes('--check');
const checkUpstream = process.argv.includes('--check-upstream');

/* 允许整目录取用的组件族。 */
const includeDirectories = [
    'components/base/avatar',
    'components/base/badges',
    'components/base/button-group',
    'components/base/checkbox',
    'components/base/dropdown',
    'components/base/file-upload-trigger',
    'components/base/form',
    'components/base/input',
    'components/base/progress-indicators',
    'components/base/radio-buttons',
    'components/base/select',
    'components/base/tags',
    'components/base/textarea',
    'components/base/toggle',
    'components/base/tooltip',
    'components/application/date-picker',
    'components/application/loading-indicator',
    'components/application/modals',
    'components/application/pagination',
    'components/application/slideout-menus',
    'components/application/table',
    'components/application/tabs',
];

/* 具体文件额外纳入（不在上面的目录清单里，但是组件依赖）。 */
const includeFiles = [
    'components/base/buttons/button.tsx',
    'components/base/buttons/button-utility.tsx',
    'components/base/buttons/close-button.tsx',
    'components/foundations/dot-icon.tsx',
    'components/foundations/featured-icon/featured-icon.tsx',
    'hooks/use-breakpoint.ts',
    'hooks/use-resize-observer.ts',
    'utils/cx.ts',
    'utils/is-react-component.ts',
    'styles/theme.css',
];

/*
 * 排除项：每一条都必须写明原因。匹配按前缀或完整路径。
 * PRO 资产不在此列表内，因为 allow 清单从未包含它们。
 */
const exclusions = [
    { pattern: 'components/application/carousel', reason: '需要 embla-carousel-react；后台不引入轮播' },
    { pattern: 'components/application/charts', reason: '需要 recharts；会顶穿体积预算，后台图表不在本 Epic 范围' },
    { pattern: 'components/application/empty-state', reason: '需要 @untitledui/file-icons；S4 决定 Grid 空态是否引入该依赖后再纳入' },
    { pattern: 'components/application/file-upload', reason: '需要 motion/react 与 @untitledui/file-icons；后台上传走 compat island（webuploader）' },
    { pattern: 'components/application/app-navigation', reason: 'S3 处理 shell 时按需纳入；sidebar-simple 依赖上游品牌 logo，需先设计替换方案' },
    { pattern: 'components/base/buttons/app-store-buttons', reason: '营销/品牌资产，不属于后台' },
    { pattern: 'components/base/buttons/app-store-buttons-outline', reason: '营销/品牌资产，不属于后台' },
    { pattern: 'components/base/buttons/social-button', reason: '营销/品牌资产，不属于后台' },
    { pattern: 'components/base/buttons/social-logos', reason: '营销/品牌资产，不属于后台' },
    { pattern: 'components/base/dropdown/dropdown-account', reason: '应用级模式（账户卡/团队切换），Dcat 有自己的用户区；只取基础 dropdown.tsx' },
    { pattern: 'components/base/dropdown/dropdown-avatar', reason: '应用级模式，同上' },
    { pattern: 'components/base/dropdown/dropdown-button-', reason: '应用级模式，同上' },
    { pattern: 'components/base/dropdown/dropdown-context-menu-', reason: '应用级模式，同上' },
    { pattern: 'components/base/dropdown/dropdown-icon-', reason: '应用级模式，同上' },
    { pattern: 'components/base/dropdown/dropdown-integration', reason: '应用级模式，同上' },
    { pattern: 'components/base/dropdown/dropdown-search-', reason: '应用级模式，同上' },
    { pattern: 'components/base/form/hook-form.tsx', reason: '需要 react-hook-form；Dcat 表单由 PHP 侧驱动，不引入表单库' },
    { pattern: 'components/base/input/pin-input.tsx', reason: '需要 input-otp' },
    { pattern: 'components/base/input/input-payment.tsx', reason: '需要 foundations/payment-icons 品牌资产' },
    { pattern: 'components/base/slider', reason: 'Dcat 无对应字段；需要时再单独评估' },
    { pattern: '.demo.tsx', reason: '上游示例文件' },
    { pattern: '.story.tsx', reason: '上游 Storybook 文件' },
];

/* 允许的类型：只取实现源码与样式，不取数据 fixture。 */
const allowedExtensions = ['.ts', '.tsx', '.css'];

if (checkOnly && !checkUpstream) {
    verifyLocal();
} else {
    const selected = selectFiles(await fetchTree());
    if (checkOnly) {
        verify(selected);
    } else {
        await vendor(selected);
    }
}

function selectFiles(tree) {
    const matched = new Map();

    tree.forEach((entry) => {
        if (entry.type !== 'blob') return;
        if (!allowedExtensions.includes(path.extname(entry.path))) return;

        const inDirectory = includeDirectories.some((directory) => entry.path.startsWith(`${directory}/`));
        const inFiles = includeFiles.includes(entry.path);
        if (!inDirectory && !inFiles) return;

        const exclusion = exclusions.find((item) => entry.path.startsWith(item.pattern) || entry.path.endsWith(item.pattern));
        if (exclusion) return;

        matched.set(entry.path, entry);
    });

    return matched;
}

async function fetchTree() {
    const response = await fetch(`https://api.github.com/repos/untitleduico/react/git/trees/${revision}?recursive=1`, {
        headers: { 'User-Agent': 'dcat-admin-view-modernization' },
    });
    if (!response.ok) {
        fail(`无法读取上游文件树（HTTP ${response.status}）：${revision}`);
    }
    const payload = await response.json();
    if (payload.truncated) {
        fail('上游文件树被截断，无法可靠判定 vendor 面');
    }
    return payload.tree;
}

async function vendor(selected) {
    const records = [];

    for (const [upstreamPath, entry] of selected) {
        const response = await fetch(`https://raw.githubusercontent.com/untitleduico/react/${revision}/${upstreamPath}`, {
            headers: { 'User-Agent': 'dcat-admin-view-modernization' },
        });
        if (!response.ok) {
            fail(`下载失败（HTTP ${response.status}）：${upstreamPath}`);
        }
        const content = Buffer.from(await response.arrayBuffer());
        const destination = path.join(targetRoot, upstreamPath);
        fs.mkdirSync(path.dirname(destination), { recursive: true });
        fs.writeFileSync(destination, content);
        records.push({ path: upstreamPath, bytes: content.byteLength, sha256: sha256(content) });
    }

    records.sort((a, b) => a.path.localeCompare(b.path));
    provenance.revision = revision;
    provenance.vendoredTo = 'resources/modern/ui/';
    provenance.selectedSources = records.map((record) => record.path);
    provenance.files = records;
    provenance.fileCount = records.length;
    provenance.totalBytes = records.reduce((total, record) => total + record.bytes, 0);
    provenance.exclusions = exclusions;
    provenance.adaptation =
        'Untitled UI React 开源组件源码按上游路径 vendored 到 resources/modern/ui/。本地通过 tsconfig/vite 的 @/* 别名指向上游路径，' +
        '因此组件文件保持上游原样；本地必要的改动登记在 resources/modern/ui/PATCHES.md。仅使用 MIT 开源部分，PRO 组件与页面示例不纳入。';
    delete provenance.notes;

    fs.mkdirSync(path.dirname(provenancePath), { recursive: true });
    fs.writeFileSync(provenancePath, JSON.stringify(provenance, null, 2) + '\n');

    console.log(`Vendored Untitled UI React ${revision.slice(0, 12)}: ${records.length} files, ${provenance.totalBytes} bytes.`);
}

function verify(selected) {
    const expected = provenance.files || [];
    const problems = [];

    if (expected.length !== selected.size) {
        problems.push(`provenance 记录 ${expected.length} 个文件，当前策略选出 ${selected.size} 个；请先运行不带 --check 的命令刷新`);
    }

    expected.forEach((record) => {
        const file = path.join(targetRoot, record.path);
        if (!fs.existsSync(file)) {
            problems.push(`缺少 vendor 文件：${record.path}`);
            return;
        }
        const actual = sha256(fs.readFileSync(file));
        if (actual !== record.sha256) {
            problems.push(`vendor 文件与 provenance 不一致（若有本地改动请登记到 PATCHES.md 并更新 sha256）：${record.path}`);
        }
    });

    if (problems.length) {
        console.error('Untitled UI vendor verification failed:');
        problems.slice(0, 20).forEach((problem) => console.error(`- ${problem}`));
        process.exit(1);
    }

    console.log(`Untitled UI vendor OK: ${expected.length} files match provenance (revision ${revision.slice(0, 12)}).`);
}

/*
 * 离线校验：不联网，只确认 provenance 记录的每个文件都在本地且哈希一致，
 * 并且 resources/modern/ui/ 下没有 provenance 未记录的源码文件（防止手工塞入来路不明的代码）。
 */
function verifyLocal() {
    const expected = provenance.files || [];
    const problems = [];

    if (!expected.length) {
        fail('PROVENANCE.json 未记录任何 vendor 文件，请先运行不带 --check 的命令');
    }

    const recorded = new Set(expected.map((record) => record.path));

    expected.forEach((record) => {
        const file = path.join(targetRoot, record.path);
        if (!fs.existsSync(file)) {
            problems.push(`缺少 vendor 文件：${record.path}`);
            return;
        }
        const actual = sha256(fs.readFileSync(file));
        if (actual !== record.sha256) {
            problems.push(`vendor 文件与 provenance 不一致（若有本地改动请登记到 PATCHES.md 并更新 sha256）：${record.path}`);
        }
    });

    walkSourceFiles(targetRoot).forEach((relative) => {
        if (!recorded.has(relative)) {
            problems.push(`存在 provenance 未记录的文件：${relative}`);
        }
    });

    if (problems.length) {
        console.error('Untitled UI vendor verification failed:');
        problems.slice(0, 20).forEach((problem) => console.error(`- ${problem}`));
        process.exit(1);
    }

    console.log(`Untitled UI vendor OK: ${expected.length} files match provenance (revision ${revision.slice(0, 12)}).`);
}

function walkSourceFiles(directory) {
    const found = [];
    if (!fs.existsSync(directory)) return found;

    const visit = (current) => {
        fs.readdirSync(current, { withFileTypes: true }).forEach((entry) => {
            const full = path.join(current, entry.name);
            if (entry.isDirectory()) {
                visit(full);
                return;
            }
            if (!allowedExtensions.includes(path.extname(entry.name))) return;
            found.push(path.relative(targetRoot, full).split(path.sep).join('/'));
        });
    };

    visit(directory);
    return found;
}

function sha256(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
}

function fail(message) {
    console.error(message);
    process.exit(1);
}
