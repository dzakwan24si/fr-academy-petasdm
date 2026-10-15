<?php

namespace Tests\Unit;

use App\Support\Demographics;
use Carbon\Carbon;
use Tests\TestCase;

class DemographicsTest extends TestCase
{
    public function test_age_calculations()
    {
        Carbon::setTestNow('2026-09-28');

        $birth = Carbon::parse('1996-09-28');
        $this->assertEquals(30, Demographics::ageFullYears($birth));
        $this->assertEquals('25-34', Demographics::ageGroup(30));

        $this->assertEquals('Gen Y', Demographics::generation(1996));
        $this->assertEquals('Boomers', Demographics::generation(1960));
    }

    public function test_retirement_risk()
    {
        Carbon::setTestNow('2026-09-28');
        config(['sdm.retirement_age' => 55]);

        $retiringSoon = Carbon::parse('1971-09-28');
        $this->assertTrue(Demographics::isRetirementRisk($retiringSoon));

        $safe = Carbon::parse('1980-01-01');
        $this->assertFalse(Demographics::isRetirementRisk($safe));
        $this->assertTrue(Demographics::retiresInYears($safe, 10));
        $this->assertFalse(Demographics::retiresInYears($safe, 5));
    }
}
