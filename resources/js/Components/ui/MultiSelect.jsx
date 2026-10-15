import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, X, Search } from 'lucide-react';

export function MultiSelect({ options = [], value = [], onChange, placeholder, disabled = false, labelKey = 'name', valueKey = 'id' }) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef(null);
    const searchInputRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!isOpen) {
            setSearch('');
        } else if (options.length > 7 && searchInputRef.current) {
            setTimeout(() => searchInputRef.current?.focus(), 50);
        }
    }, [isOpen, options.length]);

    const toggleOption = (optValue) => {
        if (value.includes(optValue)) {
            onChange(value.filter(v => v !== optValue));
        } else {
            onChange([...value, optValue]);
        }
    };

    const clearAll = (e) => {
        e.stopPropagation();
        onChange([]);
    };

    const selectedCount = value.length;

    const filteredOptions = useMemo(() => {
        if (!search.trim()) return options;
        const q = search.toLowerCase();
        return options.filter(opt => {
            const optLabel = typeof opt === 'object' ? opt[labelKey] : opt;
            return String(optLabel || '').toLowerCase().includes(q);
        });
    }, [options, search, labelKey]);

    return (
        <div className={`relative ${isOpen ? 'z-50' : 'z-10'} ${disabled ? 'opacity-50 pointer-events-none' : ''}`} ref={containerRef}>
            <div 
                className={`flex items-center justify-between min-h-[38px] px-3 py-1.5 bg-white border rounded-lg cursor-pointer transition-colors ${
                    isOpen 
                        ? 'border-[#004D40] ring-2 ring-[#004D40]/15' 
                        : 'border-gray-300 hover:border-corporate-light'
                }`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex-1 truncate text-sm">
                    {selectedCount > 0 ? (
                        <span className="font-semibold text-corporate-dark">{selectedCount} terpilih</span>
                    ) : (
                        <span className="text-gray-400">{placeholder}</span>
                    )}
                </div>
                <div className="flex items-center gap-1 text-gray-400">
                    {selectedCount > 0 && (
                        <button onClick={clearAll} className="p-0.5 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors" title="Hapus pilihan">
                            <X size={14} />
                        </button>
                    )}
                    <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#004D40]' : ''}`} />
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-[100] left-0 w-full min-w-[200px] mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                    {options.length > 7 && (
                        <div className="p-2 border-b border-gray-100 sticky top-0 bg-white z-10">
                            <div className="relative">
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari pilihan..."
                                    className="w-full pl-7 pr-6 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#004D40] focus:border-[#004D40]"
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <Search size={12} className="absolute left-2 top-2 text-gray-400" />
                                {search && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setSearch(''); }}
                                        className="absolute right-2 top-1.5 text-gray-400 hover:text-gray-600 p-0.5"
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {filteredOptions.length === 0 ? (
                        <div className="p-3 text-xs text-gray-500 text-center">
                            {options.length === 0 ? 'Tidak ada opsi' : 'Tidak ada hasil'}
                        </div>
                    ) : (
                        <div className="p-1">
                            {filteredOptions.map((opt) => {
                                const optVal = typeof opt === 'object' ? opt[valueKey] : opt;
                                const optLabel = typeof opt === 'object' ? opt[labelKey] : opt;
                                const isSelected = value.includes(String(optVal));
                                return (
                                    <div 
                                        key={optVal} 
                                        className="flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-gray-50 cursor-pointer"
                                        onClick={() => toggleOption(String(optVal))}
                                    >
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'bg-corporate-light border-corporate-light text-white' : 'border-gray-300'}`}>
                                            {isSelected && <Check size={12} strokeWidth={3} />}
                                        </div>
                                        <span className="truncate">{optLabel}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
