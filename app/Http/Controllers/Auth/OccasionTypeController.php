<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Carbon\Carbon;

class OccasionTypeController extends Controller
{
    /**
     * Protected index for Admins/Directors
     * Returns all occasion types including inactive ones.
     */
    public function index(Request $request)
    {
        $occasions = DB::table('occasion_types')
            ->whereNull('deleted_at')
            ->orderBy('sort_order')
            ->get();

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
        $occasions = DB::table('occasion_types')
            ->whereNull('deleted_at')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();

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

        // Generate unique slug
        $baseSlug = Str::slug($data['name']);
        if ($baseSlug === '') $baseSlug = 'occasion';
        $slug = $baseSlug;
        $i = 1;
        while (DB::table('occasion_types')->where('slug', $slug)->exists()) {
            $slug = $baseSlug . '-' . $i;
            $i++;
        }

        $insertData = [
            'uuid' => (string) Str::uuid(),
            'name' => $data['name'],
            'slug' => $slug,
            'description' => $data['description'] ?? null,
            'icon' => $data['icon'] ?? null,
            'is_active' => $data['is_active'] ?? true,
            'sort_order' => $data['sort_order'] ?? 0,
            'created_by' => $request->attributes->get('auth_tokenable_id'),
            'created_at' => $now,
            'updated_at' => $now,
        ];

        $id = DB::table('occasion_types')->insertGetId($insertData);

        $occasion = DB::table('occasion_types')->where('id', $id)->first();

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
        $occasion = DB::table('occasion_types')
            ->where('id', $id)
            ->whereNull('deleted_at')
            ->first();

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
        $occasion = DB::table('occasion_types')
            ->where('id', $id)
            ->whereNull('deleted_at')
            ->first();

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

        if (isset($data['name']) && $data['name'] !== $occasion->name) {
            $updates['name'] = $data['name'];
            
            // Regenerate slug
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

        if (array_key_exists('description', $data)) $updates['description'] = $data['description'];
        if (array_key_exists('icon', $data)) $updates['icon'] = $data['icon'];
        if (isset($data['is_active'])) $updates['is_active'] = $data['is_active'];
        if (isset($data['sort_order'])) $updates['sort_order'] = $data['sort_order'];

        DB::table('occasion_types')->where('id', $id)->update($updates);

        $updatedOccasion = DB::table('occasion_types')->where('id', $id)->first();

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
        $occasion = DB::table('occasion_types')
            ->where('id', $id)
            ->whereNull('deleted_at')
            ->first();

        if (!$occasion) {
            return response()->json([
                'success' => false,
                'error' => 'Occasion type not found'
            ], 404);
        }

        DB::table('occasion_types')->where('id', $id)->update([
            'deleted_at' => Carbon::now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Occasion type deleted successfully'
        ]);
    }
}
