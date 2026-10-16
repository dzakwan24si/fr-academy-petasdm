import { useForm, usePage } from '@inertiajs/react';
import { Save } from 'lucide-react';

export default function UpdateProfileInformation({ status, className = '' }) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: user.name,
        email: user.email,
    });

    const submit = (e) => {
        e.preventDefault();
        patch('/pengaturan/profil');
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-bold text-gray-900">Informasi Akun</h2>
                <p className="mt-1 text-sm text-gray-600">
                    Perbarui nama lengkap dan alamat email akun Anda.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6 max-w-xl">
                {/* Identitas Terdaftar (Read-only) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 border border-gray-200 rounded-2xl">
                    <div>
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">NIK Pegawai</span>
                        <span className="text-sm font-mono font-bold text-gray-900 mt-0.5 block">{user?.nik || '-'}</span>
                    </div>
                    <div>
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Role Hak Akses</span>
                        <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-xs font-bold uppercase ${
                            user?.role === 'superadmin' ? 'bg-purple-100 text-purple-700' :
                            user?.role === 'manajemen' ? 'bg-amber-100 text-amber-700' :
                            'bg-sky-100 text-sky-700'
                        }`}>
                            {user?.role || 'Viewer'}
                        </span>
                    </div>
                    {user?.employee?.job_title_name && (
                        <div className="sm:col-span-2 pt-2 border-t border-gray-200/60">
                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Jabatan & Departemen</span>
                            <span className="text-xs text-gray-700 mt-0.5 block">
                                {user.employee.job_title_name} &bull; {user.employee.organization_name} {user.employee.region ? `(${user.employee.region})` : ''}
                            </span>
                        </div>
                    )}
                </div>

                <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">Nama Lengkap</label>
                    <input
                        id="name"
                        type="text"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        autoComplete="name"
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-corporate-light focus:border-corporate-light outline-none transition-all"
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-2">{errors.name}</p>}
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                        Alamat Email <span className="text-xs text-gray-400 font-normal">(Opsional)</span>
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={data.email || ''}
                        onChange={(e) => setData('email', e.target.value)}
                        autoComplete="email"
                        placeholder="nama@first-resources.com"
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-corporate-light focus:border-corporate-light outline-none transition-all placeholder:text-gray-400"
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-2">{errors.email}</p>}
                </div>

                <div className="flex items-center gap-4">
                    <button
                        type="submit"
                        disabled={processing}
                        className="bg-corporate-dark hover:bg-corporate-light text-white font-bold py-2.5 px-5 rounded-lg transition-colors disabled:opacity-70 flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Simpan Perubahan
                    </button>

                    {recentlySuccessful && (
                        <p className="text-sm text-green-600 font-medium bg-green-50 px-3 py-1 rounded-md border border-green-100 transition-opacity">
                            Berhasil disimpan.
                        </p>
                    )}
                </div>
            </form>
        </section>
    );
}
