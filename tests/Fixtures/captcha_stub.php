<?php

namespace Mews\Captcha {
    if (! class_exists(Captcha::class, false)) {
        class Captcha
        {
        }
    }
}

namespace {
    if (! function_exists('captcha_src')) {
        function captcha_src()
        {
            return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="120" height="30"%3E%3Crect width="120" height="30" fill="%23eee"/%3E%3Ctext x="8" y="20" font-size="14"%3Efixture-captcha%3C/text%3E%3C/svg%3E';
        }
    }
}
