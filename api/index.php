<?php

$_ENV['VERCEL'] = '1';
$_SERVER['VERCEL'] = '1';

// Create all writable dirs in /tmp before Laravel boots
$dirs = [
    '/tmp/storage/app/public',
    '/tmp/storage/framework/cache/data',
    '/tmp/storage/framework/sessions',
    '/tmp/storage/framework/views',
    '/tmp/storage/logs',
    '/tmp/views',
    '/tmp/bootstrap/cache',
];
foreach ($dirs as $dir) {
    if (!is_dir($dir)) {
        mkdir($dir, 0775, true);
    }
}

// Dev-only providers that must be excluded (they don't exist without --dev packages)
$devProviders = [
    'Laravel\\Pail\\PailServiceProvider',
    'Laravel\\Sail\\SailServiceProvider',
    'NunoMaduro\\Collision\\Adapters\\Laravel\\CollisionServiceProvider',
    'Pest\\Laravel\\PestServiceProvider',
];
$devPackages = [
    'laravel/pail',
    'laravel/sail',
    'nunomaduro/collision',
    'pestphp/pest-plugin-laravel',
];

// Filter services.php → /tmp/bootstrap/cache/services.php
// (vercel-php overwrites bootstrap/cache/services.php with dev providers at build time)
$cleanServices = '/tmp/bootstrap/cache/services.php';
$sourceServices = __DIR__ . '/../bootstrap/cache/services.php';
if (!file_exists($cleanServices) && file_exists($sourceServices)) {
    $data = require $sourceServices;

    $data['providers'] = array_values(array_filter(
        $data['providers'] ?? [],
        fn($p) => !in_array($p, $devProviders)
    ));
    $data['eager'] = array_values(array_filter(
        $data['eager'] ?? [],
        fn($p) => !in_array($p, $devProviders)
    ));
    $data['deferred'] = array_filter(
        $data['deferred'] ?? [],
        fn($p) => !in_array($p, $devProviders)
    );
    foreach ($devProviders as $dev) {
        unset($data['when'][$dev]);
    }

    file_put_contents($cleanServices, "<?php return " . var_export($data, true) . ";\n");
}

// Filter packages.php → /tmp/bootstrap/cache/packages.php
$cleanPackages = '/tmp/bootstrap/cache/packages.php';
$sourcePackages = __DIR__ . '/../bootstrap/cache/packages.php';
if (!file_exists($cleanPackages) && file_exists($sourcePackages)) {
    $data = require $sourcePackages;
    foreach ($devPackages as $pkg) {
        unset($data[$pkg]);
    }
    file_put_contents($cleanPackages, "<?php return " . var_export($data, true) . ";\n");
}

require __DIR__ . '/../public/index.php';
