<?php

// Tell Laravel we're on Vercel
$_ENV['VERCEL'] = '1';
$_SERVER['VERCEL'] = '1';

// Create all required writable dirs in /tmp BEFORE Laravel boots
$dirs = [
    '/tmp/storage/app/public',
    '/tmp/storage/framework/cache/data',
    '/tmp/storage/framework/sessions',
    '/tmp/storage/framework/views',
    '/tmp/storage/logs',
    '/tmp/views',
];
foreach ($dirs as $dir) {
    if (!is_dir($dir)) {
        mkdir($dir, 0775, true);
    }
}

// Copy bootstrap/cache files to /tmp so they're writable
// (vercel-php may try to write to bootstrap/cache during runtime)
$cacheDir = '/tmp/bootstrap/cache';
if (!is_dir($cacheDir)) {
    mkdir($cacheDir, 0775, true);
}
$sourceCache = __DIR__ . '/../bootstrap/cache';
foreach (['services.php', 'packages.php'] as $file) {
    $dest = "$cacheDir/$file";
    if (!file_exists($dest) && file_exists("$sourceCache/$file")) {
        copy("$sourceCache/$file", $dest);
    }
}

require __DIR__ . '/../public/index.php';
