import { useRef, useState } from 'react';
import { Skeleton } from './Skeleton';
import { EmptyState } from './EmptyState';
import { Check, Image as ImageIcon } from 'lucide-react';
import { toBlob, toPng } from 'html-to-image';

export function ChartCard({ title, loading, isEmpty, children, className = '', height = "h-72" }) {
    const cardRef = useRef(null);
    const [isCopying, setIsCopying] = useState(false);
    const [status, setStatus] = useState(''); // 'copied', 'downloaded', ''

    const handleCopy = async () => {
        if (!cardRef.current || loading || isEmpty) return;
        
        setIsCopying(true);
        setStatus('');
        
        // Filter out the button container
        const filter = (node) => {
            return !(node.classList && node.classList.contains('hide-from-export'));
        };
        
        try {
            const blob = await toBlob(cardRef.current, { backgroundColor: '#ffffff', filter });
            
            if (navigator.clipboard && window.ClipboardItem) {
                try {
                    await navigator.clipboard.write([
                        new window.ClipboardItem({ 'image/png': blob })
                    ]);
                    setStatus('copied');
                } catch (err) {
                    throw err; // Fallback to download
                }
            } else {
                throw new Error('Clipboard API not supported'); // Fallback to download
            }
        } catch (error) {
            console.warn('Failed to copy to clipboard, falling back to download', error);
            try {
                const dataUrl = await toPng(cardRef.current, { backgroundColor: '#ffffff', filter });
                const link = document.createElement('a');
                link.download = `${title ? title.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'chart'}.png`;
                link.href = dataUrl;
                link.click();
                setStatus('downloaded');
            } catch (dlError) {
                console.error('Failed to download image', dlError);
            }
        } finally {
            setIsCopying(false);
            setTimeout(() => setStatus(''), 2500);
        }
    };

    return (
        <div ref={cardRef} className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col relative ${className}`}>
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

            <h3 className="font-bold text-gray-800 mb-4 pr-12">{title}</h3>
            <div className={`relative w-full min-h-[18rem] ${height}`}>
                {loading ? (
                    <div className="absolute inset-0 flex items-end justify-between gap-2 p-4">
                        <Skeleton className="w-1/6 h-1/3" />
                        <Skeleton className="w-1/6 h-2/3" />
                        <Skeleton className="w-1/6 h-1/2" />
                        <Skeleton className="w-1/6 h-full" />
                        <Skeleton className="w-1/6 h-3/4" />
                    </div>
                ) : isEmpty ? (
                    <EmptyState />
                ) : (
                    children
                )}
            </div>
        </div>
    );
}
