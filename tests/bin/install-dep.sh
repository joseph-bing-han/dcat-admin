#!/usr/bin/env bash

set -euo pipefail

cp -f ./tests/resources/stubs/artisan ./laravel-tests/
cp -f ./tests/resources/stubs/ComposerConfigCommand.php ./laravel-tests/app/
mkdir ./laravel-tests/dcat-admin
cp -rf ./config ./laravel-tests/dcat-admin
cp -rf ./database ./laravel-tests/dcat-admin
cp -rf ./resources ./laravel-tests/dcat-admin
cp -rf ./src ./laravel-tests/dcat-admin
cp -rf ./tests ./laravel-tests/dcat-admin
cp -rf ./composer.json ./laravel-tests/dcat-admin
rm -rf ./laravel-tests/tests
cp -rf ./tests ./laravel-tests/tests
cp -f ./phpunit.dusk.xml ./laravel-tests
cp -f ./.env.testing ./laravel-tests/.env
cd ./laravel-tests
php artisan admin:composer-config

LOCAL_PACKAGE_NAME="$(php -r '$composer = json_decode(file_get_contents("./dcat-admin/composer.json"), true); if (empty($composer["name"])) { fwrite(STDERR, "Missing package name in ./dcat-admin/composer.json\n"); exit(1); } echo $composer["name"];')"

composer require "${LOCAL_PACKAGE_NAME}:*@dev" --with-all-dependencies --no-interaction

LOCAL_PACKAGE_NAME="${LOCAL_PACKAGE_NAME}" php -r 'require "vendor/autoload.php"; $name = getenv("LOCAL_PACKAGE_NAME"); $installed = realpath(Composer\InstalledVersions::getInstallPath($name)); $expected = realpath("./dcat-admin"); if ($installed !== $expected) { fwrite(STDERR, "Expected local package at {$expected}, installed {$name} from {$installed}\n"); exit(1); } echo "Verified local package: {$name} => {$installed}\n";'

if [ "${DCAT_INSTALL_DUSK:-0}" = "1" ]; then
    if [ -z "${DCAT_DUSK_CONSTRAINT:-}" ]; then
        echo "DCAT_DUSK_CONSTRAINT is required when DCAT_INSTALL_DUSK=1" >&2
        exit 1
    fi

    composer require "laravel/dusk:${DCAT_DUSK_CONSTRAINT}" --dev
fi
