<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use App\Services\UserActivityLogger;

class SocialAuthController extends Controller
{
    private const USER_TYPE = 'App\\Models\\User';

    private function isInactiveStatus($status): bool
    {
        if ($status === null || $status === '') {
            return false;
        }

        if (is_bool($status)) {
            return $status === false;
        }

        if (is_int($status) || is_float($status)) {
            return ((int) $status) === 0;
        }

        $normalized = strtolower(trim((string) $status));
        return in_array($normalized, ['0', 'false', 'inactive', 'disabled'], true);
    }

    private function generateUniqueSlug(string $name): string
    {
        $base = Str::slug($name);
        if ($base === '') {
            $base = 'google-user';
        }

        $slug = $base;
        $count = 1;

        while (DB::table('users')->where('slug', $slug)->exists()) {
            $slug = $base . '-' . $count;
            $count++;
        }

        return $slug;
    }

    public function redirect()
    {
        return Socialite::driver('google')->stateless()->redirect();
    }

    public function callback(Request $request)
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
            
            // Find user by Google ID or Email
            $user = DB::table('users')->where('google_id', $googleUser->getId())->first();

            if (!$user) {
                // Check if user exists with the same email
                $user = DB::table('users')->where('email', $googleUser->getEmail())->first();

                if ($user) {
                    // Update existing user with Google ID
                    DB::table('users')->where('id', $user->id)->update([
                        'google_id' => $googleUser->getId(),
                        'updated_at' => Carbon::now(),
                    ]);
                } else {
                    // Create new user
                    $insert = [
                        'name' => $googleUser->getName() ?? 'Google User',
                        'email' => $googleUser->getEmail(),
                        'password' => Hash::make(Str::random(24)), // Generate random secure password
                        'google_id' => $googleUser->getId(),
                        'role' => 'user',
                        'created_at' => Carbon::now(),
                        'updated_at' => Carbon::now(),
                    ];

                    if (\Illuminate\Support\Facades\Schema::hasColumn('users', 'uuid')) {
                        $insert['uuid'] = (string) Str::uuid();
                    }
                    if (\Illuminate\Support\Facades\Schema::hasColumn('users', 'slug')) {
                        $insert['slug'] = $this->generateUniqueSlug($googleUser->getName() ?? $googleUser->getEmail() ?? 'Google User');
                    }
                    if (\Illuminate\Support\Facades\Schema::hasColumn('users', 'role_short_form')) {
                        $insert['role_short_form'] = 'USR';
                    }
                    if (\Illuminate\Support\Facades\Schema::hasColumn('users', 'status')) {
                        $insert['status'] = 'active';
                    }

                    $userId = DB::table('users')->insertGetId($insert);

                    $user = DB::table('users')->where('id', $userId)->first();

                    UserActivityLogger::log(
                        $request,
                        'register',
                        'auth',
                        'users',
                        (int) $userId,
                        null,
                        null,
                        ['email' => $user->email, 'method' => 'google'],
                        'User registered via Google OAuth',
                        ['id' => (int) $userId, 'role' => 'user']
                    );
                }
            }

            $isInactive = (isset($user->status) && $this->isInactiveStatus($user->status))
                || (!isset($user->status) && isset($user->deleted_at) && $user->deleted_at !== null);

            if ($isInactive) {
                return redirect('/login?error=Account is not active');
            }

            // Create Sanctum Token
            $now = Carbon::now();
            $plainToken = Str::random(80);
            $hashedToken = hash('sha256', $plainToken);

            DB::table('personal_access_tokens')->insert([
                'tokenable_type' => self::USER_TYPE,
                'tokenable_id'   => $user->id,
                'name'           => 'msit-api-google',
                'token'          => $hashedToken,
                'abilities'      => json_encode(['*']),
                'last_used_at'   => null,
                'created_at'     => $now,
                'updated_at'     => $now,
            ]);

            // Update last login
            $updates = [];
            if (\Illuminate\Support\Facades\Schema::hasColumn('users', 'last_login_at')) $updates['last_login_at'] = $now;
            if (\Illuminate\Support\Facades\Schema::hasColumn('users', 'last_login_ip')) $updates['last_login_ip'] = $request->ip();
            
            if (!empty($updates)) {
                DB::table('users')->where('id', $user->id)->update($updates);
            }

            UserActivityLogger::log(
                $request,
                'login',
                'auth',
                'users',
                (int) $user->id,
                null,
                null,
                ['email' => $user->email, 'method' => 'google'],
                'Login successful via Google OAuth',
                ['id' => (int) $user->id, 'role' => (string)($user->role ?? 'user')]
            );

            // Redirect to frontend callback route with token
            return redirect('/oauth/callback?token=' . $plainToken);

        } catch (\Exception $e) {
            Log::error('Google OAuth Error: ' . $e->getMessage());
            return redirect('/login?error=Authentication failed');
        }
    }
}
