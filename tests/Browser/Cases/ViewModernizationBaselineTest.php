<?php

namespace Tests\Browser\Cases;

use Tests\Browser;
use Tests\TestCase;

/**
 * M0 runtime contract harness for the View modernization baseline.
 *
 * @group view-modernization
 */
class ViewModernizationBaselineTest extends TestCase
{
    public function testFrozenLayoutProfilesAcrossAllViewports()
    {
        $contract = $this->contract();
        $measurements = [];

        $this->browse(function (Browser $browser) use ($contract, &$measurements) {
            foreach ($contract['viewports'] as $viewport) {
                foreach ($contract['domProfiles'] as $profile) {
                    $browser
                        ->resize($viewport['width'], $viewport['height'])
                        ->visit(admin_base_path($profile['fixtureRoute']))
                        ->pause(150);

                    foreach ($profile['requiredSelectors'] as $selector) {
                        $browser->assertPresent($selector);
                        $this->assertCount(
                            1,
                            $browser->elements($selector),
                            sprintf('%s must be unique for %s at %sx%s', $selector, $profile['id'], $viewport['width'], $viewport['height'])
                        );
                    }

                    foreach ($profile['forbiddenSelectors'] as $selector) {
                        $browser->assertNotPresent($selector);
                    }

                    $browser->assertPresent('[data-m0-view-baseline="content"]');

                    $geometry = $browser->script(sprintf(
                        'return {viewport:{width:window.innerWidth,height:window.innerHeight},document:{clientWidth:document.documentElement.clientWidth,clientHeight:document.documentElement.clientHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight},anchors:%s.reduce(function(result, selector){var nodes=Array.prototype.slice.call(document.querySelectorAll(selector));result[selector]=nodes.map(function(node){var rect=node.getBoundingClientRect();return {x:rect.x,y:rect.y,width:rect.width,height:rect.height,display:window.getComputedStyle(node).display,position:window.getComputedStyle(node).position};});return result;}, {})};',
                        json_encode($profile['requiredSelectors'])
                    ));

                    $measurements[] = [
                        'profile' => $profile['id'],
                        'requestedViewport' => $viewport,
                        'geometry' => $geometry[0] ?? null,
                    ];

                    if (getenv($contract['runtimeCapture']['screenshotOptInEnv']) === '1') {
                        $browser->screenshot(sprintf(
                            'm0-%s-%sx%s',
                            $profile['id'],
                            $viewport['width'],
                            $viewport['height']
                        ));
                    }
                }
            }
        });

        if ($output = getenv($contract['runtimeCapture']['geometryOutputEnv'])) {
            file_put_contents($output, json_encode($measurements, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        }
    }

    public function testGridAndFormStableSelectorsRemainPresent()
    {
        $this->browse(function (Browser $browser) {
            $browser
                ->visit(admin_base_path('/tests/view-baseline/grid'))
                ->pause(150)
                ->assertPresent('form.grid-filter-form[pjax-container]')
                ->assertPresent('form.quick-search-form[pjax-container]');

            $browser
                ->visit(admin_base_path('/tests/view-baseline/form'))
                ->pause(150)
                ->assertPresent('form[data-toggle="validator"]')
                ->assertAttribute('form[data-toggle="validator"]', 'enctype', 'multipart/form-data')
                ->assertPresent('input[name="username"]')
                ->assertPresent('input[name="email"]')
                ->assertPresent('input[name="password"]')
                ->assertPresent('input[name="password_confirmation"]')
                ->assertPresent('input[name="profile[first_name]"]')
                ->assertPresent('input[name="profile[last_name]"]')
                ->assertPresent('input[name="profile[postcode]"]');
        });
    }

    public function testModernLayoutKeepsFrozenStableAnchorsInPlace()
    {
        $this->browse(function (Browser $browser) {
            $browser
                ->visit(admin_base_path('/tests/view-baseline/modern-vertical'))
                ->pause(300)
                ->assertPresent('.main-menu[data-dcat-react-component="layout.navigation"]')
                ->assertPresent('nav.header-navbar[data-dcat-react-component="layout.navbar"]')
                ->assertPresent('footer.main-footer[data-dcat-react-component="layout.footer"]');

            $vertical = $browser->script(<<<'JS'
return {
    menuContentParent: document.querySelector('.main-menu-content').parentElement.classList.contains('main-menu'),
    sidebarParent: document.querySelector('.main-sidebar').parentElement.classList.contains('main-menu-content'),
    navbarParent: document.querySelector('nav.header-navbar').parentElement.classList.contains('wrapper'),
    footerParent: document.querySelector('footer.main-footer').parentElement === document.body,
    navbarStructurallyReplaced: Boolean(document.querySelector('nav.header-navbar > .dcat-modern-react-view')),
    footerStructurallyReplaced: Boolean(document.querySelector('footer.main-footer > .dcat-modern-react-view')),
};
JS
            )[0];

            $this->assertTrue($vertical['menuContentParent']);
            $this->assertTrue($vertical['sidebarParent']);
            $this->assertTrue($vertical['navbarParent']);
            $this->assertTrue($vertical['footerParent']);
            $this->assertFalse($vertical['navbarStructurallyReplaced']);
            $this->assertFalse($vertical['footerStructurallyReplaced']);

            $browser
                ->visit(admin_base_path('/tests/view-baseline/modern-horizontal'))
                ->pause(300)
                ->assertPresent('.header-navbar.navbar-horizontal[data-dcat-react-component="layout.navigation"]');

            $horizontal = $browser->script(<<<'JS'
return {
    horizontalParent: document.querySelector('.header-navbar.navbar-horizontal').parentElement.classList.contains('wrapper'),
    menuContentParent: document.querySelector('.main-menu-content').parentElement.classList.contains('navbar-horizontal'),
    horizontalSidebarParent: document.querySelector('.main-horizontal-sidebar').parentElement.classList.contains('main-menu-content'),
};
JS
            )[0];
            $this->assertTrue($horizontal['horizontalParent']);
            $this->assertTrue($horizontal['menuContentParent']);
            $this->assertTrue($horizontal['horizontalSidebarParent']);

            $browser
                ->visit(admin_base_path('/tests/view-baseline/modern-full-page'))
                ->pause(300)
                ->assertPresent('body[data-dcat-react-component="layout.full-page"]')
                ->assertPresent('.app-content.content');

            $fullPage = $browser->script(<<<'JS'
return {
    appContentParent: document.querySelector('.app-content.content').parentElement === document.body,
    wrapperParent: document.querySelector('.app-content.content > .wrapper') !== null,
    structurallyReplaced: Boolean(document.querySelector('body > .dcat-modern-react-view')),
};
JS
            )[0];
            $this->assertTrue($fullPage['appContentParent']);
            $this->assertTrue($fullPage['wrapperParent']);
            $this->assertFalse($fullPage['structurallyReplaced']);
        });
    }

    public function testPjaxHeadersAndFragmentLifecycleRemainPresent()
    {
        $this->browse(function (Browser $browser) {
            $browser
                ->visit(admin_base_path('/tests/view-baseline/grid'))
                ->pause(150);

            $browser->script(<<<'JS'
window.__m0PjaxHeaders = [];
window.__m0OriginalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
    window.__m0PjaxHeaders.push([name, value]);
    return window.__m0OriginalSetRequestHeader.apply(this, arguments);
};
$.pjax({url: window.location.href, container: Dcat.config.pjax_container_selector});
JS
            );

            $browser
                ->pause(300)
                ->assertPresent('.content-body#app');

            $result = $browser->script('return window.__m0PjaxHeaders;');
            $headers = [];

            foreach (($result[0] ?? []) as $pair) {
                $headers[strtolower($pair[0])] = $pair[1];
            }

            $this->assertSame('true', $headers['x-pjax'] ?? null);
            $this->assertSame('#pjax-container', $headers['x-pjax-container'] ?? null);
            $this->assertCount(1, $browser->elements('.content-body#app'));
        });
    }

    protected function contract(): array
    {
        $path = dirname(__DIR__, 3).'/codestable/epics/001-o-view-layer-modernization/m0/legacy-contracts.json';
        $contract = json_decode(file_get_contents($path), true);

        $this->assertIsArray($contract);
        $this->assertSame(1, $contract['schemaVersion']);

        return $contract;
    }
}

