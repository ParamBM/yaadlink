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

class SocialAuthController extends Controller
{
    private const USER_TYPE = 'App\\Models\\User';

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
                    ]);
                } else {
                    // Create new user
                    $userId = DB::table('users')->insertGetId([
                        'name' => $googleUser->getName() ?? 'Google User',
                        'email' => $googleUser->getEmail(),
                        'password' => Hash::make(Str::random(24)), // Generate random secure password
                        'google_id' => $googleUser->getId(),
                        'role' => 'user',
                        'created_at' => Carbon::now(),
                        'updated_at' => Carbon::now(),
                    ]);

                    $user = DB::table('users')->where('id', $userId)->first();
                }
            }

            if (isset($user->status) && $user->status !== 'active') {
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

            // Redirect to frontend callback route with token
            return redirect('/oauth/callback?token=' . $plainToken);

        } catch (\Exception $e) {
            Log::error('Google OAuth Error: ' . $e->getMessage());
            return redirect('/login?error=Authentication failed');
        }
    }
}
