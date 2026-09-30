import { useForm, Head } from '@inertiajs/react';
import { Leaf } from 'lucide-react';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <div className="min-h-screen flex bg-app-bg font-sans">
            <Head title="Login" />
            
            {/* Kolom Kiri - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-24 bg-white relative z-10 shadow-2xl">
                <div className="w-full max-w-md">
                    <div className="text-center lg:text-left mb-10">
                        <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mb-6 mx-auto lg:mx-0 shadow-md">
                            <img src="/logofr.png" alt="Logo" className="w-12 h-12 object-contain" />
                        </div>
                        <h1 className="text-3xl font-bold text-corporate-dark mb-3">Selamat Datang</h1>
                        <p className="text-gray-500">Silakan masuk ke akun Anda untuk melanjutkan ke Peta SDM Operasional.</p>
                    </div>

                    <form onSubmit={submit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                            <input
                                type="email"
                                value={data.email}
                                onChange={e => setData('email', e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-corporate-light focus:border-corporate-light focus:bg-white outline-none transition-all"
                                placeholder="nama@perusahaan.com"
                                required
                            />
                            {errors.email && <p className="text-red-500 text-sm mt-2">{errors.email}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                            <input
                                type="password"
                                value={data.password}
                                onChange={e => setData('password', e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-corporate-light focus:border-corporate-light focus:bg-white outline-none transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full bg-corporate-dark hover:bg-corporate-light text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-70 shadow-lg shadow-corporate-dark/30 mt-4"
                        >
                            {processing ? 'Masuk...' : 'Masuk ke Dashboard'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Kolom Kanan - Visual Panel */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-corporate-dark overflow-hidden items-center justify-center">
                {/* SVG Pattern Background (Subtle leaf/geo pattern) */}
                <div className="absolute inset-0 opacity-15">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="leaf-pattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                                <path d="M40 10 C55 10, 65 25, 40 60 C15 25, 25 10, 40 10 Z" fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.6"/>
                                <path d="M40 10 L40 60" stroke="#ffffff" strokeWidth="0.5" opacity="0.4"/>
                            </pattern>
                        </defs>
                        <rect x="0" y="0" width="100%" height="100%" fill="url(#leaf-pattern)" />
                    </svg>
                </div>
                
                {/* Gradient Overlay for richness */}
                <div className="absolute inset-0 bg-gradient-to-br from-corporate-dark/80 via-transparent to-corporate-light/60 mix-blend-multiply pointer-events-none"></div>
                
                {/* Content */}
                <div className="relative z-10 text-center px-12 max-w-2xl">
                    <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-center mx-auto mb-8 shadow-2xl">
                        <Leaf className="text-amber-400 w-10 h-10" />
                    </div>
                    <h2 className="text-4xl font-bold text-white mb-6 leading-tight tracking-wide">Kelola SDM Perkebunan<br/>dengan Cerdas</h2>
                    <p className="text-lg opacity-90 text-white/90 leading-relaxed font-light">
                        Peta SDM Operasional menyajikan insight demografi, masa kerja, risiko pensiun, dan sebaran karyawan di seluruh area operasional Anda secara terpusat.
                    </p>
                </div>
            </div>
        </div>
    );
}
