<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

#[Signature('sdm:create-user')]
#[Description('Create the single admin user for Peta SDM interactively')]
class CreateUserCommand extends Command
{
    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->ask('Enter email address:');
        while (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error('Invalid email address.');
            $email = $this->ask('Enter email address:');
        }

        $password = $this->secret('Enter password (minimum 12 characters):');
        while (strlen($password) < 12) {
            $this->error('Password must be at least 12 characters long.');
            $password = $this->secret('Enter password (minimum 12 characters):');
        }

        $user = User::firstOrCreate(
            ['email' => $email],
            ['name' => 'Admin', 'password' => Hash::make($password)]
        );

        if (! $user->wasRecentlyCreated) {
            $user->update(['password' => Hash::make($password)]);
            $this->info("User {$email} already exists. Password updated.");
        } else {
            $this->info("User {$email} created successfully.");
        }
    }
}
