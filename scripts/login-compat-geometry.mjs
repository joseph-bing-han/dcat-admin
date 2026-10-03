// 可在真实消费页面和 facade fixture 中复用，不读取或提交表单值。
export function loginCompatGeometry() {
    const root = document.querySelector('.login-page');
    const brand = root.querySelector('.login-logo');
    const brandItems = [...brand.children].filter((item) => item.getBoundingClientRect().width > 0);
    const brandRects = brandItems.map((item) => item.getBoundingClientRect());
    const fields = [...root.querySelectorAll('.form-label-group')].map((group) => {
        const input = group.querySelector('.form-control');
        const icon = group.querySelector('.form-control-position');
        const label = group.querySelector('label');
        const box = input.getBoundingClientRect();
        const glyph = icon.getBoundingClientRect();
        return {
            iconInside: glyph.left >= box.left && glyph.right <= box.right
                && glyph.top >= box.top && glyph.bottom <= box.bottom + 1,
            textClearsIcon: parseFloat(getComputedStyle(input).paddingLeft) >= glyph.width,
            labelCorrect: input.matches(':placeholder-shown')
                ? getComputedStyle(label).opacity === '0'
                : getComputedStyle(label).opacity === '1' && label.getBoundingClientRect().bottom <= box.top,
        };
    });
    const buttons = [...root.querySelectorAll('.login-btn')].map((item) => item.getBoundingClientRect());
    return {
        fields,
        brandSingleRow: brandRects.every((box) => box.top < brandRects[0].bottom && box.bottom > brandRects[0].top),
        buttonsSingleRow: buttons.every((box) => Math.abs(box.top - buttons[0].top) < 2),
        noHorizontalOverflow: document.documentElement.scrollWidth <= innerWidth,
    };
}
