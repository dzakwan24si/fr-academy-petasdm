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
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                    <input
                        id="email"
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-corporate-light focus:border-corporate-light outline-none transition-all"
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
