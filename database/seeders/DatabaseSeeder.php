<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            AdminUserSeeder::class,
        ]);

        DB::table('users')->insert([
            'name'                  => 'Regular User',
            'email'                 => 'user@gmail.com',
            'email_verified_at'     => now(),
            'password'              => Hash::make('user@123'),
            'role'                  => 'user',
            'created_at'            => now(),
            'updated_at'            => now(),
        ]);
    }
}
