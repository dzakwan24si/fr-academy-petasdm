<?php

namespace Tests\Unit;

use App\Support\Clean;
use PHPUnit\Framework\TestCase;

class CleanTest extends TestCase
{
    public function test_date2_parsing()
    {
        $d = Clean::date2('04-Dec-06', 15);
        $this->assertEquals('2006-12-04', $d->format('Y-m-d'));

        $d = Clean::date2('04-Dec-99', 15);
        $this->assertEquals('1999-12-04', $d->format('Y-m-d'));
        
        $this->assertNull(Clean::date2('', 15));
        $this->assertNull(Clean::date2('invalid', 15));
    }

    public function test_month_parsing()
    {
        $this->assertEquals(1, Clean::month('JAN'));
        $this->assertEquals(5, Clean::month('MEI'));
        $this->assertEquals(8, Clean::month('AGU'));
        $this->assertNull(Clean::month('xyz'));
    }

    public function test_region_mapping()
    {
        $this->assertEquals('Kaltim', Clean::region('Kaltim'));
        $this->assertEquals('Riau', Clean::region('riau'));
        $this->assertNull(Clean::region(''));
    }

    public function test_nik_status()
    {
        $this->assertEquals('empty', Clean::nikStatus('-'));
        $this->assertEquals('empty', Clean::nikStatus(''));
        $this->assertEquals('corrupt', Clean::nikStatus('20140700000000'));
        $this->assertEquals('corrupt', Clean::nikStatus('2,01407E+13'));
        $this->assertEquals('invalid', Clean::nikStatus('Promosi'));
        $this->assertEquals('ok', Clean::nikStatus('123456'));
    }

    public function test_company_key()
    {
        $this->assertEquals('PANCA SURYA GARDEN', Clean::companyKey('PT. Panca Surya Garden'));
        $this->assertEquals('PANCA SURYA GARDEN', Clean::companyKey('PANCA SURYA GARDEN'));
    }
}
