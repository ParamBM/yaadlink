<?php

require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;

try {
    $cloudName = config('cloudinary.cloud_url');
    echo "Cloud URL Config: " . $cloudName . "\n";
    
    // Attempt to just check if the facade works
    echo "Testing facade...\n";
    if (class_exists('CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary')) {
        echo "Facade class exists.\n";
    } else {
        echo "Facade class NOT found.\n";
    }

} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
