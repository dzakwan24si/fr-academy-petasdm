<?php

namespace App\Support;

use Carbon\Carbon;

class Demographics
{
    public static function age(?Carbon $birthDate, ?Carbon $asOf = null): ?float
    {
        if (!$birthDate) return null;
        $asOf = $asOf ?? now();
        return $birthDate->diffInDays($asOf) / 365.25;
    }

    public static function los(?Carbon $joinDate, ?Carbon $asOf = null): ?float
    {
        if (!$joinDate) return null;
        $asOf = $asOf ?? now();
        return $joinDate->diffInDays($asOf) / 365.25;
    }

    public static function ageFullYears(?Carbon $birthDate, ?Carbon $asOf = null): ?int
    {
        if (!$birthDate) return null;
        $asOf = $asOf ?? now();
        return (int) $birthDate->diffInYears($asOf);
    }

    public static function losFullYears(?Carbon $joinDate, ?Carbon $asOf = null): ?int
    {
        if (!$joinDate) return null;
        $asOf = $asOf ?? now();
        return (int) $joinDate->diffInYears($asOf);
    }

    public static function ageGroup(?int $age): string
    {
        if ($age === null) return 'Unknown';
        if ($age < 25) return '<25';
        if ($age < 35) return '25-34';
        if ($age < 45) return '35-44';
        if ($age < 55) return '45-54';
        return '55+';
    }

    public static function losGroup(?int $los): string
    {
        if ($los === null) return 'Unknown';
        if ($los < 1) return '<1';
        if ($los < 3) return '1-<3';
        if ($los < 5) return '3-<5';
        if ($los < 10) return '5-<10';
        return '10+';
    }

    public static function generation(?int $birthYear): string
    {
        if ($birthYear === null) return 'Unknown';
        $config = config('sdm.generations', [
            'Boomers' => 1964,
            'Gen X' => 1980,
            'Gen Y' => 1996,
        ]);
        if ($birthYear <= $config['Boomers']) return 'Boomers';
        if ($birthYear <= $config['Gen X']) return 'Gen X';
        if ($birthYear <= $config['Gen Y']) return 'Gen Y';
        return 'Gen Z';
    }

    public static function isRetirementRisk(?Carbon $birthDate, ?Carbon $asOf = null): bool
    {
        if (!$birthDate) return false;
        $age = self::ageFullYears($birthDate, $asOf);
        return $age >= config('sdm.retirement_age', 55);
    }

    public static function retiresInYears(?Carbon $birthDate, int $years, ?Carbon $asOf = null): bool
    {
        if (!$birthDate) return false;
        $asOf = $asOf ?? now();
        $targetDate = $asOf->copy()->addYears($years);
        
        $currentAge = self::ageFullYears($birthDate, $asOf);
        $futureAge = self::ageFullYears($birthDate, $targetDate);
        $retirementAge = config('sdm.retirement_age', 55);
        
        return $currentAge < $retirementAge && $futureAge >= $retirementAge;
    }
}
