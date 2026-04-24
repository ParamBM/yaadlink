<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /** tokenable_type stored in personal_access_tokens */
    private const USER_TYPE = 'App\\Models\\User';

    /**
     * Usage:
     *   ->middleware('checkRole')                               // any authenticated user
     *   ->middleware('checkRole:director,principal')            // only director/principal
     *   ->middleware('checkRole:hod,faculty')                   // only HOD/faculty
     *   ->middleware('checkRole:student')                       // only students
     *   ->middleware('checkRole:placement_officer')             // only placement officer
     *   ->middleware('checkRole:placement_officer,principal')   // multiple roles
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        // 1) Extract Bearer token
        $token = $this->extractToken($request);
        if (!$token) {
            return response()->json(['error' => 'Unauthorized Access'], 403);
        }
        $hashed = hash('sha256', $token);

        // 2) Validate token (for Users only)
        $pat = DB::table('personal_access_tokens')
            ->where('token', $hashed)
            ->where('tokenable_type', self::USER_TYPE)
            ->first();

        if (!$pat) {
            return response()->json(['error' => 'Unauthorized Access'], 403);
        }

        // Optional expiry guard (tokens may have expires_at)
        if (isset($pat->expires_at) && $pat->expires_at !== null) {
            try {
                if (now()->greaterThan(\Carbon\Carbon::parse($pat->expires_at))) {
                    // remove expired token for hygiene
                    DB::table('personal_access_tokens')->where('id', $pat->id)->delete();
                    return response()->json(['error' => 'Token Expired'], 401);
                }
            } catch (\Throwable $e) {
                return response()->json(['error' => 'Unauthorized Access'], 403);
            }
        }

        // 3) Fetch user
        $user = DB::table('users')
            ->where('id', $pat->tokenable_id)
            ->first();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized Access'], 403);
        }
        $isInactive = (isset($user->status) && $this->isInactiveStatus($user->status))
            || (!isset($user->status) && isset($user->deleted_at) && $user->deleted_at !== null);

        if ($isInactive) {
            return response()->json(['error' => 'Account is not active'], 403);
        }

        // 4) If roles were provided, enforce them (supports short forms + synonyms)
        if (!empty($roles)) {
            $allowed   = $this->normalizeMany($roles);   // from route
            $userRoles = $this->userRoleAliases($user);  // from DB (role + short form + synonyms)

            if (count(array_intersect($allowed, $userRoles)) === 0) {
                return response()->json(['error' => 'Forbidden (role)'], 403);
            }
        }

        // 5) Attach identity/useful attrs for controllers
        $request->attributes->set('auth_tokenable_type', self::USER_TYPE);
        $request->attributes->set('auth_tokenable_id', (int) $user->id);
        $request->attributes->set('auth_user_uuid', (string) ($user->uuid ?? ''));
        $request->attributes->set('auth_role', $this->canonicalRole((string) ($user->role ?? '')));
        $request->attributes->set('auth_abilities', $this->decodeAbilities($pat->abilities ?? null));

        return $next($request);
    }

    /* ===================== helpers ===================== */

    private function extractToken(Request $request): ?string
    {
        $header = $request->header('Authorization', '');
        if (stripos($header, 'Bearer ') === 0) {
            $token = trim(substr($header, 7));
        } else {
            $token = trim($header);
        }
        return $token !== '' ? $token : null;
    }

    /** normalize a single role → canonical token (alnum only), then alias map */
    /** accept both string and flag-based user status values */
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

    private function normalize(string $role): string
    {
        $r = mb_strtolower(trim($role));
        $r = preg_replace('/[^a-z0-9]+/', '', $r) ?? '';
        return $this->aliasToCanonical($r);
    }

    /** normalize many roles */
    private function normalizeMany(array $roles): array
    {
        $out = [];
        foreach ($roles as $r) {
            $n = $this->normalize((string) $r);
            if ($n !== '') {
                $out[] = $n;
            }
        }
        return array_values(array_unique($out));
    }

    /** canonicalize user->role (display) */
    private function canonicalRole(string $role): string
    {
        return $this->normalize($role);
    }

    /**
     * Map short forms & synonyms → canonical tokens for MSIT Home Builder:
     *
     * Canonical set (what controllers see):
     *  admin, director, principal, hod, faculty, technical_assistant, it_person, placement_officer, student
     *
     * DB values (from UserController normalizeRole): same as above (with underscores).
     */
    private function aliasToCanonical(string $norm): string
    {
        $map = [
            'admin'     => 'admin',

            // director
            'dir'       => 'director',
            'director'  => 'director',

            // principal
            'pri'       => 'principal',
            'principal' => 'principal',

            // HOD
            'hod'              => 'hod',
            'headofdept'       => 'hod',
            'headofdepartment' => 'hod',

            // faculty
            'fac'       => 'faculty',
            'faculty'   => 'faculty',
            'teacher'   => 'faculty',
            'professor' => 'faculty',

            // technical assistant
            'ta'                 => 'technical_assistant',
            'techassistant'      => 'technical_assistant',
            'technicalassistant' => 'technical_assistant',
            'labassistant'       => 'technical_assistant',

            // IT person
            'it'          => 'it_person',
            'itstaff'     => 'it_person',
            'itperson'    => 'it_person',
            'systemadmin' => 'it_person',

            // ✅ placement officer (T&P)
            'po'                       => 'placement_officer',
            'tpo'                      => 'placement_officer',
            'placement'                => 'placement_officer',
            'placementofficer'         => 'placement_officer',
            'trainingplacementofficer' => 'placement_officer',
            'trainingandplacementofficer' => 'placement_officer',
            'placementcell'            => 'placement_officer',

            // author
            'aut'           => 'author',
            'author'        => 'author',
            'contentauthor' => 'author',
            'contentwriter' => 'author',
            'writer'        => 'author',

            // student
            'std'       => 'student',
            'stu'       => 'student',
            'students'  => 'student',
            'learner'   => 'student',
            'candidate' => 'student',
            'student'   => 'student',
        ];

        return $map[$norm] ?? $norm;
    }

    /** build a set of role aliases for the user (role, short form, and synonyms) */
    private function userRoleAliases(object $user): array
    {
        $set = [];

        // from DB role (e.g., "director" | "hod" | "technical_assistant" | "placement_officer")
        $role = $this->normalize((string) ($user->role ?? ''));
        if ($role !== '') {
            $set[] = $role;
        }

        // from DB short form (e.g., "DIR","PRI","HOD","FAC","TA","IT","PO","TPO","STD")
        $short = $this->normalize((string) ($user->role_short_form ?? ''));
        if ($short !== '') {
            $set[] = $this->aliasToCanonical($short);
        }

        // ensure uniqueness
        $set = array_values(array_unique(array_filter($set, fn ($v) => $v !== '')));

        return $set;
    }

    /** decode abilities column (json or string) */
    private function decodeAbilities($abilities)
    {
        if (is_array($abilities)) {
            return $abilities;
        }

        if (is_string($abilities)) {
            $trim = trim($abilities);
            if ($trim === '' || $trim === '*') {
                return ['*'];
            }
            try {
                $arr = json_decode($abilities, true, 512, JSON_THROW_ON_ERROR);
                if (is_array($arr)) {
                    return $arr;
                }
            } catch (\Throwable $e) {
                // ignore parse errors → default *
            }
        }

        return ['*'];
    }
}
