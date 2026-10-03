<?php

namespace Tests\Feature;

use Dcat\Admin\Show\Field;
use Dcat\Admin\Support\Context;
use DOMDocument;
use DOMXPath;
use Illuminate\Container\Container;
use Illuminate\Contracts\Routing\UrlGenerator as UrlGeneratorContract;
use Illuminate\Http\Request;
use Illuminate\Filesystem\Filesystem;
use Illuminate\Routing\RouteCollection;
use Illuminate\Routing\UrlGenerator;
use Illuminate\Support\Facades\Facade;
use PHPUnit\Framework\TestCase;

class ShowFileTest extends TestCase
{
    public function testAttachmentNamesDownloadTheSameFileAsTheActionAndEscapeMarkup()
    {
        $previous = Container::getInstance();
        $previousFacade = Facade::getFacadeApplication();
        $container = new Container();
        Container::setInstance($container);
        Facade::setFacadeApplication($container);
        Facade::clearResolvedInstances();
        $container->instance('files', new Filesystem());
        $container->instance('url', new UrlGenerator(new RouteCollection(), Request::create('http://localhost')));
        $container->instance(UrlGeneratorContract::class, $container->make('url'));
        $container->instance('admin.context', new Context());

        try {
            $field = new class('attachments', 'Attachments') extends Field {
                public function attachmentHtml($paths)
                {
                    [$callback] = $this->showAs->first();

                    return $callback($paths);
                }
            };
            $field->file();
            $paths = ['http://localhost/report.pdf', 'http://localhost/<img src=x onerror=alert(1)>"&.txt'];
            $html = $field->attachmentHtml($paths);
            $document = new DOMDocument();
            $document->loadHTML($html);
            $xpath = new DOMXPath($document);
            $this->assertCount(2, $xpath->query('//ul/li'));
            $this->assertCount(0, $xpath->query('//img'));
            $this->assertStringNotContainsString('fa-paperclip', $html);
            foreach ($paths as $index => $path) {
                $links = $xpath->query('//li['.($index + 1).']//a');
                $this->assertCount(2, $links);
                foreach ($links as $link) {
                    $this->assertSame($path, $link->getAttribute('href'));
                    $this->assertTrue($link->hasAttribute('download'));
                }
            }
            $this->assertSame('<img src=x onerror=alert(1)>"&.txt', $xpath->query('//li[2]//a')->item(0)->textContent);
            $this->assertSame('', $field->attachmentHtml([]));
        } finally {
            Facade::clearResolvedInstances();
            Facade::setFacadeApplication($previousFacade);
            Container::setInstance($previous);
        }
    }
}
