<?php

namespace Tests\Feature;

use Dcat\Admin\Layout\Asset;
use Dcat\Admin\Modern\Manager;
use Dcat\Admin\Modern\Manifest;
use Illuminate\Config\Repository;
use Illuminate\Console\Application as Artisan;
use Illuminate\Container\Container;
use Illuminate\Filesystem\Filesystem;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Console\VendorPublishCommand;
use Illuminate\Support\ServiceProvider;
use PHPUnit\Framework\TestCase;

class LegacyFacadePublishTest extends TestCase
{
    /**
     * @runInSeparateProcess
     * @preserveGlobalState disabled
     */
    public function testGeneratedFacadesPublishThroughTheCoreAssetsTag()
    {
        $root = dirname(__DIR__, 2);
        if (! is_file($root.'/scripts/view-modernization-legacy-assets.js')) {
            $root = dirname($root);
        }
        $this->assertFileExists($root.'/scripts/view-modernization-legacy-assets.js');
        $registry = json_decode((string) file_get_contents($root.'/resources/modern/legacy-assets.json'), true);

        $this->assertIsArray($registry);
        $this->assertCount(3, $registry['javascript']);
        $this->assertCount(10, $registry['stylesheets']);

        $assets = array_merge($registry['javascript'], $registry['stylesheets']);
        $this->assertCount(13, array_unique($assets));

        $base = sys_get_temp_dir().'/dcat-legacy-facade-publish-'.bin2hex(random_bytes(6));
        $packageRoot = $base.'/package';
        $stagedDist = $packageRoot.'/resources/dist';
        $consumerRoot = $base.'/consumer';
        $publicRoot = $consumerRoot.'/public';
        $marker = "/*! Dcat-owned legacy asset facade. No Bootstrap or AdminLTE implementation. */\n";
        $previousContainer = Container::getInstance();
        $previousPublishRegistry = $this->publishRegistry();

        try {
            $this->copyDirectory($root.'/resources/dist', $stagedDist);
            $this->makeDirectory($packageRoot.'/src');
            $this->makeDirectory($publicRoot);

            $providerSource = $root.'/src/AdminServiceProvider.php';
            $stagedProvider = $packageRoot.'/src/AdminServiceProvider.php';
            $this->assertTrue(copy($providerSource, $stagedProvider));
            $this->assertSame(hash_file('sha256', $providerSource), hash_file('sha256', $stagedProvider));

            $originalHashes = [
                'resources/dist' => $this->hashDirectory($root.'/resources/dist'),
            ];

            [$exitCode, $output] = $this->runNode(
                $root,
                $root.'/scripts/view-modernization-legacy-assets.js',
                '--out-dir='.$stagedDist
            );
            $this->assertSame(0, $exitCode, $output);

            [$exitCode, $output] = $this->runNode(
                $root,
                $root.'/scripts/view-modernization-legacy-assets.js',
                '--out-dir='.$stagedDist,
                '--check'
            );
            $this->assertSame(0, $exitCode, $output);

            $stagedHashes = $this->hashDirectory($stagedDist);
            foreach ($assets as $asset) {
                $candidate = $stagedDist.'/'.$asset;
                $this->assertFileExists($candidate, $asset);
                $this->assertStringStartsWith($marker, (string) file_get_contents($candidate), $asset);
            }

            require $stagedProvider;
            $app = new Application($consumerRoot);
            $app->instance('path.public', $publicRoot);
            $app->instance('config', new Repository([
                'admin' => [
                    'modern' => [],
                ],
            ]));
            $app->instance('admin.asset', new Asset());
            $app->instance('admin.modern', new Manager(new Manifest()));
            Container::setInstance($app);

            $providerClass = 'Dcat\\Admin\\AdminServiceProvider';
            $provider = new $providerClass($app);
            $registerPublishing = new \ReflectionMethod($provider, 'registerPublishing');
            $registerPublishing->setAccessible(true);
            $registerPublishing->invoke($provider);

            $expectedDestination = $publicRoot.'/vendor/dcat-admin';
            $publishPaths = ServiceProvider::pathsToPublish($providerClass, 'dcat-admin-assets');
            $this->assertCount(1, $publishPaths);
            $registeredSource = array_key_first($publishPaths);
            $this->assertSame(realpath($stagedDist), realpath($registeredSource));
            $this->assertSame($expectedDestination, reset($publishPaths));

            $artisan = new Artisan($app, $app->make('events'), Application::VERSION);
            $artisan->add(new VendorPublishCommand(new Filesystem()));
            $publishExitCode = $artisan->call('vendor:publish', [
                '--tag' => ['dcat-admin-assets'],
                '--force' => true,
            ]);
            $this->assertSame(0, $publishExitCode, $artisan->output());

            foreach ($assets as $asset) {
                $candidate = $stagedDist.'/'.$asset;
                $published = $expectedDestination.'/'.$asset;
                $this->assertFileExists($published, $asset);
                $this->assertSame(hash_file('sha256', $candidate), hash_file('sha256', $published), $asset);
                $this->assertStringStartsWith($marker, (string) file_get_contents($published), $asset);
            }

            $this->assertModernManifestsPublished($stagedDist, $expectedDestination);
            foreach ([
                'modern-compat/assets/dcat-fallback.js',
                'modern-compat/assets/dcat-fallback.css',
            ] as $asset) {
                $candidate = $stagedDist.'/'.$asset;
                $published = $expectedDestination.'/'.$asset;
                $this->assertFileExists($candidate, $asset);
                $this->assertFileExists($published, $asset);
                $this->assertSame(hash_file('sha256', $candidate), hash_file('sha256', $published), $asset);
            }

            $modernManifest = json_decode((string) file_get_contents($stagedDist.'/modern/manifest.json'), true);
            $this->assertIsArray($modernManifest);
            $javascriptEntry = Manifest::ENTRY;
            $this->assertArrayHasKey($javascriptEntry, $modernManifest);
            $javascriptReference = $modernManifest[$javascriptEntry]['file'] ?? null;
            $this->assertIsString($javascriptReference);
            $this->assertNotSame('', $javascriptReference);
            $this->assertSame('.js', substr($javascriptReference, -3));

            $publicModernManifest = $expectedDestination.'/modern/manifest.json';
            $damagedManifest = $modernManifest;
            $damagedManifest[$javascriptEntry]['file'] = 'assets/dcat-modern-stale.js';
            $encodedManifest = json_encode($damagedManifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
            $this->assertIsString($encodedManifest);
            $this->assertNotFalse(file_put_contents($publicModernManifest, $encodedManifest));

            $missingJavascript = $expectedDestination.'/modern/'.$javascriptReference;
            $this->assertFileExists($missingJavascript);
            $this->assertTrue(unlink($missingJavascript));

            $this->assertNotSame(
                hash_file('sha256', $stagedDist.'/modern/manifest.json'),
                hash_file('sha256', $publicModernManifest),
                'The staging status check should detect the stale published manifest.'
            );
            $this->assertFalse(is_file($missingJavascript), 'The staging status check should detect the missing hashed JavaScript.');

            $repairExitCode = $artisan->call('vendor:publish', [
                '--tag' => ['dcat-admin-assets'],
                '--force' => true,
            ]);
            $this->assertSame(0, $repairExitCode, $artisan->output());
            $this->assertModernManifestsPublished($stagedDist, $expectedDestination);
            $this->assertFileExists($missingJavascript);
            $this->assertSame(
                hash_file('sha256', $stagedDist.'/modern/manifest.json'),
                hash_file('sha256', $publicModernManifest)
            );

            $this->assertSame($stagedHashes, $this->hashDirectory($stagedDist));
            $this->assertSame($originalHashes['resources/dist'], $this->hashDirectory($root.'/resources/dist'));
        } finally {
            $this->restorePublishRegistry($previousPublishRegistry);
            Container::setInstance($previousContainer);
            $this->removeDirectory($base);
        }
    }

    protected function runNode($root, $script, ...$arguments)
    {
        $command = array_merge(['node', $script], $arguments);
        $process = proc_open($command, [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes, $root);

        if (! is_resource($process)) {
            return [1, 'Unable to start Node.js process.'];
        }

        $stdout = stream_get_contents($pipes[1]);
        $stderr = stream_get_contents($pipes[2]);
        fclose($pipes[1]);
        fclose($pipes[2]);

        return [proc_close($process), $stdout.$stderr];
    }

    protected function copyDirectory($source, $destination)
    {
        $this->makeDirectory($destination);
        $items = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($source, \FilesystemIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::SELF_FIRST
        );

        foreach ($items as $item) {
            $target = $destination.'/'.substr($item->getPathname(), strlen($source) + 1);
            if ($item->isDir()) {
                $this->makeDirectory($target);
            } elseif ($item->isFile()) {
                $this->makeDirectory(dirname($target));
                if (! copy($item->getPathname(), $target)) {
                    throw new \RuntimeException('Unable to stage '.$item->getPathname());
                }
            }
        }
    }

    protected function makeDirectory($path)
    {
        if (! is_dir($path) && ! mkdir($path, 0777, true) && ! is_dir($path)) {
            throw new \RuntimeException('Unable to create '.$path);
        }
    }

    protected function hashDirectory($directory)
    {
        $hashes = [];
        $items = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($directory, \FilesystemIterator::SKIP_DOTS)
        );

        foreach ($items as $item) {
            if ($item->isFile()) {
                $relative = substr($item->getPathname(), strlen($directory) + 1);
                $hashes[$relative] = hash_file('sha256', $item->getPathname());
            }
        }
        ksort($hashes);

        return $hashes;
    }

    protected function assertModernManifestsPublished($stagedDist, $publishedDist)
    {
        foreach ([
            'modern' => Manifest::ENTRY,
            'modern-compat' => 'resources/modern/compat.js',
        ] as $directory => $entryName) {
            $manifest = $directory.'/manifest.json';
            $stagedManifest = $stagedDist.'/'.$manifest;
            $publishedManifest = $publishedDist.'/'.$manifest;
            $this->assertFileExists($stagedManifest);
            $this->assertFileExists($publishedManifest);
            $this->assertSame(hash_file('sha256', $stagedManifest), hash_file('sha256', $publishedManifest), $manifest);

            $entries = json_decode((string) file_get_contents($stagedManifest), true);
            $this->assertIsArray($entries, $manifest);
            $this->assertNotEmpty($entries, $manifest);
            $this->assertArrayHasKey($entryName, $entries, $manifest);
            $entry = $entries[$entryName];
            $this->assertTrue($entry['isEntry'] ?? false, $manifest.' entry marker');
            $entryFile = $entry['file'] ?? null;
            $this->assertIsString($entryFile, $manifest.' entry JavaScript');
            $this->assertNotSame('', $entryFile, $manifest.' entry JavaScript');
            $this->assertSame('.js', substr($entryFile, -3), $manifest.' entry JavaScript');
            foreach ($entries as $entryName => $entry) {
                $this->assertIsArray($entry, $entryName);
                $references = [];
                if (array_key_exists('file', $entry)) {
                    $references[] = $entry['file'];
                }
                if (array_key_exists('css', $entry)) {
                    $this->assertIsArray($entry['css'], $entryName.' css');
                    $references = array_merge($references, $entry['css']);
                }

                foreach ($references as $reference) {
                    $this->assertIsString($reference, $entryName.' reference');
                    $reference = str_replace('\\', '/', $reference);
                    $this->assertNotSame('', $reference, $entryName.' reference');
                    $this->assertSame(0, preg_match('#^(?:/|[a-zA-Z]:)#', $reference), $entryName.' absolute reference');
                    $this->assertSame(0, preg_match('#(?:^|/)\.\.(?:/|$)#', $reference), $entryName.' traversal reference');
                    $this->assertFalse(strpos($reference, "\0") !== false, $entryName.' null byte reference');

                    $relativeAsset = $directory.'/'.$reference;
                    $stagedAsset = $stagedDist.'/'.$relativeAsset;
                    $publishedAsset = $publishedDist.'/'.$relativeAsset;
                    $this->assertFileExists($stagedAsset, $relativeAsset);
                    $this->assertFileExists($publishedAsset, $relativeAsset);
                    $this->assertSame(hash_file('sha256', $stagedAsset), hash_file('sha256', $publishedAsset), $relativeAsset);
                }
            }
        }
    }

    protected function publishRegistry()
    {
        $reflection = new \ReflectionClass(ServiceProvider::class);
        $registry = [];

        foreach (['publishes', 'publishGroups'] as $name) {
            $property = $reflection->getProperty($name);
            $property->setAccessible(true);
            $registry[$name] = $property->getValue();
        }

        return $registry;
    }

    protected function restorePublishRegistry(array $registry)
    {
        $reflection = new \ReflectionClass(ServiceProvider::class);

        foreach ($registry as $name => $value) {
            $property = $reflection->getProperty($name);
            $property->setAccessible(true);
            $property->setValue(null, $value);
        }
    }

    protected function removeDirectory($path)
    {
        if (! is_dir($path)) {
            return;
        }

        $items = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($path, \FilesystemIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::CHILD_FIRST
        );

        foreach ($items as $item) {
            if ($item->isLink() || ! $item->isDir()) {
                unlink($item->getPathname());
            } else {
                rmdir($item->getPathname());
            }
        }

        rmdir($path);
    }
}
