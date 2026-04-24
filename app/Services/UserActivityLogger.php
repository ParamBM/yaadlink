<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * Persists audit rows using only columns that actually exist on user_data_activity_log
 * (supports DBs that differ from the minimal migration in the repo).
 */
class UserActivityLogger
{
    /** @var array<string, array<string, string>> table => lowercase_col => actual_col */
    private static array $columnMapCache = [];

    public static function actorFromRequest(Request $request): array
    {
        return [
            'role' => $request->attributes->get('auth_role'),
            'type' => $request->attributes->get('auth_tokenable_type'),
            'id'   => (int) ($request->attributes->get('auth_tokenable_id') ?? 0),
        ];
    }

    /**
     * @param  array<string, mixed>|null  $actorOverride
     */
    public static function log(
        Request $request,
        string $activity,
        string $module,
        string $tableName,
        ?int $recordId = null,
        ?array $changedFields = null,
        mixed $oldValues = null,
        mixed $newValues = null,
        ?string $note = null,
        ?array $actorOverride = null
    ): void {
        try {
            $table = 'user_data_activity_log';

            if (!Schema::hasTable($table)) {
                return;
            }

            $a = $actorOverride ?: self::actorFromRequest($request);

            $performedBy = (int) ($a['id'] ?? 0);
            if ($performedBy < 0) {
                $performedBy = 0;
            }

            $performedRole = $a['role'] ?? null;
            $performedRole = is_string($performedRole) ? trim($performedRole) : null;
            if ($performedRole === '') {
                $performedRole = null;
            }

            $ua = (string) ($request->userAgent() ?? '');
            if (strlen($ua) > 512) {
                $ua = substr($ua, 0, 512);
            }

            $now = Carbon::now();

            $logical = [
                'performed_by'      => $performedBy,
                'performed_by_role' => $performedRole,
                'ip'                => $request->ip(),
                'user_agent'        => $ua,
                'activity'          => substr($activity, 0, 50),
                'module'            => substr($module, 0, 100),
                'table_name'        => substr($tableName, 0, 128),
                'record_id'         => $recordId !== null && $recordId > 0 ? $recordId : null,
                'changed_fields'    => $changedFields !== null
                    ? json_encode(self::sanitize($changedFields), JSON_UNESCAPED_UNICODE)
                    : null,
                'old_values' => $oldValues !== null
                    ? json_encode(self::sanitize($oldValues), JSON_UNESCAPED_UNICODE)
                    : null,
                'new_values' => $newValues !== null
                    ? json_encode(self::sanitize($newValues), JSON_UNESCAPED_UNICODE)
                    : null,
                'log_note'   => $note,
                'created_at' => $now,
                'updated_at' => $now,
            ];

            $aliases = [
                'performed_by'      => ['performed_by', 'user_id', 'actor_id', 'created_by'],
                'performed_by_role' => ['performed_by_role', 'role', 'actor_role', 'user_role'],
                'ip'                => ['ip', 'ip_address', 'client_ip'],
                'user_agent'        => ['user_agent', 'useragent', 'agent'],
                'activity'          => ['activity', 'action', 'event', 'event_type', 'type'],
                'module'            => ['module', 'section', 'area', 'context'],
                'table_name'        => ['table_name', 'resource', 'entity', 'target_table'],
                'record_id'         => ['record_id', 'entity_id', 'reference_id', 'row_id'],
                'changed_fields'    => ['changed_fields', 'changes', 'diff'],
                'old_values'        => ['old_values', 'old_data', 'before'],
                'new_values'        => ['new_values', 'new_data', 'after', 'payload', 'meta', 'meta_json', 'details'],
                'log_note'          => ['log_note', 'message', 'note', 'description', 'comment', 'remarks'],
                'created_at'        => ['created_at', 'inserted_at', 'created'],
                'updated_at'        => ['updated_at', 'modified_at', 'updated'],
            ];

            $payload = self::mapLogicalToPhysical($table, $logical, $aliases);

            if ($payload === []) {
                return;
            }

            DB::table($table)->insert($payload);
        } catch (\Throwable $e) {
            Log::warning('user_data_activity_log.write_failed', [
                'error'      => $e->getMessage(),
                'activity'   => $activity,
                'module'     => $module,
                'table_name' => $tableName,
                'record_id'  => $recordId,
            ]);
        }
    }

    /**
     * @param  array<string, mixed>  $logical
     * @param  array<string, list<string>>  $aliases
     * @return array<string, mixed>
     */
    private static function mapLogicalToPhysical(string $table, array $logical, array $aliases): array
    {
        $map = self::columnLookup($table);
        $out = [];

        foreach ($logical as $key => $value) {
            $names = $aliases[$key] ?? [$key];
            $physical = null;

            foreach ($names as $candidate) {
                $lc = strtolower($candidate);
                if (isset($map[$lc])) {
                    $physical = $map[$lc];
                    break;
                }
            }

            if ($physical === null) {
                continue;
            }

            if ($value === null && !in_array($key, ['created_at', 'updated_at'], true)) {
                continue;
            }

            if (is_string($value) && $key !== 'created_at' && $key !== 'updated_at') {
                $value = mb_substr($value, 0, 65000);
            }

            $out[$physical] = $value;
        }

        return $out;
    }

    /**
     * @return array<string, string> lowercase => actual column name
     */
    private static function columnLookup(string $table): array
    {
        if (!isset(self::$columnMapCache[$table])) {
            $cols = Schema::getColumnListing($table);
            $lookup = [];

            foreach ($cols as $col) {
                $lookup[strtolower($col)] = $col;
            }

            self::$columnMapCache[$table] = $lookup;
        }

        return self::$columnMapCache[$table];
    }

    private static function sanitize(mixed $data, int $depth = 0): mixed
    {
        if ($data === null) {
            return null;
        }

        if ($depth > 3) {
            if (is_array($data)) {
                return '[array]';
            }
            if (is_object($data)) {
                return '[object]';
            }

            return is_string($data) ? mb_substr($data, 0, 200) : $data;
        }

        if (is_bool($data) || is_int($data) || is_float($data)) {
            return $data;
        }

        if (is_string($data)) {
            $s = trim($data);
            if (mb_strlen($s) > 800) {
                $s = mb_substr($s, 0, 800).'…';
            }

            return $s;
        }

        if (is_object($data)) {
            $data = (array) $data;
        }

        if (is_array($data)) {
            $blockedKeys = [
                'password', 'current_password', 'token', 'plaintext', 'authorization',
                'abilities', 'remember_token',
            ];

            $out = [];
            $count = 0;

            foreach ($data as $k => $v) {
                $count++;
                if ($count > 60) {
                    $out['__truncated__'] = true;
                    break;
                }

                $key = is_string($k) ? strtolower($k) : $k;

                if (is_string($key) && in_array($key, $blockedKeys, true)) {
                    $out[$k] = '[redacted]';
                    continue;
                }

                $out[$k] = self::sanitize($v, $depth + 1);
            }

            return $out;
        }

        return (string) $data;
    }
}
