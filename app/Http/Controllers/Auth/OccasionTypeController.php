<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Carbon\Carbon;

class OccasionTypeController extends Controller
{
    private const PUBLIC_CACHE_VERSION_KEY = 'occasion_types_public_cache_version';

    private ?bool $occasionTypesTableExists = null;
    private array $occasionTypesColumnExists = [];

    private function publicCacheKey(): string
    {
        $version = (int) Cache::get(self::PUBLIC_CACHE_VERSION_KEY, 1);

        return "occasion_types_public_{$version}";
    }

    private function invalidatePublicCache(): void
    {
        $version = (int) Cache::get(self::PUBLIC_CACHE_VERSION_KEY, 1);
        Cache::forever(self::PUBLIC_CACHE_VERSION_KEY, $version + 1);
    }

    private function hasColumn(string $column): bool
    {
        if ($this->occasionTypesTableExists === null) {
            $this->occasionTypesTableExists = Schema::hasTable('occasion_types');
        }

        if (!$this->occasionTypesTableExists) {
            return false;
        }

        if (!array_key_exists($column, $this->occasionTypesColumnExists)) {
            $this->occasionTypesColumnExists[$column] = Schema::hasColumn('occasion_types', $column);
        }

        return $this->occasionTypesColumnExists[$column];
    }

    private function baseOccasionQuery()
    {
        $query = DB::table('occasion_types');

        if ($this->hasColumn('deleted_at')) {
            $query->whereNull('deleted_at');
        }

        if ($this->hasColumn('sort_order')) {
            $query->orderBy('sort_order');
        } else {
            $query->orderByDesc('id');
        }

        return $query;
    }

    /**
     * Protected index for Admins/Directors
     * Returns all occasion types including inactive ones.
     */
    public function index(Request $request)
    {
        $occasions = $this->baseOccasionQuery()->get();

        return response()->json([
            'success' => true,
            'data' => $occasions
        ]);
    }

    /**
     * Public index for frontend users
     * Returns only active occasion types.
     */
    public function publicIndex()
    {
        $occasions = Cache::remember($this->publicCacheKey(), now()->addMinutes(10), function () {
            $query = $this->baseOccasionQuery();

            if ($this->hasColumn('is_active')) {
                $query->where('is_active', true);
            }

            return $query->get();
        });

        return response()->json([
            'success' => true,
            'data' => $occasions
        ]);
    }

    /**
     * Store a newly created occasion type.
     */
    public function store(Request $request)
    {
        $v = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:80'],
            'description' => ['nullable', 'string'],
            'icon' => ['nullable', 'string', 'max:100'],
            'is_active' => ['boolean'],
            'sort_order' => ['integer', 'min:0']
        ]);

        if ($v->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $v->errors()
            ], 422);
        }

        $data = $v->validated();
        $now = Carbon::now();

        $insertData = [
            'created_at' => $now,
            'updated_at' => $now,
        ];

        foreach (['name', 'description', 'icon', 'is_active', 'sort_order'] as $column) {
            if ($this->hasColumn($column) && array_key_exists($column, $data)) {
                $insertData[$column] = $data[$column];
            }
        }

        if ($this->hasColumn('uuid')) {
            $insertData['uuid'] = (string) Str::uuid();
        }

        if ($this->hasColumn('created_by')) {
            $insertData['created_by'] = $request->attributes->get('auth_tokenable_id');
        }

        if ($this->hasColumn('slug')) {
            $baseSlug = Str::slug($data['name']);
            if ($baseSlug === '') $baseSlug = 'occasion';

            $slug = $baseSlug;
            $i = 1;
            while (DB::table('occasion_types')->where('slug', $slug)->exists()) {
                $slug = $baseSlug . '-' . $i;
                $i++;
            }

            $insertData['slug'] = $slug;
        }

        $id = DB::table('occasion_types')->insertGetId($insertData);

        $occasion = DB::table('occasion_types')->where('id', $id)->first();
        $this->invalidatePublicCache();

        return response()->json([
            'success' => true,
            'message' => 'Occasion type created successfully',
            'data' => $occasion
        ], 201);
    }

    /**
     * Display the specified occasion type.
     */
    public function show($id)
    {
        $query = DB::table('occasion_types')->where('id', $id);
        if ($this->hasColumn('deleted_at')) {
            $query->whereNull('deleted_at');
        }
        $occasion = $query->first();

        if (!$occasion) {
            return response()->json([
                'success' => false,
                'error' => 'Occasion type not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $occasion
        ]);
    }

    /**
     * Update the specified occasion type.
     */
    public function update(Request $request, $id)
    {
        $query = DB::table('occasion_types')->where('id', $id);
        if ($this->hasColumn('deleted_at')) {
            $query->whereNull('deleted_at');
        }
        $occasion = $query->first();

        if (!$occasion) {
            return response()->json([
                'success' => false,
                'error' => 'Occasion type not found'
            ], 404);
        }

        $v = Validator::make($request->all(), [
            'name' => ['sometimes', 'required', 'string', 'max:80'],
            'description' => ['nullable', 'string'],
            'icon' => ['nullable', 'string', 'max:100'],
            'is_active' => ['boolean'],
            'sort_order' => ['integer', 'min:0']
        ]);

        if ($v->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $v->errors()
            ], 422);
        }

        $data = $v->validated();
        $updates = [
            'updated_at' => Carbon::now()
        ];

        if ($this->hasColumn('name') && isset($data['name']) && $data['name'] !== $occasion->name) {
            $updates['name'] = $data['name'];

            if ($this->hasColumn('slug')) {
                $baseSlug = Str::slug($data['name']);
                if ($baseSlug === '') $baseSlug = 'occasion';
                $slug = $baseSlug;
                $i = 1;
                while (DB::table('occasion_types')->where('slug', $slug)->where('id', '!=', $id)->exists()) {
                    $slug = $baseSlug . '-' . $i;
                    $i++;
                }
                $updates['slug'] = $slug;
            }
        }

        if ($this->hasColumn('description') && array_key_exists('description', $data)) $updates['description'] = $data['description'];
        if ($this->hasColumn('icon') && array_key_exists('icon', $data)) $updates['icon'] = $data['icon'];
        if ($this->hasColumn('is_active') && isset($data['is_active'])) $updates['is_active'] = $data['is_active'];
        if ($this->hasColumn('sort_order') && isset($data['sort_order'])) $updates['sort_order'] = $data['sort_order'];

        DB::table('occasion_types')->where('id', $id)->update($updates);

        $updatedOccasion = DB::table('occasion_types')->where('id', $id)->first();
        $this->invalidatePublicCache();

        return response()->json([
            'success' => true,
            'message' => 'Occasion type updated successfully',
            'data' => $updatedOccasion
        ]);
    }

    /**
     * Soft delete the specified occasion type.
     */
    public function destroy($id)
    {
        $query = DB::table('occasion_types')->where('id', $id);
        if ($this->hasColumn('deleted_at')) {
            $query->whereNull('deleted_at');
        }
        $occasion = $query->first();

        if (!$occasion) {
            return response()->json([
                'success' => false,
                'error' => 'Occasion type not found'
            ], 404);
        }

        if ($this->hasColumn('deleted_at')) {
            DB::table('occasion_types')->where('id', $id)->update([
                'deleted_at' => Carbon::now(),
            ]);
        } else {
            DB::table('occasion_types')->where('id', $id)->delete();
        }

        $this->invalidatePublicCache();

        return response()->json([
            'success' => true,
            'message' => 'Occasion type deleted successfully'
        ]);
    }
}
