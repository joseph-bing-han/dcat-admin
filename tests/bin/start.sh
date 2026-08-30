#!/usr/bin/env bash

set -euo pipefail

cd ./laravel-tests
export DISPLAY=:99.0
#sudo Xvfb :99.0 &
if [ -d ./vendor/laravel/dusk/bin ]; then
    sudo chmod -R 0755 ./vendor/laravel/dusk/bin/
fi
php artisan serve --port=8300 > /dev/null 2>&1 &
