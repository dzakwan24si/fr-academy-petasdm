import { useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';

export default function Import() {
    const { batches } = usePage().props;
    const { data, setData, post, processing, errors, reset } = useForm({
        type: 'employee',
        file: null,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.import.store'), {
            onSuccess: () => reset('file'),
        });
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6">Import Data SDM</h1>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8 max-w-2xl">
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Data</label>
                        <select 
                            value={data.type} 
                            onChange={e => setData('type', e.target.value)}
                            className="w-full border-gray-300 rounded-md shadow-sm"
                        >
                            <option value="employee">Data Karyawan</option>
                            <option value="training">Training Record</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">File CSV</label>
                        <input 
                            type="file" 
                            accept=".csv,.txt"
                            onChange={e => setData('file', e.target.files[0])}
                            className="w-full border border-gray-300 p-2 rounded-md"
                        />
                        {errors.file && <p className="text-red-500 text-sm mt-1">{errors.file}</p>}
                    </div>
                    <button 
                        type="submit" 
                        disabled={processing || !data.file}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                        {processing ? 'Mengimpor...' : 'Jalankan Import'}
                    </button>
                </form>
            </div>

            <h2 className="text-xl font-bold mb-4">Riwayat Import</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="p-3 text-sm font-medium text-gray-600">ID</th>
                            <th className="p-3 text-sm font-medium text-gray-600">Tipe</th>
                            <th className="p-3 text-sm font-medium text-gray-600">File</th>
                            <th className="p-3 text-sm font-medium text-gray-600">Total/Import/Skip</th>
                            <th className="p-3 text-sm font-medium text-gray-600">Waktu</th>
                            <th className="p-3 text-sm font-medium text-gray-600">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {batches?.map(b => (
                            <tr key={b.id}>
                                <td className="p-3 text-sm">{b.id}</td>
                                <td className="p-3 text-sm capitalize">{b.type}</td>
                                <td className="p-3 text-sm">{b.filename}</td>
                                <td className="p-3 text-sm">{b.rows_total} / {b.rows_imported} / {b.rows_skipped}</td>
                                <td className="p-3 text-sm">{new Date(b.started_at).toLocaleString('id-ID')}</td>
                                <td className="p-3 text-sm">{b.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
