<?php

$file = new \Illuminate\Http\UploadedFile(
    'd:/Dzakwan_PF/laragon-6.0-minimal/www/peta-sdm/storage/app/imports/locations-filled-v2.csv',
    'locations-filled-v2.csv',
    'text/csv',
    null,
    true
);

$user = App\Models\User::first();
$request = \Illuminate\Http\Request::create('/admin/lokasi-import', 'POST', [], [], ['file' => $file]);
$request->setUserResolver(function () use ($user) {
    return $user;
});

$controller = app(\App\Http\Controllers\LocationController::class);
$response = $controller->import($request);

echo "Success Session:\n";
var_dump(session('success'));
echo "\nWarning Session:\n";
var_dump(session('warning'));
