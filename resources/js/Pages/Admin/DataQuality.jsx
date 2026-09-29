import { usePage } from '@inertiajs/react';

export default function DataQuality() {
    const { stats } = usePage().props;

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6">Laporan Kualitas Data</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-lg font-bold mb-4">Klasifikasi NIK (Training)</h2>
                    <ul className="space-y-2">
                        <li className="flex justify-between">
                            <span className="text-gray-600">Total Baris:</span>
                            <span className="font-semibold">{stats.training_rows}</span>
                        </li>
                        <li className="flex justify-between">
                            <span className="text-gray-600">NIK Valid (Angka Murni):</span>
                            <span className="font-semibold text-green-600">{stats.nik_ok}</span>
                        </li>
                        <li className="flex justify-between">
                            <span className="text-gray-600">NIK Kosong / '-':</span>
                            <span className="font-semibold text-yellow-600">{stats.nik_empty}</span>
                        </li>
                        <li className="flex justify-between">
                            <span className="text-gray-600">NIK Format Ilmiah (Corrupt):</span>
                            <span className="font-semibold text-red-600">{stats.nik_corrupt}</span>
                        </li>
                        <li className="flex justify-between">
                            <span className="text-gray-600">NIK Tidak Valid (Huruf):</span>
                            <span className="font-semibold text-red-600">{stats.nik_invalid}</span>
                        </li>
                        <li className="flex justify-between border-t pt-2 mt-2">
                            <span className="text-gray-600">NIK Rapi tapi tak ada di Karyawan:</span>
                            <span className="font-semibold text-orange-600">{stats.unmatched_nik}</span>
                        </li>
                    </ul>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-lg font-bold mb-4">Pemetaan Perusahaan</h2>
                    <ul className="space-y-2">
                        <li className="flex justify-between">
                            <span className="text-gray-600">Total Alias PT (Unik):</span>
                            <span className="font-semibold">{stats.alias_total}</span>
                        </li>
                        <li className="flex justify-between">
                            <span className="text-gray-600">Alias Belum Terpetakan:</span>
                            <span className="font-semibold text-red-600">{stats.alias_unmatched}</span>
                        </li>
                        <li className="flex justify-between">
                            <span className="text-gray-600">Alias Sudah Terpetakan:</span>
                            <span className="font-semibold text-green-600">{stats.alias_total - stats.alias_unmatched}</span>
                        </li>
                    </ul>
                    <div className="mt-4 text-sm text-gray-500">
                        Untuk memetakan alias, jalankan query manual pada tabel `company_aliases` dengan menset `company_id`.
                    </div>
                </div>
            </div>
        </div>
    );
}
