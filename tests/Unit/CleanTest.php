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

        $d = Clean::date2('2007-03-01', 15);
        $this->assertEquals('2007-03-01', $d->format('Y-m-d'));

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
        $this->assertEquals('Kaltim', Clean::region('kubar'));
        $this->assertEquals('Kaltim', Clean::region('Kubar'));
        $this->assertEquals('Riau', Clean::region('riau'));
        $this->assertEquals('Kalbar', Clean::region('kalbar'));
        $this->assertNull(Clean::region(''));
    }

    public function test_nik_status()
    {
        $this->assertEquals('empty', Clean::nikStatus('-'));
        $this->assertEquals('empty', Clean::nikStatus(''));
        $this->assertEquals('ok', Clean::nikStatus('20140700000000'));
        $this->assertEquals('corrupt', Clean::nikStatus('2,01407E+13'));
        $this->assertEquals('invalid', Clean::nikStatus('Promosi'));
        $this->assertEquals('ok', Clean::nikStatus('123456'));
    }

    public function test_company_key()
    {
        $this->assertEquals('PANCA SURYA GARDEN', Clean::companyKey('PT. Panca Surya Garden'));
        $this->assertEquals('PANCA SURYA GARDEN', Clean::companyKey('PANCA SURYA GARDEN'));
    }

    public function test_company_meta_extracts_initials_and_aliases()
    {
        // SAM 1 with locations
        $sam1 = Clean::companyMeta('PT. Subur Arum Makmur 1', ['Kebun SAM1', 'Pabrik SAM1']);
        $this->assertEquals('SAM 1', $sam1['initials']);
        $this->assertContains('SAM', $sam1['aliases']);
        $this->assertContains('SAM1', $sam1['aliases']);
        $this->assertContains('SAM 1', $sam1['aliases']);

        // SAM 2
        $sam2 = Clean::companyMeta('PT. Subur Arum Makmur 2', ['Kebun SAM2']);
        $this->assertEquals('SAM 2', $sam2['initials']);
        $this->assertContains('SAM', $sam2['aliases']);
        $this->assertContains('SAM2', $sam2['aliases']);

        // PSG (Panca Surya Garden)
        $psg = Clean::companyMeta('PT. Panca Surya Garden');
        $this->assertEquals('PSG', $psg['initials']);
        $this->assertContains('PSG', $psg['aliases']);

        // SMM (Sahabat Mewah & Makmur)
        $smm = Clean::companyMeta('PT. Sahabat Mewah & Makmur');
        $this->assertEquals('SMM', $smm['initials']);
        $this->assertContains('SMM', $smm['aliases']);

        // CLP (Ciliandra Perkasa)
        $clp = Clean::companyMeta('PT. Ciliandra Perkasa', ['Pabrik CLP', 'Kebun CLP']);
        $this->assertEquals('CLP', $clp['initials']);
        $this->assertContains('CLP', $clp['aliases']);

        // SAGM (Setia Agrindo Mandiri) - pastikan TIDAK mengandung 'SAM' agar tidak bentrok dengan Subur Arum Makmur
        $sagm = Clean::companyMeta('PT. Setia Agrindo Mandiri', ['Pabrik SAGM']);
        $this->assertEquals('SAGM', $sagm['initials']);
        $this->assertContains('SAGM', $sagm['aliases']);
        $this->assertNotContains('SAM', $sagm['aliases']);

        // ATS 1 (Arindo Trisejahtera 1)
        $ats1 = Clean::companyMeta('PT. Arindo Trisejahtera 1', ['Kebun ATS1']);
        $this->assertEquals('ATS 1', $ats1['initials']);
        $this->assertContains('ATS', $ats1['aliases']);
        $this->assertContains('ATS1', $ats1['aliases']);

        // KALE (Kayung Agro Lestari) vs KAL (Ketapang Agro Lestari)
        $kale = Clean::companyMeta('PT. Kayung Agro Lestari');
        $this->assertEquals('KALE', $kale['initials']);
        $this->assertContains('KALE', $kale['aliases']);

        $kal = Clean::companyMeta('PT. Ketapang Agro Lestari');
        $this->assertEquals('KAL', $kal['initials']);
        $this->assertContains('KAL', $kal['aliases']);
    }

    public function test_detect_facilities_classification()
    {
        // 1. Estate & Mill
        $sam1 = Clean::facilities(['Kebun SAM1', 'Pabrik SAM1']);
        $this->assertEquals(['Estate', 'Mill'], $sam1);

        // 2. Estate only
        $ats2 = Clean::facilities(['Kebun ATS2']);
        $this->assertEquals(['Estate'], $ats2);

        // 3. Field unit acronyms default to Estate
        $bdl = Clean::facilities(['BDL']);
        $this->assertEquals(['Estate'], $bdl);

        // 4. Mill only
        $aane = Clean::facilities(['Pabrik AANE']);
        $this->assertEquals(['Mill'], $aane);

        // 5. Downstream (Refinery, Bulking, Jetty)
        $ask = Clean::facilities(['Downstream ASK Bulking Station', 'Downstream ASK Refinery', 'Downstream Jetty', 'Pabrik KCP ASK']);
        $this->assertContains('Downstream', $ask);
        $this->assertContains('Mill', $ask);

        // 6. Office only
        $office = Clean::facilities(['Pekanbaru Office', 'Jakarta Office']);
        $this->assertEquals(['Office'], $office);

        // 7. Empty locations
        $empty = Clean::facilities([]);
        $this->assertEquals([], $empty);
    }
}
