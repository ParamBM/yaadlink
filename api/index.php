<?php

// Tell Laravel we're on Vercel & redirect writable paths to /tmp
$_ENV['VERCEL'] = '1';
$_SERVER['VERCEL'] = '1';

// Create required writable dirs in /tmp
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

// Override Laravel storage path
$_ENV['APP_STORAGE'] = '/tmp/storage';

require __DIR__ . '/../public/index.php';
