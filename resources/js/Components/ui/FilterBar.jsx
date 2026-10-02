import { useState } from 'react';
import { useFilters } from '@/hooks/useFilters';
import { MultiSelect } from './MultiSelect';
import { Skeleton } from './Skeleton';
import { RotateCcw, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { levelLabels } from '@/lib/constants'; // Need to create this for Job Level labels

export default function FilterBar({ isTrainingPage = false }) {
    const { filters, options, loading, updateFilter, resetFilters, getActiveCount } = useFilters(isTrainingPage);
    const [isOpen, setIsOpen] = useState(false);

    if (loading) {
        return (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
                <div className="flex gap-4">
                    {[1,2,3,4].map(i => <Skeleton key={i} className="w-32 h-10" />)}
                </div>
            </div>
        );
    }

    if (!options) return null;

    const activeCount = getActiveCount();

    // Determine location options based on selected companies
    let locationOptions = options.locations;
    if (filters.company_id.length > 0) {
        locationOptions = options.locations.filter(loc => 
            loc.companies.some(cid => filters.company_id.includes(String(cid)))
        );
    }

    // Determine region options based on page
    const regionOptions = isTrainingPage ? options.trainingRegions : options.regions;

    // Map job levels to labels
    const jobLevelOptions = options.jobLevels.map(code => ({
        id: code,
        name: levelLabels[code] ? `${code} - ${levelLabels[code]}` : code
    }));

    return (
        <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(6,78,59,0.08)] border-0 mb-6 relative z-10">
            {/* Chips area and Toggle Button */}
            <div className="p-4 flex items-center justify-between border-b border-gray-100/60 bg-gray-50/30 rounded-t-xl">
                <div className="flex-1 flex gap-2 flex-wrap items-center">
                    {activeCount > 0 ? (
                        <>
                            <span className="text-xs text-gray-500 font-medium mr-1 flex items-center gap-1.5"><Filter size={12}/> Filter aktif:</span>
                            {filters.region.map(v => (
                                <Chip key={`region-${v}`} label={`Region: ${v}`} onRemove={() => updateFilter('region', filters.region.filter(x => x !== v))} />
                            ))}
                            {filters.company_id.map(v => (
                                <Chip key={`comp-${v}`} label={`PT: ${options.companies.find(c => String(c.id) === v)?.code || v}`} onRemove={() => updateFilter('company_id', filters.company_id.filter(x => x !== v))} />
                            ))}
                            {filters.location_id.map(v => (
                                <Chip key={`loc-${v}`} label={`Lokasi: ${options.locations.find(l => String(l.id) === v)?.name || v}`} onRemove={() => updateFilter('location_id', filters.location_id.filter(x => x !== v))} />
                            ))}
                            {filters.organization_name.map(v => (
                                <Chip key={`dept-${v}`} label={`Dept: ${v}`} onRemove={() => updateFilter('organization_name', filters.organization_name.filter(x => x !== v))} />
                            ))}
                            {filters.job_level_code.map(v => (
                                <Chip key={`lvl-${v}`} label={`Level: ${v}`} onRemove={() => updateFilter('job_level_code', filters.job_level_code.filter(x => x !== v))} />
                            ))}
                            {filters.group.map(v => (
                                <Chip key={`grp-${v}`} label={`Group: ${v}`} onRemove={() => updateFilter('group', filters.group.filter(x => x !== v))} />
                            ))}
                            {filters.employment_type.map(v => (
                                <Chip key={`emp-${v}`} label={`Status: ${v}`} onRemove={() => updateFilter('employment_type', filters.employment_type.filter(x => x !== v))} />
                            ))}
                            {filters.generation?.map(v => (
                                <Chip key={`gen-${v}`} label={`Gen: ${v}`} onRemove={() => updateFilter('generation', filters.generation.filter(x => x !== v))} />
                            ))}
                            {filters.gender?.map(v => (
                                <Chip key={`gndr-${v}`} label={`Gender: ${v}`} onRemove={() => updateFilter('gender', filters.gender.filter(x => x !== v))} />
                            ))}
                            {filters.year && <Chip label={`Tahun: ${filters.year}`} onRemove={() => updateFilter('year', '')} />}
                            {filters.month && <Chip label={`Bulan: ${filters.month}`} onRemove={() => updateFilter('month', '')} />}
                            {filters.nik_status && <Chip label={`NIK: ${filters.nik_status}`} onRemove={() => updateFilter('nik_status', '')} />}
                            {filters.job_category?.map(v => (
                                <Chip key={`cat-${v}`} label={`Gol: ${v}`} onRemove={() => updateFilter('job_category', filters.job_category.filter(x => x !== v))} />
                            ))}
                            {filters.is_regular !== '' && <Chip label={`Tipe: ${filters.is_regular === '1' ? 'Reguler' : 'Non Reguler'}`} onRemove={() => updateFilter('is_regular', '')} />}
                            {filters.is_internal !== '' && <Chip label={`Asal: ${filters.is_internal === '1' ? 'Internal' : 'Eksternal'}`} onRemove={() => updateFilter('is_internal', '')} />}
                            
                            <button 
                                onClick={resetFilters}
                                className="text-xs text-corporate-light font-medium flex items-center gap-1 hover:text-corporate-dark transition-colors ml-1"
                            >
                                <RotateCcw size={12} />
                                Reset Semua
                            </button>
                        </>
                    ) : (
                        <span className="text-sm text-gray-400 italic">Tidak ada filter aktif</span>
                    )}
                </div>
                
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                    <Filter size={14} />
                    {isOpen ? 'Tutup Filter' : 'Filter Lanjutan'}
                    {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
            </div>
            
            {isOpen && (
                <div className="p-5 bg-white">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500">Region</label>
                    <MultiSelect 
                        placeholder="Semua Region"
                        options={regionOptions}
                        value={filters.region}
                        onChange={(v) => updateFilter('region', v)}
                    />
                    {isTrainingPage && <span className="text-[10px] text-gray-400 mt-1">Menggunakan region training (Kaltim)</span>}
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500">Perusahaan</label>
                    <MultiSelect 
                        placeholder="Semua Perusahaan"
                        options={options.companies}
                        valueKey="id"
                        labelKey="name"
                        value={filters.company_id}
                        onChange={(v) => updateFilter('company_id', v)}
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500">Lokasi</label>
                    <MultiSelect 
                        placeholder="Semua Lokasi"
                        options={locationOptions}
                        valueKey="id"
                        labelKey="name"
                        value={filters.location_id}
                        onChange={(v) => updateFilter('location_id', v)}
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500">Departemen</label>
                    <MultiSelect 
                        placeholder="Semua Departemen"
                        options={options.departments}
                        value={filters.organization_name}
                        onChange={(v) => updateFilter('organization_name', v)}
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500">Level Jabatan</label>
                    <MultiSelect 
                        placeholder="Semua Level"
                        options={jobLevelOptions}
                        valueKey="id"
                        labelKey="name"
                        value={filters.job_level_code}
                        onChange={(v) => updateFilter('job_level_code', v)}
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500">Group</label>
                    <MultiSelect 
                        placeholder="Semua Group"
                        options={options.groups}
                        value={filters.group}
                        onChange={(v) => updateFilter('group', v)}
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500">Employment Type</label>
                    <MultiSelect 
                        placeholder="Semua Status"
                        options={options.employmentTypes}
                        value={filters.employment_type}
                        onChange={(v) => updateFilter('employment_type', v)}
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500">Generasi</label>
                    <MultiSelect 
                        placeholder="Semua Generasi"
                        options={options.generations}
                        value={filters.generation}
                        onChange={(v) => updateFilter('generation', v)}
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500">Gender</label>
                    <MultiSelect 
                        placeholder="Semua Gender"
                        options={options.genders}
                        value={filters.gender}
                        onChange={(v) => updateFilter('gender', v)}
                    />
                </div>
                
                {isTrainingPage && (
                    <>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-500">Tahun</label>
                            <select 
                                value={filters.year} 
                                onChange={(e) => updateFilter('year', e.target.value)}
                                className="text-sm border-gray-200 rounded-lg focus:ring-amber-500 focus:border-amber-500 bg-gray-50"
                            >
                                <option value="">Semua Tahun</option>
                                {[...Array(10)].map((_, i) => {
                                    const y = new Date().getFullYear() - i;
                                    return <option key={y} value={y}>{y}</option>;
                                })}
                            </select>
                        </div>
                        
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-500">Bulan</label>
                            <select 
                                value={filters.month} 
                                onChange={(e) => updateFilter('month', e.target.value)}
                                className="text-sm border-gray-200 rounded-lg focus:ring-amber-500 focus:border-amber-500 bg-gray-50"
                            >
                                <option value="">Semua Bulan</option>
                                {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-500 font-bold text-amber-600">Status NIK</label>
                            <select 
                                value={filters.nik_status} 
                                onChange={(e) => updateFilter('nik_status', e.target.value)}
                                className="text-sm border-amber-200 rounded-lg focus:ring-amber-500 focus:border-amber-500 bg-amber-50/30"
                            >
                                <option value="">Semua Status</option>
                                <option value="terhubung">Terhubung (Employee ID ✓)</option>
                                <option value="tidak_terhubung">Tidak Terhubung</option>
                                <option value="kosong">Kosong</option>
                                <option value="rusak">Rusak (Corrupt)</option>
                                <option value="tidak_valid">Tidak Valid (Not Found)</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-500">Golongan</label>
                            <MultiSelect 
                                placeholder="Semua Golongan"
                                options={[{id: 'STAF', name: 'STAF'}, {id: 'NON STAF', name: 'NON STAF'}]}
                                valueKey="id" labelKey="name"
                                value={filters.job_category}
                                onChange={(v) => updateFilter('job_category', v)}
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-500">Tipe Reguler</label>
                            <select 
                                value={filters.is_regular} 
                                onChange={(e) => updateFilter('is_regular', e.target.value)}
                                className="text-sm border-gray-200 rounded-lg focus:ring-amber-500 focus:border-amber-500 bg-gray-50"
                            >
                                <option value="">Semua</option>
                                <option value="1">Reguler</option>
                                <option value="0">Non Reguler</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-500">Tipe Eksternal</label>
                            <select 
                                value={filters.is_internal} 
                                onChange={(e) => updateFilter('is_internal', e.target.value)}
                                className="text-sm border-gray-200 rounded-lg focus:ring-amber-500 focus:border-amber-500 bg-gray-50"
                            >
                                <option value="">Semua</option>
                                <option value="1">Internal</option>
                                <option value="0">Eksternal</option>
                            </select>
                        </div>
                    </>
                )}
                    </div>
                </div>
            )}
        </div>
    );
}

function Chip({ label, onRemove }) {
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-corporate-light bg-opacity-10 text-corporate-dark border border-corporate-light border-opacity-20">
            {label}
            <button onClick={onRemove} className="hover:text-red-500 rounded-full hover:bg-white transition-colors p-0.5">
                <RotateCcw size={10} className="hidden" /> {/* just to import icon correctly without breaking if changed */}
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
        </span>
    );
}
