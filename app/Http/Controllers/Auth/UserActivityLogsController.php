<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;

class UserActivityLogsController extends Controller
{
    /**
     * Return a DB expression to extract a JSON key from a JSON column (best-effort by driver).
     */
    private function jsonExtractExpr(string $colRef, string $key): ?\Illuminate\Database\Query\Expression
    {
        // key whitelist for safety
        if (!preg_match('/^[a-zA-Z0-9_]+$/', $key)) return null;

        $driver = DB::getDriverName();

        // MySQL / MariaDB
        if ($driver === 'mysql' || $driver === 'mariadb') {
            return DB::raw("JSON_UNQUOTE(JSON_EXTRACT($colRef, '$.$key'))");
        }

        // PostgreSQL
        if ($driver === 'pgsql') {
            return DB::raw("($colRef::jsonb ->> '$key')");
        }

        // SQLite
        if ($driver === 'sqlite') {
            return DB::raw("json_extract($colRef, '$.$key')");
        }

        return null;
    }

    /**
     * GET /api/activity-logs
     */
    public function index(Request $request)
    {
        $page     = max(1, (int) $request->get('page', 1));
        $perPage  = (int) $request->get('per_page', 20);
        $perPage  = max(10, min(100, $perPage));

        $search      = trim((string) $request->get('search', ''));
        $name        = trim((string) $request->get('name', ''));
        $role        = trim((string) $request->get('role', ''));
        $userId      = (int) $request->get('user_id', 0);
        
        $action      = trim((string) $request->get('action', ''));      // exact match
        $actionLike  = trim((string) $request->get('action_like', '')); // partial match

        $storyId        = (int) $request->get('story_id', 0);
        $themeId        = (int) $request->get('theme_id', 0);
        $occasionTypeId = (int) $request->get('occasion_type_id', 0);

        $from = $request->get('from'); // YYYY-MM-DD
        $to   = $request->get('to');   // YYYY-MM-DD

        $modulesRaw = trim((string) $request->get('modules', ''));
        $modules = array_values(array_filter(array_map('trim', explode(',', $modulesRaw))));

        // sort
        $sort = (string) $request->get('sort', 'created_at');
        $dir  = strtolower((string) $request->get('dir', 'desc')) === 'asc' ? 'asc' : 'desc';

        $sortWhitelist = [
            'created_at' => 'l.created_at',
            'module'     => 'l.module',
            'activity'   => 'l.activity',
            'role'       => 'l.performed_by_role',
        ];
        $sortCol = $sortWhitelist[$sort] ?? 'l.created_at';

        $driver = DB::getDriverName();

        // Determine which joins are needed
        $needStories   = $storyId > 0 || in_array('stories', $modules) || in_array('story', $modules);
        $needThemes    = $themeId > 0 || in_array('themes', $modules) || in_array('theme', $modules);
        $needOccasions = $occasionTypeId > 0 || in_array('occasion_types', $modules) || in_array('occasion-types', $modules) || in_array('occasions', $modules);

        // JSON extract helpers
        if ($driver === 'mysql') {
            $jsonText = function(string $col, string $path) {
                return "NULLIF(JSON_UNQUOTE(JSON_EXTRACT($col, '$.$path')), '')";
            };
            $jsonInt = function(string $col, string $path) use ($jsonText) {
                return "CAST(" . $jsonText($col, $path) . " AS UNSIGNED)";
            };
        } else {
            $jsonText = function(string $col, string $path) {
                return "NULLIF(($col->>'$path'),'')";
            };
            $jsonInt = function(string $col, string $path) use ($jsonText) {
                return "CAST(" . $jsonText($col, $path) . " AS BIGINT)";
            };
        }

        // Fallback IDs from JSON
        $metaStoryIdExpr = "COALESCE(
            {$jsonInt('l.new_values','story_id')},
            {$jsonInt('l.old_values','story_id')},
            {$jsonInt('l.new_values','id')}
        )";

        $metaThemeIdExpr = "COALESCE(
            {$jsonInt('l.new_values','theme_id')},
            {$jsonInt('l.old_values','theme_id')},
            {$jsonInt('l.new_values','id')}
        )";

        $metaOccasionIdExpr = "COALESCE(
            {$jsonInt('l.new_values','occasion_type_id')},
            {$jsonInt('l.old_values','occasion_type_id')},
            {$jsonInt('l.new_values','id')}
        )";

        // Base query
        $q = DB::table('user_data_activity_log as l');

        // ALWAYS join users
        $q->leftJoin('users as u', 'u.id', '=', 'l.performed_by');

        // Conditional joins
        if ($needStories) {
            $q->leftJoin('stories as s', function($join) {
                $join->on('s.id', '=', 'l.record_id')->where('l.table_name', '=', 'stories');
            });
        }

        if ($needThemes) {
            $q->leftJoin('themes as t', function($join) {
                $join->on('t.id', '=', 'l.record_id')->where('l.table_name', '=', 'themes');
            });
        }

        if ($needOccasions) {
            $q->leftJoin('occasion_types as ot', function($join) {
                $join->on('ot.id', '=', 'l.record_id')->where('l.table_name', '=', 'occasion_types');
            });
        }

        // Select fields
        $selectFields = [
            'l.id',
            'l.performed_by',
            'l.performed_by_role',
            'l.ip',
            'l.user_agent',
            'l.activity',
            'l.module',
            'l.table_name',
            'l.record_id',
            'l.changed_fields',
            'l.old_values',
            'l.new_values',
            'l.log_note',
            'l.created_at',
            
            DB::raw("COALESCE(u.name, CASE WHEN l.performed_by = 0 THEN 'Guest' ELSE NULL END) as performed_by_name"),
            DB::raw("u.email as performed_by_email"),
        ];

        if ($needStories) {
            $selectFields[] = DB::raw("COALESCE(s.id, (CASE WHEN l.table_name='stories' THEN l.record_id ELSE NULL END)) as story_id");
            $selectFields[] = DB::raw("COALESCE(s.slug, s.person_one_name) as story_title");
        } else {
            $selectFields[] = DB::raw("NULL as story_id");
            $selectFields[] = DB::raw("NULL as story_title");
        }

        if ($needThemes) {
            $selectFields[] = DB::raw("COALESCE(t.id, (CASE WHEN l.table_name='themes' THEN l.record_id ELSE NULL END)) as theme_id");
            $selectFields[] = DB::raw("t.name as theme_name");
        } else {
            $selectFields[] = DB::raw("NULL as theme_id");
            $selectFields[] = DB::raw("NULL as theme_name");
        }

        if ($needOccasions) {
            $selectFields[] = DB::raw("COALESCE(ot.id, (CASE WHEN l.table_name='occasion_types' THEN l.record_id ELSE NULL END)) as occasion_type_id");
            $selectFields[] = DB::raw("ot.name as occasion_type_name");
        } else {
            $selectFields[] = DB::raw("NULL as occasion_type_id");
            $selectFields[] = DB::raw("NULL as occasion_type_name");
        }

        $q->select($selectFields);

        // Filters
        if ($role !== '') {
            $q->where('l.performed_by_role', $role);
        }

        if ($userId > 0) {
            $q->where('l.performed_by', $userId);
        }

        if ($name !== '') {
            $q->where(function($w) use ($name) {
                $w->where('u.name', 'like', "%{$name}%")
                  ->orWhere('u.email', 'like', "%{$name}%");
            });
        }

        if (!empty($modules)) {
            $map = [
                'stories'        => ['stories','story'],
                'themes'         => ['themes','theme'],
                'occasion_types' => ['occasion_types','occasion-types','occasions'],
                'users'          => ['users','user'],
                'auth'           => ['auth'],
            ];

            $expanded = [];
            foreach ($modules as $m) {
                if (isset($map[$m])) $expanded = array_merge($expanded, $map[$m]);
                else $expanded[] = $m;
            }
            $expanded = array_values(array_unique($expanded));

            $q->whereIn('l.module', $expanded);
        }

        if ($action !== '') {
            $q->where('l.activity', $action);
        }

        if ($actionLike !== '' && $action === '') {
            $q->where('l.activity', 'like', "%{$actionLike}%");
        }

        if ($storyId > 0) {
            $q->where(function($w) use ($storyId, $metaStoryIdExpr) {
                $w->where(function($sub) use ($storyId) {
                    $sub->where('l.table_name', 'stories')->where('l.record_id', $storyId);
                })->orWhereRaw("($metaStoryIdExpr) = ?", [$storyId]);
            });
        }

        if ($themeId > 0) {
            $q->where(function($w) use ($themeId, $metaThemeIdExpr) {
                $w->where(function($sub) use ($themeId) {
                    $sub->where('l.table_name', 'themes')->where('l.record_id', $themeId);
                })->orWhereRaw("($metaThemeIdExpr) = ?", [$themeId]);
            });
        }

        if ($occasionTypeId > 0) {
            $q->where(function($w) use ($occasionTypeId, $metaOccasionIdExpr) {
                $w->where(function($sub) use ($occasionTypeId) {
                    $sub->where('l.table_name', 'occasion_types')->where('l.record_id', $occasionTypeId);
                })->orWhereRaw("($metaOccasionIdExpr) = ?", [$occasionTypeId]);
            });
        }

        if (!empty($from)) {
            try {
                $q->where('l.created_at', '>=', Carbon::parse($from)->startOfDay());
            } catch (\Throwable $e) {
                $q->whereRaw('1 = 0');
            }
        }
        if (!empty($to)) {
            try {
                $q->where('l.created_at', '<=', Carbon::parse($to)->endOfDay());
            } catch (\Throwable $e) {
                $q->whereRaw('1 = 0');
            }
        }

        if ($search !== '') {
            $q->where(function($w) use ($search) {
                $w->where('l.activity', 'like', "%{$search}%")
                  ->orWhere('l.module', 'like', "%{$search}%")
                  ->orWhere('l.table_name', 'like', "%{$search}%")
                  ->orWhere('l.log_note', 'like', "%{$search}%")
                  ->orWhere('u.name', 'like', "%{$search}%")
                  ->orWhere('u.email', 'like', "%{$search}%");
            });
        }

        // Ordering + Pagination
        $q->orderBy($sortCol, $dir);

        $p = $q->paginate($perPage, ['*'], 'page', $page);

        $items = collect($p->items())->map(function ($item) {
            if (isset($item->created_at)) {
                $item->created_at = Carbon::parse($item->created_at)->toIso8601String();
            }
            return $item;
        });

        return response()->json([
            'data' => $items,
            'pagination' => [
                'page'      => $p->currentPage(),
                'per_page'  => $p->perPage(),
                'total'     => $p->total(),
                'last_page' => $p->lastPage(),
            ]
        ]);
    }
}
