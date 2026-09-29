import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

export function MultiSelect({ options = [], value = [], onChange, placeholder, disabled = false, labelKey = 'name', valueKey = 'id' }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

    return (
        <div className={`relative ${disabled ? 'opacity-50 pointer-events-none' : ''}`} ref={containerRef}>
            <div 
                className="flex items-center justify-between min-h-[38px] px-3 py-1.5 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-corporate-light transition-colors"
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
                        <button onClick={clearAll} className="p-0.5 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors">
                            <X size={14} />
                        </button>
                    )}
                    <ChevronDown size={16} />
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-[100] w-full min-w-[200px] mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {options.length === 0 ? (
                        <div className="p-3 text-sm text-gray-500 text-center">Tidak ada opsi</div>
                    ) : (
                        <div className="p-1">
                            {options.map((opt) => {
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
