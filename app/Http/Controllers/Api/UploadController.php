<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\UserActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;

class UploadController extends Controller
{
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
        $request->validate([
            'image' => ['required', 'image', 'mimes:jpeg,png,jpg,webp,gif', 'max:5120'], // 5MB max
        ]);

        $path = Storage::disk('public')->putFile('uploads/stories', $request->file('image'));

        if (!$path) {
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
