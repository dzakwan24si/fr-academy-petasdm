import { useForm, Head } from '@inertiajs/react';

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
        <div className="min-h-screen flex items-center justify-center bg-app-bg p-4 font-sans">
            <Head title="Login" />
            
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-corporate-dark mb-2">Peta SDM Operasional</h1>
                    <p className="text-gray-500 text-sm">Silakan masuk dengan akun Anda</p>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            value={data.email}
                            onChange={e => setData('email', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-corporate-light focus:border-corporate-light outline-none transition-colors"
                            required
                        />
                        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            value={data.password}
                            onChange={e => setData('password', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-corporate-light focus:border-corporate-light outline-none transition-colors"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full bg-corporate-dark hover:bg-corporate-light text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-70"
                    >
                        {processing ? 'Masuk...' : 'Masuk'}
                    </button>
                </form>

                <div className="mt-8 p-4 bg-gray-50 rounded-lg text-xs text-gray-600">
                    <p className="font-semibold mb-1">Demo Akun (Sandi: password)</p>
                    <ul className="space-y-1">
                        <li>super@example.com</li>
                        <li>hr@example.com</li>
                        <li>hr_company@example.com</li>
                        <li>management@example.com</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
