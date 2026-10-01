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
                        Peta SDM Operasional
                    </h2>
                    <p className="text-lg text-white/90 font-medium mb-1">
                        Kelola SDM Perkebunan dengan Cerdas
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
                        <p className="text-gray-500">Silakan masuk ke akun Anda untuk melanjutkan ke Peta SDM Operasional.</p>
                    </div>

                    <form onSubmit={submit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Email atau NIK Pegawai</label>
                            <input
                                type="text"
                                value={data.email}
                                onChange={e => setData('email', e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-corporate-light focus:border-corporate-light outline-none transition-all"
                                placeholder="Masukkan NIK atau Email"
                                required
                            />
                            {errors.email && <p className="text-red-500 text-sm mt-2">{errors.email}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Kata Sandi</label>
                            <input
                                type="password"
                                value={data.password}
                                onChange={e => setData('password', e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-corporate-light focus:border-corporate-light outline-none transition-all"
                                placeholder="Masukkan kata sandi"
                                required
                            />
                        </div>



                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full bg-corporate-dark hover:bg-corporate-light text-white font-bold py-3.5 rounded-lg transition-colors disabled:opacity-70 mt-6 flex justify-center items-center gap-2"
                        >
                            Masuk ke Sistem
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                        </button>
                    </form>
                    
                    <div className="mt-16 text-center">
                        <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} Peta SDM - Internal System Portal</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
