import { Check, Image as ImageIcon } from 'lucide-react';

export function CopyButton({ handleCopy, status, isCopying, loading }) {
    return (
        <div className="hide-from-export absolute top-4 right-4 z-10 flex items-center gap-2">
            {status === 'copied' && <span className="text-xs font-medium text-green-700 bg-green-50 border border-green-100 px-2.5 py-1 rounded shadow-sm">Disalin ke clipboard!</span>}
            {status === 'downloaded' && <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded shadow-sm max-w-48 text-right leading-tight">Browser tidak mendukung salin gambar, file diunduh sebagai gantinya.</span>}
            
            <button
                onClick={handleCopy}
                disabled={loading || isCopying}
                title={loading ? 'Memuat...' : 'Salin sebagai Gambar'}
                className={`p-1.5 rounded-md transition-colors ${loading ? 'opacity-30 cursor-not-allowed text-gray-300' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
            >
                {status === 'copied' ? <Check className="w-4 h-4 text-green-600" /> : <ImageIcon className="w-4 h-4" />}
            </button>
        </div>
    );
}
