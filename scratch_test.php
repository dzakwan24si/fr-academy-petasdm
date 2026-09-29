<?php

$fh = fopen('d:/Dzakwan_PF/laragon-6.0-minimal/www/peta-sdm/storage/app/imports/locations-filled.csv', 'r');
fgetcsv($fh, 0, ';'); // header
while (($r = fgetcsv($fh, 0, ';')) !== false) {
    if ($r[0] === 'OF02-01') {
        var_dump($r[4]);
        var_dump($r[5]);
        $lat = trim($r[4]);
        $lng = trim($r[5]);
        var_dump($lat < -11 || $lat > 6 || $lng < 95 || $lng > 141);
        echo bin2hex($lat) . "\n";
        echo bin2hex($lng) . "\n";
    }
}
fclose($fh);
