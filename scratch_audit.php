<?php

use App\Models\Employee;
use App\Models\Location;

$locations = Location::pluck('name', 'id')->toArray();

$facilities = ['Estate' => [], 'Mill' => [], 'HO' => []];
$regions = ['Sumatera' => [], 'Kalimantan' => [], 'Jawa / HO' => [], 'Lainnya' => []];

foreach (Employee::all() as $e) {
    $locName = $locations[$e->location_id] ?? '';
    $regionStr = $e->region ?? 'Unknown';
    $orgName = $e->organization_name ?? '';

    // Facility Logic
    $facilityType = match (true) {
        stripos($locName, 'office') !== false || stripos($locName, 'jakarta') !== false => 'HO',
        stripos($locName, 'pabrik') !== false || stripos($locName, 'mill') !== false || stripos($locName, 'kcp') !== false || stripos($locName, 'biodiesel') !== false || stripos($locName, 'bulking') !== false => 'Mill',
        default => 'Estate'
    };

    // Region Logic
    $targetRegion = 'Lainnya';
    if (stripos($regionStr, 'riau') !== false || stripos($regionStr, 'sumatera') !== false) {
        $targetRegion = 'Sumatera';
    } elseif (stripos($regionStr, 'kalbar') !== false || stripos($regionStr, 'kubar') !== false || stripos($regionStr, 'kalimantan') !== false) {
        $targetRegion = 'Kalimantan';
    } elseif (stripos($regionStr, 'corp') !== false || stripos($regionStr, 'jakarta') !== false) {
        $targetRegion = 'Jawa / HO';
    }

    $key = "$locName ($orgName)";

    if (! isset($facilities[$facilityType][$key])) {
        $facilities[$facilityType][$key] = 0;
    }
    $facilities[$facilityType][$key]++;

    if (! isset($regions[$targetRegion][$key])) {
        $regions[$targetRegion][$key] = 0;
    }
    $regions[$targetRegion][$key]++;
}

echo "=== LAINNYA REGIONS ===\n";
arsort($regions['Lainnya']);
foreach ($regions['Lainnya'] as $k => $v) {
    echo "$k: $v\n";
}

echo "\n=== RANDOM 15 ESTATE ===\n";
$estateKeys = array_keys($facilities['Estate']);
shuffle($estateKeys);
foreach (array_slice($estateKeys, 0, 15) as $k) {
    echo "$k\n";
}

echo "\n=== RANDOM 15 MILL ===\n";
$millKeys = array_keys($facilities['Mill']);
shuffle($millKeys);
foreach (array_slice($millKeys, 0, 15) as $k) {
    echo "$k\n";
}

echo "\n=== RANDOM 15 HO ===\n";
$hoKeys = array_keys($facilities['HO']);
shuffle($hoKeys);
foreach (array_slice($hoKeys, 0, 15) as $k) {
    echo "$k\n";
}

echo "\nTOTAL HC: ".Employee::count()."\n";
