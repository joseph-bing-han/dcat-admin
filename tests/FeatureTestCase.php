<?php

namespace Tests;

use Dcat\Admin\Models\Administrator;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class FeatureTestCase extends BaseTestCase
{
    use CreatesApplication, InteractsWithDatabase;

    /**
     * @var Administrator|null
     */
    protected $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->boot();
    }

    protected function tearDown(): void
    {
        $this->destory();

        parent::tearDown();
    }
}
