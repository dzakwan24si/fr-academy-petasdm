import React, { useState } from 'react';

const SIZE_CLASSES = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base font-semibold',
    xl: 'w-20 h-20 text-2xl font-bold',
};

const COLOR_PALETTES = [
    'bg-amber-600 text-white',
    'bg-emerald-700 text-white',
    'bg-blue-700 text-white',
    'bg-indigo-700 text-white',
    'bg-teal-700 text-white',
    'bg-purple-700 text-white',
    'bg-rose-700 text-white',
    'bg-slate-700 text-white',
];

export function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
        return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[1][0]).toUpperCase();
}

function getColorForName(name) {
    if (!name) return COLOR_PALETTES[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % COLOR_PALETTES.length;
    return COLOR_PALETTES[index];
}

export default function EmployeeAvatar({
    name = '',
    photoUrl = null,
    size = 'md',
    className = '',
    alt = '',
}) {
    const [imgError, setImgError] = useState(false);

    const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
    const colorClass = getColorForName(name);
    const initials = getInitials(name);

    const hasPhoto = Boolean(photoUrl) && !imgError;

    return (
        <div
            className={`relative shrink-0 rounded-full overflow-hidden flex items-center justify-center font-sans tracking-wide ring-2 ring-white/80 shadow-sm transition-transform ${sizeClass} ${
                hasPhoto ? 'bg-gray-100' : colorClass
            } ${className}`}
        >
            {hasPhoto ? (
                <img
                    src={photoUrl}
                    alt={alt || name}
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover rounded-full"
                />
            ) : (
                <span className="select-none leading-none">{initials}</span>
            )}
        </div>
    );
}
