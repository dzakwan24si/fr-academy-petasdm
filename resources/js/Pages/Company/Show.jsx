import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import AppLayout from '@/Layouts/AppLayout';
import { ChartCard } from '@/Components/ui/ChartCard';
import { InfoTooltip } from '@/Components/ui/InfoTooltip';
import StaffDetailPane from '@/Components/staff/StaffDetailPane';
import EmployeeAvatar from '@/Components/EmployeeAvatar';
import { PopulationPyramid } from '@/Components/charts/PopulationPyramid';
import {
    ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { generationColors, defaultPalette } from '@/lib/colors';
import { levelLabels } from '@/lib/constants';
import { formatNumber } from '@/lib/format';
import { 
    ArrowLeft, 
    Users, 
    Clock, 
    GraduationCap, 
    Search, 
    MapPin, 
    ChevronLeft, 
    ChevronRight, 
    RotateCcw,
    Building2,
    Briefcase,
    X,
    Layers,
    Award,
    Calendar,
    TrendingUp,
    ArrowRight,
    PieChart as PieIcon,
    BarChart3,
    Table as TableIcon
} from 'lucide-react';

const LEVEL_ORDER = ['A', 'B', 'C', 'D', 'E', 'F', '1', '2', '3', '4', '5'];

const regionBadgeStyles = {
    Riau: 'bg-amber-100/90 text-amber-800 border-amber-200/60',
    Kalbar: 'bg-emerald-100/90 text-emerald-800 border-emerald-200/60',
    Kaltim: 'bg-sky-100/90 text-sky-800 border-sky-200/60',
    Corp: 'bg-slate-200/90 text-slate-800 border-slate-300/60',
    Non: 'bg-purple-100/90 text-purple-800 border-purple-200/60',
};

function renderEmploymentBadge(type) {
    const normalized = (type || '').toUpperCase();
    if (normalized === 'PERMANENT' || normalized === 'PERM') {
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                Permanent
            </span>
        );
    }
    if (normalized === 'CONTRACT' || normalized === 'PKWT') {
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
                Contract
            </span>
        );
    }
    if (normalized === 'PROBATION') {
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-200/60">
                Probation
            </span>
        );
    }
    if (normalized === 'TRAINEE') {
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200/60">
                Trainee
            </span>
        );
    }
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
            {type || '—'}
        </span>
    );
}

function SubtlePalmPattern() {
    return (
        <div className="absolute inset-0 opacity-[0.035] pointer-events-none overflow-hidden" aria-hidden="true">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="palm-leaf-pattern" width="90" height="90" patternUnits="userSpaceOnUse" patternTransform="rotate(25)">
                        <path d="M45 5 C30 25, 15 45, 5 70 C25 65, 45 55, 60 40 M45 5 C60 25, 75 45, 85 70 C65 65, 45 55, 30 40 M45 5 L45 85" fill="none" stroke="currentColor" strokeWidth="1.2" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#palm-leaf-pattern)" />
            </svg>
        </div>
    );
}

/* =========================================================================
   TAB 1: OVERVIEW 360°
   ========================================================================= */
function OverviewTab({ profile, onTabSwitch, onSelectStaff, selectedLocation }) {
    if (!profile) return null;
    const { generations, levels, departments, training, demografi, masa_kerja, kpi } = profile;

    // Generasi donut data
    const totalGen = Object.values(generations || {}).reduce((s, v) => s + v, 0);
    const genData = Object.entries(generations || {})
        .filter(([, v]) => v > 0)
        .map(([name, value]) => ({ 
            name, 
            value, 
            pct: totalGen > 0 ? Math.round((value / totalGen) * 100) : 0,
            fill: generationColors[name] || '#94A3B8' 
        }));

    // Level bar data (urutan A-F lalu 1-5)
    const levelData = LEVEL_ORDER
        .filter(l => levels?.[l])
        .map(l => ({ name: l, label: `${l} - ${levelLabels[l] || l}`, value: levels[l] }));

    // Department top 8
    const deptData = Object.entries(departments || {})
        .slice(0, 8)
        .map(([name, value]) => ({ 
            name: name.length > 22 ? name.slice(0, 22) + '…' : name, 
            fullName: name,
            value 
        }));

    // Spotlight trainings (top 3)
    const spotlightTrainings = (training?.top_trainings || []).slice(0, 3);

    return (
        <div className="space-y-6">
            {/* 4 Multi-dimensi Highlights Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">Cakupan Pelatihan</span>
                        <GraduationCap size={16} className="text-emerald-600" />
                    </div>
                    <div className="mt-2">
                        <p className="text-2xl font-black text-gray-900 font-mono">{training?.coverage_pct || 0}%</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{training?.trained_hc || 0} dari {kpi?.hc || 0} staf terlatih</p>
                    </div>
                    <button 
                        onClick={() => onTabSwitch('pelatihan')}
                        className="mt-3 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer pt-2 border-t border-gray-50"
                    >
                        Detail Pelatihan <ArrowRight size={12} />
                    </button>
                </div>

                <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">Karyawan Tetap (PKWTT)</span>
                        <Award size={16} className="text-emerald-600" />
                    </div>
                    <div className="mt-2">
                        <p className="text-2xl font-black font-mono text-emerald-700">
                            {kpi?.perm_pct || 0}%
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">Status Permanent/Tetap</p>
                    </div>
                    <button 
                        onClick={() => onTabSwitch('demografi')}
                        className="mt-3 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer pt-2 border-t border-gray-50"
                    >
                        Status Hubungan Kerja <ArrowRight size={12} />
                    </button>
                </div>

                <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">Karyawan Baru (&lt;1 Thn)</span>
                        <Briefcase size={16} className="text-teal-600" />
                    </div>
                    <div className="mt-2">
                        <p className="text-2xl font-black text-gray-900 font-mono">{masa_kerja?.new_hires_count || 0} <span className="text-xs font-normal text-gray-400">staf</span></p>
                        <p className="text-[11px] text-gray-400 mt-0.5">Rata-rata LOS {masa_kerja?.avg_los || 0} tahun</p>
                    </div>
                    <button 
                        onClick={() => onTabSwitch('tenure')}
                        className="mt-3 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer pt-2 border-t border-gray-50"
                    >
                        Analisis Masa Kerja <ArrowRight size={12} />
                    </button>
                </div>

                {(() => {
                    const maleCount = demografi?.male_count || 0;
                    const femaleCount = demografi?.female_count || 0;
                    const totalGender = maleCount + femaleCount;
                    const femalePct = totalGender > 0 ? Math.round((femaleCount / totalGender) * 100) : 0;
                    const malePct = totalGender > 0 ? (100 - femalePct) : 0;

                    return (
                        <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-2xs flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-500">Komposisi Gender</span>
                                <Users size={16} className="text-blue-600" />
                            </div>
                            <div className="mt-2">
                                <p className="text-2xl font-black text-gray-900 font-mono flex items-baseline gap-1">
                                    <span>{malePct}%</span>
                                    <span className="text-gray-300 font-sans text-base font-normal">:</span>
                                    <span className="text-gray-600">{femalePct}%</span>
                                </p>
                                <p className="text-[11px] text-gray-400 mt-0.5">{maleCount} Pria · {femaleCount} Wanita</p>
                            </div>
                            <button 
                                onClick={() => onTabSwitch('demografi')}
                                className="mt-3 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer pt-2 border-t border-gray-50"
                            >
                                Piramida Demografi <ArrowRight size={12} />
                            </button>
                        </div>
                    );
                })()}
            </div>

            {/* Generasi & Ringkasan Pelatihan */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Donut generasi */}
                <ChartCard 
                    title={`Komposisi Generasi Karyawan ${selectedLocation ? `(${selectedLocation.name})` : ''}`} 
                    isEmpty={genData.length === 0} 
                    height="h-72"
                >
                    <div className="flex flex-col sm:flex-row items-center justify-between h-full gap-4">
                        <div className="w-full sm:w-1/2 h-56 relative flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie 
                                        data={genData} 
                                        cx="50%" 
                                        cy="50%" 
                                        innerRadius={55} 
                                        outerRadius={80} 
                                        dataKey="value" 
                                        paddingAngle={3}
                                    >
                                        {genData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                                    </Pie>
                                    <RechartsTooltip 
                                        formatter={(v, n) => [
                                            `${formatNumber(v)} staf (${totalGen > 0 ? Math.round((v / totalGen) * 100) : 0}%)`, 
                                            n
                                        ]} 
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total</span>
                                <span className="text-base font-extrabold text-gray-900 font-mono">{formatNumber(totalGen)}</span>
                            </div>
                        </div>

                        {/* Legenda Custom */}
                        <div className="w-full sm:w-1/2 space-y-2 text-xs">
                            {genData.map(item => (
                                <div key={item.name} className="flex items-center justify-between p-2 rounded-xl bg-gray-50/70 border border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                                        <span className="font-semibold text-gray-700">{item.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-bold text-gray-900 font-mono">{formatNumber(item.value)}</span>
                                        <span className="text-gray-400 text-[10px] ml-1 font-mono">({item.pct}%)</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </ChartCard>

                {/* Ringkasan Pelatihan */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-2xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                                    <GraduationCap size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-base">
                                        Ringkasan Pelatihan SDM {selectedLocation ? `(${selectedLocation.name})` : ''}
                                    </h3>
                                    <p className="text-xs text-gray-400">Akumulasi keikutsertaan pelatihan karyawan</p>
                                </div>
                            </div>
                            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                                Terverifikasi
                            </span>
                        </div>

                        {training ? (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-2">
                                <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-100">
                                    <p className="text-[11px] text-gray-500 font-medium">Cakupan (Coverage)</p>
                                    <p className="text-2xl font-black text-emerald-700 mt-1 font-mono">{training.coverage_pct}%</p>
                                    <p className="text-[10px] text-gray-400 mt-1">{training.trained_hc} dari {kpi?.hc || 0} staf</p>
                                </div>
                                <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-100">
                                    <p className="text-[11px] text-gray-500 font-medium">Total Jam Pelatihan</p>
                                    <p className="text-2xl font-black text-gray-900 mt-1 font-mono">{formatNumber(training.total_hours)} <span className="text-xs font-normal text-gray-500 font-sans">jam</span></p>
                                    <p className="text-[10px] text-gray-400 mt-1">Seluruh sesi training</p>
                                </div>
                                <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-100">
                                    <p className="text-[11px] text-gray-500 font-medium">Rata-rata per Peserta</p>
                                    <p className="text-2xl font-black text-[#004D40] mt-1 font-mono">
                                        {training.avg_hours_per_trainee || 0} <span className="text-xs font-normal text-gray-500 font-sans">jam</span>
                                    </p>
                                    <p className="text-[10px] text-gray-400 mt-1">Khusus staf terlatih</p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400 text-xs">
                                Belum ada data pelatihan yang terhubung untuk unit ini.
                            </div>
                        )}
                    </div>

                    <div className="mt-4 pt-3.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center gap-1.5 text-gray-500">
                            <Award className="w-4 h-4 text-emerald-600" />
                            Data disinkronkan otomatis dari Portal FR Academy
                        </span>
                        <button 
                            onClick={() => onTabSwitch('pelatihan')}
                            className="font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                        >
                            Selengkapnya <ArrowRight size={13} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Level Jabatan & Top Departemen */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard 
                    title={`Distribusi Level Jabatan ${selectedLocation ? `(${selectedLocation.name})` : ''}`} 
                    isEmpty={levelData.length === 0} 
                    height="h-72"
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={levelData} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 5 }}>
                            <CartesianGrid horizontal={false} stroke="#f1f5f9" />
                            <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} width={28} />
                            <RechartsTooltip 
                                formatter={(v) => [formatNumber(v), 'Karyawan']} 
                                labelFormatter={(l) => levelLabels[l] ? `Level ${l} - ${levelLabels[l]}` : `Level ${l}`} 
                            />
                            <Bar dataKey="value" fill="#004D40" radius={[0, 6, 6, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard 
                    title={`Top Departemen / Organisasi ${selectedLocation ? `(${selectedLocation.name})` : ''}`} 
                    isEmpty={deptData.length === 0} 
                    height="h-72"
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={deptData} layout="vertical" margin={{ left: 10, right: 20, top: 10, bottom: 5 }}>
                            <CartesianGrid horizontal={false} stroke="#f1f5f9" />
                            <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#334155' }} width={130} />
                            <RechartsTooltip 
                                formatter={(v) => [formatNumber(v), 'Karyawan']} 
                                labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ''} 
                            />
                            <Bar dataKey="value" fill="#2E7D32" radius={[0, 6, 6, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            {/* Row Bawah: Status Hubungan Kerja & Top Program Training */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Status Hubungan Kerja Card */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-2xs">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Briefcase className="text-emerald-700" size={18} />
                            <h3 className="font-bold text-gray-900 text-sm">
                                Status Hubungan Kerja {selectedLocation ? `(${selectedLocation.name})` : ''}
                            </h3>
                        </div>
                        <button
                            onClick={() => onTabSwitch('demografi')}
                            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                        >
                            Detail Demografi <ArrowRight size={13} />
                        </button>
                    </div>

                    <div className="space-y-3">
                        {Object.entries(demografi?.employment_types || {}).map(([name, value]) => {
                            const pct = kpi?.hc > 0 ? Math.round((value / kpi.hc) * 100) : 0;
                            return (
                                <div key={name} className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-semibold text-gray-700">{name}</span>
                                        <span className="font-mono text-gray-900 font-bold">{formatNumber(value)} staf <span className="text-gray-400 font-normal font-sans">({pct}%)</span></span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                        <div className="bg-[#004D40] h-2 rounded-full" style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                        {Object.keys(demografi?.employment_types || {}).length === 0 && (
                            <p className="text-xs text-gray-400 py-4 text-center">Belum ada data status hubungan kerja.</p>
                        )}
                    </div>
                </div>

                {/* Spotlight Training Courses */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-2xs">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <GraduationCap className="text-emerald-700" size={18} />
                            <h3 className="font-bold text-gray-900 text-sm">
                                Spotlight: Program Training Terbanyak {selectedLocation ? `(${selectedLocation.name})` : ''}
                            </h3>
                        </div>
                        <button
                            onClick={() => onTabSwitch('pelatihan')}
                            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                        >
                            Lihat Semua ({training?.top_trainings?.length || 0}) <ArrowRight size={13} />
                        </button>
                    </div>

                    <div className="space-y-2.5">
                        {spotlightTrainings.length > 0 ? (
                            spotlightTrainings.map((tr, idx) => (
                                <div
                                    key={tr.name}
                                    className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 border border-gray-100"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center font-mono">
                                            {idx + 1}
                                        </span>
                                        <div className="max-w-[240px]">
                                            <p className="text-xs font-bold text-gray-900 truncate" title={tr.name}>
                                                {tr.name}
                                            </p>
                                            <p className="text-[11px] text-gray-500 font-mono">{formatNumber(tr.hours)} jam total</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold bg-white text-emerald-800 px-2.5 py-1 rounded-lg border border-gray-200/80 shadow-2xs font-mono">
                                        {formatNumber(tr.participants)} peserta
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-gray-400 py-4 text-center">
                                {selectedLocation ? `Belum ada riwayat training tercatat di unit ${selectedLocation.name}.` : 'Belum ada riwayat program pelatihan.'}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* =========================================================================
   TAB 2: DEMOGRAFI & USIA
   ========================================================================= */
function DemografiTab({ profile, selectedLocation }) {
    if (!profile) return null;
    const { demografi, generations, levels, departments, kpi } = profile;

    // Generasi donut data
    const totalGen = Object.values(generations || {}).reduce((s, v) => s + v, 0);
    const genData = Object.entries(generations || {})
        .filter(([, v]) => v > 0)
        .map(([name, value]) => ({ 
            name, 
            value, 
            pct: totalGen > 0 ? Math.round((value / totalGen) * 100) : 0,
            fill: generationColors[name] || '#94A3B8' 
        }));

    // Level bar data
    const levelData = LEVEL_ORDER
        .filter(l => levels?.[l])
        .map(l => ({ name: l, label: `${l} - ${levelLabels[l] || l}`, value: levels[l] }));

    // Department top 8
    const deptData = Object.entries(departments || {})
        .slice(0, 8)
        .map(([name, value]) => ({ 
            name: name.length > 22 ? name.slice(0, 22) + '…' : name, 
            fullName: name,
            value 
        }));

    // Status Pernikahan
    const maritalData = Object.entries(demografi?.marital_status || {})
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    // Tipe Kepegawaian
    const employmentData = Object.entries(demografi?.employment_types || {})
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    return (
        <div className="space-y-6">
            {/* 4 Mini KPI Demografi */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-2xs">
                    <p className="text-xs text-gray-500 font-medium">Headcount Aktif</p>
                    <p className="text-2xl font-black text-gray-900 mt-1 font-mono">{formatNumber(kpi?.hc || 0)}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{selectedLocation ? `Unit ${selectedLocation.name}` : 'Seluruh jenjang staf'}</p>
                </div>
                <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-2xs">
                    <p className="text-xs text-gray-500 font-medium">Rata-rata Usia</p>
                    <p className="text-2xl font-black text-gray-900 mt-1 font-mono">{kpi?.avg_age || 0} <span className="text-xs font-normal text-gray-500 font-sans">tahun</span></p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Dihitung dari tgl lahir</p>
                </div>
                {(() => {
                    const maleCount = demografi?.male_count || 0;
                    const femaleCount = demografi?.female_count || 0;
                    const totalGender = maleCount + femaleCount;
                    const femalePct = totalGender > 0 ? Math.round((femaleCount / totalGender) * 100) : 0;
                    const malePct = totalGender > 0 ? (100 - femalePct) : 0;

                    return (
                        <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-2xs">
                            <p className="text-xs text-gray-500 font-medium">Komposisi Gender (P / W)</p>
                            <p className="text-2xl font-black text-gray-900 mt-1 font-mono flex items-baseline gap-1">
                                <span>{malePct}%</span>
                                <span className="text-gray-300 font-sans text-base font-normal">:</span>
                                <span className="text-gray-600">{femalePct}%</span>
                            </p>
                            <p className="text-[11px] text-gray-400 mt-0.5">{maleCount} Pria · {femaleCount} Wanita</p>
                        </div>
                    );
                })()}
                <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-2xs">
                    <p className="text-xs text-gray-500 font-medium">Karyawan Tetap</p>
                    <p className="text-2xl font-black text-emerald-700 mt-1 font-mono">{kpi?.perm_pct || 0}%</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Status Permanent/Tetap</p>
                </div>
            </div>

            {/* Piramida Usia & Gender + Komposisi Generasi */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard 
                    title={`Piramida Usia & Distribusi Gender ${selectedLocation ? `(${selectedLocation.name})` : ''}`} 
                    subtitle="Proporsi karyawan Laki-laki vs Perempuan di tiap kelompok usia"
                    isEmpty={!demografi?.age_bins?.length} 
                    height="h-80"
                >
                    <PopulationPyramid 
                        data={demografi?.age_bins || []} 
                        yAxisKey="name" 
                        leftKey="Male" 
                        rightKey="Female" 
                        leftColor="#004D40" 
                        rightColor="#F59E0B" 
                    />
                </ChartCard>

                <ChartCard 
                    title={`Komposisi Generasi Karyawan ${selectedLocation ? `(${selectedLocation.name})` : ''}`} 
                    subtitle="Distribusi rentang generasi menurut tahun kelahiran" 
                    isEmpty={genData.length === 0} 
                    height="h-80"
                >
                    <div className="flex flex-col sm:flex-row items-center justify-between h-full gap-4">
                        <div className="w-full sm:w-1/2 h-56 relative flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie 
                                        data={genData} 
                                        cx="50%" 
                                        cy="50%" 
                                        innerRadius={55} 
                                        outerRadius={80} 
                                        dataKey="value" 
                                        paddingAngle={3}
                                    >
                                        {genData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                                    </Pie>
                                    <RechartsTooltip 
                                        formatter={(v, n) => [
                                            `${formatNumber(v)} staf (${totalGen > 0 ? Math.round((v / totalGen) * 100) : 0}%)`, 
                                            n
                                        ]} 
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total</span>
                                <span className="text-base font-extrabold text-gray-900 font-mono">{formatNumber(totalGen)}</span>
                            </div>
                        </div>

                        <div className="w-full sm:w-1/2 space-y-2 text-xs">
                            {genData.map(item => (
                                <div key={item.name} className="flex items-center justify-between p-2 rounded-xl bg-gray-50/70 border border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                                        <span className="font-semibold text-gray-700">{item.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-bold text-gray-900 font-mono">{formatNumber(item.value)}</span>
                                        <span className="text-gray-400 text-[10px] ml-1 font-mono">({item.pct}%)</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </ChartCard>
            </div>

            {/* Level Jabatan & Top Departemen */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard 
                    title={`Distribusi Level Jabatan ${selectedLocation ? `(${selectedLocation.name})` : ''}`} 
                    isEmpty={levelData.length === 0} 
                    height="h-72"
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={levelData} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 5 }}>
                            <CartesianGrid horizontal={false} stroke="#f1f5f9" />
                            <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} width={28} />
                            <RechartsTooltip 
                                formatter={(v) => [formatNumber(v), 'Karyawan']} 
                                labelFormatter={(l) => levelLabels[l] ? `Level ${l} - ${levelLabels[l]}` : `Level ${l}`} 
                            />
                            <Bar dataKey="value" fill="#004D40" radius={[0, 6, 6, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard 
                    title={`Top Departemen / Divisi ${selectedLocation ? `(${selectedLocation.name})` : ''}`} 
                    isEmpty={deptData.length === 0} 
                    height="h-72"
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={deptData} layout="vertical" margin={{ left: 10, right: 20, top: 10, bottom: 5 }}>
                            <CartesianGrid horizontal={false} stroke="#f1f5f9" />
                            <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#334155' }} width={130} />
                            <RechartsTooltip 
                                formatter={(v) => [formatNumber(v), 'Karyawan']} 
                                labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ''} 
                            />
                            <Bar dataKey="value" fill="#2E7D32" radius={[0, 6, 6, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            {/* Status Kepegawaian & Status Pernikahan */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-2xs">
                    <h3 className="font-bold text-gray-900 text-sm mb-1">
                        Status Hubungan Kerja {selectedLocation ? `(${selectedLocation.name})` : ''}
                    </h3>
                    <p className="text-xs text-gray-400 mb-4">Sebaran kontrak kerja karyawan operasional</p>
                    
                    <div className="space-y-3">
                        {employmentData.map(item => {
                            const pct = kpi?.hc > 0 ? Math.round((item.value / kpi.hc) * 100) : 0;
                            return (
                                <div key={item.name} className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-semibold text-gray-700">{item.name}</span>
                                        <span className="font-mono text-gray-900 font-bold">{formatNumber(item.value)} staf <span className="text-gray-400 font-normal font-sans">({pct}%)</span></span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                        <div className="bg-[#004D40] h-2 rounded-full" style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-2xs">
                    <h3 className="font-bold text-gray-900 text-sm mb-1">
                        Status Pernikahan {selectedLocation ? `(${selectedLocation.name})` : ''}
                    </h3>
                    <p className="text-xs text-gray-400 mb-4">Profil tanggungan keluarga karyawan</p>
                    
                    <div className="space-y-3">
                        {maritalData.map(item => {
                            const pct = kpi?.hc > 0 ? Math.round((item.value / kpi.hc) * 100) : 0;
                            return (
                                <div key={item.name} className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-semibold text-gray-700">{item.name}</span>
                                        <span className="font-mono text-gray-900 font-bold">{formatNumber(item.value)} staf <span className="text-gray-400 font-normal font-sans">({pct}%)</span></span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                        <div className="bg-[#2E7D32] h-2 rounded-full" style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* =========================================================================
   TAB 3: MASA KERJA (TENURE)
   ========================================================================= */
function MasaKerjaTab({ profile, selectedLocation }) {
    if (!profile) return null;
    const { masa_kerja, kpi } = profile;
    const tenureBins = masa_kerja?.tenure_bins || [];
    const cohortYears = masa_kerja?.cohort_years || [];

    const totalHc = kpi?.hc || 1;
    const productiveStaff = tenureBins
        .filter(b => b.name === '3-5 Thn' || b.name === '5-10 Thn')
        .reduce((sum, b) => sum + b.value, 0);

    const seniorStaff = tenureBins
        .filter(b => b.name === '10-15 Thn' || b.name === '15+ Thn')
        .reduce((sum, b) => sum + b.value, 0);

    return (
        <div className="space-y-6">
            {/* 4 Mini KPI Masa Kerja */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-2xs">
                    <p className="text-xs text-gray-500 font-medium">Rata-rata Masa Kerja</p>
                    <p className="text-2xl font-black text-gray-900 mt-1 font-mono">{masa_kerja?.avg_los || 0} <span className="text-xs font-normal text-gray-500 font-sans">thn</span></p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Length of Service (LOS)</p>
                </div>
                <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-2xs">
                    <p className="text-xs text-gray-500 font-medium">Karyawan Baru (&lt;1 Thn)</p>
                    <p className="text-2xl font-black text-emerald-700 mt-1 font-mono">{masa_kerja?.new_hires_count || 0} <span className="text-xs font-normal text-gray-500 font-sans">staf</span></p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Masa onboarding awal</p>
                </div>
                <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-2xs">
                    <p className="text-xs text-gray-500 font-medium">Masa Kerja Produktif (3-10 Thn)</p>
                    <p className="text-2xl font-black text-gray-900 mt-1 font-mono">{formatNumber(productiveStaff)} <span className="text-xs font-normal text-gray-500 font-sans">staf</span></p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{Math.round((productiveStaff / totalHc) * 100)}% dari total tenaga kerja</p>
                </div>
                <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-2xs">
                    <p className="text-xs text-gray-500 font-medium">Senioritas Tinggi (10+ Thn)</p>
                    <p className="text-2xl font-black text-[#004D40] mt-1 font-mono">{formatNumber(seniorStaff)} <span className="text-xs font-normal text-gray-500 font-sans">staf</span></p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Pilar pengetahuan organisasi</p>
                </div>
            </div>

            {/* Row 1: Distribusi Masa Kerja & Cohort Tahun Masuk */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard 
                    title={`Distribusi Masa Kerja ${selectedLocation ? `(${selectedLocation.name})` : ''}`} 
                    subtitle="Sebaran karyawan berdasarkan bracket lamanya masa pengabdian"
                    isEmpty={tenureBins.length === 0} 
                    height="h-72"
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={tenureBins} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
                            <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                            <RechartsTooltip 
                                formatter={(v) => [`${formatNumber(v)} staf (${Math.round((v / totalHc) * 100)}%)`, 'Jumlah Karyawan']} 
                            />
                            <Bar dataKey="value" fill="#004D40" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard 
                    title={`Cohort Rekrutmen ${selectedLocation ? `(${selectedLocation.name})` : ''}`} 
                    subtitle="Jumlah staf aktif yang bergabung berdasarkan tahun masuk (Join Year)"
                    isEmpty={cohortYears.length === 0} 
                    height="h-72"
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={cohortYears} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748B' }} />
                            <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                            <RechartsTooltip 
                                formatter={(v) => [formatNumber(v), 'Staf Masuk']} 
                                labelFormatter={(y) => `Tahun Masuk ${y}`} 
                            />
                            <Bar dataKey="count" fill="#2E7D32" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            {/* Tabel Analisis Retensi & Struktur Masa Kerja */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-gray-900 text-sm">
                            Struktur Retensi &amp; Loyalitas Karyawan {selectedLocation ? `(${selectedLocation.name})` : ''}
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">Analisis komposisi tenaga kerja berdasarkan bracket masa kerja</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-gray-500 uppercase font-semibold border-b border-gray-100">
                            <tr>
                                <th className="px-5 py-3">Bracket Masa Kerja</th>
                                <th className="px-5 py-3 text-right">Jumlah Staf</th>
                                <th className="px-5 py-3 text-right">Proporsi (%)</th>
                                <th className="px-5 py-3">Kategori Peran Strategis</th>
                                <th className="px-5 py-3">Fokus Manajemen Operasional</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {tenureBins.map((bin) => {
                                const pct = totalHc > 0 ? Math.round((bin.value / totalHc) * 100) : 0;
                                let category = 'Produktif';
                                let focus = 'Pengembangan spesialisasi & produktivitas kebun/pabrik';
                                let badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200/60';

                                if (bin.name === '<1 Thn') {
                                    category = 'Onboarding';
                                    focus = 'Aklimatisasi SOP lapangan, pendampingan mentor & training mandatori';
                                    badgeColor = 'bg-sky-50 text-sky-800 border-sky-200/60';
                                } else if (bin.name === '1-3 Thn') {
                                    category = 'Konsolidasi';
                                    focus = 'Peningkatan efisiensi kerja dan penguasaan target operasional';
                                    badgeColor = 'bg-teal-50 text-teal-800 border-teal-200/60';
                                } else if (bin.name === '3-5 Thn') {
                                    category = 'Kontributor Utama';
                                    focus = 'Kesiapan suksesi supervisor, leadership pelatihan, efisiensi unit';
                                    badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200/60';
                                } else if (bin.name === '5-10 Thn') {
                                    category = 'Pilar Operasional';
                                    focus = 'Retensi staf kunci, stabilitas tim, dan transfer best practice';
                                    badgeColor = 'bg-indigo-50 text-indigo-800 border-indigo-200/60';
                                } else {
                                    category = 'Senior Mentor';
                                    focus = 'Knowledge sharing, regenerasi kader penerus, dan pembinaan senior staf';
                                    badgeColor = 'bg-amber-50 text-amber-800 border-amber-200/60';
                                }

                                return (
                                    <tr key={bin.name} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-3.5 font-bold text-gray-900">{bin.name}</td>
                                        <td className="px-5 py-3.5 text-right font-mono font-bold text-gray-900">{formatNumber(bin.value)}</td>
                                        <td className="px-5 py-3.5 text-right font-mono text-gray-600">{pct}%</td>
                                        <td className="px-5 py-3.5">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badgeColor}`}>
                                                {category}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-gray-500">{focus}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

/* =========================================================================
   TAB 4: PELATIHAN SDM (TRAINING)
   ========================================================================= */
function PelatihanTab({ profile, selectedLocation }) {
    if (!profile) return null;
    const { training, kpi } = profile;
    const topTrainings = training?.top_trainings || [];
    const regularity = training?.regularity || {};
    const sourceType = training?.source_type || {};

    const regData = Object.entries(regularity).map(([name, value], i) => ({
        name,
        value,
        fill: i === 0 ? '#004D40' : '#F59E0B'
    }));

    const sourceData = Object.entries(sourceType).map(([name, value], i) => ({
        name,
        value,
        fill: i === 0 ? '#2E7D32' : '#64748B'
    }));

    return (
        <div className="space-y-6">
            {/* 4 KPI Pelatihan */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-2xs">
                    <p className="text-xs text-gray-500 font-medium">Cakupan Pelatihan (Coverage)</p>
                    <p className="text-2xl font-black text-emerald-700 mt-1 font-mono">{training?.coverage_pct || 0}%</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{training?.trained_hc || 0} dari {kpi?.hc || 0} staf</p>
                </div>
                <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-2xs">
                    <p className="text-xs text-gray-500 font-medium">Total Jam Pelatihan</p>
                    <p className="text-2xl font-black text-gray-900 mt-1 font-mono">{formatNumber(training?.total_hours || 0)} <span className="text-xs font-normal text-gray-500 font-sans">jam</span></p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Akumulasi sesi {selectedLocation ? selectedLocation.name : 'perusahaan'}</p>
                </div>
                <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-2xs">
                    <p className="text-xs text-gray-500 font-medium">Rata-rata per Peserta</p>
                    <p className="text-2xl font-black text-[#004D40] mt-1 font-mono">{training?.avg_hours_per_trainee || 0} <span className="text-xs font-normal text-gray-500 font-sans">jam</span></p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Staf yang telah dilatih</p>
                </div>
                <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-2xs">
                    <p className="text-xs text-gray-500 font-medium">Karyawan Baru Belum Dilatih</p>
                    <p className={`text-2xl font-black mt-1 font-mono ${training?.untrained_new_hires > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
                        {training?.untrained_new_hires || 0} <span className="text-xs font-normal text-gray-500 font-sans">staf</span>
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Perlu onboarding training</p>
                </div>
            </div>

            {/* Top 6 Program Pelatihan */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-2xs">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                <GraduationCap className="text-emerald-700" size={18} />
                                Top Program Pelatihan Terbanyak Diikuti {selectedLocation ? `(${selectedLocation.name})` : ''}
                            </h3>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Program pelatihan dengan jumlah peserta staf operasional terbanyak
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {topTrainings.length > 0 ? (
                            topTrainings.map((tr, index) => (
                                <div
                                    key={tr.name}
                                    className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 font-mono">
                                            {index + 1}
                                        </span>
                                        <div>
                                            <p className="text-xs font-bold text-gray-900">{tr.name}</p>
                                            <p className="text-[11px] text-gray-400 mt-0.5 font-mono">
                                                Total {formatNumber(tr.hours)} jam pelatihan • Rata-rata {(tr.hours / (tr.participants || 1)).toFixed(1)} jam/peserta
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 self-start sm:self-auto">
                                        <span className="text-xs font-bold bg-white text-emerald-800 px-3 py-1 rounded-lg border border-gray-200/80 shadow-2xs font-mono">
                                            {formatNumber(tr.participants)} peserta
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center py-8 text-gray-400 text-xs">
                                {selectedLocation 
                                    ? `Belum ada catatan training yang terhubung untuk unit ${selectedLocation.name}.` 
                                    : 'Belum ada catatan program pelatihan untuk perusahaan ini.'}
                            </p>
                        )}
                    </div>
                </div>

                {/* Karakteristik & Sumber Pelatihan */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-2xs">
                        <h3 className="font-bold text-gray-900 text-sm mb-1">Kategori Pelatihan (Regularity)</h3>
                        <p className="text-xs text-gray-400 mb-4">Sifat penjadwalan program pelatihan</p>

                        <div className="space-y-2.5">
                            {regData.map(item => (
                                <div key={item.name} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/70 border border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                                        <span className="text-xs font-semibold text-gray-700">{item.name}</span>
                                    </div>
                                    <span className="font-mono text-xs font-bold text-gray-900">{formatNumber(item.value)} sesi</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-2xs">
                        <h3 className="font-bold text-gray-900 text-sm mb-1">Sumber Pelatihan (Source Type)</h3>
                        <p className="text-xs text-gray-400 mb-4">Instruktur internal vs eksternal</p>

                        <div className="space-y-2.5">
                            {sourceData.map(item => (
                                <div key={item.name} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/70 border border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                                        <span className="text-xs font-semibold text-gray-700">{item.name}</span>
                                    </div>
                                    <span className="font-mono text-xs font-bold text-gray-900">{formatNumber(item.value)} sesi</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* FR Academy Banner */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white text-emerald-800 shadow-2xs border border-emerald-100">
                        <Award size={18} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-emerald-950">Integrasi Basis Data FR Academy</p>
                        <p className="text-[11px] text-emerald-800">
                            Semua jam dan sertifikat pelatihan dikompilasi secara otomatis berdasarkan NIK staf yang terdaftar.
                        </p>
                    </div>
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white text-emerald-800 border border-emerald-200 shadow-2xs font-mono">
                    Tersinkronisasi
                </span>
            </div>
        </div>
    );
}

/* =========================================================================
   TAB 6: DAFTAR STAF (SDM)
   ========================================================================= */
function StafTab({ companyId, selectedLocation, filterOptions = null, selectedEmpId = null, onSelectStaff, onLocationClear }) {
    const [employees, setEmployees] = useState(null);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [level, setLevel] = useState('');
    const [department, setDepartment] = useState('');
    const [employmentType, setEmploymentType] = useState('');
    const [loading, setLoading] = useState(true);

    const rightPaneRef = useRef(null);
    const [rightHeight, setRightHeight] = useState(null);

    // Sync left pane height with right pane height accurately
    useEffect(() => {
        if (!selectedEmpId) {
            setRightHeight(null);
            return;
        }

        const updateHeight = () => {
            if (typeof window !== 'undefined' && window.innerWidth >= 1024 && rightPaneRef.current) {
                const h = Math.round(rightPaneRef.current.getBoundingClientRect().height);
                if (h > 100) {
                    setRightHeight(h);
                }
            } else {
                setRightHeight(null);
            }
        };

        updateHeight();

        let animId = null;
        const observer = new ResizeObserver(() => {
            cancelAnimationFrame(animId);
            animId = requestAnimationFrame(updateHeight);
        });

        if (rightPaneRef.current) {
            observer.observe(rightPaneRef.current);
        }
        window.addEventListener('resize', updateHeight);

        return () => {
            cancelAnimationFrame(animId);
            observer.disconnect();
            window.removeEventListener('resize', updateHeight);
        };
    }, [selectedEmpId]);

    const load = useCallback(() => {
        setLoading(true);
        const params = new URLSearchParams({ page, search: search || '' });
        if (selectedLocation?.id) params.append('location_id', selectedLocation.id);
        if (level) params.append('level', level);
        if (department) params.append('department', department);
        if (employmentType) params.append('employment_type', employmentType);

        axios.get(`/data/companies/${companyId}/employees?${params}`).then(res => {
            setEmployees(res.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [companyId, page, search, selectedLocation, level, department, employmentType]);

    useEffect(() => { load(); }, [load]);

    // Reset page to 1 when location changes
    useEffect(() => {
        setPage(1);
    }, [selectedLocation]);

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const hasActiveFilters = Boolean(selectedLocation || level || department || employmentType || search);

    const resetFilters = () => {
        if (onLocationClear) onLocationClear();
        setLevel('');
        setDepartment('');
        setEmploymentType('');
        setSearch('');
        setPage(1);
    };

    return (
        <div className="space-y-4">
            {/* Filter controls toolbar */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs p-4 space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            value={search}
                            onChange={handleSearch}
                            placeholder="Cari nama, NIK, atau jabatan staf..."
                            className="w-full pl-10 pr-9 py-2 text-sm bg-gray-50/70 hover:bg-gray-50 focus:bg-white rounded-xl border border-gray-200/80 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all"
                        />
                        {search && (
                            <button
                                onClick={() => { setSearch(''); setPage(1); }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Filter Dropdowns */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Level */}
                        <select
                            value={level}
                            onChange={(e) => { setLevel(e.target.value); setPage(1); }}
                            className="px-3 py-2 text-xs bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none cursor-pointer"
                        >
                            <option value="">Semua Level</option>
                            {(filterOptions?.levels || []).map(lvl => (
                                <option key={lvl} value={lvl}>{lvl} - {levelLabels[lvl] || lvl}</option>
                            ))}
                        </select>

                        {/* Departemen */}
                        <select
                            value={department}
                            onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
                            className="px-3 py-2 text-xs bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none max-w-[200px] truncate cursor-pointer"
                        >
                            <option value="">Semua Departemen</option>
                            {(filterOptions?.departments || []).map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>

                        {/* Status Kerja */}
                        <select
                            value={employmentType}
                            onChange={(e) => { setEmploymentType(e.target.value); setPage(1); }}
                            className="px-3 py-2 text-xs bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none cursor-pointer"
                        >
                            <option value="">Semua Status</option>
                            {(filterOptions?.employment_types || []).map(et => (
                                <option key={et} value={et}>{et}</option>
                            ))}
                        </select>

                        {hasActiveFilters && (
                            <button
                                onClick={resetFilters}
                                className="inline-flex items-center gap-1 px-3 py-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors font-medium border border-rose-100 cursor-pointer"
                            >
                                <RotateCcw size={12} /> Reset
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter aktif chips */}
                {hasActiveFilters && (
                    <div className="flex flex-wrap gap-2 items-center text-xs pt-2 border-t border-gray-100">
                        <span className="text-gray-400 font-medium">Filter aktif:</span>
                        {selectedLocation && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                                <MapPin size={11} className="text-emerald-700" /> Unit: {selectedLocation.name}
                                <button onClick={() => onLocationClear && onLocationClear()} className="hover:text-emerald-950 font-bold ml-1 cursor-pointer">×</button>
                            </span>
                        )}
                        {level && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs">
                                Level: {level}
                                <button onClick={() => { setLevel(''); setPage(1); }} className="hover:text-emerald-950 font-bold ml-1 cursor-pointer">×</button>
                            </span>
                        )}
                        {department && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-xs">
                                Dept: {department}
                                <button onClick={() => { setDepartment(''); setPage(1); }} className="hover:text-blue-950 font-bold ml-1 cursor-pointer">×</button>
                            </span>
                        )}
                        {employmentType && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-800 border border-purple-200 text-xs">
                                Status: {employmentType}
                                <button onClick={() => { setEmploymentType(''); setPage(1); }} className="hover:text-purple-950 font-bold ml-1 cursor-pointer">×</button>
                            </span>
                        )}
                        {search && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200 text-xs">
                                Pencarian: "{search}"
                                <button onClick={() => { setSearch(''); setPage(1); }} className="hover:text-gray-950 font-bold ml-1 cursor-pointer">×</button>
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* CONDITIONAL RENDER: SPLIT VIEW (WHEN STAFF CLICKED) vs FULL-WIDTH TABLE */}
            {loading ? (
                <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-3">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-12 bg-gray-100 animate-pulse rounded-lg" />
                    ))}
                </div>
            ) : employees?.data?.length > 0 ? (
                selectedEmpId ? (
                    /* MODE 1: MASTER-DETAIL SPLIT VIEW (EQUAL HEIGHT ALIGNED BOTTOM) */
                    <div className="flex flex-col lg:flex-row gap-5 items-start animate-in fade-in duration-300">
                        {/* Left Pane: Staff List in this Company (Height matches Right Pane exactly) */}
                        <div 
                            className="w-full lg:w-[380px] xl:w-[400px] shrink-0 bg-white rounded-xl border border-gray-200/90 shadow-2xs overflow-hidden flex flex-col transition-[height] duration-150"
                            style={rightHeight ? { height: `${rightHeight}px`, maxHeight: `${rightHeight}px` } : undefined}
                        >
                            <div className="p-3.5 border-b border-gray-100 bg-slate-50/70 flex items-center justify-between shrink-0">
                                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                    <Users size={14} className="text-[#004D40]" />
                                    <span>Daftar Staf ({formatNumber(employees.total)})</span>
                                </span>
                                <span className="text-[10px] font-mono font-bold bg-emerald-100/70 text-[#004D40] px-2 py-0.5 rounded-md border border-emerald-200/60">
                                    Hal {employees.current_page} / {employees.last_page}
                                </span>
                            </div>

                            {/* Staff Cards (Scrollable within exact height of Right Pane) */}
                            <div className="divide-y divide-gray-100 flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
                                {employees.data.map(emp => {
                                    const isSelected = selectedEmpId === emp.employee_id;
                                    return (
                                        <div
                                            key={emp.employee_id}
                                            onClick={() => onSelectStaff(emp.employee_id)}
                                            className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center gap-3 relative group ${
                                                isSelected
                                                    ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-[#004D40]/20 shadow-2xs'
                                                    : 'bg-white border-slate-200/70 hover:bg-slate-50 hover:border-slate-300 shadow-2xs'
                                            }`}
                                        >
                                            {isSelected && (
                                                <div className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-[#004D40] rounded-r" />
                                            )}
                                            <div className="shrink-0 pl-1">
                                                <EmployeeAvatar name={emp.name} photoUrl={emp.photo_url} size="md" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-1">
                                                    <p className={`text-xs font-black truncate leading-tight ${
                                                        isSelected ? 'text-[#004D40]' : 'text-slate-900 group-hover:text-[#004D40]'
                                                    }`}>
                                                        {emp.name}
                                                    </p>
                                                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                                        {emp.employee_id}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-slate-600 truncate mt-0.5 font-semibold">
                                                    {emp.job_title_name || '—'}
                                                </p>
                                                <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400">
                                                    <span className="truncate max-w-[130px] font-medium text-slate-500">
                                                        {emp.department || '—'}
                                                    </span>
                                                    <span>·</span>
                                                    <span className="font-bold text-slate-600 px-1 py-0.2 bg-slate-100 rounded">
                                                        {emp.job_level_code || '—'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Pagination Controls for Left Pane (Pinned at bottom) */}
                            <div className="p-2.5 border-t border-gray-100 bg-slate-50/80 flex items-center justify-between text-xs text-slate-500 shrink-0 mt-auto">
                                <span className="text-[11px]">
                                    Hal <b className="text-slate-900">{employees.current_page}</b> dari <b className="text-slate-900">{employees.last_page}</b>
                                </span>
                                <div className="flex items-center gap-1">
                                    <button
                                        disabled={page <= 1}
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        className="p-1 rounded-md bg-white border border-gray-200 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 shadow-2xs cursor-pointer"
                                    >
                                        <ChevronLeft size={13} />
                                    </button>
                                    <button
                                        disabled={page >= employees.last_page}
                                        onClick={() => setPage(p => p + 1)}
                                        className="p-1 rounded-md bg-white border border-gray-200 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 shadow-2xs cursor-pointer"
                                    >
                                        <ChevronRight size={13} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right Pane: Staff Detail Pane with Animation */}
                        <div ref={rightPaneRef} className="flex-1 min-w-0 w-full flex flex-col gap-3.5 animate-in fade-in slide-in-from-right duration-300">
                            {/* Action Ribbon at Top of Profile */}
                            <div className="flex items-center justify-between gap-3 bg-white p-2.5 px-4 rounded-xl border border-gray-200/90 shadow-2xs shrink-0">
                                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    <span>Menampilkan Profil: <b className="text-slate-900">{employees?.data?.find(e => e.employee_id === selectedEmpId)?.name || selectedEmpId}</b></span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onSelectStaff(null)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
                                    title="Tutup Detail dan Kembali ke Tabel Penuh"
                                >
                                    <TableIcon size={14} className="text-[#004D40]" />
                                    <span>Kembali ke Tabel Penuh</span>
                                    <X size={13} className="text-slate-400" />
                                </button>
                            </div>

                            <StaffDetailPane employeeId={selectedEmpId} />
                        </div>
                    </div>
                ) : (
                    /* MODE 2: FULL-WIDTH TABLE VIEW (DEFAULT BEFORE CLICK) */
                    <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs overflow-hidden flex flex-col animate-in fade-in duration-200">
                        <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)] relative">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="text-xs text-gray-500 uppercase bg-slate-50/95 backdrop-blur-xs border-b border-gray-200/80 sticky top-0 z-10 shadow-2xs">
                                    <tr>
                                        <th className="px-5 py-3.5 font-semibold text-gray-600 tracking-wider whitespace-nowrap">Karyawan</th>
                                        <th className="px-5 py-3.5 font-semibold text-gray-600 tracking-wider whitespace-nowrap">Jabatan</th>
                                        <th className="px-5 py-3.5 font-semibold text-gray-600 tracking-wider whitespace-nowrap hidden sm:table-cell">Departemen</th>
                                        <th className="px-5 py-3.5 font-semibold text-gray-600 tracking-wider whitespace-nowrap text-center">Level</th>
                                        <th className="px-5 py-3.5 font-semibold text-gray-600 tracking-wider whitespace-nowrap text-center hidden md:table-cell">Umur</th>
                                        <th className="px-5 py-3.5 font-semibold text-gray-600 tracking-wider whitespace-nowrap text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {employees.data.map(emp => (
                                        <tr
                                            key={emp.employee_id}
                                            onClick={() => onSelectStaff(emp.employee_id)}
                                            className="hover:bg-emerald-50/30 cursor-pointer transition-colors group"
                                            title="Klik untuk membuka detail profil"
                                        >
                                            <td className="px-5 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <EmployeeAvatar name={emp.name} photoUrl={emp.photo_url} size="sm" />
                                                    <div>
                                                        <p className="font-semibold text-gray-900 group-hover:text-emerald-800 transition-colors">
                                                            {emp.name}
                                                        </p>
                                                        <p className="font-mono text-xs text-gray-400">{emp.employee_id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 text-gray-700 whitespace-nowrap font-medium">
                                                {emp.job_title_name || '—'}
                                            </td>
                                            <td className="px-5 py-3 text-gray-500 whitespace-nowrap hidden sm:table-cell text-xs">
                                                {emp.department || '—'}
                                            </td>
                                            <td className="px-5 py-3 text-center whitespace-nowrap">
                                                {emp.job_level_code ? (
                                                    <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-0.5 rounded-md border border-slate-200/60 font-mono">
                                                        {emp.job_level_code}
                                                    </span>
                                                ) : '—'}
                                            </td>
                                            <td className="px-5 py-3 text-center text-gray-600 whitespace-nowrap hidden md:table-cell text-xs font-mono">
                                                {emp.age ? `${emp.age} th` : '—'}
                                            </td>
                                            <td className="px-5 py-3 text-center whitespace-nowrap">
                                                {renderEmploymentBadge(emp.employment_type)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white">
                            <p className="text-sm text-gray-500">
                                Menampilkan <span className="font-semibold text-gray-900 font-mono">{formatNumber(employees.from)}</span> - <span className="font-semibold text-gray-900 font-mono">{formatNumber(employees.to)}</span> dari <span className="font-semibold text-gray-900 font-mono">{formatNumber(employees.total)}</span> staf
                            </p>
                            <div className="flex items-center gap-1.5">
                                <button
                                    disabled={page <= 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    className="min-w-[2rem] h-8 px-2 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-emerald-50 hover:text-emerald-900 transition-colors text-xs font-medium cursor-pointer"
                                >
                                    <ChevronLeft size={15} />
                                </button>
                                <span className="px-3 py-1 text-xs font-semibold text-gray-700 bg-gray-50 rounded-lg border border-gray-200/80 font-mono">
                                    {employees.current_page} / {employees.last_page}
                                </span>
                                <button
                                    disabled={page >= employees.last_page}
                                    onClick={() => setPage(p => p + 1)}
                                    className="min-w-[2rem] h-8 px-2 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-emerald-50 hover:text-emerald-900 transition-colors text-xs font-medium cursor-pointer"
                                >
                                    <ChevronRight size={15} />
                                </button>
                            </div>
                        </div>
                    </div>
                )
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-2xs">
                    <div className="w-16 h-16 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto mb-4 border border-gray-100">
                        <Users size={32} className="opacity-50" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900">Tidak ada staf ditemukan</h3>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                        {selectedLocation 
                            ? `Tidak ada staf yang sesuai dengan kriteria di unit ${selectedLocation.name}.` 
                            : 'Tidak ada staf yang sesuai dengan kriteria filter atau pencarian di perusahaan ini.'}
                    </p>
                    {hasActiveFilters && (
                        <button
                            onClick={resetFilters}
                            className="mt-4 inline-flex items-center px-3.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors cursor-pointer"
                        >
                            Reset Filter &amp; Pencarian
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

/* =========================================================================
   MAIN COMPONENT: CompanyShow (Unified 360° Cockpit)
   ========================================================================= */
export default function CompanyShow({ companyCode, companyId, initialCompany }) {
    const [profile, setProfile] = useState(null);
    const [company, setCompany] = useState(initialCompany || null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [selectedEmpId, setSelectedEmpId] = useState(null);

    // Selected operational unit (null = seluruh perusahaan)
    const [selectedLocation, setSelectedLocation] = useState(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const locId = params.get('location_id');
            const locName = params.get('location_name');
            return locId ? { id: locId, name: locName || '' } : null;
        }
        return null;
    });

    // Active tab: 'overview' | 'demografi' | 'tenure' | 'pelatihan' | 'staf'
    const [tab, setTab] = useState(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const queryTab = params.get('tab');
            if (queryTab === 'profil') return 'overview';
            if (['overview', 'demografi', 'tenure', 'pelatihan', 'staf'].includes(queryTab)) {
                return queryTab;
            }
        }
        return 'overview';
    });

    // Fetch profile dynamically whenever companyId OR selectedLocation changes
    const fetchProfile = useCallback((locId = null) => {
        setLoadingProfile(true);
        const params = new URLSearchParams();
        if (locId) params.append('location_id', locId);

        axios.get(`/data/companies/${companyId}/profile?${params.toString()}`).then(res => {
            setProfile(res.data);
            setLoadingProfile(false);
        }).catch(() => setLoadingProfile(false));
    }, [companyId]);

    useEffect(() => {
        fetchProfile(selectedLocation?.id);
    }, [fetchProfile, selectedLocation]);

    useEffect(() => {
        if (!company) {
            axios.get('/data/companies').then(res => {
                const found = (res.data.data || []).find(c => String(c.id) === String(companyId));
                if (found) setCompany(found);
            });
        }
    }, [companyId, company]);

    const handleTabChange = (t) => {
        setTab(t);
        const url = new URL(window.location.href);
        url.searchParams.set('tab', t);
        window.history.replaceState({}, '', url.toString());
    };

    // Toggle location filter globally across all tabs
    const handleLocationToggle = (loc) => {
        const isSame = selectedLocation && loc && String(selectedLocation.id) === String(loc.id);
        const newLoc = (isSame || !loc) ? null : loc;
        setSelectedLocation(newLoc);

        const url = new URL(window.location.href);
        if (newLoc) {
            url.searchParams.set('location_id', newLoc.id);
            url.searchParams.set('location_name', newLoc.name);
        } else {
            url.searchParams.delete('location_id');
            url.searchParams.delete('location_name');
        }
        window.history.replaceState({}, '', url.toString());
    };

    const regionBadgeClass = company?.region ? (regionBadgeStyles[company.region] || 'bg-white/20 text-white border-white/30') : 'bg-white/20 text-white border-white/30';

    return (
        <AppLayout title={company?.name || companyCode}>
            <Head title={`${company?.name || companyCode} — Monitoring Operation`} />

            {/* Banner Header Korporat */}
            <div className="relative bg-gradient-to-r from-[#00332a] via-[#004D40] to-[#0d5238] rounded-2xl overflow-hidden mb-6 text-white shadow-sm border border-emerald-900/30">
                <SubtlePalmPattern />
                <div className="relative z-10 p-6 sm:p-7">
                    <Link
                        href="/perusahaan"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-100 hover:text-white bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-xl backdrop-blur-xs transition-colors mb-4 border border-white/15"
                    >
                        <ArrowLeft size={14} /> Kembali ke Galeri Perusahaan
                    </Link>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className="font-mono text-xs font-bold bg-white/15 text-white px-2.5 py-0.5 rounded-lg border border-white/20 backdrop-blur-xs">
                                    {companyCode}
                                </span>
                                {company?.initials && (
                                    <span className="font-mono text-xs font-extrabold bg-emerald-400/25 text-emerald-100 px-2.5 py-0.5 rounded-lg border border-emerald-400/35 backdrop-blur-xs" title={`Inisial: ${company.initials}`}>
                                        {company.initials}
                                    </span>
                                )}
                                {company?.region && (
                                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-lg border backdrop-blur-xs ${regionBadgeClass}`}>
                                        Region {company.region}
                                    </span>
                                )}
                                {company?.group && (
                                    <span className="text-xs font-medium text-emerald-100 bg-white/10 px-2.5 py-0.5 rounded-lg border border-white/10 backdrop-blur-xs">
                                        {company.group}
                                    </span>
                                )}
                                {(company?.facilities || profile?.facilities || []).map(f => (
                                    <span key={f} className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-white/20 text-white border border-white/25 backdrop-blur-xs">
                                        {f}
                                    </span>
                                ))}
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                                {company?.name || companyCode}
                            </h1>
                        </div>

                        {profile?.locations?.length > 0 && (
                            <div className="flex items-center gap-2 bg-white/10 border border-white/15 backdrop-blur-xs rounded-xl px-4 py-2 self-start sm:self-auto">
                                <MapPin size={16} className="text-emerald-300" />
                                <span className="text-xs font-semibold text-white">
                                    {profile.locations.length} Unit Operasional
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 4 Top Global KPI Cards (Secara Otomatis Terfilter Sesuai Unit yang Dipilih) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {loadingProfile ? (
                    [...Array(4)].map((_, i) => (
                        <div key={i} className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse" />
                    ))
                ) : (
                    <>
                        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-2xs flex items-center justify-between relative hover:z-40 focus-within:z-40">
                            <div>
                                <div className="flex items-center gap-1">
                                    <p className="text-xs text-gray-500 font-medium">Headcount</p>
                                    <InfoTooltip title="Total Headcount" text="Jumlah seluruh karyawan aktif yang terdaftar (terfilter sesuai unit yang aktif)." />
                                </div>
                                <p className="text-2xl font-black text-gray-900 mt-0.5 font-mono">
                                    {formatNumber(profile?.kpi?.hc || 0)}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                    {selectedLocation ? `Khusus unit ${selectedLocation.name}` : 'Total seluruh unit perusahaan'}
                                </p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
                                <Users size={18} />
                            </div>
                        </div>

                        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-2xs flex items-center justify-between relative hover:z-40 focus-within:z-40">
                            <div>
                                <div className="flex items-center gap-1">
                                    <p className="text-xs text-gray-500 font-medium">Rata-rata Umur</p>
                                    <InfoTooltip title="Rata-rata Umur" text="Rata-rata usia karyawan dihitung dari tanggal lahir." />
                                </div>
                                <p className="text-2xl font-black text-gray-900 mt-0.5 font-mono">
                                    {profile?.kpi?.avg_age || 0} <span className="text-xs font-normal text-gray-500 font-sans">th</span>
                                </p>
                                <p className="text-[10px] text-gray-400 mt-0.5">Seluruh jenjang</p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
                                <Clock size={18} />
                            </div>
                        </div>

                        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-2xs flex items-center justify-between relative hover:z-40 focus-within:z-40">
                            <div>
                                <div className="flex items-center gap-1">
                                    <p className="text-xs text-gray-500 font-medium">Rata-rata Masa Kerja</p>
                                    <InfoTooltip title="Rata-rata Masa Kerja" text="Rata-rata lama masa pengabdian (Length of Service) dihitung sejak tanggal bergabung (join date)." />
                                </div>
                                <p className="text-2xl font-black text-gray-900 mt-0.5 font-mono">
                                    {profile?.kpi?.avg_los || 0} <span className="text-xs font-normal text-gray-500 font-sans">th</span>
                                </p>
                                <p className="text-[10px] text-gray-400 mt-0.5">Loyalitas karyawan</p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700">
                                <Briefcase size={18} />
                            </div>
                        </div>

                        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-2xs flex items-center justify-between relative hover:z-40 focus-within:z-40">
                            <div>
                                <div className="flex items-center gap-1">
                                    <p className="text-xs text-gray-500 font-medium">Cakupan Pelatihan</p>
                                    <InfoTooltip title="Cakupan Pelatihan" text="Persentase staf yang telah mengikuti program pelatihan peningkatan kompetensi operasional." />
                                </div>
                                <p className="text-2xl font-black text-emerald-700 mt-0.5 font-mono">
                                    {profile?.training?.coverage_pct || 0}%
                                </p>
                                <p className="text-[10px] text-gray-400 mt-0.5 font-mono">
                                    {profile?.training?.trained_hc || 0} staf terlatih
                                </p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
                                <GraduationCap size={18} />
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Universal Operational Unit Selector Bar (Langsung Memfilter Seluruh Grafik & Data) */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-2xs mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                        <MapPin className="text-emerald-700 shrink-0" size={17} />
                        <span className="font-bold text-gray-900 text-sm">
                            Lokasi / Unit Operasional Perusahaan ({profile?.locations?.length || 0})
                        </span>
                        {selectedLocation ? (
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                                Aktif: {selectedLocation.name}
                            </span>
                        ) : (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                Seluruh Unit
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-gray-400">
                        Klik salah satu unit di bawah untuk memfilter seluruh grafik, KPI, dan daftar staf di unit tersebut:
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Button Semua Unit */}
                    <button
                        onClick={() => handleLocationToggle(null)}
                        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs transition-all font-semibold cursor-pointer border ${
                            !selectedLocation
                                ? 'bg-[#004D40] text-white border-[#004D40] shadow-sm ring-2 ring-emerald-500/20'
                                : 'bg-gray-50/80 text-gray-700 border-gray-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-900'
                        }`}
                    >
                        <Building2 size={13} className={!selectedLocation ? 'text-emerald-200' : 'text-emerald-700'} />
                        <span>Semua Unit</span>
                        <span className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-bold border ${
                            !selectedLocation 
                                ? 'bg-white/20 text-white border-white/20' 
                                : 'bg-white text-emerald-800 border-gray-200/60 shadow-2xs'
                        }`}>
                            {formatNumber(profile?.total_company_hc || profile?.kpi?.hc || 0)}
                        </span>
                    </button>

                    {/* Unit Buttons */}
                    {(profile?.locations || []).map(l => {
                        const isSelected = selectedLocation && String(selectedLocation.id) === String(l.id);
                        return (
                            <button
                                key={l.id}
                                onClick={() => handleLocationToggle(l)}
                                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs transition-all cursor-pointer border ${
                                    isSelected
                                        ? 'bg-[#004D40] text-white border-[#004D40] shadow-sm ring-2 ring-emerald-500/30 font-bold'
                                        : 'bg-gray-50/80 text-gray-700 border-gray-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-900 font-medium'
                                }`}
                                title={`Klik untuk memfilter seluruh analitik & grafik untuk unit ${l.name}`}
                            >
                                <MapPin size={13} className={isSelected ? 'text-emerald-300' : 'text-emerald-700'} />
                                <span>{l.name}</span>
                                <span className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-bold border ${
                                    isSelected
                                        ? 'bg-white/20 text-white border-white/20'
                                        : 'bg-white text-emerald-800 border-gray-200/60 shadow-2xs'
                                }`}>
                                    {formatNumber(l.count)}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Active Unit Indicator Banner (Jika Ada Filter Unit yang Aktif) */}
            {selectedLocation && (
                <div className="mb-6 p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
                    <div className="flex items-center gap-2.5 text-emerald-950">
                        <span className="p-1.5 rounded-lg bg-emerald-700 text-white shrink-0">
                            <MapPin size={15} />
                        </span>
                        <div>
                            <p className="font-bold text-emerald-950 text-sm">
                                Sedang Memfilter Data Unit: {selectedLocation.name}
                            </p>
                            <p className="text-emerald-800 text-[11px] mt-0.5">
                                Seluruh grafik (Demografi, Masa Kerja, Pelatihan SDM), KPI, dan daftar staf menampilkan data khusus untuk <strong className="font-mono font-bold">{profile?.kpi?.hc || 0}</strong> staf di unit ini.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                        {tab !== 'staf' && (
                            <button
                                onClick={() => handleTabChange('staf')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-semibold transition-colors cursor-pointer shadow-2xs"
                            >
                                <Users size={13} /> Buka Daftar Staf Unit ({profile?.kpi?.hc || 0})
                            </button>
                        )}
                        <button
                            onClick={() => handleLocationToggle(null)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#004D40] hover:bg-[#00382E] text-white font-semibold transition-colors cursor-pointer shadow-2xs"
                        >
                            <RotateCcw size={12} /> Tampilkan Seluruh Unit ({profile?.total_company_hc || 0})
                        </button>
                    </div>
                </div>
            )}

            {/* Segmented Cockpit Navigation Tabs (5 Dimensi Operasional) */}
            <div className="flex items-center overflow-x-auto p-1 bg-gray-100/90 rounded-2xl w-full sm:w-fit mb-6 border border-gray-200/50 scrollbar-none gap-1">
                <button
                    onClick={() => handleTabChange('overview')}
                    className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                        tab === 'overview'
                            ? 'bg-white text-[#004D40] shadow-2xs'
                            : 'text-gray-500 hover:text-gray-800'
                    }`}
                >
                    <Layers size={15} />
                    <span>Overview 360°</span>
                </button>

                <button
                    onClick={() => handleTabChange('demografi')}
                    className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                        tab === 'demografi'
                            ? 'bg-white text-[#004D40] shadow-2xs'
                            : 'text-gray-500 hover:text-gray-800'
                    }`}
                >
                    <Users size={15} />
                    <span>Demografi</span>
                </button>

                <button
                    onClick={() => handleTabChange('tenure')}
                    className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                        tab === 'tenure'
                            ? 'bg-white text-[#004D40] shadow-2xs'
                            : 'text-gray-500 hover:text-gray-800'
                    }`}
                >
                    <Briefcase size={15} />
                    <span>Masa Kerja</span>
                </button>

                <button
                    onClick={() => handleTabChange('pelatihan')}
                    className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                        tab === 'pelatihan'
                            ? 'bg-white text-[#004D40] shadow-2xs'
                            : 'text-gray-500 hover:text-gray-800'
                    }`}
                >
                    <GraduationCap size={15} />
                    <span>Pelatihan SDM</span>
                    {profile?.training?.coverage_pct > 0 && (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {profile.training.coverage_pct}%
                        </span>
                    )}
                </button>

                <button
                    onClick={() => handleTabChange('staf')}
                    className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                        tab === 'staf'
                            ? 'bg-white text-[#004D40] shadow-2xs'
                            : 'text-gray-500 hover:text-gray-800'
                    }`}
                >
                    <Search size={15} />
                    <span>Daftar Staf</span>
                    {profile?.kpi?.hc > 0 && (
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${tab === 'staf' ? 'bg-emerald-50 text-emerald-800' : 'bg-gray-200 text-gray-600'}`}>
                            {formatNumber(profile.kpi.hc)}
                        </span>
                    )}
                </button>
            </div>

            {/* Views Content */}
            {tab === 'overview' && (
                <OverviewTab
                    profile={profile}
                    onTabSwitch={handleTabChange}
                    onSelectStaff={(empId) => {
                        setSelectedEmpId(empId);
                        if (empId) setTab('staf');
                    }}
                    selectedLocation={selectedLocation}
                />
            )}

            {tab === 'demografi' && (
                <DemografiTab
                    profile={profile}
                    selectedLocation={selectedLocation}
                />
            )}

            {tab === 'tenure' && (
                <MasaKerjaTab
                    profile={profile}
                    selectedLocation={selectedLocation}
                />
            )}

            {tab === 'pelatihan' && (
                <PelatihanTab
                    profile={profile}
                    selectedLocation={selectedLocation}
                />
            )}

            {tab === 'staf' && (
                <StafTab
                    companyId={companyId}
                    selectedLocation={selectedLocation}
                    filterOptions={profile?.filter_options}
                    selectedEmpId={selectedEmpId}
                    onSelectStaff={setSelectedEmpId}
                    onLocationClear={() => handleLocationToggle(null)}
                />
            )}
        </AppLayout>
    );
}
