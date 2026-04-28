<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo json_encode(\Illuminate\Support\Facades\DB::table('themes')->select('id', 'name', 'occasion_type_id')->get());
