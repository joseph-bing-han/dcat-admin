export function installLoadingPlugins($) {
    const overlayClass = 'dcat-modern-compat-loading';

    $.fn.loading = function loading(options) {
        if (options === false) {
            return this.each(function () {
                const $container = $(this);
                $container.children(`.${overlayClass}`).remove();
                if ($container.data('dcatModernLoadingPosition') !== undefined) {
                    this.style.position = $container.data('dcatModernLoadingPosition');
                    $container.removeData('dcatModernLoadingPosition');
                }
            });
        }

        const opts = $.extend({
            background: 'rgba(255,255,255,0.72)',
            color: 'var(--dcat-modern-primary)',
            zIndex: 100,
        }, options || {});

        return this.each(function () {
            const $container = $(this);
            if ($container.children(`.${overlayClass}`).length) return;
            const currentPosition = getComputedStyle(this).position;
            if (currentPosition === 'static') {
                $container.data('dcatModernLoadingPosition', this.style.position || '');
                this.style.position = 'relative';
            }
            $('<div />', {
                class: overlayClass,
                role: 'status',
                'aria-label': 'Loading',
            }).css({
                position: 'absolute',
                inset: 0,
                zIndex: opts.zIndex,
                background: opts.background,
                color: opts.color,
                display: 'grid',
                placeItems: 'center',
                pointerEvents: 'none',
            }).html('<span class="dcat-modern-loading-spinner" aria-hidden="true"></span>').appendTo($container);
        });
    };

    $.fn.buttonLoading = function buttonLoading(start) {
        return this.each(function () {
            const $button = $(this);
            if (start === false) {
                const original = $button.data('dcatModernButtonHtml');
                if (original === undefined) return;
                $button
                    .html(original)
                    .removeData('dcatModernButtonHtml');
                const state = $button.data('dcatModernButtonState');
                this.classList.toggle('disabled', state.disabledClass);
                this.classList.toggle('btn-loading', state.loadingClass);
                for (const [attribute, value] of Object.entries(state.attributes)) {
                    if (value === null) this.removeAttribute(attribute);
                    else this.setAttribute(attribute, value);
                }
                this.style.minWidth = state.minWidth;
                $button.removeData('dcatModernButtonState');
                return;
            }
            if ($button.data('dcatModernButtonHtml') !== undefined) return;
            $button.data('dcatModernButtonHtml', $button.html());
            $button.data('dcatModernButtonState', {
                disabledClass: this.classList.contains('disabled'),
                loadingClass: this.classList.contains('btn-loading'),
                minWidth: this.style.minWidth,
                attributes: Object.fromEntries(['disabled', 'aria-disabled', 'aria-busy', 'aria-label'].map((name) => [name, this.getAttribute(name)])),
            });
            this.style.minWidth = `${this.getBoundingClientRect().width}px`;
            $button
                .addClass('disabled btn-loading')
                .attr('disabled', true)
                .attr('aria-disabled', 'true')
                .attr('aria-busy', 'true')
                .attr('aria-label', 'Loading')
                .html('<span class="dcat-modern-loading-spinner" aria-hidden="true"></span>');
        });
    };
}

// 顶部进度条与全屏加载相互独立，结束时清理定时器和节点。
export function createProgress() {
    let progress = null;
    let timer = null;
    let value = 0;
    const api = {
        start() {
            if (progress?.isConnected) return api;
            progress = document.createElement('div');
            progress.className = 'dcat-modern-progress';
            progress.setAttribute('role', 'progressbar');
            progress.setAttribute('aria-label', 'Loading');
            progress.innerHTML = '<span></span>';
            document.body.appendChild(progress);
            value = 10;
            progress.firstElementChild.style.width = `${value}%`;
            timer = window.setInterval(() => {
                value += (95 - value) / 10;
                progress.firstElementChild.style.width = `${value}%`;
            }, 200);
            return api;
        },
        done() {
            window.clearInterval(timer);
            timer = null;
            progress?.remove();
            progress = null;
            return api;
        },
        configure() { return api; },
    };
    document.addEventListener('dcat:pjax:before-replace', api.done);
    return api;
}
