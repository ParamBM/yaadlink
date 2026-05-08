<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\UserActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;

class UploadController extends Controller
{
    private const USER_TYPE = 'App\\Models\\User';

    private function activityActorOverride(Request $request): ?array
    {
        $this->attachOptionalAuthActor($request);

        if ($request->attributes->get('auth_tokenable_id') !== null) {
            return null;
        }

        return [
            'id' => 0,
            'role' => 'guest',
            'type' => 'guest',
        ];
    }

    private function attachOptionalAuthActor(Request $request): void
    {
        if ($request->attributes->get('auth_tokenable_id') !== null) {
            return;
        }

        $header = (string) $request->header('Authorization', '');
        $token = stripos($header, 'Bearer ') === 0
            ? trim(substr($header, 7))
            : trim($header);

        if ($token === '') {
            return;
        }

        $user = DB::table('personal_access_tokens as pat')
            ->join('users as u', 'u.id', '=', 'pat.tokenable_id')
            ->where('pat.token', hash('sha256', $token))
            ->where('pat.tokenable_type', self::USER_TYPE)
            ->select([
                'pat.expires_at as token_expires_at',
                'u.id',
                'u.role',
                'u.status',
                'u.deleted_at',
            ])
            ->first();

        if (!$user) {
            return;
        }

        if ($user->token_expires_at !== null && now()->greaterThan(\Carbon\Carbon::parse($user->token_expires_at))) {
            return;
        }

        $status = $user->status ?? null;
        $inactive = in_array(strtolower(trim((string) $status)), ['0', 'false', 'inactive', 'disabled'], true)
            || ($status === null && $user->deleted_at !== null);

        if ($inactive) {
            return;
        }

        $request->attributes->set('auth_tokenable_type', self::USER_TYPE);
        $request->attributes->set('auth_tokenable_id', (int) $user->id);
        $request->attributes->set('auth_role', $this->canonicalRole((string) ($user->role ?? '')));
    }

    private function canonicalRole(string $role): string
    {
        $normalized = preg_replace('/[^a-z0-9]+/', '', mb_strtolower(trim($role))) ?? '';

        return in_array($normalized, ['admin', 'adm'], true) ? 'admin' : 'user';
    }

    private function activityLog(
        Request $request,
        string $activity,
        string $module,
        string $tableName,
        ?array $changedFields = null,
        mixed $oldValues = null,
        mixed $newValues = null,
        ?string $note = null
    ): void {
        UserActivityLogger::log(
            $request,
            $activity,
            $module,
            $tableName,
            null,
            $changedFields,
            $oldValues,
            $newValues,
            $note,
            $this->activityActorOverride($request)
        );
    }

    /**
     * Handle single image upload to local storage.
     */
    public function store(Request $request)
    {
        $this->attachOptionalAuthActor($request);

        $request->validate([
            'image' => ['required', 'image', 'mimes:jpeg,png,jpg,webp,gif', 'max:5120'], // 5MB max
        ]);

        // On Vercel or in Production, we prefer Cloudinary because the local disk is ephemeral/read-only
        $isVercel = env('VERCEL') || env('APP_ENV') === 'production';
        
        if ($isVercel) {
            try {
                return $this->cloudinary($request);
            } catch (\Throwable $e) {
                \Log::error('Cloudinary upload failed in production: ' . $e->getMessage());

                return response()->json([
                    'success' => false,
                    'error'   => 'Cloudinary upload failed. Please check the production Cloudinary configuration.',
                ], 500);
            }
        }

        $path = Storage::disk('public')->putFile('uploads/stories', $request->file('image'));

        if (!$path) {
            // If local fails and we haven't tried Cloudinary yet, try it now
            if (!$isVercel) {
                try {
                    return $this->cloudinary($request);
                } catch (\Throwable $e) {
                    \Log::error('Both local and Cloudinary upload failed: ' . $e->getMessage());
                }
            }

            return response()->json([
                'success' => false,
                'error'   => 'Failed to save the uploaded image.',
            ], 500);
        }

        $relative = str_replace('\\', '/', $path);
        $url = Storage::disk('public')->url($relative);

        $this->activityLog(
            $request,
            'upload',
            'uploads',
            'story_uploads',
            ['storage', 'path', 'url', 'original_name', 'mime_type', 'bytes'],
            null,
            [
                'storage' => 'public',
                'path' => $relative,
                'url' => $url,
                'original_name' => $request->file('image')?->getClientOriginalName(),
                'mime_type' => $request->file('image')?->getMimeType(),
                'bytes' => $request->file('image')?->getSize(),
                'guest' => $request->attributes->get('auth_tokenable_id') === null,
            ],
            'Story image uploaded'
        );

        return response()->json([
            'success' => true,
            'url'     => $url,
        ]);
    }

    /**
     * Handle single image upload to Cloudinary.
     */
    public function cloudinary(Request $request)
    {
        try {
            $this->attachOptionalAuthActor($request);

            $request->validate([
                'image' => ['required', 'image', 'mimes:jpeg,png,jpg,webp,gif', 'max:5120'], // 5MB max
            ]);

            if (!$request->hasFile('image')) {
                return response()->json([
                    'success' => false,
                    'error'   => 'No image file provided.',
                ], 400);
            }

            $result = Cloudinary::uploadApi()->upload($request->file('image')->getRealPath(), [
                'folder' => 'yaadlink/stories'
            ]);

            if (!$result) {
                \Log::error('Cloudinary upload returned null.');
                return response()->json([
                    'success' => false,
                    'error'   => 'Cloudinary upload failed: No response from server.',
                ], 500);
            }

            $secureUrl = null;

            if (is_array($result)) {
                $secureUrl = $result['secure_url'] ?? $result['url'] ?? null;
            } elseif ($result instanceof \ArrayAccess) {
                $secureUrl = $result->offsetGet('secure_url') ?? $result->offsetGet('url');
            } elseif (method_exists($result, 'getSecurePath')) {
                $secureUrl = $result->getSecurePath();
            }

            if (!$secureUrl) {
                \Log::error('Cloudinary upload missing secure URL.', [
                    'result_type' => is_object($result) ? get_class($result) : gettype($result),
                    'result' => $result,
                ]);
                return response()->json([
                    'success' => false,
                    'error'   => 'Cloudinary upload failed: Missing secure URL in response.',
                ], 500);
            }

            $cloudinaryMeta = is_array($result)
                ? $result
                : ((is_object($result) && method_exists($result, 'getArrayCopy')) ? $result->getArrayCopy() : []);

            $this->activityLog(
                $request,
                'upload',
                'uploads',
                'cloudinary_uploads',
                ['provider', 'folder', 'url', 'public_id', 'original_name', 'mime_type', 'bytes'],
                null,
                [
                    'provider' => 'cloudinary',
                    'folder' => 'yaadlink/stories',
                    'url' => $secureUrl,
                    'public_id' => $cloudinaryMeta['public_id'] ?? null,
                    'original_name' => $cloudinaryMeta['original_filename'] ?? $request->file('image')?->getClientOriginalName(),
                    'mime_type' => $request->file('image')?->getMimeType(),
                    'bytes' => $cloudinaryMeta['bytes'] ?? $request->file('image')?->getSize(),
                    'format' => $cloudinaryMeta['format'] ?? null,
                    'guest' => $request->attributes->get('auth_tokenable_id') === null,
                ],
                'Cloudinary image uploaded'
            );

            return response()->json([
                'success' => true,
                'url'     => $secureUrl,
            ]);
        } catch (\Exception $e) {
            \Log::error('Cloudinary upload exception: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            return response()->json([
                'success' => false,
                'error'   => 'Cloudinary upload failed: ' . $e->getMessage(),
            ], 500);
        }
    }
}
