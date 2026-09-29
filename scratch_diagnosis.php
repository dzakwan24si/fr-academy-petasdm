<?php
echo "ALL LOCATIONS:\n";
foreach (\App\Models\Location::whereNotNull('latitude')->orderBy('code')->get() as $l) {
    echo "{$l->code}: {$l->latitude}, {$l->longitude} ({$l->coordinate_source})\n";
}

echo "\nSPECIFIC LOCATIONS:\n";
foreach (['OF02-01', 'PR07', 'PB01', 'KR10', 'KR19'] as $code) {
    $l = \App\Models\Location::where('code', $code)->first();
    if ($l) {
        echo "{$code}: {$l->latitude}, {$l->longitude} ({$l->coordinate_source})\n";
    } else {
        echo "{$code}: NOT FOUND\n";
    }
}
