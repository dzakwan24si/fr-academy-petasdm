import { Skeleton } from './Skeleton';
import { EmptyState } from './EmptyState';

export function ChartCard({ title, loading, isEmpty, children, className = '', height = "h-72" }) {
    return (
        <div className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col ${className}`}>
            <h3 className="font-bold text-gray-800 mb-4">{title}</h3>
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
