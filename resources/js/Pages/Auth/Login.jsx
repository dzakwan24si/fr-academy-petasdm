import { useRef, useState } from 'react';
import { useForm, Head } from '@inertiajs/react';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import TurnstileWidget from '@/Components/ui/TurnstileWidget';

export default function Login({ turnstileSiteKey, turnstileEnabled = true }) {
    const turnstileRef = useRef(null);
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        nik: '',
        password: '',
        remember: false,
        turnstile_token: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/login', {
            onError: () => {
                turnstileRef.current?.reset();
                setData('turnstile_token', '');
            },
        });
    };

    return (
        <div className="min-h-screen flex bg-app-bg font-sans">
            <Head title="Masuk - Monitoring Operation" />

            {/* Kolom Kiri - Visual Panel (Image Background) */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-end p-12">
                {/* Background Image */}
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: "url('/welcomefr.jpg')" }}
                ></div>

                {/* Dark Green Overlay */}
                <div className="absolute inset-0 bg-corporate-dark/80 mix-blend-multiply"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-corporate-dark/95 via-corporate-dark/40 to-transparent"></div>

                {/* Content at Bottom Left */}
                <div className="relative z-10 w-full mb-8">
                    <h2 className="text-4xl font-extrabold text-white mb-4 uppercase tracking-wider">
                        Monitoring Operation
                    </h2>
                    <p className="text-lg text-white/90 font-medium mb-1">
                        Sistem Monitoring Operasional Perkebunan
                    </p>
                    <p className="text-sm text-white/70">
                        First Resources
                    </p>
                </div>
            </div>

            {/* Kolom Kanan - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-24 bg-white relative z-10">
                <div className="w-full max-w-md">
                    <div className="text-center lg:text-left mb-10">
                        <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mb-6 mx-auto lg:mx-0 shadow-md hidden">
                            <img src="/logofr.png" alt="Logo" className="w-12 h-12 object-contain" />
                        </div>
                        <h1 className="text-3xl font-bold text-corporate-dark mb-3">Selamat Datang</h1>
                        <p className="text-gray-500">Silakan masuk menggunakan Nomor Induk Karyawan (NIK) Anda untuk melanjutkan.</p>
                    </div>

                    <form onSubmit={submit} className="space-y-5">
                        <div>
                            <label htmlFor="nik" className="block text-sm font-semibold text-gray-700 mb-2">
                                Nomor Induk Karyawan (NIK)
                            </label>
                            <input
                                id="nik"
                                name="nik"
                                type="text"
                                autoComplete="username"
                                value={data.nik}
                                onChange={e => setData('nik', e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-corporate-light focus:border-corporate-light outline-none transition-all placeholder:text-gray-400"
                                placeholder="Masukkan Nomor Induk Karyawan (NIK)"
                                required
                                autoFocus
                            />
                            {errors.nik && <p className="text-red-500 text-sm mt-2 font-medium">{errors.nik}</p>}
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                                Kata Sandi
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    value={data.password}
                                    onChange={e => setData('password', e.target.value)}
                                    className="w-full px-4 py-3 pr-11 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-corporate-light focus:border-corporate-light outline-none transition-all placeholder:text-gray-400"
                                    placeholder="Masukkan kata sandi"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.password && <p className="text-red-500 text-sm mt-2 font-medium">{errors.password}</p>}
                        </div>

                        {/* Ingat Saya (Remember Me) */}
                        <div className="flex items-center">
                            <input
                                id="remember_me"
                                name="remember"
                                type="checkbox"
                                checked={data.remember}
                                onChange={e => setData('remember', e.target.checked)}
                                className="h-4 w-4 text-corporate-dark focus:ring-corporate-light border-gray-300 rounded cursor-pointer accent-[#004D40]"
                            />
                            <label htmlFor="remember_me" className="ml-2 block text-sm text-gray-600 font-medium cursor-pointer select-none">
                                Ingat Saya
                            </label>
                        </div>

                        {/* Cloudflare Turnstile Widget (Jika Diaktifkan) */}
                        {turnstileEnabled && turnstileSiteKey && (
                            <div className="pt-1">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                    Verifikasi Keamanan
                                </label>
                                <TurnstileWidget
                                    ref={turnstileRef}
                                    siteKey={turnstileSiteKey}
                                    onVerify={(token) => setData('turnstile_token', token)}
                                    onExpire={() => setData('turnstile_token', '')}
                                    onError={() => setData('turnstile_token', '')}
                                />
                                {errors.turnstile_token && (
                                    <p className="text-red-500 text-sm mt-1.5 font-medium">
                                        {errors.turnstile_token}
                                    </p>
                                )}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={processing || (turnstileEnabled && turnstileSiteKey && !data.turnstile_token)}
                            className="w-full bg-corporate-dark hover:bg-corporate-light text-white font-bold py-3.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-6 flex justify-center items-center gap-2 cursor-pointer shadow-sm hover:shadow"
                        >
                            Masuk ke Sistem
                            <LogIn size={18} />
                        </button>
                    </form>

                    <div className="mt-16 text-center">
                        <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} Monitoring Operation - First Resources</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
