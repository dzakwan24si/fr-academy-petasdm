import { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, Users, UserPlus, FileText, PieChart as PieChartIcon } from 'lucide-react';
import { StaffList } from './StaffList';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { usePage } from '@inertiajs/react';

export function CompanyPanel({ company, location, onBack, onLocationSelect }) {
    const { auth } = usePage().props;
    const [tab, setTab] = useState('profil');
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        axios.get(`/data/companies/${company.id}/profile`)
            .then(res => {
                setProfile(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [company.id]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    const renderPie = (dataObj) => {
        if (!dataObj) return null;
        const data = Object.entries(dataObj).map(([name, value]) => ({ name, value: value === '<5' ? 5 : value }));
        return (
            <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                    <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5} dataKey="value">
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <RechartsTooltip formatter={(value, name, props) => [dataObj[props.payload.name], name]} />
                </PieChart>
            </ResponsiveContainer>
        );
    };

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="bg-corporate-dark text-white p-4">
                <button onClick={onBack} className="flex items-center text-sm text-green-100 hover:text-white mb-4">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Kembali ke daftar
                </button>
                <h2 className="text-xl font-bold">{company.code} - {company.name}</h2>
                <div className="text-sm text-green-100 mt-1 flex gap-4">
                    <span>{company.region}</span>
                    <span>{company.location_count} Lokasi</span>
                </div>
            </div>

            <div className="flex border-b">
                <button 
                    className={`flex-1 py-3 text-sm font-medium border-b-2 ${tab === 'profil' ? 'border-corporate-dark text-corporate-dark' : 'border-transparent text-gray-500'}`}
                    onClick={() => setTab('profil')}
                >
                    Profil
                </button>
                {auth.user.role !== 'management' && (
                    <button 
                        className={`flex-1 py-3 text-sm font-medium border-b-2 ${tab === 'staff' ? 'border-corporate-dark text-corporate-dark' : 'border-transparent text-gray-500'}`}
                        onClick={() => setTab('staff')}
                    >
                        Staff (SDM)
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                    <div className="flex justify-center items-center h-full">Memuat data...</div>
                ) : tab === 'profil' && profile ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div className="text-sm text-gray-500">Headcount</div>
                                <div className="text-2xl font-bold">{profile.kpi.hc}</div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div className="text-sm text-gray-500">Rata Umur</div>
                                <div className="text-2xl font-bold">{profile.kpi.avg_age} th</div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div className="text-sm text-gray-500">Rata Masa Kerja</div>
                                <div className="text-2xl font-bold">{profile.kpi.avg_los} th</div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div className="text-sm text-gray-500">% Perempuan</div>
                                <div className="text-2xl font-bold">{profile.kpi.female_pct}%</div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div className="text-sm text-gray-500">% Permanent</div>
                                <div className="text-2xl font-bold">{profile.kpi.perm_pct}%</div>
                            </div>
                            <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                <div className="text-sm text-red-600">Risiko Pensiun</div>
                                <div className="text-2xl font-bold text-red-700">{profile.kpi.pensiun}</div>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-bold text-gray-800 mb-2">Generasi</h3>
                            {renderPie(profile.generations)}
                        </div>

                        <div>
                            <h3 className="font-bold text-gray-800 mb-2">Daftar Lokasi</h3>
                            <div className="space-y-2">
                                {profile.locations.map(l => (
                                    <button 
                                        key={l.id} 
                                        onClick={() => onLocationSelect(l.id)}
                                        className="w-full text-left bg-gray-50 p-3 rounded-lg flex justify-between items-center hover:bg-gray-100"
                                    >
                                        <span>{l.name}</span>
                                        <span className="font-bold">{l.count} HC</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : tab === 'staff' ? (
                    <StaffList company={company} location={location} />
                ) : (
                    <div className="text-center text-gray-500 mt-10">Data tidak tersedia.</div>
                )}
            </div>
        </div>
    );
}
