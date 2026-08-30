#!/usr/bin/env bash

set -euo pipefail

cd ./laravel-tests
php artisan admin:publish --force
php artisan admin:install
if [ "${DCAT_INSTALL_DUSK:-1}" = "1" ]; then
    php artisan migrate:rollback
fi
if [ "${DCAT_INSTALL_DUSK:-0}" = "1" ]; then
    if ! php artisan dusk:chrome-driver --detect; then
        CHROME_MAJOR="$(google-chrome --version | grep -oE '[0-9]+' | head -n 1)"
        php artisan dusk:chrome-driver "${CHROME_MAJOR}"
    fi
fi
cp -f ./tests/routes.php ./app/Admin/
cp -rf ./tests/resources/config ./config/
