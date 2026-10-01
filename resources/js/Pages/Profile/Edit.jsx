import AppLayout from '@/Layouts/AppLayout';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { Head } from '@inertiajs/react';
import { Settings } from 'lucide-react';

export default function Edit({ mustVerifyEmail, status }) {
    return (
        <AppLayout
            header={
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-corporate-light/10 rounded-lg">
                        <Settings className="w-6 h-6 text-corporate-light" />
                    </div>
                    <h2 className="font-bold text-xl text-corporate-dark leading-tight">Pengaturan Akun</h2>
                </div>
            }
        >
            <Head title="Pengaturan Akun" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    <div className="p-4 sm:p-8 bg-white shadow-sm border border-gray-100 sm:rounded-2xl">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-xl"
                        />
                    </div>

                    <div className="p-4 sm:p-8 bg-white shadow-sm border border-gray-100 sm:rounded-2xl">
                        <UpdatePasswordForm className="max-w-xl" />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
