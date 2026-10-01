import { useRef } from 'react';
import { useForm } from '@inertiajs/react';
import { KeyRound } from 'lucide-react';

export default function UpdatePasswordForm({ className = '' }) {
    const passwordInput = useRef();
    const currentPasswordInput = useRef();

    const { data, setData, errors, put, reset, processing, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword = (e) => {
        e.preventDefault();

        put('/pengaturan/password', {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current.focus();
                }

                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current.focus();
                }
            },
        });
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-bold text-gray-900">Ubah Password</h2>
                <p className="mt-1 text-sm text-gray-600">
                    Pastikan akun Anda menggunakan password yang panjang (minimal 12 karakter) dan acak agar tetap aman.
                </p>
            </header>

            <form onSubmit={updatePassword} className="mt-6 space-y-6 max-w-xl">
                <div>
                    <label htmlFor="current_password" className="block text-sm font-semibold text-gray-700 mb-2">Password Saat Ini</label>
                    <input
                        id="current_password"
                        ref={currentPasswordInput}
                        value={data.current_password}
                        onChange={(e) => setData('current_password', e.target.value)}
                        type="password"
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-corporate-light focus:border-corporate-light outline-none transition-all"
                        autoComplete="current-password"
                    />
                    {errors.current_password && <p className="text-red-500 text-sm mt-2">{errors.current_password}</p>}
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">Password Baru (Min. 12 karakter)</label>
                    <input
                        id="password"
                        ref={passwordInput}
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        type="password"
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-corporate-light focus:border-corporate-light outline-none transition-all"
                        autoComplete="new-password"
                    />
                    {errors.password && <p className="text-red-500 text-sm mt-2">{errors.password}</p>}
                </div>

                <div>
                    <label htmlFor="password_confirmation" className="block text-sm font-semibold text-gray-700 mb-2">Konfirmasi Password Baru</label>
                    <input
                        id="password_confirmation"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        type="password"
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-corporate-light focus:border-corporate-light outline-none transition-all"
                        autoComplete="new-password"
                    />
                    {errors.password_confirmation && <p className="text-red-500 text-sm mt-2">{errors.password_confirmation}</p>}
                </div>

                <div className="flex items-center gap-4">
                    <button
                        type="submit"
                        disabled={processing}
                        className="bg-corporate-dark hover:bg-corporate-light text-white font-bold py-2.5 px-5 rounded-lg transition-colors disabled:opacity-70 flex items-center gap-2"
                    >
                        <KeyRound className="w-4 h-4" />
                        Ubah Password
                    </button>

                    {recentlySuccessful && (
                        <p className="text-sm text-green-600 font-medium bg-green-50 px-3 py-1 rounded-md border border-green-100 transition-opacity">
                            Password berhasil diubah.
                        </p>
                    )}
                </div>
            </form>
        </section>
    );
}
