<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DashboardAnalyticsController extends Controller
{
    public function index(Request $request)
    {
        $days = (int) $request->query('days', 30);
        $days = max(7, min(90, $days));

        $cacheKey = "dashboard_analytics_{$days}";

        $data = Cache::remember($cacheKey, now()->addSeconds(60), function () use ($days) {
            return $this->buildPayload($days);
        });

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    private function buildPayload(int $days): array
    {
        $now = now();
        $periodStart = $now->copy()->subDays($days - 1)->startOfDay();
        $last7Days = $now->copy()->subDays(6)->startOfDay();
        $todayStart = $now->copy()->startOfDay();

        $totalUsers = $this->tableExists('users') ? DB::table('users')->count() : 0;
        $activeUsers = $this->tableExists('users') && $this->columnExists('users', 'status')
            ? DB::table('users')->where('status', $this->userStatusStorageValue('active'))->count()
            : $totalUsers;
        $inactiveUsers = max(0, $totalUsers - $activeUsers);

        $totalStories = $this->tableExists('stories') ? DB::table('stories')->count() : 0;
        $publishedStories = $this->tableExists('stories') && $this->columnExists('stories', 'is_published')
            ? DB::table('stories')->where('is_published', true)->count()
            : $totalStories;
        $hiddenStories = max(0, $totalStories - $publishedStories);
        $totalViews = $this->tableExists('stories') && $this->columnExists('stories', 'view_count')
            ? (int) DB::table('stories')->sum('view_count')
            : 0;

        $activityTotal = $this->tableExists('user_data_activity_log')
            ? DB::table('user_data_activity_log')->count()
            : 0;
        $activityToday = $this->tableExists('user_data_activity_log')
            ? DB::table('user_data_activity_log')->where('created_at', '>=', $todayStart)->count()
            : 0;
        $recentLogins = $this->tableExists('user_data_activity_log')
            ? DB::table('user_data_activity_log')
                ->where('module', 'auth')
                ->where('activity', 'login')
                ->where('created_at', '>=', $last7Days)
                ->count()
            : 0;
        $activeTokens = $this->tableExists('personal_access_tokens')
            ? DB::table('personal_access_tokens')
                ->where(function ($query) use ($now) {
                    $query->whereNull('expires_at')->orWhere('expires_at', '>', $now);
                })
                ->count()
            : 0;

        return [
            'generated_at' => $now->toIso8601String(),
            'period' => [
                'days' => $days,
                'from' => $periodStart->toDateString(),
                'to' => $now->toDateString(),
            ],
            'summary' => [
                'total_users' => $totalUsers,
                'active_users' => $activeUsers,
                'inactive_users' => $inactiveUsers,
                'total_stories' => $totalStories,
                'published_stories' => $publishedStories,
                'hidden_stories' => $hiddenStories,
                'total_views' => $totalViews,
                'average_views_per_story' => $totalStories > 0 ? round($totalViews / $totalStories, 1) : 0,
                'themes' => $this->tableExists('themes') ? DB::table('themes')->count() : 0,
                'occasion_types' => $this->tableExists('occasion_types') ? DB::table('occasion_types')->count() : 0,
                'activity_logs' => $activityTotal,
                'activity_today' => $activityToday,
                'logins_last_7_days' => $recentLogins,
                'active_tokens' => $activeTokens,
                'page_views_recorded' => $this->tableExists('story_page_views')
                    ? DB::table('story_page_views')->count()
                    : 0,
            ],
            'breakdowns' => [
                'users_by_status' => [
                    ['label' => 'Active', 'value' => $activeUsers],
                    ['label' => 'Inactive', 'value' => $inactiveUsers],
                ],
                'users_by_role' => $this->usersByRole(),
                'stories_by_status' => [
                    ['label' => 'Published', 'value' => $publishedStories],
                    ['label' => 'Hidden', 'value' => $hiddenStories],
                ],
                'activity_by_module' => $this->activityBreakdown('module', 8, $periodStart),
                'activity_by_action' => $this->activityBreakdown('activity', 8, $periodStart),
                'views_by_theme' => $this->viewsByDimension('themes', 'theme_id', 'theme'),
                'views_by_occasion' => $this->viewsByDimension('occasion_types', 'occasion_type_id', 'occasion'),
            ],
            'trends' => [
                'story_views' => $this->storyViewsTrend($days),
                'stories_created' => $this->tableTrend('stories', $days),
                'activity' => $this->tableTrend('user_data_activity_log', $days),
            ],
            'top' => [
                'pages' => $this->topPages($periodStart),
                'users_by_views' => $this->topUsersByViews(),
                'active_users' => $this->topActiveUsers($periodStart),
            ],
            'recent_activity' => $this->recentActivity(),
        ];
    }

    private function fixImageUrl(?string $url): ?string
    {
        if (!$url) {
            return null;
        }

        if (preg_match('/^http:\/\/127\.0\.0\.1:8000\/(.*)$/', $url, $matches)) {
            return '/' . $matches[1];
        }

        if (preg_match('/^http:\/\/localhost:8000\/(.*)$/', $url, $matches)) {
            return '/' . $matches[1];
        }

        return $url;
    }

    private function tableExists(string $table): bool
    {
        return Schema::hasTable($table);
    }

    private function columnExists(string $table, string $column): bool
    {
        return $this->tableExists($table) && Schema::hasColumn($table, $column);
    }

    private function userStatusStorageValue(string $status): string|int
    {
        if (!$this->columnExists('users', 'status')) {
            return $status;
        }

        try {
            $type = strtolower((string) Schema::getColumnType('users', 'status'));
        } catch (\Throwable $e) {
            return $status;
        }

        return in_array($type, ['bool', 'boolean', 'tinyint', 'smallint', 'mediumint', 'integer', 'int', 'bigint'], true)
            ? ($status === 'active' ? 1 : 0)
            : $status;
    }

    private function usersByRole(): array
    {
        if (!$this->tableExists('users') || !$this->columnExists('users', 'role')) {
            return [];
        }

        return DB::table('users')
            ->selectRaw("COALESCE(NULLIF(role, ''), 'unknown') as label, COUNT(*) as value")
            ->groupBy('role')
            ->orderByDesc('value')
            ->limit(10)
            ->get()
            ->map(fn ($row) => [
                'label' => $this->titleLabel($row->label),
                'value' => (int) $row->value,
            ])
            ->values()
            ->all();
    }

    private function activityBreakdown(string $column, int $limit, Carbon $from): array
    {
        if (!$this->tableExists('user_data_activity_log') || !$this->columnExists('user_data_activity_log', $column)) {
            return [];
        }

        return DB::table('user_data_activity_log')
            ->selectRaw("COALESCE(NULLIF({$column}, ''), 'unknown') as label, COUNT(*) as value")
            ->where('created_at', '>=', $from)
            ->groupBy($column)
            ->orderByDesc('value')
            ->limit($limit)
            ->get()
            ->map(fn ($row) => [
                'label' => $this->titleLabel($row->label),
                'value' => (int) $row->value,
            ])
            ->values()
            ->all();
    }

    private function viewsByDimension(string $dimensionTable, string $foreignKey, string $fallback): array
    {
        if (!$this->tableExists('stories')
            || !$this->tableExists($dimensionTable)
            || !$this->columnExists('stories', $foreignKey)
            || !$this->columnExists('stories', 'view_count')) {
            return [];
        }

        return DB::table('stories as s')
            ->leftJoin("{$dimensionTable} as d", 'd.id', '=', "s.{$foreignKey}")
            ->selectRaw("COALESCE(d.name, ?) as label, COUNT(s.id) as story_count, COALESCE(SUM(s.view_count), 0) as value", [ucfirst($fallback) . ' not set'])
            ->groupBy('d.name')
            ->orderByDesc('value')
            ->limit(8)
            ->get()
            ->map(fn ($row) => [
                'label' => (string) $row->label,
                'value' => (int) $row->value,
                'story_count' => (int) $row->story_count,
            ])
            ->values()
            ->all();
    }

    private function topPages(Carbon $periodStart): array
    {
        if (!$this->tableExists('stories') || !$this->columnExists('stories', 'view_count')) {
            return [];
        }

        $query = DB::table('stories as s')
            ->leftJoin('users as u', 'u.id', '=', 's.user_id')
            ->leftJoin('themes as t', 't.id', '=', 's.theme_id')
            ->leftJoin('occasion_types as o', 'o.id', '=', 's.occasion_type_id');

        if ($this->tableExists('story_page_views')) {
            $periodViews = DB::table('story_page_views')
                ->selectRaw('story_id, COUNT(*) as period_views')
                ->where('created_at', '>=', $periodStart)
                ->groupBy('story_id');

            $query->leftJoinSub($periodViews, 'pv', 'pv.story_id', '=', 's.id');
        }

        $select = [
                's.id',
                's.slug',
                's.person_one_name',
                's.person_two_name',
                's.tagline',
                's.cover_image_url',
                's.view_count',
                's.is_published',
                's.published_at',
                'u.name as creator_name',
                't.name as theme_name',
                'o.name as occasion_name',
        ];

        $select[] = $this->tableExists('story_page_views')
            ? DB::raw('COALESCE(pv.period_views, 0) as period_views')
            : DB::raw('0 as period_views');

        return $query
            ->select($select)
            ->orderByDesc('s.view_count')
            ->orderByDesc('s.id')
            ->limit(10)
            ->get()
            ->map(fn ($story) => [
                'id' => (int) $story->id,
                'slug' => (string) $story->slug,
                'title' => $this->storyTitle($story),
                'tagline' => $story->tagline,
                'cover_image_url' => $this->fixImageUrl($story->cover_image_url),
                'view_count' => (int) $story->view_count,
                'period_views' => (int) $story->period_views,
                'is_published' => (bool) $story->is_published,
                'published_at' => $story->published_at,
                'creator_name' => $story->creator_name,
                'theme_name' => $story->theme_name,
                'occasion_name' => $story->occasion_name,
                'url' => $story->slug ? "/story/{$story->slug}" : null,
            ])
            ->values()
            ->all();
    }

    private function topUsersByViews(): array
    {
        if (!$this->tableExists('stories') || !$this->tableExists('users') || !$this->columnExists('stories', 'view_count')) {
            return [];
        }

        return DB::table('stories as s')
            ->join('users as u', 'u.id', '=', 's.user_id')
            ->selectRaw('u.id, u.name, u.email, u.image, u.role, COUNT(s.id) as story_count, COALESCE(SUM(s.view_count), 0) as total_views, MAX(s.view_count) as highest_story_views')
            ->groupBy('u.id', 'u.name', 'u.email', 'u.image', 'u.role')
            ->orderByDesc('total_views')
            ->limit(10)
            ->get()
            ->map(fn ($row) => [
                'id' => (int) $row->id,
                'name' => (string) $row->name,
                'email' => (string) $row->email,
                'image' => $this->fixImageUrl($row->image),
                'role' => $row->role,
                'story_count' => (int) $row->story_count,
                'total_views' => (int) $row->total_views,
                'highest_story_views' => (int) $row->highest_story_views,
            ])
            ->values()
            ->all();
    }

    private function topActiveUsers(Carbon $from): array
    {
        if (!$this->tableExists('user_data_activity_log') || !$this->tableExists('users')) {
            return [];
        }

        return DB::table('user_data_activity_log as l')
            ->leftJoin('users as u', 'u.id', '=', 'l.performed_by')
            ->selectRaw("l.performed_by as id, COALESCE(u.name, CASE WHEN l.performed_by = 0 THEN 'Guest' ELSE 'Unknown' END) as name, u.email, u.image, u.role, COUNT(l.id) as activity_count")
            ->where('l.created_at', '>=', $from)
            ->groupBy('l.performed_by', 'u.name', 'u.email', 'u.image', 'u.role')
            ->orderByDesc('activity_count')
            ->limit(8)
            ->get()
            ->map(fn ($row) => [
                'id' => (int) $row->id,
                'name' => (string) $row->name,
                'email' => $row->email,
                'image' => $this->fixImageUrl($row->image),
                'role' => $row->role,
                'activity_count' => (int) $row->activity_count,
            ])
            ->values()
            ->all();
    }

    private function recentActivity(): array
    {
        if (!$this->tableExists('user_data_activity_log')) {
            return [];
        }

        return DB::table('user_data_activity_log as l')
            ->leftJoin('users as u', 'u.id', '=', 'l.performed_by')
            ->select([
                'l.id',
                'l.activity',
                'l.module',
                'l.table_name',
                'l.record_id',
                'l.log_note',
                'l.created_at',
                'u.name as performed_by_name',
                'u.email as performed_by_email',
            ])
            ->orderByDesc('l.created_at')
            ->limit(8)
            ->get()
            ->map(fn ($row) => [
                'id' => (int) $row->id,
                'activity' => $row->activity,
                'module' => $row->module,
                'table_name' => $row->table_name,
                'record_id' => $row->record_id ? (int) $row->record_id : null,
                'log_note' => $row->log_note,
                'created_at' => Carbon::parse($row->created_at)->toIso8601String(),
                'performed_by_name' => $row->performed_by_name ?: 'Guest',
                'performed_by_email' => $row->performed_by_email,
            ])
            ->values()
            ->all();
    }

    private function tableTrend(string $table, int $days): array
    {
        if (!$this->tableExists($table) || !$this->columnExists($table, 'created_at')) {
            return $this->emptyTrend($days);
        }

        $from = now()->subDays($days - 1)->startOfDay();
        $dateExpr = $this->dateExpression('created_at');

        $rows = DB::table($table)
            ->selectRaw("{$dateExpr} as day, COUNT(*) as value")
            ->where('created_at', '>=', $from)
            ->groupBy('day')
            ->orderBy('day')
            ->get()
            ->keyBy('day');

        return $this->fillTrend($days, fn ($day) => (int) ($rows->get($day)?->value ?? 0));
    }

    private function storyViewsTrend(int $days): array
    {
        if ($this->tableExists('story_page_views')) {
            return $this->tableTrend('story_page_views', $days);
        }

        if (!$this->tableExists('stories') || !$this->columnExists('stories', 'created_at') || !$this->columnExists('stories', 'view_count')) {
            return $this->emptyTrend($days);
        }

        $from = now()->subDays($days - 1)->startOfDay();
        $dateExpr = $this->dateExpression('created_at');

        $rows = DB::table('stories')
            ->selectRaw("{$dateExpr} as day, COALESCE(SUM(view_count), 0) as value")
            ->where('created_at', '>=', $from)
            ->groupBy('day')
            ->orderBy('day')
            ->get()
            ->keyBy('day');

        return $this->fillTrend($days, fn ($day) => (int) ($rows->get($day)?->value ?? 0));
    }

    private function emptyTrend(int $days): array
    {
        return $this->fillTrend($days, fn () => 0);
    }

    private function fillTrend(int $days, callable $resolver): array
    {
        $start = now()->subDays($days - 1)->startOfDay();
        $trend = [];

        for ($index = 0; $index < $days; $index++) {
            $date = $start->copy()->addDays($index);
            $day = $date->toDateString();

            $trend[] = [
                'date' => $day,
                'label' => $date->format('M d'),
                'value' => (int) $resolver($day),
            ];
        }

        return $trend;
    }

    private function dateExpression(string $column): string
    {
        $driver = DB::getDriverName();

        if ($driver === 'sqlsrv') {
            return "CONVERT(date, {$column})";
        }

        return "DATE({$column})";
    }

    private function storyTitle(object $story): string
    {
        $first = trim((string) ($story->person_one_name ?? ''));
        $second = trim((string) ($story->person_two_name ?? ''));
        $title = trim($first . ' & ' . $second, ' &');

        return $title !== '' ? $title : 'Untitled story';
    }

    private function titleLabel(?string $value): string
    {
        $value = trim((string) $value);

        if ($value === '') {
            return 'Unknown';
        }

        return ucwords(str_replace(['_', '-'], ' ', $value));
    }
}
