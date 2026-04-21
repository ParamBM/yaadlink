<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('users')->insert([
            'name'                  => 'Admin',
            'email'                 => 'admin@gmail.com',
            'email_verified_at'     => now(),
            'password'              => Hash::make('admin@123'),
            'role'                  => 'admin',
            'created_at'            => now(),
            'updated_at'            => now(),
        ]);
    }
}
