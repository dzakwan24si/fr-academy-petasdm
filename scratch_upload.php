<?php
$user = App\Models\User::first();
$file = new \Illuminate\Http\UploadedFile(
    'd:/Dzakwan_PF/laragon-6.0-minimal/www/peta-sdm/storage/app/imports/locations-filled.csv',
    'locations-filled.csv',
    'text/csv',
    null,
    true
);

$request = \Illuminate\Http\Request::create('/admin/lokasi-import', 'POST', [], [], ['file' => $file]);
$request->setUserResolver(function () use ($user) {
    return $user;
});

$controller = app(\App\Http\Controllers\LocationController::class);
$response = $controller->import($request);

echo "Success:\n";
var_dump(session('success'));
echo "\nWarning:\n";
var_dump(session('warning'));
