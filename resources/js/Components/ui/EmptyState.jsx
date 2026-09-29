export function EmptyState({ message = "Tidak ada data untuk filter ini", className = '' }) {
    return (
        <div className={`flex items-center justify-center h-full text-sm text-gray-400 italic ${className}`}>
            {message}
        </div>
    );
}
