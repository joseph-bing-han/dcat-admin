<?php

namespace Tests\Feature;

use Dcat\Admin\Console\ResetPasswordCommand;
use Illuminate\Config\Repository;
use Illuminate\Container\Container;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Application;
use Illuminate\Hashing\HashManager;
use Illuminate\Support\Collection;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Console\Tester\CommandTester;

class ResetPasswordCommandTest extends TestCase
{
    protected $previousContainer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->previousContainer = Container::getInstance();
        $container = new Application();
        Container::setInstance($container);
        $container->instance('config', new Repository([
            'admin' => ['database' => ['users_model' => ResetPasswordUser::class]],
            'hashing' => ['driver' => 'bcrypt', 'bcrypt' => ['rounds' => 4]],
        ]));
        $container->instance('hash', new HashManager($container));
    }

    protected function tearDown(): void
    {
        ResetPasswordUser::$users = null;
        Container::setInstance($this->previousContainer);

        parent::tearDown();
    }

    /** @dataProvider usernames */
    public function testResetsPasswordWithRealConsoleInput(array $attributes, string $identifier)
    {
        $user = $this->user($attributes, true);
        ResetPasswordUser::$users = new Collection([$user]);

        $command = new ResetPasswordCommand();
        $command->setLaravel(Container::getInstance());
        $tester = new CommandTester($command);
        $tester->setInputs([$identifier, 'new-password', 'new-password']);

        $this->assertSame(0, $tester->execute([]));
        $this->assertStringContainsString('Please enter a username who needs to reset his password', $tester->getDisplay());
        $this->assertStringContainsString('User password reset successfully.', $tester->getDisplay());
        $this->assertTrue(password_verify('new-password', $user->password));
    }

    public static function usernames(): array
    {
        return [
            'standard username' => [['username' => 'admin'], 'admin'],
            'email stored as username' => [['username' => 'info@paytax.nz'], 'info@paytax.nz'],
            'email with plus sign' => [['username' => 'admin+tax@example.co.nz'], 'admin+tax@example.co.nz'],
            'separate email field' => [['username' => 'admin', 'email' => 'info@paytax.nz'], 'info@paytax.nz'],
            'both fields match' => [['username' => 'info@paytax.nz', 'email' => 'info@paytax.nz'], 'info@paytax.nz'],
        ];
    }

    public function testUnknownAndAmbiguousInputPromptAgain()
    {
        $user = $this->user(['username' => 'admin', 'email' => 'info@paytax.nz'], true);
        $other = $this->user(['username' => 'info@paytax.nz'], false);
        ResetPasswordUser::$users = new Collection([$user, $other]);

        $command = new ResetPasswordCommand();
        $command->setLaravel(Container::getInstance());
        $tester = new CommandTester($command);
        $tester->setInputs(['missing', 'info@paytax.nz', 'admin', 'new-password', 'new-password']);

        $this->assertSame(0, $tester->execute([]));
        $this->assertStringContainsString('The user you entered is not exists', $tester->getDisplay());
        $this->assertStringContainsString('Multiple users match', $tester->getDisplay());
        $this->assertTrue(password_verify('new-password', $user->password));
    }

    protected function user(array $attributes, bool $saved)
    {
        $user = $this->getMockBuilder(Model::class)->onlyMethods(['save'])->getMock();
        $user->setRawAttributes($attributes);
        $user->expects($saved ? $this->once() : $this->never())->method('save')->willReturn(true);

        return $user;
    }
}

class ResetPasswordUser extends Model
{
    public static $users;

    public static function all($columns = ['*'])
    {
        return static::$users;
    }
}
