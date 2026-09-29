import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search } from 'lucide-react';
import { StaffDetailModal } from './StaffDetailModal';

export function StaffList({ company, location }) {
    const [employees, setEmployees] = useState(null);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedEmp, setSelectedEmp] = useState(null);

    const loadData = () => {
        setLoading(true);
        const locParam = location ? `&location_id=${location.id}` : '';
        axios.get(`/data/companies/${company.id}/employees?page=${page}&search=${search}${locParam}`)
            .then(res => {
                setEmployees(res.data);
                setLoading(false);
            });
    };

    useEffect(() => {
        loadData();
    }, [company.id, page, location]);

    useEffect(() => {
        setPage(1);
        const timer = setTimeout(loadData, 500);
        return () => clearTimeout(timer);
    }, [search]);

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                <input 
                    type="text" 
                    placeholder="Cari nama, NIK, jabatan..." 
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-corporate-light"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="text-center py-10 text-gray-500">Memuat staf...</div>
            ) : employees?.data.length > 0 ? (
                <>
                    <div className="flex-1 space-y-3">
                        {employees.data.map(emp => (
                            <button 
                                key={emp.employee_id}
                                onClick={() => setSelectedEmp(emp.employee_id)}
                                className="w-full text-left p-3 border rounded-lg hover:border-corporate-light hover:bg-gray-50 flex items-center gap-3"
                            >
                                <div className="w-10 h-10 rounded-full bg-corporate-light text-white flex items-center justify-center font-bold">
                                    {emp.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-gray-900 truncate">{emp.name}</div>
                                    <div className="text-sm text-gray-500 truncate">{emp.job_title_name}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                    <div className="flex justify-between items-center py-4 border-t">
                        <button 
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="px-3 py-1 bg-gray-100 rounded disabled:opacity-50"
                        >Prev</button>
                        <span className="text-sm text-gray-500">Hal {employees.current_page} dari {employees.last_page}</span>
                        <button 
                            disabled={page === employees.last_page}
                            onClick={() => setPage(p => p + 1)}
                            className="px-3 py-1 bg-gray-100 rounded disabled:opacity-50"
                        >Next</button>
                    </div>
                </>
            ) : (
                <div className="text-center py-10 text-gray-500">Tidak ada staf ditemukan.</div>
            )}

            {selectedEmp && (
                <StaffDetailModal 
                    employeeId={selectedEmp} 
                    onClose={() => setSelectedEmp(null)} 
                />
            )}
        </div>
    );
}
