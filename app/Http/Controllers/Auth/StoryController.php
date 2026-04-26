<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\GeminiStoryEnhancer;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class StoryController extends Controller
{
    private function hasStoryColumn(string $column): bool
    {
        return Schema::hasTable('stories') && Schema::hasColumn('stories', $column);
    }

    private function isAdmin(Request $request): bool
    {
        return $request->attributes->get('auth_role') === 'admin';
    }

    private function canManagePublishing(Request $request): bool
    {
        return $this->currentUserId($request) !== null;
    }

    private function currentUserId(Request $request): ?int
    {
        $userId = $request->attributes->get('auth_tokenable_id');

        return $userId !== null ? (int) $userId : null;
    }

    private function parseBoolean($value): ?bool
    {
        return filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
    }

    private function normalizeSlug(string $value, string $fallback = 'story'): string
    {
        $slug = Str::slug($value);

        return $slug !== '' ? $slug : $fallback;
    }

    private function makeUniqueSlug(string $value, ?int $ignoreId = null): string
    {
        $baseSlug = $this->normalizeSlug($value);
        $slug = $baseSlug;
        $i = 1;

        while (true) {
            $query = DB::table('stories')->where('slug', $slug);

            if ($ignoreId !== null) {
                $query->where('id', '!=', $ignoreId);
            }

            if (!$query->exists()) {
                return $slug;
            }

            $slug = $baseSlug . '-' . $i;
            $i++;
        }
    }

    private function generateStorySlug(array $data): string
    {
        $partOne = trim((string) ($data['person_one_name'] ?? ''));
        $partTwo = trim((string) ($data['person_two_name'] ?? ''));
        $base = trim($partOne . ' ' . $partTwo . ' love story');

        return $this->makeUniqueSlug($base !== '' ? $base : 'story');
    }

    private function baseStoryQuery(bool $onlyTrashed = false)
    {
        $query = DB::table('stories');

        if ($this->hasStoryColumn('deleted_at')) {
            if ($onlyTrashed) {
                $query->whereNotNull('deleted_at');
            } else {
                $query->whereNull('deleted_at');
            }
        }

        if ($this->hasStoryColumn('published_at')) {
            $query->orderByDesc('published_at');
        }

        if ($this->hasStoryColumn('updated_at')) {
            $query->orderByDesc('updated_at');
        } else {
            $query->orderByDesc('id');
        }

        return $query;
    }

    private function authorizedStoryQuery(Request $request)
    {
        $trash = $this->isAdmin($request) && $request->boolean('trash');
        $query = $this->baseStoryQuery($trash);

        if (!$this->isAdmin($request) && $this->hasStoryColumn('user_id')) {
            $query->where('user_id', $this->currentUserId($request));
        }

        return $query;
    }

    private function applyStoryFilters($query, Request $request, bool $isPublic = false)
    {
        if ($this->hasStoryColumn('slug') && $request->filled('slug')) {
            $query->where('slug', $this->normalizeSlug($request->string('slug')->toString()));
        }

        if ($this->hasStoryColumn('theme_id') && $request->filled('theme_id')) {
            $query->where('theme_id', (int) $request->input('theme_id'));
        }

        if ($this->hasStoryColumn('occasion_type_id') && $request->filled('occasion_type_id')) {
            $query->where('occasion_type_id', (int) $request->input('occasion_type_id'));
        }

        if (!$isPublic && $this->hasStoryColumn('user_id') && $this->isAdmin($request) && $request->filled('user_id')) {
            $query->where('user_id', (int) $request->input('user_id'));
        }

        if ($this->hasStoryColumn('is_published') && $request->has('is_published')) {
            $isPublished = $this->parseBoolean($request->input('is_published'));

            if ($isPublished !== null) {
                $query->where('is_published', $isPublished);
            }
        }

        return $query;
    }

    private function fetchThemesByIds(array $ids)
    {
        if (empty($ids) || !Schema::hasTable('themes')) {
            return collect();
        }

        return DB::table('themes')
            ->whereIn('id', array_values(array_unique($ids)))
            ->get()
            ->keyBy('id');
    }

    private function fetchOccasionTypesByIds(array $ids)
    {
        if (empty($ids) || !Schema::hasTable('occasion_types')) {
            return collect();
        }

        return DB::table('occasion_types')
            ->whereIn('id', array_values(array_unique($ids)))
            ->get()
            ->keyBy('id');
    }

    private function fetchUsersByIds(array $ids)
    {
        if (empty($ids) || !Schema::hasTable('users')) {
            return collect();
        }

        $query = DB::table('users')
            ->whereIn('id', array_values(array_unique($ids)));

        if (Schema::hasColumn('users', 'deleted_at')) {
            $query->whereNull('deleted_at');
        }

        return $query
            ->select('id', 'name')
            ->get()
            ->keyBy('id');
    }

    private function normalizeTheme($theme): ?array
    {
        if (!$theme) {
            return null;
        }

        $theme = (array) $theme;

        if (array_key_exists('is_active', $theme)) {
            $theme['is_active'] = (bool) $theme['is_active'];
        }

        if (array_key_exists('is_premium', $theme)) {
            $theme['is_premium'] = (bool) $theme['is_premium'];
        }

        if (array_key_exists('config', $theme) && is_string($theme['config']) && $theme['config'] !== '') {
            $decoded = json_decode($theme['config'], true);
            $theme['config'] = json_last_error() === JSON_ERROR_NONE ? $decoded : $theme['config'];
        }

        return $theme;
    }

    private function normalizeOccasionType($occasion): ?array
    {
        if (!$occasion) {
            return null;
        }

        $occasion = (array) $occasion;

        if (array_key_exists('is_active', $occasion)) {
            $occasion['is_active'] = (bool) $occasion['is_active'];
        }

        return $occasion;
    }

    private function normalizeMilestones($milestones): array
    {
        if (is_string($milestones) && trim($milestones) !== '') {
            $decoded = json_decode($milestones, true);
            $milestones = json_last_error() === JSON_ERROR_NONE ? $decoded : [];
        }

        if (!is_array($milestones)) {
            return [];
        }

        return array_values(array_map(function ($milestone) {
            if (!is_array($milestone)) {
                return [
                    'title' => (string) $milestone,
                    'description' => '',
                    'event_date' => null,
                    'date' => null,
                    'image_url' => null,
                ];
            }

            $eventDate = $milestone['event_date'] ?? null;

            return [
                'title' => (string) ($milestone['title'] ?? ''),
                'description' => isset($milestone['description']) ? (string) $milestone['description'] : '',
                'event_date' => $eventDate,
                'date' => $milestone['date'] ?? $eventDate,
                'image_url' => $milestone['image_url'] ?? null,
            ];
        }, $milestones));
    }

    private function normalizeImages($images): array
    {
        if (is_string($images) && trim($images) !== '') {
            $decoded = json_decode($images, true);
            $images = json_last_error() === JSON_ERROR_NONE ? $decoded : [];
        }

        if (!is_array($images)) {
            return [];
        }

        return array_values(array_map(function ($image) {
            if (!is_array($image)) {
                $url = (string) $image;

                return [
                    'url' => $url,
                    'src' => $url,
                    'caption' => '',
                ];
            }

            $url = (string) ($image['url'] ?? $image['src'] ?? '');

            return [
                'url' => $url,
                'src' => $url,
                'caption' => isset($image['caption']) ? (string) $image['caption'] : '',
            ];
        }, $images));
    }

    private function normalizeStory($story, $theme = null, $occasionType = null, $creator = null): ?array
    {
        if (!$story) {
            return null;
        }

        $story = (array) $story;

        $story['ai_polished'] = (bool) ($story['ai_polished'] ?? false);
        $story['is_published'] = (bool) ($story['is_published'] ?? false);
        $story['approval_status'] = $story['is_published'] ? 'published' : 'hidden';
        $story['is_branding_hidden'] = (bool) ($story['is_branding_hidden'] ?? false);
        $story['view_count'] = (int) ($story['view_count'] ?? 0);
        $story['milestones'] = $this->normalizeMilestones($story['milestones'] ?? []);
        $story['images'] = $this->normalizeImages($story['images'] ?? []);
        $story['theme'] = $this->normalizeTheme($theme);
        $story['occasion_type'] = $this->normalizeOccasionType($occasionType);
        $story['people'] = array_values(array_filter([
            ['name' => (string) ($story['person_one_name'] ?? '')],
            ['name' => (string) ($story['person_two_name'] ?? '')],
        ], fn ($person) => trim((string) ($person['name'] ?? '')) !== ''));
        $story['title'] = trim(((string) ($story['person_one_name'] ?? '')) . ' & ' . ((string) ($story['person_two_name'] ?? '')));
        $story['eventDate'] = $story['start_date'] ?? null;
        $story['date'] = $story['start_date'] ?? null;
        $story['summary'] = $story['tagline'] ?: ($story['story'] ?? null);
        $story['occasion'] = $story['occasion_type']['name'] ?? null;
        $story['themeName'] = $story['theme']['name'] ?? null;
        $story['creator_name'] = $creator->name ?? null;

        return $story;
    }

    private function normalizeStoryCollection($stories): array
    {
        $stories = collect($stories)->map(fn ($story) => (array) $story)->values();

        $themeIds = $stories->pluck('theme_id')->filter()->map(fn ($id) => (int) $id)->unique()->values()->all();
        $occasionIds = $stories->pluck('occasion_type_id')->filter()->map(fn ($id) => (int) $id)->unique()->values()->all();
        $creatorIds = $stories->pluck('user_id')->filter()->map(fn ($id) => (int) $id)->unique()->values()->all();

        $themes = $this->fetchThemesByIds($themeIds);
        $occasionTypes = $this->fetchOccasionTypesByIds($occasionIds);
        $creators = $this->fetchUsersByIds($creatorIds);

        return $stories->map(function ($story) use ($themes, $occasionTypes, $creators) {
            $theme = isset($story['theme_id']) ? $themes->get((int) $story['theme_id']) : null;
            $occasionType = isset($story['occasion_type_id']) ? $occasionTypes->get((int) $story['occasion_type_id']) : null;
            $creator = isset($story['user_id']) ? $creators->get((int) $story['user_id']) : null;

            return $this->normalizeStory($story, $theme, $occasionType, $creator);
        })->values()->all();
    }

    private function recordView(object $story, Request $request): void
    {
        if ($this->isBot((string) $request->userAgent())) {
            return;
        }

        $cacheKey = $this->buildCacheKey($story, $request);

        if (Cache::has($cacheKey)) {
            return;
        }

        Cache::put($cacheKey, true, now()->addHours(24));
        DB::table('stories')->where('id', $story->id)->increment('view_count');
    }

    private function buildCacheKey(object $story, Request $request): string
    {
        $userId = $this->resolveViewerUserId($request);

        if ($userId !== null) {
            return "sv:{$story->id}:u:{$userId}";
        }

        $visitorId = (string) $request->header('X-Visitor-ID', '');

        if ($visitorId !== '' && $this->isValidUuid($visitorId)) {
            return "sv:{$story->id}:{$visitorId}";
        }

        $ipAddress = (string) $request->ip();
        $userAgent = (string) $request->userAgent();

        return 'sv:' . $story->id . ':f:' . md5($ipAddress . $userAgent);
    }

    private function resolveViewerUserId(Request $request): ?int
    {
        $userId = $this->currentUserId($request);

        if ($userId !== null) {
            return $userId;
        }

        $header = (string) $request->header('Authorization', '');
        $token = stripos($header, 'Bearer ') === 0
            ? trim(substr($header, 7))
            : trim($header);

        if ($token === '') {
            return null;
        }

        $hashedToken = hash('sha256', $token);

        $personalAccessToken = DB::table('personal_access_tokens')
            ->select('tokenable_id', 'tokenable_type', 'expires_at')
            ->where('token', $hashedToken)
            ->where('tokenable_type', 'App\\Models\\User')
            ->first();

        if (!$personalAccessToken) {
            return null;
        }

        if ($personalAccessToken->expires_at !== null) {
            try {
                if (now()->greaterThan(Carbon::parse($personalAccessToken->expires_at))) {
                    return null;
                }
            } catch (\Throwable $exception) {
                return null;
            }
        }

        return (int) $personalAccessToken->tokenable_id;
    }

    private function isBot(?string $userAgent): bool
    {
        $normalizedUserAgent = strtolower(trim((string) $userAgent));

        if ($normalizedUserAgent === '') {
            return true;
        }

        foreach ([
            'bot',
            'crawler',
            'spider',
            'slurp',
            'archive',
            'facebookexternalhit',
            'whatsapp',
            'twitterbot',
            'linkedinbot',
            'telegrambot',
            'applebot',
            'googlebot',
        ] as $botSignature) {
            if (str_contains($normalizedUserAgent, $botSignature)) {
                return true;
            }
        }

        return false;
    }

    private function isValidUuid(string $value): bool
    {
        return preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', $value) === 1;
    }

    private function validateStory(Request $request, ?int $id = null)
    {
        $slugRules = $id === null
            ? ['nullable', 'string', 'max:200', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', Rule::unique('stories', 'slug')]
            : ['sometimes', 'required', 'string', 'max:200', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', Rule::unique('stories', 'slug')->ignore($id)];
        $occasionRules = $id === null
            ? ['required', 'integer', 'exists:occasion_types,id']
            : ['sometimes', 'required', 'integer', 'exists:occasion_types,id'];
        $story = $id !== null
            ? DB::table('stories')->select('theme_id', 'occasion_type_id')->where('id', $id)->first()
            : null;

        $validator = Validator::make($request->all(), [
            'slug' => $slugRules,
            'occasion_type_id' => $occasionRules,
            'theme_id' => [$id === null ? 'required' : 'sometimes', 'integer', 'exists:themes,id'],
            'person_one_name' => [$id === null ? 'required' : 'sometimes', 'string', 'max:100'],
            'person_two_name' => $id === null
                ? ['required', 'string', 'max:100']
                : ['sometimes', 'required', 'string', 'max:100'],
            'start_date' => $id === null
                ? ['required', 'date']
                : ['sometimes', 'required', 'date'],
            'tagline' => ['nullable', 'string', 'max:255'],
            'story' => ['nullable', 'string'],
            'milestones' => ['nullable', 'array', 'max:4'],
            'milestones.*.title' => ['required_with:milestones', 'string', 'max:150'],
            'milestones.*.description' => ['nullable', 'string'],
            'milestones.*.event_date' => ['nullable', 'date'],
            'milestones.*.image_url' => ['nullable', 'string', 'max:500'],
            'images' => ['nullable', 'array', 'max:4'],
            'images.*.url' => ['required_with:images', 'string', 'max:500'],
            'images.*.caption' => ['nullable', 'string', 'max:255'],
            'cover_image_url' => ['nullable', 'string', 'max:500'],
            'final_message' => ['nullable', 'string'],
            'ai_polished' => ['boolean'],
            'ai_model' => ['nullable', 'string', 'max:60'],
            'is_published' => ['boolean'],
            'is_branding_hidden' => ['boolean'],
            'published_at' => ['nullable', 'date'],
        ]);

        $validator->after(function ($validator) use ($request, $story) {
            if (!Schema::hasTable('themes')) {
                return;
            }

            $themeInput = $request->input('theme_id', $story?->theme_id);
            $themeId = $themeInput !== null && $themeInput !== '' ? (int) $themeInput : null;

            if ($themeId === null) {
                return;
            }

            $theme = DB::table('themes')
                ->select('id', 'name', 'occasion_type_id')
                ->where('id', $themeId)
                ->first();

            if (!$theme) {
                return;
            }

            $occasionInput = $request->exists('occasion_type_id')
                ? $request->input('occasion_type_id')
                : ($story?->occasion_type_id ?? null);
            $occasionId = $occasionInput !== null && $occasionInput !== '' ? (int) $occasionInput : null;
            $themeOccasionId = $theme->occasion_type_id !== null ? (int) $theme->occasion_type_id : null;

            if ($themeOccasionId === null) {
                return;
            }

            if ($occasionId === null) {
                $validator->errors()->add('occasion_type_id', 'Select the occasion type required by the chosen theme.');

                return;
            }

            if ($occasionId !== $themeOccasionId) {
                $validator->errors()->add('occasion_type_id', sprintf(
                    'The selected theme "%s" must be used with its linked occasion type.',
                    $theme->name
                ));
            }
        });

        return $validator;
    }

    /**
     * Protected index for authenticated users.
     * Admins can see all stories; other users only see their own.
     */
    public function index(Request $request)
    {
        $stories = $this->applyStoryFilters($this->authorizedStoryQuery($request), $request)->get();

        return response()->json([
            'success' => true,
            'data' => $this->normalizeStoryCollection($stories),
        ]);
    }

    /**
     * Public index for published stories.
     */
    public function publicIndex(Request $request)
    {
        $query = $this->baseStoryQuery();

        if ($this->hasStoryColumn('is_published')) {
            $query->where('is_published', true);
        }

        $stories = $this->applyStoryFilters($query, $request, true)->get();

        return response()->json([
            'success' => true,
            'data' => $this->normalizeStoryCollection($stories),
        ]);
    }

    /**
     * Store a newly created story.
     */
    public function store(Request $request)
    {
        $v = $this->validateStory($request);

        if ($v->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $v->errors(),
            ], 422);
        }

        $data = $v->validated();
        $now = Carbon::now();

        $insertData = [
            'created_at' => $now,
            'updated_at' => $now,
        ];

        foreach ([
            'occasion_type_id',
            'theme_id',
            'person_one_name',
            'person_two_name',
            'start_date',
            'tagline',
            'story',
            'cover_image_url',
            'final_message',
            'ai_polished',
            'ai_model',
            'is_branding_hidden',
        ] as $column) {
            if ($this->hasStoryColumn($column) && array_key_exists($column, $data)) {
                $insertData[$column] = $data[$column];
            }
        }

        if ($this->hasStoryColumn('is_published')) {
            // The route is token-protected, so successfully authenticated users can publish immediately.
            $insertData['is_published'] = $this->canManagePublishing($request);
        }

        if ($this->hasStoryColumn('milestones') && array_key_exists('milestones', $data)) {
            $insertData['milestones'] = $data['milestones'] === null
                ? null
                : json_encode($data['milestones'], JSON_UNESCAPED_SLASHES);
        }

        if ($this->hasStoryColumn('images') && array_key_exists('images', $data)) {
            $insertData['images'] = $data['images'] === null
                ? null
                : json_encode($data['images'], JSON_UNESCAPED_SLASHES);
        }

        if ($this->hasStoryColumn('published_at')) {
            $shouldPublish = (bool) ($insertData['is_published'] ?? false);

            if ($shouldPublish && array_key_exists('published_at', $data) && $data['published_at'] && $this->canManagePublishing($request)) {
                $insertData['published_at'] = Carbon::parse($data['published_at']);
            } elseif ($shouldPublish) {
                $insertData['published_at'] = $now;
            } else {
                $insertData['published_at'] = null;
            }
        }

        if ($this->hasStoryColumn('uuid')) {
            $insertData['uuid'] = (string) Str::uuid();
        }

        if ($this->hasStoryColumn('user_id')) {
            $insertData['user_id'] = $this->currentUserId($request);
        }

        if ($this->hasStoryColumn('slug')) {
            $insertData['slug'] = array_key_exists('slug', $data)
                ? $this->makeUniqueSlug($data['slug'])
                : $this->generateStorySlug($data);
        }

        $id = DB::table('stories')->insertGetId($insertData);
        $story = DB::table('stories')->where('id', $id)->first();

        return response()->json([
            'success' => true,
            'message' => 'Story created successfully',
            'data' => $this->normalizeStoryCollection([$story])[0] ?? null,
        ], 201);
    }

    /**
     * Display the specified story for the owner/admin.
     */
    public function show(Request $request, $id)
    {
        $story = $this->authorizedStoryQuery($request)->where('id', $id)->first();

        if (!$story) {
            return response()->json([
                'success' => false,
                'error' => 'Story not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $this->normalizeStoryCollection([$story])[0] ?? null,
        ]);
    }

    /**
     * Display a published story by slug for public microsites.
     */
    public function publicShow(Request $request, string $slug)
    {
        $query = $this->baseStoryQuery()->where('slug', $this->normalizeSlug($slug));

        if ($this->hasStoryColumn('is_published')) {
            $query->where('is_published', true);
        }

        $story = $query->first();

        if (!$story) {
            return response()->json([
                'success' => false,
                'error' => 'Story not found',
            ], 404);
        }

        if ($this->hasStoryColumn('view_count') && !$request->boolean('preview')) {
            $this->recordView($story, $request);
            $story = $query->first() ?? $story;
        }

        return response()->json([
            'success' => true,
            'data' => $this->normalizeStoryCollection([$story])[0] ?? null,
        ]);
    }

    /**
     * Update the specified story.
     */
    public function update(Request $request, $id)
    {
        $story = $this->authorizedStoryQuery($request)->where('id', $id)->first();

        if (!$story) {
            return response()->json([
                'success' => false,
                'error' => 'Story not found',
            ], 404);
        }

        $v = $this->validateStory($request, (int) $id);

        if ($v->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $v->errors(),
            ], 422);
        }

        $data = $v->validated();
        $updates = [
            'updated_at' => Carbon::now(),
        ];

        foreach ([
            'occasion_type_id',
            'theme_id',
            'person_one_name',
            'person_two_name',
            'start_date',
            'tagline',
            'story',
            'cover_image_url',
            'final_message',
            'ai_polished',
            'ai_model',
            'is_branding_hidden',
        ] as $column) {
            if ($this->hasStoryColumn($column) && array_key_exists($column, $data)) {
                $updates[$column] = $data[$column];
            }
        }

        if ($this->hasStoryColumn('is_published') && array_key_exists('is_published', $data) && $this->canManagePublishing($request)) {
            $updates['is_published'] = (bool) $data['is_published'];
        }

        if ($this->hasStoryColumn('milestones') && array_key_exists('milestones', $data)) {
            $updates['milestones'] = $data['milestones'] === null
                ? null
                : json_encode($data['milestones'], JSON_UNESCAPED_SLASHES);
        }

        if ($this->hasStoryColumn('images') && array_key_exists('images', $data)) {
            $updates['images'] = $data['images'] === null
                ? null
                : json_encode($data['images'], JSON_UNESCAPED_SLASHES);
        }

        if ($this->hasStoryColumn('slug') && array_key_exists('slug', $data)) {
            $updates['slug'] = $this->makeUniqueSlug($data['slug'], (int) $id);
        }

        if ($this->hasStoryColumn('published_at')) {
            if (array_key_exists('published_at', $data) && $this->canManagePublishing($request)) {
                $updates['published_at'] = $data['published_at']
                    ? Carbon::parse($data['published_at'])
                    : null;
            } elseif (array_key_exists('is_published', $updates)) {
                if ((bool) $updates['is_published']) {
                    $updates['published_at'] = $story->published_at ?: Carbon::now();
                } else {
                    $updates['published_at'] = null;
                }
            }
        }

        DB::table('stories')->where('id', $id)->update($updates);
        $updatedStory = DB::table('stories')->where('id', $id)->first();

        return response()->json([
            'success' => true,
            'message' => 'Story updated successfully',
            'data' => $this->normalizeStoryCollection([$updatedStory])[0] ?? null,
        ]);
    }

    /**
     * Soft delete the specified story.
     */
    public function destroy(Request $request, $id)
    {
        $story = $this->authorizedStoryQuery($request)->where('id', $id)->first();

        if (!$story) {
            return response()->json([
                'success' => false,
                'error' => 'Story not found',
            ], 404);
        }

        if ($this->hasStoryColumn('deleted_at')) {
            DB::table('stories')->where('id', $id)->update([
                'deleted_at' => Carbon::now(),
            ]);
        } else {
            DB::table('stories')->where('id', $id)->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Story deleted successfully',
        ]);
    }

    /**
     * Enhance story text using Gemini AI.
     * Public endpoint — API key stays server-side, never exposed to browser.
     */
    public function enhance(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'story'           => ['required', 'string', 'min:10', 'max:5000'],
            'person_one_name' => ['nullable', 'string', 'max:100'],
            'person_two_name' => ['nullable', 'string', 'max:100'],
            'tagline'         => ['nullable', 'string', 'max:255'],
            'occasion'        => ['nullable', 'string', 'max:150'],
            'start_date'      => ['nullable', 'date'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        try {
            $result = app(GeminiStoryEnhancer::class)->enhance($validator->validated());

            return response()->json([
                'success'          => true,
                'enhanced_story'   => $result['text'],
                'ai_model'         => $result['model'],
            ]);
        } catch (\RuntimeException $e) {
            return response()->json([
                'success' => false,
                'error'   => $e->getMessage(),
            ], 500);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error'   => 'An unexpected error occurred. Please try again.',
            ], 500);
        }
    }
}
