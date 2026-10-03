<?php

namespace Dcat\Admin\Console;

use Illuminate\Console\Command;

class ResetPasswordCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'admin:reset-password';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reset password for a specific admin user';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $userModel = config('admin.database.users_model');

        $users = $userModel::all();
        $identifiers = $users->pluck('username')->merge($users->pluck('email'))
            ->filter()->unique()->values()->toArray();

        askForUserName:
        $username = $this->askWithCompletion('Please enter a username who needs to reset his password', $identifiers);

        $matches = $users->filter(function ($user) use ($username) {
            return $user->username == $username || ($user->email !== null && $user->email === $username);
        });

        if ($matches->count() > 1) {
            $this->error('Multiple users match this username or email address. Please enter a unique username or email address.');
            goto askForUserName;
        }

        $user = $matches->first();

        if (is_null($user)) {
            $this->error('The user you entered is not exists');
            goto askForUserName;
        }

        enterPassword:
        $password = $this->secret('Please enter a password');

        if ($password !== $this->secret('Please confirm the password')) {
            $this->error('The passwords entered twice do not match, please re-enter');
            goto enterPassword;
        }

        $user->password = bcrypt($password);

        $user->save();

        $this->info('User password reset successfully.');
    }
}
