import { Skeleton } from './Skeleton';
import { EmptyState } from './EmptyState';
import { useCopyAsImage } from '@/hooks/useCopyAsImage';
import { CopyButton } from './CopyButton';

export function ChartCard({ title, loading, isEmpty, children, className = '', height = "h-72" }) {
    const { ref: cardRef, isCopying, status, handleCopy } = useCopyAsImage({ title });

    return (
        <div ref={cardRef} className={`bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(6,78,59,0.08)] border-0 transition-all duration-300 [@media(hover:hover)]:hover:shadow-[0_8px_30px_rgba(6,78,59,0.12)] [@media(hover:hover)]:hover:-translate-y-1 flex flex-col relative ${className}`}>
            <CopyButton handleCopy={handleCopy} status={status} isCopying={isCopying} loading={loading} />

            <h3 className="font-bold text-gray-800 pb-3 mb-4 pr-12 border-b border-gray-100/60">{title}</h3>
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
