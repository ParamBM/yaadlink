<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\UserActivityLogger;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ContactQueryController extends Controller
{
    private const ADMIN_CACHE_VERSION_KEY = 'contact_queries_admin_cache_version';

    private ?bool $tableExists = null;
    private array $columnExists = [];

    private function hasColumn(string $column): bool
    {
        if ($this->tableExists === null) {
            $this->tableExists = Schema::hasTable('contact_queries');
        }

        if (!$this->tableExists) {
            return false;
        }

        if (!array_key_exists($column, $this->columnExists)) {
            $this->columnExists[$column] = Schema::hasColumn('contact_queries', $column);
        }

        return $this->columnExists[$column];
    }

    private function adminCacheVersion(): int
    {
        return (int) Cache::get(self::ADMIN_CACHE_VERSION_KEY, 1);
    }

    private function adminCacheKey(array $query): string
    {
        return 'contact_queries_admin_' . $this->adminCacheVersion() . '_' . md5(json_encode($query));
    }

    private function invalidateAdminCache(): void
    {
        Cache::forever(self::ADMIN_CACHE_VERSION_KEY, $this->adminCacheVersion() + 1);
    }

    private function activityActorOverride(Request $request): ?array
    {
        $userId = $request->attributes->get('auth_tokenable_id');

        if ($userId !== null) {
            return null;
        }

        return [
            'id' => 0,
            'role' => 'guest',
            'type' => 'guest',
        ];
    }

    private function activityLog(
        Request $request,
        string $activity,
        ?int $recordId = null,
        ?array $changedFields = null,
        mixed $oldValues = null,
        mixed $newValues = null,
        ?string $note = null
    ): void {
        UserActivityLogger::log(
            $request,
            $activity,
            'contact_queries',
            'contact_queries',
            $recordId,
            $changedFields,
            $oldValues,
            $newValues,
            $note,
            $this->activityActorOverride($request)
        );
    }

    private function baseQuery()
    {
        $query = DB::table('contact_queries');

        if ($this->hasColumn('deleted_at')) {
            $query->whereNull('deleted_at');
        }

        return $query;
    }

    private function normalize($row): ?array
    {
        if (!$row) {
            return null;
        }

        $row = (array) $row;

        return [
            'id' => (int) ($row['id'] ?? 0),
            'uuid' => $row['uuid'] ?? null,
            'name' => $row['name'] ?? null,
            'email' => $row['email'] ?? null,
            'phone' => $row['phone'] ?? null,
            'subject' => $row['subject'] ?? null,
            'message' => $row['message'] ?? null,
            'status' => $row['status'] ?? 'new',
            'admin_note' => $row['admin_note'] ?? null,
            'ip' => $row['ip'] ?? null,
            'user_agent' => $row['user_agent'] ?? null,
            'read_at' => $row['read_at'] ?? null,
            'resolved_at' => $row['resolved_at'] ?? null,
            'created_at' => $row['created_at'] ?? null,
            'updated_at' => $row['updated_at'] ?? null,
        ];
    }

    public function captcha(Request $request)
    {
        $left = random_int(2, 12);
        $right = random_int(1, 9);
        $id = (string) Str::uuid();

        Cache::put("contact_captcha_{$id}", $left + $right, now()->addMinutes(10));

        return response()->json([
            'success' => true,
            'data' => [
                'captcha_id' => $id,
                'question' => "{$left} + {$right}",
            ],
        ]);
    }

    public function store(Request $request)
    {
        $v = Validator::make($request->all(), [
            'name' => ['nullable', 'string', 'max:120'],
            'email' => ['nullable', 'email', 'max:190'],
            'phone' => ['required', 'string', 'max:40'],
            'subject' => ['nullable', 'string', 'max:180'],
            'message' => ['nullable', 'string', 'max:5000'],
            'captcha_id' => ['required', 'string', 'max:80'],
            'captcha_answer' => ['required', 'integer'],
            'website' => ['nullable', 'string', 'max:0'],
        ]);

        if ($v->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $v->errors(),
            ], 422);
        }

        $data = $v->validated();
        $cacheKey = 'contact_captcha_' . $data['captcha_id'];
        $expected = Cache::pull($cacheKey);

        if ($expected === null || (int) $expected !== (int) $data['captcha_answer']) {
            $this->activityLog(
                $request,
                'captcha_failed',
                null,
                ['phone', 'captcha_id'],
                null,
                ['phone' => $data['phone'] ?? null, 'captcha_id' => $data['captcha_id'] ?? null],
                'Contact query captcha failed'
            );

            return response()->json([
                'success' => false,
                'errors' => [
                    'captcha_answer' => ['Captcha answer is incorrect.'],
                ],
            ], 422);
        }

        $now = Carbon::now();
        $insertData = [
            'created_at' => $now,
            'updated_at' => $now,
        ];

        foreach (['name', 'email', 'phone', 'subject', 'message'] as $column) {
            if ($this->hasColumn($column)) {
                $value = array_key_exists($column, $data) ? trim((string) $data[$column]) : null;
                $insertData[$column] = $value === '' && $column !== 'phone' ? null : $value;
            }
        }

        if ($this->hasColumn('uuid')) {
            $insertData['uuid'] = (string) Str::uuid();
        }

        if ($this->hasColumn('status')) {
            $insertData['status'] = 'new';
        }

        if ($this->hasColumn('ip')) {
            $insertData['ip'] = $request->ip();
        }

        if ($this->hasColumn('user_agent')) {
            $ua = (string) ($request->userAgent() ?? '');
            $insertData['user_agent'] = strlen($ua) > 512 ? substr($ua, 0, 512) : $ua;
        }

        $id = DB::table('contact_queries')->insertGetId($insertData);
        $query = DB::table('contact_queries')->where('id', $id)->first();
        $this->invalidateAdminCache();

        $this->activityLog(
            $request,
            'create',
            $id,
            array_keys($insertData),
            null,
            [
                'contact_query_id' => $id,
                'name' => $insertData['name'] ?? null,
                'email' => $insertData['email'] ?? null,
                'phone' => $insertData['phone'] ?? null,
                'subject' => $insertData['subject'] ?? null,
                'status' => $insertData['status'] ?? null,
            ],
            'Contact query submitted'
        );

        return response()->json([
            'success' => true,
            'message' => 'Your message has been received.',
            'data' => $this->normalize($query),
        ], 201);
    }

    public function index(Request $request)
    {
        $params = [
            'status' => $request->query('status'),
            'search' => $request->query('search'),
            'page' => (int) $request->query('page', 1),
            'per_page' => min(max((int) $request->query('per_page', 20), 1), 100),
        ];

        $payload = Cache::remember($this->adminCacheKey($params), now()->addMinute(), function () use ($params) {
            $query = $this->baseQuery();

            if ($params['status']) {
                $query->where('status', $params['status']);
            }

            if ($params['search']) {
                $search = '%' . str_replace(['%', '_'], ['\\%', '\\_'], trim((string) $params['search'])) . '%';
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', $search)
                        ->orWhere('email', 'like', $search)
                        ->orWhere('phone', 'like', $search)
                        ->orWhere('subject', 'like', $search)
                        ->orWhere('message', 'like', $search);
                });
            }

            $total = (clone $query)->count();
            $rows = $query
                ->orderByDesc('created_at')
                ->offset(($params['page'] - 1) * $params['per_page'])
                ->limit($params['per_page'])
                ->get()
                ->map(fn ($row) => $this->normalize($row))
                ->values()
                ->all();

            return [
                'data' => $rows,
                'pagination' => [
                    'page' => $params['page'],
                    'per_page' => $params['per_page'],
                    'total' => $total,
                    'last_page' => (int) ceil($total / $params['per_page']),
                ],
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $payload['data'],
            'pagination' => $payload['pagination'],
        ]);
    }

    public function update(Request $request, $id)
    {
        $query = $this->baseQuery()->where('id', $id)->first();

        if (!$query) {
            return response()->json([
                'success' => false,
                'error' => 'Contact query not found',
            ], 404);
        }

        $v = Validator::make($request->all(), [
            'status' => ['sometimes', 'required', Rule::in(['new', 'read', 'resolved', 'archived'])],
            'admin_note' => ['nullable', 'string', 'max:5000'],
        ]);

        if ($v->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $v->errors(),
            ], 422);
        }

        $data = $v->validated();
        $updates = ['updated_at' => Carbon::now()];

        if (array_key_exists('status', $data) && $this->hasColumn('status')) {
            $updates['status'] = $data['status'];

            if ($this->hasColumn('read_at') && in_array($data['status'], ['read', 'resolved'], true) && !$query->read_at) {
                $updates['read_at'] = Carbon::now();
            }

            if ($this->hasColumn('resolved_at')) {
                $updates['resolved_at'] = $data['status'] === 'resolved' ? Carbon::now() : null;
            }
        }

        if (array_key_exists('admin_note', $data) && $this->hasColumn('admin_note')) {
            $note = trim((string) ($data['admin_note'] ?? ''));
            $updates['admin_note'] = $note === '' ? null : $note;
        }

        DB::table('contact_queries')->where('id', $id)->update($updates);
        $updated = DB::table('contact_queries')->where('id', $id)->first();
        $this->invalidateAdminCache();

        $this->activityLog(
            $request,
            'update',
            (int) $id,
            array_keys($updates),
            [
                'status' => $query->status ?? null,
                'admin_note' => $query->admin_note ?? null,
            ],
            [
                'status' => $updated->status ?? null,
                'admin_note' => $updated->admin_note ?? null,
            ],
            'Contact query updated'
        );

        return response()->json([
            'success' => true,
            'message' => 'Contact query updated successfully',
            'data' => $this->normalize($updated),
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $query = $this->baseQuery()->where('id', $id)->first();

        if (!$query) {
            return response()->json([
                'success' => false,
                'error' => 'Contact query not found',
            ], 404);
        }

        if ($this->hasColumn('deleted_at')) {
            DB::table('contact_queries')->where('id', $id)->update([
                'deleted_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
        } else {
            DB::table('contact_queries')->where('id', $id)->delete();
        }

        $this->invalidateAdminCache();

        $this->activityLog(
            $request,
            'delete',
            (int) $id,
            ['deleted_at'],
            $this->normalize($query),
            null,
            'Contact query deleted'
        );

        return response()->json([
            'success' => true,
            'message' => 'Contact query deleted successfully',
        ]);
    }
}
