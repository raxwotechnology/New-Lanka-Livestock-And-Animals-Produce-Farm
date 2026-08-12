import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, onPageChange, total }) {
    if (totalPages <= 1) return null;

    const canPrev = page > 1;
    const canNext = page < totalPages;

    return (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
                Page <span className="font-medium text-gray-900 dark:text-gray-100">{page}</span> of{' '}
                <span className="font-medium text-gray-900 dark:text-gray-100">{totalPages}</span>
                {total !== undefined && <span className="text-gray-400 dark:text-gray-500 ml-2">({total} total)</span>}
            </p>
            <div className="flex gap-2">
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={!canPrev}
                    className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                >
                    <ChevronLeft size={16} />
                    Previous
                </button>
                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={!canNext}
                    className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                >
                    Next
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}