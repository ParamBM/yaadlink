<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UploadController extends Controller
{
    /**
     * Handle single image upload.
     * Stores the validated file on the public disk and returns its public URL.
     * (No GD/Imagick — works on PHP builds without image extensions.)
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

        return response()->json([
            'success' => true,
            'url'     => asset('storage/' . $relative),
        ]);
    }
}
