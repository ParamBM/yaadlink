<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ThemeController extends Controller
{
    private function hasColumn(string $column): bool
    {
        return Schema::hasTable('themes') && Schema::hasColumn('themes', $column);
    }

    private function hasOccasionTypeColumn(string $column): bool
    {
        return Schema::hasTable('occasion_types') && Schema::hasColumn('occasion_types', $column);
    }

    private function baseThemeQuery()
    {
        $query = DB::table('themes');

        if ($this->hasColumn('deleted_at')) {
            $query->whereNull('deleted_at');
        }

        if ($this->hasColumn('sort_order')) {
            $query->orderBy('sort_order')->orderBy('name');
        } else {
            $query->orderByDesc('id');
        }

        return $query;
    }

    private function themeByIdQuery($id)
    {
        $query = DB::table('themes')->where('id', $id);

        if ($this->hasColumn('deleted_at')) {
            $query->whereNull('deleted_at');
        }

        return $query;
    }

    private function parseBoolean($value): ?bool
    {
        return filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
    }

    private function resolveOccasionTypeId($value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_numeric($value)) {
            $occasionTypeId = (int) $value;

            return $occasionTypeId > 0 ? $occasionTypeId : null;
        }

        if (!Schema::hasTable('occasion_types')) {
            return null;
        }

        if (!$this->hasOccasionTypeColumn('slug') && !$this->hasOccasionTypeColumn('uuid')) {
            return null;
        }

        $identifier = trim((string) $value);

        if ($identifier === '') {
            return null;
        }

        $query = DB::table('occasion_types');

        if ($this->hasOccasionTypeColumn('deleted_at')) {
            $query->whereNull('deleted_at');
        }

        $query->where(function ($nested) use ($identifier) {
            if ($this->hasOccasionTypeColumn('slug')) {
                $nested->orWhere('slug', $identifier);
            }

            if ($this->hasOccasionTypeColumn('uuid')) {
                $nested->orWhere('uuid', $identifier);
            }
        });

        $occasionType = $query->select('id')->first();

        return $occasionType ? (int) $occasionType->id : null;
    }

    private function normalizeSlug(string $value, string $fallback = 'theme'): string
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
            $query = DB::table('themes')->where('slug', $slug);

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

    private function prepareThemeInput(Request $request): array
    {
        $input = $request->all();

        if (array_key_exists('config', $input) && is_string($input['config'])) {
            $config = trim($input['config']);

            if ($config === '') {
                $input['config'] = null;
            } else {
                $decoded = json_decode($config, true);

                if (json_last_error() === JSON_ERROR_NONE) {
                    $input['config'] = $decoded;
                }
            }
        }

        return $input;
    }

    private function isLocalThemePreviewPath(?string $path): bool
    {
        return is_string($path) && str_starts_with($path, '/assets/media/image/theme/');
    }

    private function deleteLocalThemePreview(?string $path): void
    {
        if (!$this->isLocalThemePreviewPath($path)) {
            return;
        }

        $absolutePath = public_path(ltrim($path, '/'));

        if (is_file($absolutePath)) {
            @unlink($absolutePath);
        }
    }

    private function storeThemePreviewImage($file, string $themeUuid, ?string $oldPath = null): string
    {
        if (!$file || !$file->isValid()) {
            throw new \RuntimeException('Invalid preview image upload');
        }

        $baseDir = public_path("assets/media/image/theme/{$themeUuid}/preview");

        if (!is_dir($baseDir)) {
            @mkdir($baseDir, 0775, true);
        }

        $ext = strtolower($file->getClientOriginalExtension() ?: 'jpg');
        $safeExt = preg_replace('/[^a-z0-9]/i', '', $ext) ?: 'jpg';
        $filename = 'preview_' . date('Ymd_His') . '_' . Str::random(8) . '.' . $safeExt;

        $file->move($baseDir, $filename);

        if ($oldPath) {
            $this->deleteLocalThemePreview($oldPath);
        }

        return "/assets/media/image/theme/{$themeUuid}/preview/{$filename}";
    }

    private function applyThemeFilters($query, Request $request, bool $isPublic = false)
    {
        if ($this->hasColumn('slug') && $request->filled('slug')) {
            $query->where('slug', $this->normalizeSlug($request->string('slug')->toString()));
        }

        if ($this->hasColumn('source') && $request->filled('source')) {
            $query->where('source', $request->string('source')->toString());
        }

        if ($this->hasColumn('occasion_type_id') && $request->filled('occasion_type_id')) {
            $occasionTypeId = $this->resolveOccasionTypeId($request->input('occasion_type_id'));

            if ($occasionTypeId === null) {
                $query->whereRaw('1 = 0');

                return $query;
            }

            if ($isPublic) {
                $query->where(function ($nested) use ($occasionTypeId) {
                    $nested->whereNull('occasion_type_id')
                        ->orWhere('occasion_type_id', $occasionTypeId);
                });
            } else {
                $query->where('occasion_type_id', $occasionTypeId);
            }
        }

        if (!$isPublic && $this->hasColumn('is_active') && $request->has('is_active')) {
            $isActive = $this->parseBoolean($request->input('is_active'));

            if ($isActive !== null) {
                $query->where('is_active', $isActive);
            }
        }

        if (!$isPublic && $this->hasColumn('is_premium') && $request->has('is_premium')) {
            $isPremium = $this->parseBoolean($request->input('is_premium'));

            if ($isPremium !== null) {
                $query->where('is_premium', $isPremium);
            }
        }

        return $query;
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

    /**
     * Protected index for Admins.
     * Returns all themes including inactive ones.
     */
    public function index(Request $request)
    {
        $themes = $this->applyThemeFilters($this->baseThemeQuery(), $request)->get();

        return response()->json([
            'success' => true,
            'data' => $themes->map(fn ($theme) => $this->normalizeTheme($theme))->values(),
        ]);
    }

    /**
     * Public index for frontend users.
     * Returns only active themes.
     */
    public function publicIndex(Request $request)
    {
        $query = $this->baseThemeQuery();

        if ($this->hasColumn('is_active')) {
            $query->where('is_active', true);
        }

        $themes = $this->applyThemeFilters($query, $request, true)->get();

        return response()->json([
            'success' => true,
            'data' => $themes->map(fn ($theme) => $this->normalizeTheme($theme))->values(),
        ]);
    }

    /**
     * Store a newly created theme.
     */
    public function store(Request $request)
    {
        $input = $this->prepareThemeInput($request);

        $v = Validator::make($input, [
            'name' => ['required', 'string', 'max:100'],
            'slug' => [
                'nullable',
                'string',
                'max:100',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('themes', 'slug'),
            ],
            'description' => ['nullable', 'string'],
            'preview_image' => ['nullable', 'string', 'max:500'],
            'preview_image_file' => ['sometimes', 'nullable', 'file', 'image', 'max:4096'],
            'occasion_type_id' => ['nullable', 'integer', 'exists:occasion_types,id'],
            'author_name' => ['nullable', 'string', 'max:150'],
            'author_url' => ['nullable', 'string', 'max:500'],
            'version' => ['nullable', 'string', 'max:20'],
            'source' => ['nullable', 'string', 'in:internal,community'],
            'is_active' => ['boolean'],
            'is_premium' => ['boolean'],
            'sort_order' => ['integer', 'min:0'],
            'config' => ['nullable', 'array'],
        ]);

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
        $themeUuid = (string) Str::uuid();

        foreach ([
            'name',
            'description',
            'occasion_type_id',
            'author_name',
            'author_url',
            'version',
            'source',
            'is_active',
            'is_premium',
            'sort_order',
        ] as $column) {
            if ($this->hasColumn($column) && array_key_exists($column, $data)) {
                $insertData[$column] = $data[$column];
            }
        }

        if ($this->hasColumn('config') && array_key_exists('config', $data)) {
            $insertData['config'] = $data['config'] === null
                ? null
                : json_encode($data['config'], JSON_UNESCAPED_SLASHES);
        }

        if ($this->hasColumn('uuid')) {
            $insertData['uuid'] = $themeUuid;
        }

        if ($this->hasColumn('created_by')) {
            $insertData['created_by'] = $request->attributes->get('auth_tokenable_id');
        }

        if ($this->hasColumn('slug')) {
            $insertData['slug'] = array_key_exists('slug', $data)
                ? $this->normalizeSlug($data['slug'])
                : $this->makeUniqueSlug($data['name']);
        }

        if ($this->hasColumn('preview_image')) {
            if ($request->hasFile('preview_image_file')) {
                try {
                    $insertData['preview_image'] = $this->storeThemePreviewImage(
                        $request->file('preview_image_file'),
                        $themeUuid
                    );
                } catch (\Throwable $e) {
                    return response()->json([
                        'success' => false,
                        'error' => 'Failed to save the preview image',
                    ], 422);
                }
            } elseif (array_key_exists('preview_image', $data)) {
                $insertData['preview_image'] = $data['preview_image'];
            }
        }

        $id = DB::table('themes')->insertGetId($insertData);
        $theme = DB::table('themes')->where('id', $id)->first();

        return response()->json([
            'success' => true,
            'message' => 'Theme created successfully',
            'data' => $this->normalizeTheme($theme),
        ], 201);
    }

    /**
     * Display the specified theme.
     */
    public function show($id)
    {
        $theme = $this->themeByIdQuery($id)->first();

        if (!$theme) {
            return response()->json([
                'success' => false,
                'error' => 'Theme not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $this->normalizeTheme($theme),
        ]);
    }

    /**
     * Update the specified theme.
     */
    public function update(Request $request, $id)
    {
        $theme = $this->themeByIdQuery($id)->first();

        if (!$theme) {
            return response()->json([
                'success' => false,
                'error' => 'Theme not found',
            ], 404);
        }

        $input = $this->prepareThemeInput($request);

        $v = Validator::make($input, [
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'slug' => [
                'sometimes',
                'required',
                'string',
                'max:100',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('themes', 'slug')->ignore($id),
            ],
            'description' => ['nullable', 'string'],
            'preview_image' => ['nullable', 'string', 'max:500'],
            'preview_image_file' => ['sometimes', 'nullable', 'file', 'image', 'max:4096'],
            'occasion_type_id' => ['nullable', 'integer', 'exists:occasion_types,id'],
            'author_name' => ['nullable', 'string', 'max:150'],
            'author_url' => ['nullable', 'string', 'max:500'],
            'version' => ['nullable', 'string', 'max:20'],
            'source' => ['nullable', 'string', 'in:internal,community'],
            'is_active' => ['boolean'],
            'is_premium' => ['boolean'],
            'sort_order' => ['integer', 'min:0'],
            'config' => ['nullable', 'array'],
        ]);

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
            'name',
            'description',
            'occasion_type_id',
            'author_name',
            'author_url',
            'version',
            'source',
            'is_active',
            'is_premium',
            'sort_order',
        ] as $column) {
            if ($this->hasColumn($column) && array_key_exists($column, $data)) {
                $updates[$column] = $data[$column];
            }
        }

        if ($this->hasColumn('config') && array_key_exists('config', $data)) {
            $updates['config'] = $data['config'] === null
                ? null
                : json_encode($data['config'], JSON_UNESCAPED_SLASHES);
        }

        if ($this->hasColumn('slug') && array_key_exists('slug', $data)) {
            $updates['slug'] = $this->normalizeSlug($data['slug']);
        }

        if ($this->hasColumn('preview_image')) {
            $themeUuid = (string) ($theme->uuid ?? Str::uuid());

            if ($request->hasFile('preview_image_file')) {
                try {
                    $updates['preview_image'] = $this->storeThemePreviewImage(
                        $request->file('preview_image_file'),
                        $themeUuid,
                        $theme->preview_image ?? null
                    );
                } catch (\Throwable $e) {
                    return response()->json([
                        'success' => false,
                        'error' => 'Failed to save the preview image',
                    ], 422);
                }
            } elseif (array_key_exists('preview_image', $data)) {
                $nextPreview = $data['preview_image'];
                $currentPreview = $theme->preview_image ?? null;

                if ($nextPreview !== $currentPreview && $currentPreview) {
                    $this->deleteLocalThemePreview($currentPreview);
                }

                $updates['preview_image'] = $nextPreview;
            }
        }

        DB::table('themes')->where('id', $id)->update($updates);
        $updatedTheme = $this->themeByIdQuery($id)->first();

        return response()->json([
            'success' => true,
            'message' => 'Theme updated successfully',
            'data' => $this->normalizeTheme($updatedTheme),
        ]);
    }

    /**
     * Soft delete the specified theme.
     */
    public function destroy($id)
    {
        $theme = $this->themeByIdQuery($id)->first();

        if (!$theme) {
            return response()->json([
                'success' => false,
                'error' => 'Theme not found',
            ], 404);
        }

        if ($this->hasColumn('deleted_at')) {
            DB::table('themes')->where('id', $id)->update([
                'deleted_at' => Carbon::now(),
            ]);
        } else {
            DB::table('themes')->where('id', $id)->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Theme deleted successfully',
        ]);
    }
}
