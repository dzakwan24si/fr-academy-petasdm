import { useState, useEffect, useRef } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { 
    Users, 
    ShieldCheck, 
    UserCheck, 
    Eye, 
    Plus, 
    Search, 
    Trash2, 
    KeyRound, 
    UserCog, 
    CheckCircle2, 
    XCircle, 
    AlertCircle, 
    Building2, 
    Briefcase, 
    MapPin, 
    RotateCcw, 
    Lock, 
    EyeOff, 
    X,
    Check,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    Shield
} from 'lucide-react';
import axios from 'axios';

export default function UsersIndex({ users, filters, stats }) {
    const { auth, flash } = usePage().props;
    const currentUserId = auth?.user?.id;

    // Filters state
    const [search, setSearch] = useState(filters.search || '');
    const [role, setRole] = useState(filters.role || '');
    const [status, setStatus] = useState(filters.status || '');

    // Modal states
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [roleModalUser, setRoleModalUser] = useState(null);
    const [passwordModalUser, setPasswordModalUser] = useState(null);
    const [deleteModalUser, setDeleteModalUser] = useState(null);

    // Live search for employee in create modal
    const [empQuery, setEmpQuery] = useState('');
    const [empSuggestions, setEmpSuggestions] = useState([]);
    const [isSearchingEmp, setIsSearchingEmp] = useState(false);
    const [selectedEmp, setSelectedEmp] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    // Debounce filter search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (filters.search || '') || role !== (filters.role || '') || status !== (filters.status || '')) {
                router.get('/admin/users', {
                    search: search || undefined,
                    role: role || undefined,
                    status: status || undefined,
                }, {
                    preserveState: true,
                    replace: true,
                });
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [search, role, status]);

    // Live search for employees
    useEffect(() => {
        if (!empQuery || empQuery.trim().length < 2) {
            setEmpSuggestions([]);
            return;
        }

        const timer = setTimeout(() => {
            setIsSearchingEmp(true);
            axios.get('/admin/users/search-employee', { params: { q: empQuery.trim() } })
                .then(res => {
                    setEmpSuggestions(res.data || []);
                })
                .catch(() => {
                    setEmpSuggestions([]);
                })
                .finally(() => {
                    setIsSearchingEmp(false);
                });
        }, 300);

        return () => clearTimeout(timer);
    }, [empQuery]);

    // Form for Create User
    const createForm = useForm({
        is_manual: false,
        nik: '',
        name: '',
        job_title: '',
        role: 'manajemen',
        password: '',
        is_active: true,
    });

    const handleSelectEmployee = (emp) => {
        if (emp.already_registered) return;
        setSelectedEmp(emp);
        createForm.setData('nik', emp.employee_id);
        setEmpQuery(`${emp.employee_id} - ${emp.name}`);
        setEmpSuggestions([]);
    };

    const handleCreateSubmit = (e) => {
        e.preventDefault();
        createForm.post('/admin/users', {
            onSuccess: () => {
                setCreateModalOpen(false);
                createForm.reset();
                setSelectedEmp(null);
                setEmpQuery('');
            },
        });
    };

    // Form for Change Role
    const roleForm = useForm({
        role: 'viewer',
    });

    const openRoleModal = (u) => {
        setRoleModalUser(u);
        roleForm.setData('role', u.role);
    };

    const handleRoleSubmit = (e) => {
        e.preventDefault();
        if (!roleModalUser) return;
        roleForm.put(`/admin/users/${roleModalUser.id}/role`, {
            onSuccess: () => {
                setRoleModalUser(null);
            },
        });
    };

    // Form for Reset Password
    const passwordForm = useForm({
        password: '',
    });

    const openPasswordModal = (u) => {
        setPasswordModalUser(u);
        passwordForm.setData('password', '');
        setShowPassword(false);
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        if (!passwordModalUser) return;
        passwordForm.put(`/admin/users/${passwordModalUser.id}/password`, {
            onSuccess: () => {
                setPasswordModalUser(null);
                passwordForm.reset();
            },
        });
    };

    // Toggle active status
    const handleToggleStatus = (u) => {
        if (u.id === currentUserId) {
            alert('Anda tidak dapat menonaktifkan akun Anda sendiri.');
            return;
        }
        const confirmMsg = u.is_active 
            ? `Apakah Anda yakin ingin menonaktifkan akun ${u.name}? Pengguna ini tidak akan bisa login ke sistem.`
            : `Aktifkan kembali akun ${u.name}?`;
        
        if (window.confirm(confirmMsg)) {
            router.patch(`/admin/users/${u.id}/toggle-status`, {}, {
                preserveScroll: true,
            });
        }
    };

    // Delete user
    const handleDeleteSubmit = () => {
        if (!deleteModalUser) return;
        router.delete(`/admin/users/${deleteModalUser.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteModalUser(null),
        });
    };

    // Reset filters
    const handleResetFilters = () => {
        setSearch('');
        setRole('');
        setStatus('');
        router.get('/admin/users');
    };

    const getRoleBadge = (userRole) => {
        switch (userRole) {
            case 'superadmin':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        <ShieldCheck size={13} className="text-purple-600" />
                        Superadmin
                    </span>
                );
            case 'manajemen':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <UserCheck size={13} className="text-amber-600" />
                        Manajemen
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
                        <Eye size={13} className="text-sky-600" />
                        Viewer
                    </span>
                );
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Belum pernah';
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <AppLayout title="Manajemen Akun">
            <Head title="Manajemen Akun - Peta SDM" />

            <div className="space-y-6 max-w-7xl mx-auto pb-10">
                {/* Alert Notifications */}
                {flash?.success && (
                    <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm shadow-xs animate-in fade-in duration-200">
                        <div className="flex items-center gap-2.5">
                            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                            <span className="font-semibold">{flash.success}</span>
                        </div>
                    </div>
                )}
                {flash?.error && (
                    <div className="flex items-center justify-between p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm shadow-xs animate-in fade-in duration-200">
                        <div className="flex items-center gap-2.5">
                            <AlertCircle size={18} className="text-rose-600 shrink-0" />
                            <span className="font-semibold">{flash.error}</span>
                        </div>
                    </div>
                )}

                {/* Header Bar */}
                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#004D40] flex items-center justify-center font-bold shadow-2xs">
                                <Users size={20} />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                                    Manajemen Akun Pengguna
                                </h1>
                                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                                    Kelola hak akses role (Superadmin, Manajemen, Viewer) dan otorisasi login berbasis NIK.
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            createForm.reset();
                            setSelectedEmp(null);
                            setEmpQuery('');
                            setEmpSuggestions([]);
                            setCreateModalOpen(true);
                        }}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#004D40] hover:bg-[#00382e] text-white font-bold text-sm rounded-full shadow-sm hover:shadow transition-all cursor-pointer shrink-0"
                    >
                        <Plus size={16} strokeWidth={2.5} />
                        Tambah Akun Pengguna
                    </button>
                </div>

                {/* KPI Cards Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
                    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Akun</span>
                            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                                <Users size={16} />
                            </div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2">{stats.total}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5 font-medium">Terdaftar di sistem</p>
                    </div>

                    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Superadmin</span>
                            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
                                <ShieldCheck size={16} />
                            </div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2">{stats.superadmin}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5 font-medium">Akses penuh sistem</p>
                    </div>

                    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Manajemen</span>
                            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                                <UserCheck size={16} />
                            </div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2">{stats.manajemen}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5 font-medium">Akses analitik & import</p>
                    </div>

                    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">Viewer</span>
                            <div className="p-2 rounded-xl bg-sky-50 text-sky-700">
                                <Eye size={16} />
                            </div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2">{stats.viewer}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5 font-medium">Akses hanya lihat</p>
                    </div>

                    <div className="col-span-2 lg:col-span-1 bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-2xs flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Status Akun</span>
                            <div className="p-2 rounded-xl bg-slate-50 text-slate-600">
                                <CheckCircle2 size={16} />
                            </div>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                            <div>
                                <span className="text-xl sm:text-2xl font-extrabold text-emerald-600">{stats.active}</span>
                                <span className="text-[11px] text-gray-500 ml-1 font-semibold">Aktif</span>
                            </div>
                            <span className="text-gray-300">/</span>
                            <div>
                                <span className="text-xl sm:text-2xl font-extrabold text-rose-500">{stats.inactive}</span>
                                <span className="text-[11px] text-gray-500 ml-1 font-semibold">Nonaktif</span>
                            </div>
                        </div>
                        <p className="text-[11px] text-gray-400 font-medium">Otorisasi login</p>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <div className="w-full sm:w-80 relative">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari NIK atau Nama Pengguna..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="flex-1 sm:flex-none px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-700 font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all"
                        >
                            <option value="">Semua Role</option>
                            <option value="superadmin">Superadmin</option>
                            <option value="manajemen">Manajemen</option>
                            <option value="viewer">Viewer</option>
                        </select>

                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="flex-1 sm:flex-none px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-700 font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all"
                        >
                            <option value="">Semua Status</option>
                            <option value="active">Aktif</option>
                            <option value="inactive">Nonaktif</option>
                        </select>

                        {(search || role || status) && (
                            <button
                                onClick={handleResetFilters}
                                className="p-2 text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                                title="Reset Filter"
                            >
                                <RotateCcw size={15} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs sm:text-sm">
                            <thead className="bg-slate-50/80 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[11px] font-bold">
                                <tr>
                                    <th className="px-5 py-3.5">Pengguna & NIK</th>
                                    <th className="px-5 py-3.5">Jabatan & Departemen</th>
                                    <th className="px-5 py-3.5">Role Akses</th>
                                    <th className="px-5 py-3.5">Status</th>
                                    <th className="px-5 py-3.5">Login Terakhir</th>
                                    <th className="px-5 py-3.5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {users.data.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-5 py-12 text-center text-gray-400">
                                            <div className="flex flex-col items-center justify-center">
                                                <Users size={36} className="text-gray-300 mb-2 stroke-[1.5]" />
                                                <p className="font-semibold text-gray-600">Tidak ada pengguna ditemukan</p>
                                                <p className="text-xs text-gray-400 mt-0.5">Coba sesuaikan kata kunci pencarian atau filter.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    users.data.map((u) => {
                                        const isSelf = u.id === currentUserId;
                                        return (
                                            <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                                                {/* User & NIK */}
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                                            u.role === 'superadmin' 
                                                                ? 'bg-purple-100 text-purple-700' 
                                                                : u.role === 'manajemen' 
                                                                    ? 'bg-amber-100 text-amber-700' 
                                                                    : 'bg-emerald-100 text-emerald-800'
                                                        }`}>
                                                            {u.name?.charAt(0) || 'U'}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-gray-900 truncate">{u.name}</span>
                                                                {isSelf && (
                                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                                                        Anda
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-gray-500 font-mono mt-0.5 font-medium">
                                                                NIK: {u.nik || '-'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Job & Org */}
                                                <td className="px-5 py-4 text-xs text-gray-600">
                                                    {u.employee ? (
                                                        <div>
                                                            <p className="font-semibold text-gray-800">{u.employee.job_title_name || '-'}</p>
                                                            <p className="text-gray-400 truncate max-w-xs">{u.employee.organization_name || '-'}</p>
                                                            {u.employee.region && (
                                                                <span className="inline-block mt-0.5 text-[10px] text-gray-500 font-medium bg-gray-100 px-1.5 py-0.5 rounded">
                                                                    {u.employee.region}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : u.job_title ? (
                                                        <div>
                                                            <p className="font-bold text-gray-900">{u.job_title}</p>
                                                            <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200 font-semibold">
                                                                Akun Direksi / Khusus
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 italic">Data karyawan tidak tertaut</span>
                                                    )}
                                                </td>

                                                {/* Role */}
                                                <td className="px-5 py-4">
                                                    {getRoleBadge(u.role)}
                                                </td>

                                                {/* Status */}
                                                <td className="px-5 py-4">
                                                    {u.is_active ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                            Aktif
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                                            Nonaktif
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Last Login */}
                                                <td className="px-5 py-4 text-xs text-gray-500 font-medium">
                                                    {formatDate(u.last_login_at)}
                                                </td>

                                                {/* Actions */}
                                                <td className="px-5 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {/* Ubah Role */}
                                                        <button
                                                            onClick={() => openRoleModal(u)}
                                                            className="p-1.5 text-gray-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                                                            title="Ubah Role"
                                                        >
                                                            <UserCog size={16} />
                                                        </button>

                                                        {/* Reset Password */}
                                                        <button
                                                            onClick={() => openPasswordModal(u)}
                                                            className="p-1.5 text-gray-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                                                            title="Reset Kata Sandi"
                                                        >
                                                            <KeyRound size={16} />
                                                        </button>

                                                        {/* Toggle Status */}
                                                        <button
                                                            onClick={() => handleToggleStatus(u)}
                                                            disabled={isSelf}
                                                            className={`p-1.5 rounded-lg transition-colors ${
                                                                isSelf 
                                                                    ? 'text-gray-300 cursor-not-allowed' 
                                                                    : u.is_active 
                                                                        ? 'text-gray-500 hover:text-rose-600 hover:bg-rose-50' 
                                                                        : 'text-gray-500 hover:text-emerald-600 hover:bg-emerald-50'
                                                            }`}
                                                            title={isSelf ? 'Tidak dapat menonaktifkan akun sendiri' : (u.is_active ? 'Nonaktifkan Akun' : 'Aktifkan Akun')}
                                                        >
                                                            {u.is_active ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
                                                        </button>

                                                        {/* Delete */}
                                                        <button
                                                            onClick={() => setDeleteModalUser(u)}
                                                            disabled={isSelf}
                                                            className={`p-1.5 rounded-lg transition-colors ${
                                                                isSelf 
                                                                    ? 'text-gray-300 cursor-not-allowed' 
                                                                    : 'text-gray-500 hover:text-rose-600 hover:bg-rose-50'
                                                            }`}
                                                            title={isSelf ? 'Tidak dapat menghapus akun sendiri' : 'Hapus Pengguna'}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {users.links && users.links.length > 3 && (
                        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 bg-slate-50/50">
                            <div>
                                Menampilkan <span className="font-bold text-gray-700">{users.from || 0}</span> sampai <span className="font-bold text-gray-700">{users.to || 0}</span> dari <span className="font-bold text-gray-700">{users.total}</span> akun
                            </div>
                            <div className="flex items-center gap-1">
                                {users.links.map((link, idx) => {
                                    if (link.label.includes('&laquo;') || link.label.includes('Previous')) {
                                        return (
                                            <button
                                                key={idx}
                                                disabled={!link.url}
                                                onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                                className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 ${
                                                    link.url 
                                                        ? 'bg-white hover:bg-gray-100 border-gray-200 text-gray-700 cursor-pointer' 
                                                        : 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed'
                                                }`}
                                            >
                                                <ChevronLeft size={13} />
                                                Prev
                                            </button>
                                        );
                                    }
                                    if (link.label.includes('&raquo;') || link.label.includes('Next')) {
                                        return (
                                            <button
                                                key={idx}
                                                disabled={!link.url}
                                                onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                                className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 ${
                                                    link.url 
                                                        ? 'bg-white hover:bg-gray-100 border-gray-200 text-gray-700 cursor-pointer' 
                                                        : 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed'
                                                }`}
                                            >
                                                Next
                                                <ChevronRight size={13} />
                                            </button>
                                        );
                                    }
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                            className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${
                                                link.active 
                                                    ? 'bg-[#004D40] text-white shadow-xs' 
                                                    : 'hover:bg-gray-200/70 text-gray-700'
                                            }`}
                                        >
                                            {link.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* CREATE USER MODAL */}
            {createModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-2xs animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl max-w-xl w-full border border-gray-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
                        {/* Header */}
                        <div className="px-6 py-5 bg-[#004D40] text-white flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-white/10">
                                    <Plus size={18} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold">Tambah Akun Pengguna Baru</h2>
                                    <p className="text-xs text-emerald-100/80">Pilih karyawan dari master data via NIK</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setCreateModalOpen(false)}
                                className="text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <form onSubmit={handleCreateSubmit} className="p-6 space-y-5">
                            {/* Mode Tab Switcher */}
                            <div className="flex p-1 bg-slate-100 rounded-2xl border border-gray-200/80">
                                <button
                                    type="button"
                                    onClick={() => {
                                        createForm.setData(data => ({
                                            ...data,
                                            is_manual: false,
                                            nik: '',
                                            name: '',
                                            job_title: '',
                                        }));
                                        setSelectedEmp(null);
                                        setEmpQuery('');
                                    }}
                                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                        !createForm.data.is_manual 
                                            ? 'bg-white text-emerald-900 shadow-xs' 
                                            : 'text-gray-500 hover:text-gray-900'
                                    }`}
                                >
                                    <Users size={14} />
                                    Tarik Data Karyawan
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        createForm.setData(data => ({
                                            ...data,
                                            is_manual: true,
                                            nik: '',
                                            name: '',
                                            job_title: '',
                                            role: 'manajemen',
                                        }));
                                        setSelectedEmp(null);
                                        setEmpQuery('');
                                    }}
                                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                        createForm.data.is_manual 
                                            ? 'bg-white text-purple-900 shadow-xs' 
                                            : 'text-gray-500 hover:text-gray-900'
                                    }`}
                                >
                                    <Shield size={14} className={createForm.data.is_manual ? 'text-purple-600' : ''} />
                                    Input Manual (Akun Direksi / Khusus)
                                </button>
                            </div>

                            {/* MODE 1: Tarik dari Master Karyawan */}
                            {!createForm.data.is_manual ? (
                                <>
                                    {/* NIK Autocomplete Search */}
                                    <div className="relative">
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                            Cari NIK atau Nama Pegawai <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                value={empQuery}
                                                onChange={(e) => {
                                                    setEmpQuery(e.target.value);
                                                    setSelectedEmp(null);
                                                    createForm.setData('nik', '');
                                                }}
                                                placeholder="Ketik NIK atau nama pegawai (contoh: 201805...)"
                                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all placeholder:text-gray-400"
                                                required={!createForm.data.is_manual}
                                            />
                                            {isSearchingEmp && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Autocomplete Dropdown */}
                                        {empSuggestions.length > 0 && !selectedEmp && (
                                            <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 max-h-56 overflow-y-auto divide-y divide-gray-100">
                                                {empSuggestions.map((emp) => (
                                                    <div
                                                        key={emp.employee_id}
                                                        onClick={() => handleSelectEmployee(emp)}
                                                        className={`p-3 text-left transition-colors flex items-center justify-between ${
                                                            emp.already_registered 
                                                                ? 'bg-gray-50/80 cursor-not-allowed opacity-60' 
                                                                : 'hover:bg-emerald-50/60 cursor-pointer'
                                                        }`}
                                                    >
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-xs text-gray-900">{emp.name}</span>
                                                                <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold">
                                                                    {emp.employee_id}
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] text-gray-500 mt-0.5">
                                                                {emp.job_title_name} &bull; {emp.organization_name} ({emp.region})
                                                            </p>
                                                        </div>
                                                        {emp.already_registered && (
                                                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                                                Sudah ada akun
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {createForm.errors.nik && (
                                            <p className="text-rose-500 text-xs font-semibold mt-1.5">{createForm.errors.nik}</p>
                                        )}
                                    </div>

                                    {/* Selected Employee Card Preview */}
                                    {selectedEmp && (
                                        <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl animate-in fade-in duration-150">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                                                    <Sparkles size={13} className="text-emerald-600" />
                                                    Data Pegawai Terverifikasi
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedEmp(null);
                                                        createForm.setData('nik', '');
                                                        setEmpQuery('');
                                                    }}
                                                    className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold cursor-pointer"
                                                >
                                                    Ganti
                                                </button>
                                            </div>
                                            <div className="space-y-1 text-xs">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-500 w-20 font-medium">Nama</span>
                                                    <span className="font-bold text-gray-900">: {selectedEmp.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-500 w-20 font-medium">NIK</span>
                                                    <span className="font-mono font-bold text-gray-900">: {selectedEmp.employee_id}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-500 w-20 font-medium">Jabatan</span>
                                                    <span className="text-gray-700">: {selectedEmp.job_title_name}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-500 w-20 font-medium">Departemen</span>
                                                    <span className="text-gray-700">: {selectedEmp.organization_name} ({selectedEmp.region})</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                /* MODE 2: Input Manual Akun Direksi / Khusus */
                                <div className="space-y-4 animate-in fade-in duration-150">
                                    <div className="p-3.5 bg-purple-50/80 border border-purple-200 rounded-2xl flex items-start gap-2.5 text-xs text-purple-900">
                                        <Shield className="shrink-0 mt-0.5 text-purple-600" size={16} />
                                        <div>
                                            <p className="font-bold">Akun Direksi / Pimpinan Khusus</p>
                                            <p className="text-[11px] text-purple-700 mt-0.5 leading-relaxed">
                                                Akun ini bersifat independen tanpa tersimpan di tabel master karyawan publik, sehingga tidak akan memengaruhi statistik headcount atau grafik demografi SDM.
                                            </p>
                                        </div>
                                    </div>

                                    {/* NIK / ID Input */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                            NIK atau ID Login Direksi <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={createForm.data.nik}
                                            onChange={(e) => createForm.setData('nik', e.target.value)}
                                            placeholder="Contoh: 198001001 atau DIR01"
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none transition-all placeholder:text-gray-400"
                                            required={createForm.data.is_manual}
                                        />
                                        {createForm.errors.nik && (
                                            <p className="text-rose-500 text-xs font-semibold mt-1.5">{createForm.errors.nik}</p>
                                        )}
                                    </div>

                                    {/* Nama Lengkap */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                            Nama Lengkap Beliau <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={createForm.data.name}
                                            onChange={(e) => createForm.setData('name', e.target.value)}
                                            placeholder="Contoh: Bpk. Bambang Sutrisno"
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none transition-all placeholder:text-gray-400"
                                            required={createForm.data.is_manual}
                                        />
                                        {createForm.errors.name && (
                                            <p className="text-rose-500 text-xs font-semibold mt-1.5">{createForm.errors.name}</p>
                                        )}
                                    </div>

                                    {/* Jabatan */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                            Jabatan / Posisi <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={createForm.data.job_title}
                                            onChange={(e) => createForm.setData('job_title', e.target.value)}
                                            placeholder="Contoh: Direktur Operasional / Board of Directors"
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none transition-all placeholder:text-gray-400"
                                            required={createForm.data.is_manual}
                                        />
                                        {createForm.errors.job_title && (
                                            <p className="text-rose-500 text-xs font-semibold mt-1.5">{createForm.errors.job_title}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Role Selection */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                    Pilih Role & Hak Akses <span className="text-rose-500">*</span>
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                    {/* Viewer */}
                                    <label className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                                        createForm.data.role === 'viewer' 
                                            ? 'bg-sky-50/70 border-sky-400 ring-2 ring-sky-300/40' 
                                            : 'bg-white border-gray-200 hover:bg-gray-50'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="role"
                                            value="viewer"
                                            checked={createForm.data.role === 'viewer'}
                                            onChange={(e) => createForm.setData('role', e.target.value)}
                                            className="sr-only"
                                        />
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-bold text-xs text-sky-800 flex items-center gap-1.5">
                                                <Eye size={14} className="text-sky-600" />
                                                Viewer
                                            </span>
                                            {createForm.data.role === 'viewer' && <Check size={14} className="text-sky-600" />}
                                        </div>
                                        <p className="text-[10px] text-gray-500 leading-tight">
                                            Hanya melihat Dashboard & Analitik SDM.
                                        </p>
                                    </label>

                                    {/* Manajemen */}
                                    <label className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                                        createForm.data.role === 'manajemen' 
                                            ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-300/40' 
                                            : 'bg-white border-gray-200 hover:bg-gray-50'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="role"
                                            value="manajemen"
                                            checked={createForm.data.role === 'manajemen'}
                                            onChange={(e) => createForm.setData('role', e.target.value)}
                                            className="sr-only"
                                        />
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-bold text-xs text-amber-800 flex items-center gap-1.5">
                                                <UserCheck size={14} className="text-amber-600" />
                                                Manajemen
                                            </span>
                                            {createForm.data.role === 'manajemen' && <Check size={14} className="text-amber-600" />}
                                        </div>
                                        <p className="text-[10px] text-gray-500 leading-tight">
                                            Akses Analitik & fasilitas Import Data.
                                        </p>
                                    </label>

                                    {/* Superadmin */}
                                    <label className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                                        createForm.data.role === 'superadmin' 
                                            ? 'bg-purple-50/70 border-purple-400 ring-2 ring-purple-300/40' 
                                            : 'bg-white border-gray-200 hover:bg-gray-50'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="role"
                                            value="superadmin"
                                            checked={createForm.data.role === 'superadmin'}
                                            onChange={(e) => createForm.setData('role', e.target.value)}
                                            className="sr-only"
                                        />
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-bold text-xs text-purple-800 flex items-center gap-1.5">
                                                <ShieldCheck size={14} className="text-purple-600" />
                                                Superadmin
                                            </span>
                                            {createForm.data.role === 'superadmin' && <Check size={14} className="text-purple-600" />}
                                        </div>
                                        <p className="text-[10px] text-gray-500 leading-tight">
                                            Akses penuh + kelola akun pengguna.
                                        </p>
                                    </label>
                                </div>
                                {createForm.errors.role && (
                                    <p className="text-rose-500 text-xs font-semibold mt-1.5">{createForm.errors.role}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                    Kata Sandi Baru <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={createForm.data.password}
                                        onChange={(e) => createForm.setData('password', e.target.value)}
                                        placeholder="Minimal 6 karakter"
                                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all placeholder:text-gray-400"
                                        required
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {createForm.errors.password && (
                                    <p className="text-rose-500 text-xs font-semibold mt-1.5">{createForm.errors.password}</p>
                                )}
                            </div>

                            {/* Active Checkbox */}
                            <div className="flex items-center gap-3 pt-1">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={createForm.data.is_active}
                                    onChange={(e) => createForm.setData('is_active', e.target.checked)}
                                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                                />
                                <label htmlFor="is_active" className="text-xs font-medium text-gray-700 cursor-pointer">
                                    Langsung aktifkan akun ini (dapat langsung login dengan NIK dan kata sandi di atas).
                                </label>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setCreateModalOpen(false)}
                                    className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={createForm.processing || (!createForm.data.is_manual && !selectedEmp)}
                                    className="px-5 py-2 text-xs font-bold text-white bg-[#004D40] hover:bg-[#00382e] rounded-full shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    {createForm.processing ? 'Menyimpan...' : 'Simpan Akun'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT ROLE MODAL */}
            {roleModalUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-2xs animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl max-w-md w-full border border-gray-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
                        <div className="px-6 py-5 bg-purple-900 text-white flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-white/10">
                                    <UserCog size={18} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold">Ubah Role Pengguna</h2>
                                    <p className="text-xs text-purple-200">{roleModalUser.name} ({roleModalUser.nik})</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setRoleModalUser(null)}
                                className="text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleRoleSubmit} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                                    roleForm.data.role === 'superadmin' 
                                        ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-300/40' 
                                        : 'bg-white border-gray-200 hover:bg-gray-50'
                                }`}>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                                            <ShieldCheck size={18} />
                                        </div>
                                        <div>
                                            <span className="font-bold text-xs text-purple-900 block">Superadmin</span>
                                            <span className="text-[11px] text-gray-500">Akses penuh sistem & manajemen akun</span>
                                        </div>
                                    </div>
                                    <input
                                        type="radio"
                                        name="modal_role"
                                        value="superadmin"
                                        checked={roleForm.data.role === 'superadmin'}
                                        onChange={(e) => roleForm.setData('role', e.target.value)}
                                        className="text-purple-600 focus:ring-purple-500"
                                    />
                                </label>

                                <label className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                                    roleForm.data.role === 'manajemen' 
                                        ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-300/40' 
                                        : 'bg-white border-gray-200 hover:bg-gray-50'
                                }`}>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                                            <UserCheck size={18} />
                                        </div>
                                        <div>
                                            <span className="font-bold text-xs text-amber-900 block">Manajemen</span>
                                            <span className="text-[11px] text-gray-500">Akses analitik & import data portal</span>
                                        </div>
                                    </div>
                                    <input
                                        type="radio"
                                        name="modal_role"
                                        value="manajemen"
                                        checked={roleForm.data.role === 'manajemen'}
                                        onChange={(e) => roleForm.setData('role', e.target.value)}
                                        className="text-amber-600 focus:ring-amber-500"
                                    />
                                </label>

                                <label className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                                    roleForm.data.role === 'viewer' 
                                        ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-300/40' 
                                        : 'bg-white border-gray-200 hover:bg-gray-50'
                                }`}>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-sky-100 text-sky-700">
                                            <Eye size={18} />
                                        </div>
                                        <div>
                                            <span className="font-bold text-xs text-sky-900 block">Viewer</span>
                                            <span className="text-[11px] text-gray-500">Akses hanya lihat visualisasi data</span>
                                        </div>
                                    </div>
                                    <input
                                        type="radio"
                                        name="modal_role"
                                        value="viewer"
                                        checked={roleForm.data.role === 'viewer'}
                                        onChange={(e) => roleForm.setData('role', e.target.value)}
                                        className="text-sky-600 focus:ring-sky-500"
                                    />
                                </label>
                            </div>

                            {roleModalUser.id === currentUserId && roleForm.data.role !== 'superadmin' && (
                                <p className="text-rose-600 text-xs font-semibold bg-rose-50 p-3 rounded-xl border border-rose-200">
                                    Perhatian: Anda tidak dapat menurunkan role akun Anda sendiri dari Superadmin.
                                </p>
                            )}

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setRoleModalUser(null)}
                                    className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-full"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={roleForm.processing || (roleModalUser.id === currentUserId && roleForm.data.role !== 'superadmin')}
                                    className="px-5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-full shadow-sm hover:shadow transition-all disabled:opacity-50"
                                >
                                    {roleForm.processing ? 'Menyimpan...' : 'Perbarui Role'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* RESET PASSWORD MODAL */}
            {passwordModalUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-2xs animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl max-w-md w-full border border-gray-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
                        <div className="px-6 py-5 bg-amber-600 text-white flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-white/10">
                                    <KeyRound size={18} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold">Reset Kata Sandi</h2>
                                    <p className="text-xs text-amber-100">{passwordModalUser.name} ({passwordModalUser.nik})</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setPasswordModalUser(null)}
                                className="text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                    Kata Sandi Baru <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={passwordForm.data.password}
                                        onChange={(e) => passwordForm.setData('password', e.target.value)}
                                        placeholder="Masukkan kata sandi baru (min 6 karakter)"
                                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 outline-none transition-all"
                                        required
                                        minLength={6}
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {passwordForm.errors.password && (
                                    <p className="text-rose-500 text-xs font-semibold mt-1.5">{passwordForm.errors.password}</p>
                                )}
                            </div>

                            <p className="text-xs text-gray-500 bg-amber-50/70 p-3 rounded-xl border border-amber-200/60">
                                Setelah direset, pengguna dapat langsung login menggunakan NIK dan kata sandi baru ini.
                            </p>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setPasswordModalUser(null)}
                                    className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-full"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={passwordForm.processing}
                                    className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-full shadow-sm hover:shadow transition-all disabled:opacity-50"
                                >
                                    {passwordForm.processing ? 'Menyimpan...' : 'Reset Kata Sandi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {deleteModalUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-2xs animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl max-w-md w-full border border-gray-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
                        <div className="p-6 text-center">
                            <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center mb-4 border border-rose-100 shadow-2xs">
                                <Trash2 size={26} />
                            </div>
                            <h3 className="text-base font-bold text-gray-900 mb-1">
                                Hapus Akun Pengguna?
                            </h3>
                            <p className="text-xs text-gray-500 mb-4">
                                Akun untuk <strong className="text-gray-800">{deleteModalUser.name}</strong> (NIK: {deleteModalUser.nik}) akan dihapus secara permanen dari sistem. Master data karyawan tidak akan terhapus.
                            </p>

                            <div className="flex items-center justify-center gap-3">
                                <button
                                    onClick={() => setDeleteModalUser(null)}
                                    className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleDeleteSubmit}
                                    className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-full shadow-sm hover:shadow transition-all"
                                >
                                    Ya, Hapus Akun
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
