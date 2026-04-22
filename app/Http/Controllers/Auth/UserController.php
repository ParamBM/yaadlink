<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Str;
use App\Models\User;
use Carbon\Carbon;

class UserController extends Controller
{
    /** tokenable_type stored in personal_access_tokens (Sanctum) */
    private const USER_TYPE = 'App\\Models\\User';

    /**
     * MSIT Home Builder roles:
     * director, principal, hod, faculty, technical_assistant, it_person, placement_officer, student, alumni, program_topper
     */
    private const ALLOWED_ROLES = [
        'admin',
        'director',
        'principal',
        'hod',
        'faculty',
        'technical_assistant',
        'it_person',
        'author',
        'placement_officer',
        'student',
        'alumni', // ✅ added
        'program_topper', // ✅ added
    ];

    private const ROLE_SHORT_MAP = [
        'admin'               => 'adm',
        'director'            => 'DIR',
        'principal'           => 'PRI',
        'hod'                 => 'HOD',
        'faculty'             => 'FAC',
        'technical_assistant' => 'TA',
        'it_person'           => 'IT',
        'author'              => 'AUT',
        'placement_officer'   => 'TPO',   // ✅ added
        'student'             => 'STD',
        'alumni'              => 'ALU',   // ✅ added
        'program_topper'      => 'TOP',   // ✅ added
    ];

    // ✅ Added: name_short_form + employee_id + department_id
    private const SELECT_COLUMNS = [
        'id',
        'uuid',
        'slug',
        'name',
        'name_short_form', // ✅ NEW
        'email',
        'phone_number',
        'alternative_email',
        'alternative_phone_number',
        'whatsapp_number',
        'image',
        'address',
        'role',
        'role_short_form',
        'employee_id', // ✅ NEW
        'department_id', // ✅ NEW (for edit prefill + API)
        'status',
        'last_login_at',
        'last_login_ip',
        'created_by',
        'created_at_ip',
        'metadata',
        'created_at',
        'updated_at',
    ];

    /** cache for safe select columns */
    protected ?array $selectColsCache = null;

    /**
     * ✅ Safe select columns (won't break if migration not run yet)
     */
    private function userSelectColumns(): array
    {
        if ($this->selectColsCache !== null) return $this->selectColsCache;

        $cols = [];
        foreach (self::SELECT_COLUMNS as $c) {
            if (Schema::hasColumn('users', $c)) $cols[] = $c;
        }

        $this->selectColsCache = $cols;
        return $cols;
    }

    /* =========================
     * Auth / helpers
     * ========================= */

    private function actor(Request $request): array
    {
        return [
            'role' => $request->attributes->get('auth_role'),
            'type' => $request->attributes->get('auth_tokenable_type'),
            'id'   => (int) ($request->attributes->get('auth_tokenable_id') ?? 0),
        ];
    }

    private function requireRole(Request $r, array $allowed)
    {
        return null;
    }

    private function logWithActor(string $msg, Request $r, array $extra = []): void
    {
        $a = $this->actor($r);
        Log::info($msg, array_merge([
            'actor_role' => $a['role'],
            'actor_id'   => $a['id'],
        ], $extra));
    }

    /**
     * ✅ NEW: sanitize snapshots for activity log (avoid secrets + huge payloads)
     */
    private function sanitizeForActivityLog($data, int $depth = 0)
    {
        if ($data === null) return null;

        // prevent deep recursion
        if ($depth > 3) {
            if (is_array($data)) return '[array]';
            if (is_object($data)) return '[object]';
            return is_string($data) ? mb_substr($data, 0, 200) : $data;
        }

        // scalars
        if (is_bool($data) || is_int($data) || is_float($data)) return $data;

        if (is_string($data)) {
            $s = trim($data);
            if (mb_strlen($s) > 800) $s = mb_substr($s, 0, 800) . '…';
            return $s;
        }

        // objects -> array
        if (is_object($data)) {
            $data = (array) $data;
        }

        if (is_array($data)) {
            $blockedKeys = [
                'password', 'current_password', 'token', 'plainToken', 'authorization',
                'abilities', 'remember_token'
            ];

            $out = [];
            $count = 0;

            foreach ($data as $k => $v) {
                $count++;
                if ($count > 60) { $out['__truncated__'] = true; break; }

                $key = is_string($k) ? strtolower($k) : $k;

                if (is_string($key) && in_array($key, $blockedKeys, true)) {
                    $out[$k] = '[redacted]';
                    continue;
                }

                $out[$k] = $this->sanitizeForActivityLog($v, $depth + 1);
            }

            return $out;
        }

        return (string) $data;
    }

    /**
     * ✅ NEW: write to user_data_activity_log (safe: won't break if table missing)
     * Logs every POST/PUT/PATCH/DELETE activity (except GET endpoints).
     */
    private function activityLog(
        Request $r,
        string $activity,
        string $module,
        string $tableName,
        ?int $recordId = null,
        ?array $changedFields = null,
        $oldValues = null,
        $newValues = null,
        ?string $note = null,
        ?array $actorOverride = null
    ): void {
        try {
            if (!Schema::hasTable('user_data_activity_log')) return;

            $a = $actorOverride ?: $this->actor($r);

            $performedBy = (int)($a['id'] ?? 0);
            if ($performedBy < 0) $performedBy = 0;

            $performedRole = $a['role'] ?? null;
            $performedRole = is_string($performedRole) ? trim($performedRole) : null;
            if ($performedRole === '') $performedRole = null;

            $ua = (string)($r->userAgent() ?? '');
            if (strlen($ua) > 512) $ua = substr($ua, 0, 512);

            $now = Carbon::now();

            $payload = [
                'performed_by'       => $performedBy,
                'performed_by_role'  => $performedRole,
                'ip'                 => $r->ip(),
                'user_agent'         => $ua,

                'activity'           => substr($activity, 0, 50),
                'module'             => substr($module, 0, 100),

                'table_name'         => substr($tableName, 0, 128),
                'record_id'          => $recordId,

                'changed_fields'     => $changedFields !== null ? json_encode($this->sanitizeForActivityLog($changedFields), JSON_UNESCAPED_UNICODE) : null,
                'old_values'         => $oldValues !== null ? json_encode($this->sanitizeForActivityLog($oldValues), JSON_UNESCAPED_UNICODE) : null,
                'new_values'         => $newValues !== null ? json_encode($this->sanitizeForActivityLog($newValues), JSON_UNESCAPED_UNICODE) : null,

                'log_note'           => $note,

                'created_at'         => $now,
                'updated_at'         => $now,
            ];

            DB::table('user_data_activity_log')->insert($payload);
        } catch (\Throwable $e) {
            // never break API because of logging
            Log::warning('user_data_activity_log.write_failed', [
                'error' => $e->getMessage(),
                'activity' => $activity,
                'module' => $module,
                'table_name' => $tableName,
                'record_id' => $recordId,
            ]);
        }
    }

    private function extractToken(Request $request): ?string
    {
        $header = (string) $request->header('Authorization', '');
        if (stripos($header, 'Bearer ') === 0) {
            $token = trim(substr($header, 7));
        } else {
            $token = trim($header);
        }
        return $token !== '' ? $token : null;
    }

    /**
     * accessControl (ONLY users table)
     *
     * Returns ONLY:
     *  - ['mode' => 'all',         'department_id' => null]
     *  - ['mode' => 'department',  'department_id' => <int>]
     *  - ['mode' => 'none',        'department_id' => null]
     *  - ['mode' => 'not_allowed', 'department_id' => null]
     */
    private function accessControl(int $userId): array
    {
        if ($userId <= 0) {
            return ['mode' => 'none', 'department_id' => null];
    }

        // Safety (if some env doesn't have dept column yet — fall through to 'all'
        // since CheckRole middleware already validated admin/director role)
        if (!Schema::hasColumn('users', 'department_id')) {
            return ['mode' => 'all', 'department_id' => null];
        }

        $q = DB::table('users')->select(['id', 'role', 'department_id', 'status']);

        // your schema has deleted_at; keep it safe
        if (Schema::hasColumn('users', 'deleted_at')) {
            $q->whereNull('deleted_at');
        }

        $u = $q->where('id', $userId)->first();

        if (!$u) {
            return ['mode' => 'none', 'department_id' => null];
        }

        // optional: inactive users => none
        if (isset($u->status) && (string)$u->status !== 'active') {
            return ['mode' => 'none', 'department_id' => null];
        }

        // normalize role from users table
        $role = strtolower(trim((string)($u->role ?? '')));
        $role = str_replace([' ', '-'], '_', $role);
        $role = preg_replace('/_+/', '_', $role) ?? $role;

        $deptId = $u->department_id !== null ? (int)$u->department_id : null;
        if ($deptId !== null && $deptId <= 0) $deptId = null;

        $adminRoles = ['admin', 'super_admin', 'director', 'principal', 'author', 'placement_officer'];
        if (in_array($role, $adminRoles, true)) {
            return ['mode' => 'all', 'department_id' => null];
        }

        if ($deptId !== null) {
            return ['mode' => 'department', 'department_id' => $deptId];
        }

        return ['mode' => 'none', 'department_id' => null];
    }

    /**
     * Get allowed roles that this actor role can create/edit to.
     */
    private function getAllowedCreationRoles(string $actorRole): array
    {
        $actorRole = strtolower(trim($actorRole));
        $rootRoles = ['admin', 'super_admin', 'director', 'principal', 'author'];
        
        if (in_array($actorRole, $rootRoles, true)) {
            return self::ALLOWED_ROLES;
        }
        
        if ($actorRole === 'hod') {
            return ['faculty', 'technical_assistant', 'it_person', 'placement_officer', 'student', 'alumni', 'program_topper'];
        }
        
        $staffRoles = ['faculty', 'technical_assistant', 'it_person', 'placement_officer'];
        if (in_array($actorRole, $staffRoles, true)) {
            return ['student', 'alumni', 'program_topper'];
        }
        
        return [];
    }


    /**
     * Normalize a role + derive short form.
     * If invalid/missing, default to "faculty" + "FAC".
     */
    private function normalizeRole(?string $role): array
    {
        $role = $role !== null ? strtolower(trim($role)) : '';

        // normalize separators
        $role = str_replace([' ', '-'], '_', $role);
        $role = preg_replace('/_+/', '_', $role) ?? $role;
        $role = trim($role, '_');

        // aliases/synonyms
        if ($role === 'tech_assistant' || $role === 'techassistant') {
            $role = 'technical_assistant';
        }

        // ✅ alumni aliases
        if (in_array($role, ['alum', 'alumnus', 'alumni'], true)) {
            $role = 'alumni';
        }

        // ✅ program topper aliases
        if (in_array($role, [
            'program_topper',
            'programtopper',
            'program_top',
            'program-topper',
            'topper',
        ], true)) {
            $role = 'program_topper';
        }

        // ✅ placement officer aliases
        if (in_array($role, [
            'po',
            'tpo',
            'placement',
            'placementofficer',
            'placement_officer',
            'training_placement_officer',
            'trainingplacementofficer',
            'trainingandplacementofficer',
            'training_and_placement_officer',
            'placement_cell',
            'placementcell',
        ], true)) {
            $role = 'placement_officer';
        }

        // ✅ author aliases
if (in_array($role, [
    'author',
    'content_author',
    'contentauthor',
    'content_writer',
    'contentwriter',
    'writer',
], true)) {
    $role = 'author';
}

        if (!in_array($role, self::ALLOWED_ROLES, true)) {
            $role = 'faculty';
        }

        $short = self::ROLE_SHORT_MAP[$role] ?? strtoupper(substr($role, 0, 3));

        return [$role, $short];
    }

    /**
     * Generate unique slug from name.
     */
    private function generateUniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        if ($base === '') {
            $base = 'user';
        }

        $slug = $base;
        $i    = 1;

        while (true) {
            $q = DB::table('users')->where('slug', $slug);
            if ($ignoreId) {
                $q->where('id', '!=', $ignoreId);
            }

            if (!$q->exists()) {
                return $slug;
            }

            $slug = $base . '-' . $i;
            $i++;
        }
    }

    /**
     * ✅ helper: sync department_id into user_personal_information if table/cols exist
     */
    private function syncUpiDepartment(int $userId, $departmentId, $now): void
    {
        if (!Schema::hasTable('user_personal_information')) return;
        if (!Schema::hasColumn('user_personal_information', 'user_id')) return;
        if (!Schema::hasColumn('user_personal_information', 'department_id')) return;

        $hasDeletedAt = Schema::hasColumn('user_personal_information', 'deleted_at');
        $hasUuid      = Schema::hasColumn('user_personal_information', 'uuid');
        $hasCreatedAt = Schema::hasColumn('user_personal_information', 'created_at');
        $hasUpdatedAt = Schema::hasColumn('user_personal_information', 'updated_at');

        $q = DB::table('user_personal_information')->where('user_id', $userId);
        if ($hasDeletedAt) $q->whereNull('deleted_at');

        $upi = $q->first();

        if ($upi) {
            $payload = ['department_id' => $departmentId];
            if ($hasUpdatedAt) $payload['updated_at'] = $now;
            DB::table('user_personal_information')->where('id', $upi->id)->update($payload);
        } else {
            $payload = [
                'user_id'        => $userId,
                'department_id'  => $departmentId,
            ];
            if ($hasUuid)      $payload['uuid'] = (string) Str::uuid();
            if ($hasCreatedAt) $payload['created_at'] = $now;
            if ($hasUpdatedAt) $payload['updated_at'] = $now;

            DB::table('user_personal_information')->insert($payload);
        }
    }

    /* =====================================================
     * AUTH ENDPOINTS
     * ===================================================== */

    /**
     * POST /api/auth/login
     * Issue Sanctum token for MSIT Home Builder.
     */
    public function login(Request $request)
    {
        $v = Validator::make($request->all(), [
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if ($v->fails()) {
            $this->activityLog(
                $request,
                'login_failed_validation',
                'auth',
                'users',
                null,
                ['email','password'],
                null,
                ['email' => (string)$request->input('email')],
                'Validation failed'
            );

            return response()->json([
                'success' => false,
                'errors'  => $v->errors(),
            ], 422);
        }

        $data = $v->validated();

        $user = DB::table('users')
            ->where('email', $data['email'])
            ->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            $this->activityLog(
                $request,
                'login_failed',
                'auth',
                'users',
                null,
                ['email'],
                null,
                ['email' => (string)$data['email']],
                'Invalid credentials',
                ['id' => 0, 'role' => null]
            );

            return response()->json([
                'success' => false,
                'error'   => 'Invalid credentials',
            ], 401);
        }

        if (isset($user->status) && $user->status !== 'active') {
            $this->activityLog(
                $request,
                'login_blocked',
                'auth',
                'users',
                (int)$user->id,
                ['status'],
                ['status' => (string)($user->status ?? '')],
                ['status' => (string)($user->status ?? '')],
                'Account is not active',
                ['id' => (int)$user->id, 'role' => (string)($user->role ?? null)]
            );

            return response()->json([
                'success' => false,
                'error'   => 'Account is not active',
            ], 403);
        }

        $now         = Carbon::now();
        $plainToken  = Str::random(80);
        $hashedToken = hash('sha256', $plainToken);

        // Insert Sanctum token (manual, like Unzip Exam)
        DB::table('personal_access_tokens')->insert([
            'tokenable_type' => self::USER_TYPE,
            'tokenable_id'   => $user->id,
            'name'           => 'msit-api',
            'token'          => $hashedToken,
            'abilities'      => json_encode(['*']),
            'last_used_at'   => null,
            'created_at'     => $now,
            'updated_at'     => $now,
        ]);

        // Track last login
        $updates = [];
        if (Schema::hasColumn('users', 'last_login_at')) $updates['last_login_at'] = $now;
        if (Schema::hasColumn('users', 'last_login_ip')) $updates['last_login_ip'] = $request->ip();
        
        if (!empty($updates)) {
            DB::table('users')
                ->where('id', $user->id)
                ->update($updates);
        }

        $fresh = DB::table('users')
            ->select($this->userSelectColumns())
            ->where('id', $user->id)
            ->first();

        Log::info('msit.auth.login.success', [
            'user_id' => $user->id,
            'email'   => $user->email,
            'ip'      => $request->ip(),
        ]);

        // ✅ ACTIVITY LOG (success)
        $this->activityLog(
            $request,
            'login',
            'auth',
            'users',
            (int)$user->id,
            ['last_login_at','last_login_ip'],
            null,
            ['ip' => $request->ip()],
            'Login successful',
            ['id' => (int)$user->id, 'role' => (string)($user->role ?? null)]
        );

        return response()->json([
            'success'    => true,
            'token'      => $plainToken,
            'token_type' => 'Bearer',
            'user'       => $fresh,
        ]);
    }

    /**
     * POST /api/auth/logout
     * Invalidate current token (route is protected by checkRole).
     */
    public function logout(Request $request)
    {
        $token = $this->extractToken($request);
        if (!$token) {
            $this->activityLog(
                $request,
                'logout_failed',
                'auth',
                'personal_access_tokens',
                null,
                null,
                null,
                null,
                'No token provided'
            );

            return response()->json([
                'success' => false,
                'error'   => 'No token provided',
            ], 401);
        }

        $hashed = hash('sha256', $token);

        $pat = DB::table('personal_access_tokens')
            ->where('token', $hashed)
            ->where('tokenable_type', self::USER_TYPE)
            ->first();

        if ($pat) {
            DB::table('personal_access_tokens')
                ->where('id', $pat->id)
                ->delete();
        }

        $this->logWithActor('msit.auth.logout', $request, [
            'token_id' => $pat->id ?? null,
        ]);

        // ✅ ACTIVITY LOG
        $this->activityLog(
            $request,
            'logout',
            'auth',
            'personal_access_tokens',
            $pat ? (int)$pat->id : null,
            null,
            null,
            null,
            'Logged out'
        );

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully',
        ]);
    }

    /**
     * GET /api/auth/check
     * Validate token & return user if valid (for SPA "already logged in?" check).
     */
    public function authenticateToken(Request $request)
    {
        $token = $this->extractToken($request);
        if (!$token) {
            return response()->json([
                'success' => false,
                'error'   => 'No token provided',
            ], 401);
        }

        $hashed = hash('sha256', $token);

        $pat = DB::table('personal_access_tokens')
            ->where('token', $hashed)
            ->where('tokenable_type', self::USER_TYPE)
            ->first();

        if (!$pat) {
            return response()->json([
                'success' => false,
                'error'   => 'Invalid token',
            ], 401);
        }

        // Optional expiry guard (same style as CheckRole)
        if (isset($pat->expires_at) && $pat->expires_at !== null) {
            try {
                if (Carbon::now()->greaterThan(Carbon::parse($pat->expires_at))) {
                    DB::table('personal_access_tokens')->where('id', $pat->id)->delete();
                    return response()->json([
                        'success' => false,
                        'error'   => 'Token expired',
                    ], 401);
                }
            } catch (\Throwable $e) {
                return response()->json([
                    'success' => false,
                    'error'   => 'Invalid token',
                ], 401);
            }
        }

        $user = DB::table('users')
            ->select($this->userSelectColumns())
            ->where('id', $pat->tokenable_id)
            ->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'error'   => 'User not found',
            ], 404);
        }

        if (isset($user->status) && $user->status !== 'active') {
            return response()->json([
                'success' => false,
                'error'   => 'Account is not active',
            ], 403);
        }

        // Optionally update last_used_at
        DB::table('personal_access_tokens')
            ->where('id', $pat->id)
            ->update([
                'last_used_at' => Carbon::now(),
                'updated_at'   => Carbon::now(),
            ]);

        return response()->json([
            'success' => true,
            'user'    => $user,
        ]);
    }

    /* =====================================================
     * USER MANAGEMENT ENDPOINTS
     * ===================================================== */

    /**
     * GET /api/users
     * List users with optional filters (role, search).
     */
    public function index(Request $request)
    {
        // ✅ APPLY accessControl here (listing)
        $actorId = (int) $request->attributes->get('auth_tokenable_id');
        $ac      = $this->accessControl($actorId);

        if ($ac['mode'] === 'not_allowed') return response()->json(['error' => 'Not allowed'], 403);
        if ($ac['mode'] === 'none') {
            return response()->json([
                'success' => true,
                'data'    => [],
            ], 200);
        }

        $search = trim((string) $request->query('q', ''));
        $role   = $request->query('role');
        $status = $request->query('status');

        $hasNameShort = Schema::hasColumn('users', 'name_short_form');
        $hasEmpId     = Schema::hasColumn('users', 'employee_id');

        $query = DB::table('users')
            ->select($this->userSelectColumns());

        // ✅ department scoping
        if ($ac['mode'] === 'department') {
            $query->where('department_id', (int) $ac['department_id']);
        }

        if ($role) {
            $query->where('role', $role);
        }

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search, $hasNameShort, $hasEmpId) {
                $q->where('name', 'like', '%' . $search . '%')
                  ->orWhere('email', 'like', '%' . $search . '%')
                  ->orWhere('phone_number', 'like', '%' . $search . '%');

                if ($hasNameShort) $q->orWhere('name_short_form', 'like', '%' . $search . '%');
                if ($hasEmpId)     $q->orWhere('employee_id', 'like', '%' . $search . '%');
            });
        }

        $users = $query
            ->orderBy('id', 'desc')
            ->limit(200)
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $users,
        ]);
    }

    /**
     * POST /api/users
     * Create a new user.
     */
    public function store(Request $request)
    {
        // ✅ APPLY accessControl here (create)
        $actorId = (int) $request->attributes->get('auth_tokenable_id');
        $ac      = $this->accessControl($actorId);

        if ($ac['mode'] === 'not_allowed' || $ac['mode'] === 'none') {
            $this->activityLog($request, 'create_denied', 'users', 'users', null, null, null, null, 'Not allowed');
            return response()->json(['error' => 'Not allowed'], 403);
        }

        $deptRule = Rule::exists('departments', 'id');
        if (Schema::hasColumn('departments', 'deleted_at')) {
            $deptRule = $deptRule->whereNull('deleted_at');
        }

        // ✅ new cols are optional
        $v = Validator::make($request->all(), [
            'name'                      => ['required', 'string', 'max:190'],
            'name_short_form'           => ['nullable', 'string', 'max:50'],   // ✅ NEW
            'employee_id'               => ['nullable', 'string', 'max:50'],   // ✅ NEW

            'email'                     => ['required', 'email', 'max:255', 'unique:users,email'],
            'password'                  => ['required', 'string', 'min:8'],
            'phone_number'              => ['nullable', 'string', 'max:32', 'unique:users,phone_number'],
            'alternative_email'         => ['nullable', 'email', 'max:255'],
            'alternative_phone_number'  => ['nullable', 'string', 'max:32'],
            'whatsapp_number'           => ['nullable', 'string', 'max:32'],
            'image'                     => ['nullable', 'string', 'max:255'],
            'address'                   => ['nullable', 'string'],
            'role'                      => ['nullable', 'string'],
            'status'                    => ['nullable', 'string', 'max:20'],
            'metadata'                  => ['nullable', 'array'],
            'department_id'             => ['nullable', 'integer', $deptRule],
        ]);

        if ($v->fails()) {
            $this->activityLog(
                $request,
                'create_failed_validation',
                'users',
                'users',
                null,
                array_keys($request->all() ?: []),
                null,
                ['email' => (string)$request->input('email')],
                'Validation failed'
            );

            return response()->json([
                'success' => false,
                'errors'  => $v->errors(),
            ], 422);
        }

        $data  = $v->validated();
        [$role, $roleShort] = $this->normalizeRole($data['role'] ?? null);

        // ✅ Check Role Hierarchy
        $actorRole = strtolower(trim((string)($this->actor($request)['role'] ?? '')));
        $allowedRoles = $this->getAllowedCreationRoles($actorRole);
        if (!in_array($role, $allowedRoles, true)) {
            $this->activityLog($request, 'create_denied', 'users', 'users', null, ['role'], null, ['role' => $role], 'Role hierarchy violation');
            return response()->json(['error' => 'Cannot create user with this role'], 403);
        }

        // ✅ department scoping: dept actors MUST create inside their dept
        if ($ac['mode'] === 'department') {
            $data['department_id'] = (int) $ac['department_id'];
        }

        $now   = Carbon::now();
        $actor = $this->actor($request);

        $hasNameShort = Schema::hasColumn('users', 'name_short_form');
        $hasEmpId     = Schema::hasColumn('users', 'employee_id');
        $hasDept      = Schema::hasColumn('users', 'department_id');

        DB::beginTransaction();

        try {
            $uuid = (string) Str::uuid();
            $slug = $this->generateUniqueSlug($data['name']);

            $insert = [
                'name'                     => $data['name'],
                'email'                    => $data['email'],
                'password'                 => Hash::make($data['password']),
                'uuid'                     => $uuid,
                'slug'                     => $slug,
                'phone_number'             => $data['phone_number']             ?? null,
                'alternative_email'        => $data['alternative_email']        ?? null,
                'alternative_phone_number' => $data['alternative_phone_number'] ?? null,
                'whatsapp_number'          => $data['whatsapp_number']          ?? null,
                'image'                    => $data['image']                    ?? null,
                'address'                  => $data['address']                  ?? null,
                'role'                     => $role,
                'role_short_form'          => $roleShort,
                'status'                   => $data['status']                   ?? 'active',
                'metadata'                 => array_key_exists('metadata', $data)
                    ? json_encode($data['metadata'])
                    : null,
                'created_by'               => $actor['id'] ?: null,
                'created_at_ip'            => $request->ip(),
                'created_at'               => $now,
                'updated_at'               => $now,
            ];

            // ✅ optional fields (only if columns exist)
            if ($hasNameShort) $insert['name_short_form'] = $data['name_short_form'] ?? null;
            if ($hasEmpId)     $insert['employee_id']     = $data['employee_id'] ?? null;

            // ✅ department_id save (only if column exists)
            if ($hasDept)      $insert['department_id']   = $data['department_id'] ?? null;

            $id = DB::table('users')->insertGetId($insert);

            // ✅ optional: keep UPI dept in sync if UPI is used as primary in facultyindex()
            if ($hasDept && array_key_exists('department_id', $data)) {
                $this->syncUpiDepartment((int)$id, $data['department_id'] ?? null, $now);
            }

            DB::commit();

            $this->logWithActor('msit.users.store.success', $request, ['user_id' => $id]);

            // ✅ ACTIVITY LOG (create)
            $changed = array_keys($insert);
            $changed = array_values(array_filter($changed, fn($k) => $k !== 'password')); // never log password
            $newVals = $insert;
            unset($newVals['password']);

            $this->activityLog(
                $request,
                'create',
                'users',
                'users',
                (int)$id,
                $changed,
                null,
                $newVals,
                'User created'
            );

            $user = DB::table('users')
                ->select($this->userSelectColumns())
                ->where('id', $id)
                ->first();

            return response()->json([
                'success' => true,
                'data'    => $user,
            ], 201);

        } catch (\Throwable $e) {
            DB::rollBack();
            $this->logWithActor('msit.users.store.failed', $request, [
                'error' => $e->getMessage(),
            ]);

            $this->activityLog(
                $request,
                'create_failed',
                'users',
                'users',
                null,
                null,
                null,
                null,
                'Failed to create user: ' . $e->getMessage()
            );

            return response()->json([
                'success' => false,
                'error'   => 'Failed to create user',
            ], 500);
        }
    }

    /**
     * GET /api/users/{uuid}
     * Show a single user.
     */
    public function show(Request $request, string $uuid)
    {
        // ✅ APPLY accessControl here (single view)
        $actorId = (int) $request->attributes->get('auth_tokenable_id');
        $ac      = $this->accessControl($actorId);

        if ($ac['mode'] === 'not_allowed') return response()->json(['error' => 'Not allowed'], 403);
        if ($ac['mode'] === 'none') {
            return response()->json([
                'success' => false,
                'error'   => 'User not found',
            ], 404);
        }

        $q = DB::table('users')
            ->select($this->userSelectColumns())
            ->where('uuid', $uuid)
            ->whereNull('deleted_at');

        if ($ac['mode'] === 'department') {
            $q->where('department_id', (int)$ac['department_id']);
        }

        $user = $q->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'error'   => 'User not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => $user,
        ]);
    }

    /**
     * PUT/PATCH /api/users/{uuid}
     * Update profile (name, contact, image, address, role/status...)
     */
    public function update(Request $request, string $uuid)
    {
        // ✅ APPLY accessControl here (update)
        $actorId = (int) $request->attributes->get('auth_tokenable_id');
        $ac      = $this->accessControl($actorId);

        if ($ac['mode'] === 'not_allowed' || $ac['mode'] === 'none') {
            $this->activityLog($request, 'update_denied', 'users', 'users', null, null, null, null, 'Not allowed');
            return response()->json(['error' => 'Not allowed'], 403);
        }

        $qUser = DB::table('users');
        
        if (Schema::hasColumn('users', 'uuid')) {
            $qUser->where('uuid', $uuid);
        } else {
            // Fallback: if uuid doesn't exist, the parameter is actually the ID
            $qUser->where('id', $uuid);
        }

        if (Schema::hasColumn('users', 'deleted_at')) {
            $qUser->whereNull('deleted_at');
        }

        if ($ac['mode'] === 'department') {
            $qUser->where('department_id', (int)$ac['department_id']);
        }

        $user = $qUser->first();

        if (!$user) {
            $this->activityLog($request, 'update_not_found', 'users', 'users', null, null, null, ['uuid' => $uuid], 'User not found');
            return response()->json([
                'success' => false,
                'error'   => 'User not found',
            ], 404);
        }

        $deptRule = Rule::exists('departments', 'id');
        if (Schema::hasColumn('departments', 'deleted_at')) {
            $deptRule = $deptRule->whereNull('deleted_at');
        }

        $hasNameShort = Schema::hasColumn('users', 'name_short_form');
        $hasEmpId     = Schema::hasColumn('users', 'employee_id');
        $hasDept      = Schema::hasColumn('users', 'department_id');

        $rules = [
            'name'                     => ['sometimes', 'required', 'string', 'max:190'],

            // ✅ NEW optional fields
            'name_short_form'          => ['sometimes', 'nullable', 'string', 'max:50'],
            'employee_id'              => ['sometimes', 'nullable', 'string', 'max:50'],

            'email'                    => [
                'sometimes', 'required', 'email', 'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'password'                 => ['sometimes', 'nullable', 'string', 'min:8'],
            'phone_number'             => [
                'sometimes', 'nullable', 'string', 'max:32',
                Rule::unique('users', 'phone_number')->ignore($user->id),
            ],
            'alternative_email'        => ['sometimes', 'nullable', 'email', 'max:255'],
            'alternative_phone_number' => ['sometimes', 'nullable', 'string', 'max:32'],
            'whatsapp_number'          => ['sometimes', 'nullable', 'string', 'max:32'],
            'image'                    => ['sometimes', 'nullable', 'string', 'max:255'],
            'address'                  => ['sometimes', 'nullable', 'string'],
            'role'                     => ['sometimes', 'nullable', 'string'],
            'status'                   => ['sometimes', 'nullable', 'string', 'max:20'],
            'metadata'                 => ['sometimes', 'nullable', 'array'],
            'department_id'            => ['sometimes', 'nullable', 'integer', $deptRule],
        ];

        $v = Validator::make($request->all(), $rules);

        if ($v->fails()) {
            $this->activityLog(
                $request,
                'update_failed_validation',
                'users',
                'users',
                (int)$user->id,
                array_keys($request->all() ?: []),
                null,
                null,
                'Validation failed'
            );

            return response()->json([
                'success' => false,
                'errors'  => $v->errors(),
            ], 422);
        }

        $data   = $v->validated();

        $isSelf = ((int)$user->id === (int)($this->actor($request)['id'] ?? 0));
        $currentUserRole = strtolower(trim($user->role ?? ''));
        $actorRole = strtolower(trim((string)($this->actor($request)['role'] ?? '')));
        $allowedRoles = $this->getAllowedCreationRoles($actorRole);

        // Cannot edit someone above you (unless targeting self)
        if (!$isSelf && !in_array($currentUserRole, $allowedRoles, true)) {
            $this->activityLog($request, 'update_denied', 'users', 'users', (int)$user->id, null, null, null, 'Cannot edit peer or higher role');
            return response()->json(['error' => 'Cannot edit user with this role'], 403);
        }

        if (array_key_exists('role', $data)) {
            [$targetRole, $short] = $this->normalizeRole($data['role']);
            if ($targetRole !== $currentUserRole && !in_array($targetRole, $allowedRoles, true)) {
                $this->activityLog($request, 'update_denied', 'users', 'users', (int)$user->id, ['role'], null, ['role' => $targetRole], 'Cannot grant this role');
                return response()->json(['error' => 'Cannot grant this role'], 403);
            }
        }

        // ✅ dept actors: force incoming department to match their own
        if ($ac['mode'] === 'department' && $hasDept) {
            $data['department_id'] = (int)$ac['department_id'];
        }

        $update = [];
        $now    = Carbon::now();

        if (array_key_exists('name', $data)) {
            $update['name'] = $data['name'];
            $update['slug'] = $this->generateUniqueSlug($data['name'], (int) $user->id);
        }

        // ✅ NEW optional fields
        if ($hasNameShort && array_key_exists('name_short_form', $data)) {
            $update['name_short_form'] = $data['name_short_form'] ?? null;
        }
        if ($hasEmpId && array_key_exists('employee_id', $data)) {
            $update['employee_id'] = $data['employee_id'] ?? null;
        }

        // ✅ department_id update (only if column exists)
        if ($hasDept && array_key_exists('department_id', $data)) {
            $update['department_id'] = $data['department_id'] ?? null;
        }

        if (array_key_exists('email', $data)) {
            $update['email'] = $data['email'];
        }

        if (array_key_exists('password', $data) && $data['password']) {
            $update['password'] = Hash::make($data['password']);
        }

        if (array_key_exists('phone_number', $data)) {
            $update['phone_number'] = $data['phone_number'] ?? null;
        }
        if (array_key_exists('alternative_email', $data)) {
            $update['alternative_email'] = $data['alternative_email'] ?? null;
        }
        if (array_key_exists('alternative_phone_number', $data)) {
            $update['alternative_phone_number'] = $data['alternative_phone_number'] ?? null;
        }
        if (array_key_exists('whatsapp_number', $data)) {
            $update['whatsapp_number'] = $data['whatsapp_number'] ?? null;
        }
        if (array_key_exists('image', $data)) {
            $update['image'] = $data['image'] ?? null;
        }
        if (array_key_exists('address', $data)) {
            $update['address'] = $data['address'] ?? null;
        }

        if (array_key_exists('role', $data)) {
            [$role, $short] = $this->normalizeRole($data['role']);
            $update['role']            = $role;
            $update['role_short_form'] = $short;
        }

        if (array_key_exists('status', $data)) {
            $update['status'] = $data['status'] ?? 'active';
        }

        if (array_key_exists('metadata', $data)) {
            $update['metadata'] = $data['metadata'] !== null
                ? json_encode($data['metadata'])
                : null;
        }

        if (empty($update)) {
            return response()->json([
                'success' => true,
                'data'    => $user,
            ]);
        }

        $update['updated_at'] = $now;

        // ✅ prepare old/new snapshots (exclude password)
        $changedFields = array_keys($update);
        $changedFields = array_values(array_filter($changedFields, fn($k) => $k !== 'password'));

        $oldVals = [];
        $newVals = [];
        foreach ($changedFields as $f) {
            $oldVals[$f] = $user->{$f} ?? null;
            $newVals[$f] = $update[$f] ?? null;
        }

        DB::beginTransaction();
        try {
            DB::table('users')
                ->where('id', $user->id)
                ->update($update);

            // ✅ optional: keep UPI dept in sync if UPI is used as primary in facultyindex()
            if ($hasDept && array_key_exists('department_id', $data)) {
                $this->syncUpiDepartment((int)$user->id, $data['department_id'] ?? null, $now);
            }

            DB::commit();

        } catch (\Throwable $e) {
            DB::rollBack();
            $this->logWithActor('msit.users.update.failed', $request, [
                'user_id' => $user->id,
                'error'   => $e->getMessage(),
            ]);

            $this->activityLog(
                $request,
                'update_failed',
                'users',
                'users',
                (int)$user->id,
                $changedFields,
                $oldVals,
                $newVals,
                'Failed to update user: ' . $e->getMessage()
            );

            return response()->json([
                'success' => false,
                'error'   => 'Failed to update user',
            ], 500);
        }

        $this->logWithActor('msit.users.update', $request, [
            'user_id' => $user->id,
        ]);

        // ✅ ACTIVITY LOG (update)
        $this->activityLog(
            $request,
            'update',
            'users',
            'users',
            (int)$user->id,
            $changedFields,
            $oldVals,
            $newVals,
            'User updated'
        );

        $fresh = DB::table('users')
            ->select($this->userSelectColumns())
            ->where('id', $user->id)
            ->first();

        return response()->json([
            'success' => true,
            'data'    => $fresh,
        ]);
    }

    /**
     * PATCH /api/users/{uuid}/password
     * Update password separately.
     */
    public function updatePassword(Request $request, string $uuid)
    {
        if ($resp = $this->requireRole($request, self::ALLOWED_ROLES)) {
            $this->activityLog($request, 'password_update_denied', 'users', 'users', null, null, null, null, 'Unauthorized Access');
            return $resp;
        }

        $user = DB::table('users')
            ->where('uuid', $uuid)
            ->whereNull('deleted_at')
            ->first();

        if (!$user) {
            $this->activityLog($request, 'password_update_not_found', 'users', 'users', null, null, null, ['uuid' => $uuid], 'User not found');
            return response()->json([
                'success' => false,
                'error'   => 'User not found',
            ], 404);
        }

        $actor     = $this->actor($request);
        $highRoles = ['director', 'principal', 'hod', 'technical_assistant', 'it_person','admin', 'author'];

        $isSelf = $actor['id'] === (int) $user->id;
        $isHigh = in_array($actor['role'], $highRoles, true);

        if (!$isHigh && !$isSelf) {
            $this->activityLog(
                $request,
                'password_update_denied',
                'users',
                'users',
                (int)$user->id,
                ['password'],
                null,
                null,
                'Unauthorized Access'
            );

            return response()->json([
                'success' => false,
                'error'   => 'Unauthorized Access',
            ], 403);
        }

        $rules = [
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ];

        if (!$isHigh || $isSelf) {
            $rules['current_password'] = ['required', 'string'];
        }

        $v = Validator::make($request->all(), $rules);

        if ($v->fails()) {
            $this->activityLog(
                $request,
                'password_update_failed_validation',
                'users',
                'users',
                (int)$user->id,
                ['password','current_password'],
                null,
                null,
                'Validation failed'
            );

            return response()->json([
                'success' => false,
                'errors'  => $v->errors(),
            ], 422);
        }

        $data = $v->validated();

        if (array_key_exists('current_password', $rules)) {
            if (!Hash::check($data['current_password'], $user->password)) {
                $this->activityLog(
                    $request,
                    'password_update_failed',
                    'users',
                    'users',
                    (int)$user->id,
                    ['current_password'],
                    null,
                    null,
                    'Current password incorrect'
                );

                return response()->json([
                    'success' => false,
                    'errors'  => [
                        'current_password' => ['Current password is incorrect'],
                    ],
                ], 422);
            }
        }

        DB::table('users')
            ->where('id', $user->id)
            ->update([
                'password'   => Hash::make($data['password']),
                'updated_at' => Carbon::now(),
            ]);

        $this->logWithActor('msit.users.update_password', $request, [
            'user_id' => $user->id,
        ]);

        // ✅ ACTIVITY LOG (password change) - do not store password hashes
        $this->activityLog(
            $request,
            'update_password',
            'users',
            'users',
            (int)$user->id,
            ['password'],
            null,
            null,
            'Password updated'
        );

        return response()->json([
            'success' => true,
            'message' => 'Password updated successfully',
        ]);
    }

    /**
     * PATCH /api/users/{uuid}/image
     * Update profile image path.
     */
    public function updateImage(Request $request, string $uuid)
    {
        if ($resp = $this->requireRole($request, self::ALLOWED_ROLES)) {
            $this->activityLog($request, 'image_update_denied', 'users', 'users', null, null, null, null, 'Unauthorized Access');
            return $resp;
        }

        $user = DB::table('users')
            ->where('uuid', $uuid)
            ->whereNull('deleted_at')
            ->first();

        if (!$user) {
            $this->activityLog($request, 'image_update_not_found', 'users', 'users', null, null, null, ['uuid' => $uuid], 'User not found');
            return response()->json([
                'success' => false,
                'error'   => 'User not found',
            ], 404);
        }

        $actor     = $this->actor($request);
        $highRoles = ['director', 'principal', 'hod', 'technical_assistant', 'it_person','admin', 'author'];

        $isSelf = $actor['id'] === (int) $user->id;
        $isHigh = in_array($actor['role'], $highRoles, true);

        if (!$isHigh && !$isSelf) {
            $this->activityLog(
                $request,
                'image_update_denied',
                'users',
                'users',
                (int)$user->id,
                ['image'],
                ['image' => (string)($user->image ?? null)],
                null,
                'Unauthorized Access'
            );

            return response()->json([
                'success' => false,
                'error'   => 'Unauthorized Access',
            ], 403);
        }

        $v = Validator::make($request->all(), [
            'image' => ['required', 'string', 'max:255'],
        ]);

        if ($v->fails()) {
            $this->activityLog(
                $request,
                'image_update_failed_validation',
                'users',
                'users',
                (int)$user->id,
                ['image'],
                null,
                null,
                'Validation failed'
            );

            return response()->json([
                'success' => false,
                'errors'  => $v->errors(),
            ], 422);
        }

        $data = $v->validated();

        $old = (string)($user->image ?? null);

        DB::table('users')
            ->where('id', $user->id)
            ->update([
                'image'      => $data['image'],
                'updated_at' => Carbon::now(),
            ]);

        $this->logWithActor('msit.users.update_image', $request, [
            'user_id' => $user->id,
        ]);

        // ✅ ACTIVITY LOG
        $this->activityLog(
            $request,
            'update_image',
            'users',
            'users',
            (int)$user->id,
            ['image'],
            ['image' => $old],
            ['image' => (string)$data['image']],
            'Image updated'
        );

        $fresh = DB::table('users')
            ->select($this->userSelectColumns())
            ->where('id', $user->id)
            ->first();

        return response()->json([
            'success' => true,
            'data'    => $fresh,
        ]);
    }

    /**
     * DELETE /api/users/{uuid}
     * Soft delete a user (your code marks inactive)
     */
    public function destroy(Request $request, string $uuid)
    {
        // ✅ APPLY accessControl here (delete)
        $actorId = (int) $request->attributes->get('auth_tokenable_id');
        $ac      = $this->accessControl($actorId);

        if ($ac['mode'] === 'not_allowed' || $ac['mode'] === 'none') {
            $this->activityLog($request, 'delete_denied', 'users', 'users', null, null, null, null, 'Not allowed');
            return response()->json(['error' => 'Not allowed'], 403);
        }

        $qUser = DB::table('users')
            ->where('uuid', $uuid)
            ->whereNull('deleted_at');

        if ($ac['mode'] === 'department') {
            $qUser->where('department_id', (int)$ac['department_id']);
        }

        $user = $qUser->first();

        if (!$user) {
            $this->activityLog($request, 'delete_not_found', 'users', 'users', null, null, null, ['uuid' => $uuid], 'User not found');
            return response()->json([
                'success' => false,
                'error'   => 'User not found',
            ], 404);
        }

        $actor = $this->actor($request);

        // Don't allow deleting yourself
        if ($actor['id'] === (int) $user->id) {
            $this->activityLog(
                $request,
                'delete_denied',
                'users',
                'users',
                (int)$user->id,
                ['status'],
                ['status' => (string)($user->status ?? '')],
                null,
                'Tried to delete own account'
            );

            return response()->json([
                'success' => false,
                'error'   => 'You cannot delete your own account',
            ], 422);
        }

        $oldStatus = (string)($user->status ?? '');

        DB::table('users')
            ->where('id', $user->id)
            ->update([
                'status'     => 'inactive',
            ]);

        $this->logWithActor('msit.users.destroy', $request, [
            'user_id' => $user->id,
        ]);

        // ✅ ACTIVITY LOG (delete/inactivate)
        $this->activityLog(
            $request,
            'delete',
            'users',
            'users',
            (int)$user->id,
            ['status'],
            ['status' => $oldStatus],
            ['status' => 'inactive'],
            'User marked inactive'
        );

        return response()->json([
            'success' => true,
            'message' => 'User deleted',
        ]);
    }

    /**
     * GET /api/me
     * View logged-in user's own profile
     */
    public function me(Request $request)
    {
        $actor = $this->actor($request);
        if (!$actor['id']) {
            return response()->json([
                'success' => false,
                'error'   => 'Unauthenticated',
            ], 401);
        }

        $user = DB::table('users')
            ->select($this->userSelectColumns())
            ->where('id', $actor['id'])
            ->whereNull('deleted_at')
            ->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'error'   => 'User not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => $user,
        ]);
    }

    /**
     * PATCH /api/users/me
     * Update logged-in user's own basic profile (safe fields only)
     * ✅ supports image upload via multipart file (image / image_file) OR string path
     */
    public function updateMe(Request $request)
    {
        $actor = $this->actor($request);
        if (!$actor['id']) {
            $this->activityLog($request, 'update_me_denied', 'users', 'users', null, null, null, null, 'Unauthenticated');
            return response()->json([
                'success' => false,
                'error'   => 'Unauthenticated',
            ], 401);
        }

        $user = DB::table('users')
            ->where('id', $actor['id'])
            ->whereNull('deleted_at')
            ->first();

        if (!$user) {
            $this->activityLog($request, 'update_me_not_found', 'users', 'users', (int)$actor['id'], null, null, null, 'User not found');
            return response()->json([
                'success' => false,
                'error'   => 'User not found',
            ], 404);
        }

        $hasNameShort = Schema::hasColumn('users', 'name_short_form');
        $hasEmpId     = Schema::hasColumn('users', 'employee_id');

        // Base validation (text fields)
        $v = Validator::make($request->all(), [
            'name'                     => ['sometimes', 'required', 'string', 'max:190'],

            // ✅ NEW optional fields
            'name_short_form'          => ['sometimes', 'nullable', 'string', 'max:50'],
            'employee_id'              => ['sometimes', 'nullable', 'string', 'max:50'],

            'email'                    => [
                'sometimes', 'required', 'email', 'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'phone_number'             => [
                'sometimes', 'nullable', 'string', 'max:32',
                Rule::unique('users', 'phone_number')->ignore($user->id),
            ],
            'alternative_email'        => ['sometimes', 'nullable', 'email', 'max:255'],
            'alternative_phone_number' => ['sometimes', 'nullable', 'string', 'max:32'],
            'whatsapp_number'          => ['sometimes', 'nullable', 'string', 'max:32'],
            'address'                  => ['sometimes', 'nullable', 'string'],

            // allow either a file OR a string path (validated conditionally below)
            'image'                    => ['sometimes', 'nullable'],
            'image_file'               => ['sometimes', 'nullable'],

            'metadata'                 => ['sometimes', 'nullable', 'array'],
        ]);

        if ($v->fails()) {
            $this->activityLog(
                $request,
                'update_me_failed_validation',
                'users',
                'users',
                (int)$user->id,
                array_keys($request->all() ?: []),
                null,
                null,
                'Validation failed'
            );

            return response()->json([
                'success' => false,
                'errors'  => $v->errors(),
            ], 422);
        }

        // If file is present, validate it as an actual image file
        $fileRules = [];
        if ($request->hasFile('image')) {
            $fileRules['image'] = ['file', 'image', 'max:4096']; // 4MB
        }
        if ($request->hasFile('image_file')) {
            $fileRules['image_file'] = ['file', 'image', 'max:4096']; // 4MB
        }
        if (!empty($fileRules)) {
            $fv = Validator::make($request->all(), $fileRules);
            if ($fv->fails()) {
                $this->activityLog(
                    $request,
                    'update_me_failed_validation',
                    'users',
                    'users',
                    (int)$user->id,
                    array_keys($fileRules),
                    null,
                    null,
                    'File validation failed'
                );

                return response()->json([
                    'success' => false,
                    'errors'  => $fv->errors(),
                ], 422);
            }
        }

        $data   = $v->validated();
        $update = [];

        // helper: store profile image into public/assets/media/... and return DB path
        $storeProfileImage = function ($file, string $userUuid, ?string $oldPath = null): string {
            if (!$file || !$file->isValid()) {
                throw new \Exception('Invalid image upload');
            }

            $baseDir = public_path("assets/media/image/user/{$userUuid}/profile");
            if (!is_dir($baseDir)) {
                @mkdir($baseDir, 0775, true);
            }

            $ext = strtolower($file->getClientOriginalExtension() ?: 'jpg');
            $safeExt = preg_replace('/[^a-z0-9]/i', '', $ext) ?: 'jpg';

            $filename = 'profile_' . date('Ymd_His') . '_' . Str::random(8) . '.' . $safeExt;
            $file->move($baseDir, $filename);

            // delete old file only if it is local under /assets/media/
            if ($oldPath && is_string($oldPath) && str_starts_with($oldPath, '/assets/media/')) {
                $oldAbs = public_path(ltrim($oldPath, '/'));
                if (is_file($oldAbs)) @unlink($oldAbs);
            }

            return "/assets/media/image/user/{$userUuid}/profile/{$filename}";
        };

        // Name + slug
        if (array_key_exists('name', $data)) {
            $update['name'] = $data['name'];
            $update['slug'] = $this->generateUniqueSlug($data['name'], (int) $user->id);
        }

        // ✅ NEW optional fields
        if ($hasNameShort && array_key_exists('name_short_form', $data)) {
            $update['name_short_form'] = $data['name_short_form'] ?? null;
        }
        if ($hasEmpId && array_key_exists('employee_id', $data)) {
            $update['employee_id'] = $data['employee_id'] ?? null;
        }

        // Email
        if (array_key_exists('email', $data)) {
            $update['email'] = $data['email'];
        }

        // Phones / WhatsApp / Address
        if (array_key_exists('phone_number', $data)) {
            $update['phone_number'] = $data['phone_number'] ?? null;
        }
        if (array_key_exists('alternative_email', $data)) {
            $update['alternative_email'] = $data['alternative_email'] ?? null;
        }
        if (array_key_exists('alternative_phone_number', $data)) {
            $update['alternative_phone_number'] = $data['alternative_phone_number'] ?? null;
        }
        if (array_key_exists('whatsapp_number', $data)) {
            $update['whatsapp_number'] = $data['whatsapp_number'] ?? null;
        }
        if (array_key_exists('address', $data)) {
            $update['address'] = $data['address'] ?? null;
        }

        $oldImage = (string)($user->image ?? null);

        // ✅ Image (FILE has priority)
        try {
            if ($request->hasFile('image') || $request->hasFile('image_file')) {
                $file = $request->hasFile('image') ? $request->file('image') : $request->file('image_file');
                $update['image'] = $storeProfileImage($file, (string)$user->uuid, $user->image ?? null);
            } else {
                // If no file, allow string path (or null to clear) if image key is present
                if (array_key_exists('image', $data)) {
                    $img = $request->input('image');
                    $update['image'] = (is_string($img) && trim($img) !== '') ? trim($img) : null;
                } elseif (array_key_exists('image_file', $data)) {
                    // optional: allow string path via image_file key too (if frontend uses that)
                    $img = $request->input('image_file');
                    $update['image'] = (is_string($img) && trim($img) !== '') ? trim($img) : ($update['image'] ?? null);
                }
            }
        } catch (\Throwable $e) {
            $this->activityLog(
                $request,
                'update_me_failed',
                'users',
                'users',
                (int)$user->id,
                ['image'],
                ['image' => $oldImage],
                null,
                'Image update failed: ' . $e->getMessage()
            );

            return response()->json([
                'success' => false,
                'error'   => $e->getMessage(),
            ], 422);
        }

        // Metadata
        if (array_key_exists('metadata', $data)) {
            $update['metadata'] = $data['metadata'] !== null ? json_encode($data['metadata']) : null;
        }

        if (empty($update)) {
            $fresh = DB::table('users')->select($this->userSelectColumns())->where('id', $user->id)->first();
            return response()->json(['success' => true, 'data' => $fresh]);
        }

        $update['updated_at'] = Carbon::now();

        // snapshots for log
        $changedFields = array_keys($update);
        $oldVals = [];
        $newVals = [];
        foreach ($changedFields as $f) {
            $oldVals[$f] = $user->{$f} ?? null;
            $newVals[$f] = $update[$f] ?? null;
        }

        DB::table('users')->where('id', $user->id)->update($update);

        $this->logWithActor('msit.users.update_me', $request, [
            'user_id' => $user->id,
        ]);

        // ✅ ACTIVITY LOG (update_me)
        $this->activityLog(
            $request,
            'update_me',
            'users',
            'users',
            (int)$user->id,
            $changedFields,
            $oldVals,
            $newVals,
            'Self profile updated'
        );

        $fresh = DB::table('users')
            ->select($this->userSelectColumns())
            ->where('id', $user->id)
            ->first();

        return response()->json([
            'success' => true,
            'data'    => $fresh,
        ]);
    }

    /* ============================================
     | PUBLIC: Faculty Index
     | GET /api/public/faculty
     |============================================ */
    public function facultyindex(Request $request)
    {
        $page    = max(1, (int)$request->query('page', 1));
        $perPage = (int)$request->query('per_page', 12);
        $perPage = max(6, min(60, $perPage));

        $qText    = trim((string)$request->query('q', ''));
        $status   = trim((string)$request->query('status', 'active')) ?: 'active';
        $deptUuid = trim((string)$request->query('dept_uuid', ''));

        $sort = (string)$request->query('sort', 'created_at');
        $dir  = strtolower((string)$request->query('direction', 'desc')) === 'asc' ? 'asc' : 'desc';

        $allowedSort = ['created_at','updated_at','name','id'];
        if (!in_array($sort, $allowedSort, true)) $sort = 'created_at';

        // ✅ exclude roles
        $excludedRoles = ['super_admin', 'admin', 'author', 'student', 'students', 'alumni', 'program_topper']; // ✅ NEW author // ✅ added program_topper

        // ✅ detect where dept mapping exists
        $upiHasDept  = Schema::hasColumn('user_personal_information', 'department_id');
        $userHasDept = Schema::hasColumn('users', 'department_id');

        $base = DB::table('users as u')
            ->leftJoin('user_personal_information as upi', 'upi.user_id', '=', 'u.id')
            ->whereNull('u.deleted_at')
            ->whereNotIn('u.role', $excludedRoles)
            ->where('u.status', $status)
            ->where(function ($w) {
                $w->whereNull('upi.id')->orWhereNull('upi.deleted_at');
            });

        // ✅ join departments if possible
        if ($upiHasDept) {
            $base->leftJoin('departments as d', 'd.id', '=', 'upi.department_id');
        } elseif ($userHasDept) {
            $base->leftJoin('departments as d', 'd.id', '=', 'u.department_id');
        }

        // ✅ dept filter by dept_uuid
        if ($deptUuid !== '') {
            $dept = DB::table('departments')
                ->select(['id','uuid','title'])
                ->where('uuid', $deptUuid)
                ->whereNull('deleted_at')
                ->first();

            if (!$dept) {
                return response()->json([
                    'success' => true,
                    'data' => [],
                    'pagination' => [
                        'page' => $page,
                        'per_page' => $perPage,
                        'total' => 0,
                        'last_page' => 1,
                    ],
                ]);
            }

            $deptId = (int)$dept->id;

            $base->where(function ($w) use ($deptId, $upiHasDept, $userHasDept) {
                if ($upiHasDept)  $w->orWhere('upi.department_id', $deptId);
                if ($userHasDept) $w->orWhere('u.department_id', $deptId);
            });
        }

        if ($qText !== '') {
            $term = '%' . $qText . '%';
            $base->where(function ($w) use ($term) {
                $w->where('u.name', 'like', $term)
                  ->orWhere('u.name_short_form', 'like', $term)   // ✅ NEW
                  ->orWhere('u.employee_id', 'like', $term)       // ✅ NEW
                  ->orWhere('u.email', 'like', $term)
                  ->orWhere('upi.affiliation', 'like', $term)
                  ->orWhere('upi.specification', 'like', $term)
                  ->orWhere('upi.experience', 'like', $term)
                  ->orWhere('upi.interest', 'like', $term)
                  ->orWhere('upi.administration', 'like', $term)
                  ->orWhere('upi.research_project', 'like', $term);
            });
        }

        $total    = (clone $base)->distinct('u.id')->count('u.id');
        $lastPage = max(1, (int)ceil($total / $perPage));

        $deptIdSelect = $upiHasDept ? 'upi.department_id' : ($userHasDept ? 'u.department_id' : null);

        // ✅ only add these cols if exist (avoid breaking before migration)
        $hasNameShort = Schema::hasColumn('users', 'name_short_form');
        $hasEmpId     = Schema::hasColumn('users', 'employee_id');

        $rows = (clone $base)
            ->select(array_filter([
                'u.id',
                'u.uuid',
                'u.slug',
                'u.name',
                $hasNameShort ? 'u.name_short_form' : null, // ✅ NEW
                'u.email',
                'u.image',
                'u.role',
                'u.role_short_form',
                $hasEmpId ? 'u.employee_id' : null, // ✅ NEW
                'u.status',
                'u.created_at',
                'u.updated_at',

                'upi.uuid as personal_info_uuid',
                'upi.qualification',
                'upi.affiliation',
                'upi.specification',
                'upi.experience',
                'upi.interest',
                'upi.administration',
                'upi.research_project',

                // ✅ department fields
                $deptIdSelect ? DB::raw($deptIdSelect . ' as department_id') : null,
                ($upiHasDept || $userHasDept) ? 'd.uuid as department_uuid' : null,
                ($upiHasDept || $userHasDept) ? 'd.title as department_title' : null,
            ]))
            ->orderBy($sort === 'name' ? 'u.name' : 'u.' . $sort, $dir)
            ->orderBy('u.id', 'desc')
            ->forPage($page, $perPage)
            ->get();

        // socials (same as your code)
        $ids = $rows->pluck('id')->filter()->values()->all();
        $socialsByUserId = [];

        if (!empty($ids)) {
            $socialRows = DB::table('user_social_media as usm')
                ->select([
                    'usm.user_id',
                    'usm.platform',
                    'usm.icon',
                    'usm.link',
                    'usm.sort_order',
                    'usm.metadata',
                ])
                ->whereIn('usm.user_id', $ids)
                ->whereNull('usm.deleted_at')
                ->where('usm.active', 1)
                ->orderBy('usm.sort_order', 'asc')
                ->orderBy('usm.id', 'asc')
                ->get();

            foreach ($socialRows as $s) {
                $platform = strtolower(trim((string)$s->platform));
                $socialsByUserId[(int)$s->user_id][] = [
                    'platform'   => $platform,
                    'icon'       => (string)($s->icon ?? ''),
                    'url'        => (string)($s->link ?? ''),
                    'sort_order' => (int)($s->sort_order ?? 0),
                    'metadata'   => $this->maybeJson($s->metadata),
                ];
            }
        }

        $rows->each(function ($r) use ($socialsByUserId) {
            $r->socials = $socialsByUserId[(int)$r->id] ?? [];
        });

        $items = $rows->map(fn($r) => $this->normalizeRow($r))->values()->all();

        return response()->json([
            'success' => true,
            'data' => $items,
            'pagination' => [
                'page'      => $page,
                'per_page'  => $perPage,
                'total'     => $total,
                'last_page' => $lastPage,
            ],
        ]);
    }

    /* =========================
     | Helpers for Faculty API
     * ========================= */

    protected function maybeJson($v)
    {
        if ($v === null) return null;
        if (is_array($v) || is_object($v)) return $v;
        $s = trim((string)$v);
        if ($s === '') return null;
        try { return json_decode($s, true, 512, JSON_THROW_ON_ERROR); }
        catch (\Throwable $e) { return $v; }
    }

    protected function toUrl(?string $path): ?string
    {
        $path = trim((string)$path);
        if ($path === '') return null;

        // already absolute
        if (preg_match('~^https?://~i', $path)) return $path;

        // normalize to /...
        $path = '/' . ltrim($path, '/');

        return rtrim(config('app.url'), '/') . $path;
    }

    protected function normalizeRow($r): array
    {
        $qualification = $this->maybeJson($r->qualification);
        if (is_array($qualification)) {
            // keep array -> frontend can join
        } elseif ($qualification === null) {
            $qualification = null;
        } else {
            $qualification = (string)$qualification;
        }

        // website can also be stored as a "website" platform row (optional)
        $website = null;
        $socials = [];
        $rawSocials = is_array($r->socials ?? null) ? $r->socials : [];

        foreach ($rawSocials as $s) {
            $plat = strtolower(trim((string)($s['platform'] ?? '')));
            $url  = trim((string)($s['url'] ?? ''));

            if ($plat === 'website' || $plat === 'site' || $plat === 'web' || $plat === 'personal_website') {
                if ($website === null && $url !== '') $website = $url;
                continue; // don’t show website as icon
            }

            $socials[] = [
                'platform'   => $plat,
                'icon'       => (string)($s['icon'] ?? ''),
                'url'        => $url,
                'sort_order' => (int)($s['sort_order'] ?? 0),
            ];
        }

        return [
            'id' => (int)$r->id,
            'uuid' => (string)$r->uuid,
            'slug' => (string)($r->slug ?? ''),
            'name' => (string)($r->name ?? ''),
            'name_short_form' => (string)($r->name_short_form ?? ''), // ✅ NEW
            'employee_id' => (string)($r->employee_id ?? ''),         // ✅ NEW
            'email' => (string)($r->email ?? ''),

            'image' => (string)($r->image ?? ''),
            'image_full_url' => $this->toUrl($r->image),

            // this line in your screenshot is basically "designation"
            'designation' => (string)($r->affiliation ?? ''),

            'qualification' => $qualification,
            'specification' => (string)($r->specification ?? ''),
            'experience' => (string)($r->experience ?? ''),

            'website' => $website,

            'department_id'    => isset($r->department_id) ? (int)$r->department_id : null,
            'department_uuid'  => (string)($r->department_uuid ?? ''),
            'department_title' => (string)($r->department_title ?? ''),

            // ✅ socials come from user_social_media
            'socials' => $socials,
        ];
    }

    /* ============================================
     | PUBLIC: Placement Officer Index
     | GET /api/public/placement-officers
     |============================================ */
    public function placementOfficerIndex(Request $request)
    {
        $page    = max(1, (int)$request->query('page', 1));
        $perPage = (int)$request->query('per_page', 12);
        $perPage = max(6, min(60, $perPage));

        $qText   = trim((string)$request->query('q', ''));
        $status  = trim((string)$request->query('status', 'active')) ?: 'active';

        // ✅ allow multiple param names (frontend can use any)
        $deptUuid = trim((string)(
            $request->query('dept_uuid', '') ?:
            $request->query('department_uuid', '') ?:
            $request->query('department', '')
        ));

        $sort = (string)$request->query('sort', 'created_at');
        $dir  = strtolower((string)$request->query('direction', 'desc')) === 'asc' ? 'asc' : 'desc';

        $allowedSort = ['created_at','updated_at','name','id'];
        if (!in_array($sort, $allowedSort, true)) $sort = 'created_at';

        // ✅ keep only placement roles (your normalizeRole stores: placement_officer)
        $placementRoles = [
            'placement_officer',
            'placement_officer_admin',
            'tpo',
            'training_placement_officer',
            'placement',
            'placement_cell',
        ];

        // ✅ detect where dept mapping exists
        $upiHasDept  = Schema::hasColumn('user_personal_information', 'department_id');
        $userHasDept = Schema::hasColumn('users', 'department_id');

        $base = DB::table('users as u')
            ->leftJoin('user_personal_information as upi', 'upi.user_id', '=', 'u.id')
            ->whereNull('u.deleted_at')
            ->where('u.status', $status)
            ->where(function ($w) use ($placementRoles) {
                $w->whereIn('u.role', $placementRoles)
                  ->orWhere('u.role_short_form', 'TPO');
            })
            ->where(function ($w) {
                $w->whereNull('upi.id')->orWhereNull('upi.deleted_at');
            });

        // ✅ join departments (support both storages)
        if ($upiHasDept) {
            $base->leftJoin('departments as d_upi', function ($join) {
                $join->on('d_upi.id', '=', 'upi.department_id')
                     ->whereNull('d_upi.deleted_at');
            });
        }
        if ($userHasDept) {
            $base->leftJoin('departments as d_user', function ($join) {
                $join->on('d_user.id', '=', 'u.department_id')
                     ->whereNull('d_user.deleted_at');
            });
        }

        // ✅ dept filter by dept_uuid (optional)
        if ($deptUuid !== '') {
            if (!($upiHasDept || $userHasDept)) {
                return response()->json([
                    'success' => true,
                    'data' => [],
                    'pagination' => [
                        'page' => $page,
                        'per_page' => $perPage,
                        'total' => 0,
                        'last_page' => 1,
                    ],
                ]);
            }

            $dept = DB::table('departments')
                ->select(['id','uuid','title'])
                ->where('uuid', $deptUuid)
                ->whereNull('deleted_at')
                ->first();

            if (!$dept) {
                return response()->json([
                    'success' => true,
                    'data' => [],
                    'pagination' => [
                        'page' => $page,
                        'per_page' => $perPage,
                        'total' => 0,
                        'last_page' => 1,
                    ],
                ]);
            }

            $deptId = (int)$dept->id;

            $base->where(function ($w) use ($deptId, $upiHasDept, $userHasDept) {
                if ($upiHasDept)  $w->orWhere('upi.department_id', $deptId);
                if ($userHasDept) $w->orWhere('u.department_id', $deptId);
            });
        }

        // ✅ search
        if ($qText !== '') {
            $term = '%' . $qText . '%';
            $base->where(function ($w) use ($term) {
                $w->where('u.name', 'like', $term)
                  ->orWhere('u.name_short_form', 'like', $term)   // ✅ NEW
                  ->orWhere('u.employee_id', 'like', $term)       // ✅ NEW
                  ->orWhere('u.email', 'like', $term)
                  ->orWhere('upi.affiliation', 'like', $term)
                  ->orWhere('upi.specification', 'like', $term)
                  ->orWhere('upi.experience', 'like', $term)
                  ->orWhere('upi.interest', 'like', $term)
                  ->orWhere('upi.administration', 'like', $term)
                  ->orWhere('upi.research_project', 'like', $term);
            });
        }

        $total    = (clone $base)->distinct('u.id')->count('u.id');
        $lastPage = max(1, (int)ceil($total / $perPage));

        // ✅ select dept fields correctly
        $deptIdSelect = null;
        $deptUuidSelect = null;
        $deptTitleSelect = null;

        if ($upiHasDept && $userHasDept) {
            $deptIdSelect    = DB::raw('COALESCE(upi.department_id, u.department_id) as department_id');
            $deptUuidSelect  = DB::raw('COALESCE(d_upi.uuid, d_user.uuid) as department_uuid');
            $deptTitleSelect = DB::raw('COALESCE(d_upi.title, d_user.title) as department_title');
        } elseif ($upiHasDept) {
            $deptIdSelect    = DB::raw('upi.department_id as department_id');
            $deptUuidSelect  = DB::raw('d_upi.uuid as department_uuid');
            $deptTitleSelect = DB::raw('d_upi.title as department_title');
        } elseif ($userHasDept) {
            $deptIdSelect    = DB::raw('u.department_id as department_id');
            $deptUuidSelect  = DB::raw('d_user.uuid as department_uuid');
            $deptTitleSelect = DB::raw('d_user.title as department_title');
        }

        $hasNameShort = Schema::hasColumn('users', 'name_short_form');
        $hasEmpId     = Schema::hasColumn('users', 'employee_id');

        $rows = (clone $base)
            ->select(array_filter([
                'u.id',
                'u.uuid',
                'u.slug',
                'u.name',
                $hasNameShort ? 'u.name_short_form' : null, // ✅ NEW
                'u.email',
                'u.image',
                'u.role',
                'u.role_short_form',
                $hasEmpId ? 'u.employee_id' : null, // ✅ NEW
                'u.status',
                'u.created_at',
                'u.updated_at',

                'upi.uuid as personal_info_uuid',
                'upi.qualification',
                'upi.affiliation',
                'upi.specification',
                'upi.experience',
                'upi.interest',
                'upi.administration',
                'upi.research_project',

                // ✅ dept fields
                $deptIdSelect,
                $deptUuidSelect,
                $deptTitleSelect,
            ]))
            ->orderBy($sort === 'name' ? 'u.name' : 'u.' . $sort, $dir)
            ->orderBy('u.id', 'desc')
            ->forPage($page, $perPage)
            ->get();

        // socials (same as your code)
        $ids = $rows->pluck('id')->filter()->values()->all();
        $socialsByUserId = [];

        if (!empty($ids)) {
            $socialRows = DB::table('user_social_media as usm')
                ->select([
                    'usm.user_id',
                    'usm.platform',
                    'usm.icon',
                    'usm.link',
                    'usm.sort_order',
                    'usm.metadata',
                ])
                ->whereIn('usm.user_id', $ids)
                ->whereNull('usm.deleted_at')
                ->where('usm.active', 1)
                ->orderBy('usm.sort_order', 'asc')
                ->orderBy('usm.id', 'asc')
                ->get();

            foreach ($socialRows as $s) {
                $platform = strtolower(trim((string)$s->platform));
                $socialsByUserId[(int)$s->user_id][] = [
                    'platform'   => $platform,
                    'icon'       => (string)($s->icon ?? ''),
                    'url'        => (string)($s->link ?? ''),
                    'sort_order' => (int)($s->sort_order ?? 0),
                    'metadata'   => $this->maybeJson($s->metadata),
                ];
            }
        }

        $rows->each(function ($r) use ($socialsByUserId) {
            $r->socials = $socialsByUserId[(int)$r->id] ?? [];
        });

        $items = $rows->map(fn($r) => $this->normalizeRow($r))->values()->all();

        return response()->json([
            'success' => true,
            'data' => $items,
            'pagination' => [
                'page'      => $page,
                'per_page'  => $perPage,
                'total'     => $total,
                'last_page' => $lastPage,
            ],
        ]);
    }

    public function exportUsersCsv(Request $request)
    {
        // ✅ APPLY accessControl here (export)
        $actorId = (int) $request->attributes->get('auth_tokenable_id');
        $ac      = $this->accessControl($actorId);

        if ($ac['mode'] === 'not_allowed') return response()->json(['error' => 'Not allowed'], 403);

        $filename = 'users_export_' . now()->format('Y-m-d_His') . '.csv';

        $hasNameShort = Schema::hasColumn('users', 'name_short_form');
        $hasEmpId     = Schema::hasColumn('users', 'employee_id');
        $hasDept      = Schema::hasColumn('users', 'department_id'); // ✅ NEW

        // ✅ keep original first columns, append new ones at end (won't break simple consumers)
        $selectCols = array_filter([
            'name',
            'email',
            'phone_number',
            'role',
            $hasNameShort ? 'name_short_form' : null,
            $hasEmpId ? 'employee_id' : null,
            $hasDept ? 'department_id' : null, // ✅ NEW
        ]);

        $query = DB::table('users')
            ->select($selectCols)
            ->whereNull('deleted_at')
            ->orderBy('id', 'asc');

        // ✅ department scoping
        if ($ac['mode'] === 'none') {
            $query->whereRaw('1=0'); // empty export
        } elseif ($ac['mode'] === 'department' && $hasDept) {
            $query->where('department_id', (int)$ac['department_id']);
        }

        // ✅ optional filter: /api/users/export-csv?role=student
        if ($request->filled('role')) {
            $query->where('role', $request->query('role'));
        }

        $headers = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
            'Cache-Control'       => 'no-store, no-cache, must-revalidate',
            'Pragma'              => 'no-cache',
        ];

        return response()->stream(function () use ($query, $hasNameShort, $hasEmpId, $hasDept) {
            $out = fopen('php://output', 'w');

            // header (original + optional new)
            $header = ['name', 'email', 'phno', 'role'];
            if ($hasNameShort) $header[] = 'name_short_form';
            if ($hasEmpId)     $header[] = 'employee_id';
            if ($hasDept)      $header[] = 'department_id';
            fputcsv($out, $header);

            $seenEmail = [];
            $seenPhone = [];

            foreach ($query->cursor() as $u) {
                $name  = trim((string)($u->name ?? ''));
                $email = strtolower(trim((string)($u->email ?? '')));
                $phno  = trim((string)($u->phone_number ?? ''));
                $role  = trim((string)($u->role ?? ''));

                if ($name === '' && $email === '' && $phno === '' && $role === '') continue;

                if ($email !== '') {
                    if (isset($seenEmail[$email])) continue;
                    $seenEmail[$email] = true;
                }

                if ($phno !== '') {
                    if (isset($seenPhone[$phno])) continue;
                    $seenPhone[$phno] = true;
                }

                $row = [$name, $email, $phno, $role];
                if ($hasNameShort) $row[] = trim((string)($u->name_short_form ?? ''));
                if ($hasEmpId)     $row[] = trim((string)($u->employee_id ?? ''));
                if ($hasDept)      $row[] = (string)($u->department_id ?? '');
                fputcsv($out, $row);
            }

            fclose($out);
        }, 200, $headers);
    }

    public function importUsersCsv(Request $request)
    {
        // ✅ APPLY accessControl here (import)
        $actorId = (int) $request->attributes->get('auth_tokenable_id');
        $ac      = $this->accessControl($actorId);

        if ($ac['mode'] === 'not_allowed' || $ac['mode'] === 'none') {
            $this->activityLog($request, 'import_denied', 'users', 'users', null, null, null, null, 'Not allowed');
            return response()->json(['error' => 'Not allowed'], 403);
        }

        $forcedDeptId = ($ac['mode'] === 'department') ? (int)$ac['department_id'] : null;

        // keep same behavior, but log validation error too
        try {
            $request->validate([
                'file' => 'required|file|mimes:csv,txt',
                'update_existing' => 'nullable|boolean',
                'create_missing'  => 'nullable|boolean',
            ]);
        } catch (ValidationException $ve) {
            $this->activityLog(
                $request,
                'import_failed_validation',
                'users',
                'users',
                null,
                ['file','update_existing','create_missing'],
                null,
                null,
                'Validation failed'
            );
            throw $ve;
        }

        $updateExisting = (bool) $request->input('update_existing', true);
        $createMissing  = (bool) $request->input('create_missing', true);

        // ✅ default password if CSV password is missing
        $DEFAULT_PASSWORD = '12345678';

        $file = $request->file('file');
        $path = $file->getRealPath();

        $imported = 0;
        $updated  = 0;
        $skipped  = 0;

        // ✅ NEW: academic counters
        $academicCreated = 0;
        $academicUpdated = 0;
        $academicSkipped = 0;

        $errors   = [];

        $handle = fopen($path, 'r');
        if (!$handle) {
            $this->activityLog($request, 'import_failed', 'users', 'users', null, null, null, null, 'Failed to read uploaded CSV');
            return response()->json(['success' => false, 'error' => 'Failed to read uploaded CSV.'], 422);
        }

        $header = fgetcsv($handle);
        if (!$header) {
            fclose($handle);
            $this->activityLog($request, 'import_failed', 'users', 'users', null, null, null, null, 'CSV header missing');
            return response()->json(['success' => false, 'error' => 'CSV header missing.'], 422);
        }

        // ✅ normalize header (remove BOM on first column too)
        $cols = array_map(function ($h) {
            $h = trim((string)$h);
            $h = preg_replace('/^\xEF\xBB\xBF/', '', $h); // BOM
            return strtolower($h);
        }, $header);

        $idx = array_flip($cols);

        foreach (['name', 'email'] as $c) {
            if (!array_key_exists($c, $idx)) {
                fclose($handle);
                $this->activityLog($request, 'import_failed', 'users', 'users', null, null, null, ['missing' => $c], "Missing required column: {$c}");
                return response()->json(['success' => false, 'error' => "Missing required column: {$c}"], 422);
            }
        }

        $hasNameShort = Schema::hasColumn('users', 'name_short_form');
        $hasEmpId     = Schema::hasColumn('users', 'employee_id');
        $hasDept      = Schema::hasColumn('users', 'department_id'); // ✅ NEW safety

        // ✅ if dept scoping is required, but users.dept is missing => block (matches accessControl safety)
        if ($forcedDeptId !== null && !$hasDept) {
            fclose($handle);
            $this->activityLog($request, 'import_denied', 'users', 'users', null, ['department_id'], null, ['forced_department_id' => $forcedDeptId], 'Dept column missing');
            return response()->json(['success' => false, 'error' => 'Not allowed'], 403);
        }

        // ✅ tiny helpers
        $get = function(array $row, string $key) use ($idx) {
            if (!isset($idx[$key])) return null;
            $v = $row[$idx[$key]] ?? null;
            $v = is_string($v) ? trim($v) : $v;
            return ($v === '' ? null : $v);
        };

        $getAny = function(array $row, array $keys) use ($get) {
            foreach ($keys as $k) {
                $v = $get($row, $k);
                if ($v !== null) return $v;
            }
            return null;
        };

        $makeUniqueSlug = function(string $base, ?int $ignoreId = null) {
            $base = Str::slug($base) ?: 'user';
            $try = $base;

            $i = 0;
            while (true) {
                $q = DB::table('users')->where('slug', $try);
                if ($ignoreId) $q->where('id', '!=', $ignoreId);
                if (!$q->exists()) break;

                $i++;
                $try = $base . '-' . Str::lower(Str::random(6));
                if ($i > 30) break;
            }
            return $try;
        };

        // ✅ always student short form
        $roleShort = function() {
            return 'STD';
        };

        // ✅ resolve id from uuid helper
        $idFromUuid = function(string $table, ?string $uuid): ?int {
            if (!$uuid) return null;
            if (!Schema::hasTable($table)) return null;
            if (!Schema::hasColumn($table, 'uuid')) return null;
            $id = DB::table($table)->where('uuid', $uuid)->value('id');
            return $id ? (int) $id : null;
        };

        // ✅ academic mode: if header contains academic columns
        $hasAcademicHeader = (
            isset($idx['course_uuid']) || isset($idx['course_id']) ||
            isset($idx['semester_uuid']) || isset($idx['semester_id']) ||
            isset($idx['section_uuid']) || isset($idx['section_id']) ||
            isset($idx['roll_no']) || isset($idx['registration_no']) ||
            isset($idx['admission_no'])
        );

        $rowNum = 1;

        DB::beginTransaction();
        try {

            while (($row = fgetcsv($handle)) !== false) {
                $rowNum++;

                // skip blank row
                if (count(array_filter($row, fn($v) => trim((string)$v) !== '')) === 0) {
                    continue;
                }

                $name  = $get($row, 'name');
                $email = $get($row, 'email');

                if (!$email) { $skipped++; $errors[] = ['row' => $rowNum, 'error' => 'Email missing']; continue; }
                if (!$name)  { $skipped++; $errors[] = ['row' => $rowNum, 'error' => 'Name missing']; continue; }

                $email = strtolower(trim($email));

                // ✅ NEW optional CSV fields
                $nameShort = $getAny($row, ['name_short_form', 'short_name', 'name_short', 'initials']);
                $empId     = $getAny($row, ['employee_id', 'emp_id', 'employeeid']);

                // ✅ FORCE role student (because this import page is only for students)
                $role  = 'student';
                $short = $roleShort();

                // status
                $stRaw  = strtolower((string)($getAny($row, ['status']) ?? 'active'));
                $status = ($stRaw === 'inactive') ? 'inactive' : 'active';

                // department_id (optional)
                $dep = $getAny($row, ['department_id', 'dept_id', 'department']);
                $departmentId = null;
                if ($dep !== null) {
                    $depInt = (int)$dep;
                    $departmentId = $depInt > 0 ? $depInt : null;
                }

                // ✅ FORCE department_id if actor is department-scoped
                if ($forcedDeptId !== null) {
                    $departmentId = $forcedDeptId;
                }

                // uuid/slug from csv if present, else generate
                $uuid = $getAny($row, ['uuid']);
                if (!$uuid || strlen((string)$uuid) < 10) $uuid = (string) Str::uuid();

                $slugInCsv = $getAny($row, ['slug']);
                $slugBase  = $slugInCsv ?: $name;

                // password: use CSV password if present, else default
                $csvPassword   = $getAny($row, ['password', 'pass']);
                $finalPassword = ($csvPassword !== null && trim((string)$csvPassword) !== '')
                    ? trim((string)$csvPassword)
                    : $DEFAULT_PASSWORD;

                // optional fields
                $phone    = $getAny($row, ['phone_number','phone','mobile','phno']);
                $altEmail = $getAny($row, ['alternative_email','alt_email']);
                $altPhone = $getAny($row, ['alternative_phone_number','alt_phone']);
                $wa       = $getAny($row, ['whatsapp_number','whatsapp']);
                $image    = $getAny($row, ['image','image_url']);
                $address  = $getAny($row, ['address']);

                // ✅ normalize phone (remove spaces)
                if (is_string($phone)) {
                    $phone = trim($phone);
                    $phone = preg_replace('/\s+/', '', $phone);
                    if ($phone === '') $phone = null;
                }

                // find existing even if soft deleted
                $existing = DB::table('users')->where('email', $email)->first();

                // ✅ dept scoping: do not update users from other departments
                if ($forcedDeptId !== null && $existing && $hasDept) {
                    $exDept = (int)($existing->department_id ?? 0);
                    if ($exDept > 0 && $exDept !== (int)$forcedDeptId) {
                        $skipped++;
                        $errors[] = ['row' => $rowNum, 'error' => 'Not allowed: user belongs to another department'];
                        continue;
                    }
                }

                // ✅ phone duplicate check
                if ($phone !== null) {
                    $phoneOwnerId = DB::table('users')
                        ->where('phone_number', $phone)
                        ->value('id');

                    if ($phoneOwnerId && (!$existing || (int)$phoneOwnerId !== (int)$existing->id)) {
                        $skipped++;
                        $errors[] = [
                            'row' => $rowNum,
                            'error' => 'This number already exists',
                            'phone_number' => $phone,
                        ];
                        continue;
                    }
                }

                $now = now();
                $userId = null;

                try {

                    if ($existing) {
                        if (!$updateExisting) { $skipped++; continue; }

                        $newSlug = $existing->slug;
                        if ($slugInCsv) {
                            $newSlug = $makeUniqueSlug($slugBase, (int)$existing->id);
                        }

                        $updateData = [
                            'name'            => $name,
                            'email'           => $email,
                            'role'            => $role,
                            'role_short_form' => $short,
                            'status'          => $status,
                            'slug'            => $newSlug ?: $existing->slug,
                            'uuid'            => $existing->uuid ?: $uuid,
                            'updated_at'      => $now,
                            'deleted_at'      => null, // ✅ restore if soft deleted
                        ];

                        if ($hasDept) {
                            $updateData['department_id'] = $departmentId ?? ($existing->department_id ?? null);
                        }

                        // ✅ NEW optional fields
                        if ($hasNameShort && $nameShort !== null) $updateData['name_short_form'] = $nameShort;
                        if ($hasEmpId && $empId !== null)         $updateData['employee_id']     = $empId;

                        if ($phone !== null)    $updateData['phone_number'] = $phone;
                        if ($altEmail !== null) $updateData['alternative_email'] = $altEmail;
                        if ($altPhone !== null) $updateData['alternative_phone_number'] = $altPhone;
                        if ($wa !== null)       $updateData['whatsapp_number'] = $wa;
                        if ($image !== null)    $updateData['image'] = $image;
                        if ($address !== null)  $updateData['address'] = $address;

                        // ✅ update password only if provided explicitly in CSV
                        if ($csvPassword !== null && trim((string)$csvPassword) !== '') {
                            $updateData['password'] = Hash::make($finalPassword);
                        }

                        DB::table('users')->where('id', $existing->id)->update($updateData);
                        $updated++;

                        $userId = (int)$existing->id;

                    } else {
                        if (!$createMissing) { $skipped++; continue; }

                        $newSlug = $makeUniqueSlug($slugBase, null);

                        $insertData = [
                            'uuid'            => $uuid,
                            'name'            => $name,
                            'slug'            => $newSlug,
                            'email'           => $email,
                            'password'        => Hash::make($finalPassword),
                            'role'            => $role,
                            'role_short_form' => $short,
                            'status'          => $status,
                            'created_at'      => $now,
                            'updated_at'      => $now,
                        ];

                        if ($hasDept) {
                            $insertData['department_id'] = $departmentId;
                        }

                        // ✅ NEW optional fields
                        if ($hasNameShort && $nameShort !== null) $insertData['name_short_form'] = $nameShort;
                        if ($hasEmpId && $empId !== null)         $insertData['employee_id']     = $empId;

                        if ($phone !== null)    $insertData['phone_number'] = $phone;
                        if ($altEmail !== null) $insertData['alternative_email'] = $altEmail;
                        if ($altPhone !== null) $insertData['alternative_phone_number'] = $altPhone;
                        if ($wa !== null)       $insertData['whatsapp_number'] = $wa;
                        if ($image !== null)    $insertData['image'] = $image;
                        if ($address !== null)  $insertData['address'] = $address;

                        $userId = (int) DB::table('users')->insertGetId($insertData);
                        $imported++;
                    }

                } catch (\Illuminate\Database\QueryException $qe) {
                    $skipped++;

                    $msg = $qe->getMessage();
                    if (Str::contains($msg, 'users_phone_number_unique')) {
                        $errors[] = ['row' => $rowNum, 'error' => 'This number already exists', 'phone_number' => $phone];
                        continue;
                    }

                    $errors[] = ['row' => $rowNum, 'error' => 'User row error: ' . $qe->getMessage()];
                    continue;
                }

                // =========================================================
                // ✅ ACADEMIC DETAILS IMPORT (same API)
                // =========================================================
                if ($hasAcademicHeader && $userId > 0 && Schema::hasTable('student_academic_details')) {

                    $courseUuid = $getAny($row, ['course_uuid']);
                    $courseIdRaw = $getAny($row, ['course_id']);

                    $hasCourseInput = ($courseUuid !== null && $courseUuid !== '') || ($courseIdRaw !== null && (int)$courseIdRaw > 0);

                    if (!$hasCourseInput) {
                        $academicSkipped++;
                        continue;
                    }

                    try {
                        // ✅ department id: from CSV OR users.department_id (if exists)
                        $finalDeptId = $departmentId ?: ($hasDept ? (int) (DB::table('users')->where('id', $userId)->value('department_id') ?? 0) : 0);
                        if ($finalDeptId <= 0) {
                            $academicSkipped++;
                            $errors[] = ['row' => $rowNum, 'error' => 'Academic skipped: department_id missing'];
                            continue;
                        }

                        // ✅ course: UUID -> ID (preferred)
                        $finalCourseId = null;
                        if ($courseUuid) {
                            $finalCourseId = $idFromUuid('courses', $courseUuid);
                        }
                        if (!$finalCourseId && $courseIdRaw) {
                            $finalCourseId = (int) $courseIdRaw;
                        }
                        if (!$finalCourseId || $finalCourseId <= 0) {
                            $academicSkipped++;
                            $errors[] = ['row' => $rowNum, 'error' => 'Academic skipped: invalid course_uuid/course_id'];
                            continue;
                        }

                        // ✅ optional semester/section (uuid preferred)
                        $semUuid = $getAny($row, ['semester_uuid']);
                        $secUuid = $getAny($row, ['section_uuid']);

                        $semIdRaw = $getAny($row, ['semester_id']);
                        $secIdRaw = $getAny($row, ['section_id']);

                        $finalSemId = $semUuid ? $idFromUuid('course_semesters', $semUuid) : null;
                        if (!$finalSemId && $semIdRaw) $finalSemId = (int)$semIdRaw;

                        $finalSecId = $secUuid ? $idFromUuid('course_semester_sections', $secUuid) : null;
                        if (!$finalSecId && $secIdRaw) $finalSecId = (int)$secIdRaw;

                        $acadStatus = strtolower((string)($getAny($row, ['acad_status','academic_status']) ?? 'active'));
                        if (!in_array($acadStatus, ['active','inactive','passed-out'], true)) $acadStatus = 'active';

                        // optional academic columns
                        $acadYear   = $getAny($row, ['academic_year']);
                        $year       = $getAny($row, ['year']);
                        $rollNo     = $getAny($row, ['roll_no']);
                        $regNo      = $getAny($row, ['registration_no']);
                        $admNo      = $getAny($row, ['admission_no']);
                        $admDate    = $getAny($row, ['admission_date']);
                        $batch      = $getAny($row, ['batch']);
                        $session    = $getAny($row, ['session']);
                        $attendance = $getAny($row, ['attendance_percentage']);

                        // upsert by user_id (one academic record per user)
                        $existingAcad = DB::table('student_academic_details')
                            ->where('user_id', $userId)
                            ->first();

                        $acadPayload = [
                            'department_id' => $finalDeptId,
                            'course_id'     => $finalCourseId,
                            'semester_id'   => ($finalSemId && $finalSemId > 0) ? $finalSemId : null,
                            'section_id'    => ($finalSecId && $finalSecId > 0) ? $finalSecId : null,

                            'academic_year' => $acadYear,
                            'year'          => ($year !== null && is_numeric($year)) ? (int)$year : null,
                            'roll_no'       => $rollNo,
                            'registration_no' => $regNo,
                            'admission_no'  => $admNo,
                            'admission_date'=> $admDate,
                            'batch'         => $batch,
                            'session'       => $session,
                            'attendance_percentage' => ($attendance !== null && is_numeric($attendance)) ? (float)$attendance : null,

                            'status'        => $acadStatus,
                            'updated_at'    => $now,
                        ];

                        // ✅ keep user department synced (only if users.department_id exists)
                        if ($hasDept) {
                            DB::table('users')->where('id', $userId)->update([
                                'department_id' => $finalDeptId,
                                'updated_at'    => $now,
                            ]);
                        }

                        if ($existingAcad) {
                            DB::table('student_academic_details')
                                ->where('id', $existingAcad->id)
                                ->update($acadPayload);

                            $academicUpdated++;
                        } else {
                            $acadPayload['user_id']    = $userId;
                            $acadPayload['uuid']       = (string) Str::uuid();
                            $acadPayload['created_at'] = $now;

                            // optionally created_by
                            if (Schema::hasColumn('student_academic_details', 'created_by')) {
                                $actor = $this->actor($request);
                                $acadPayload['created_by'] = $actor['id'] ?: null;
                            }

                            DB::table('student_academic_details')->insert($acadPayload);
                            $academicCreated++;
                        }

                    } catch (\Throwable $e) {
                        $academicSkipped++;
                        $errors[] = ['row' => $rowNum, 'error' => 'Academic error: ' . $e->getMessage()];
                    }
                }
            }

            DB::commit();

        } catch (\Throwable $e) {
            DB::rollBack();
            fclose($handle);

            $this->activityLog(
                $request,
                'import_failed',
                'users',
                'users',
                null,
                null,
                null,
                ['row' => $rowNum],
                'Import failed: ' . $e->getMessage()
            );

            return response()->json([
                'success' => false,
                'error'   => $e->getMessage(),
                'row'     => $rowNum,
            ], 500);
        }

        fclose($handle);

        // ✅ ACTIVITY LOG (import summary)
        $this->activityLog(
            $request,
            'import',
            'users',
            'users',
            null,
            ['imported','updated','skipped','academic_created','academic_updated','academic_skipped'],
            null,
            [
                'imported' => $imported,
                'updated'  => $updated,
                'skipped'  => $skipped,
                'academic_created' => $academicCreated,
                'academic_updated' => $academicUpdated,
                'academic_skipped' => $academicSkipped,
                'errors_count' => is_array($errors) ? count($errors) : 0,
            ],
            'CSV import finished'
        );

        return response()->json([
            'success' => true,
            'imported' => $imported,
            'updated'  => $updated,
            'skipped'  => $skipped,

            // ✅ new academic report
            'academic_created' => $academicCreated,
            'academic_updated' => $academicUpdated,
            'academic_skipped' => $academicSkipped,

            'errors' => $errors,
        ]);
    }
}
