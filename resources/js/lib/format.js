export function formatNumber(num) {
    if (num === null || num === undefined || num === '') return '-';
    if (typeof num === 'string') {
        const clean = num.replace('%', '').trim();
        const parsed = Number(clean);
        if (!isNaN(parsed) && clean !== '') {
            return new Intl.NumberFormat('id-ID').format(parsed) + (num.includes('%') ? '%' : '');
        }
        return num;
    }
    if (typeof num === 'number' && isNaN(num)) return '-';
    return new Intl.NumberFormat('id-ID').format(num);
}

export function formatDecimal(num) {
    if (num === null || num === undefined || num === '') return '-';
    if (typeof num === 'string') {
        const clean = num.replace('%', '').trim();
        const parsed = Number(clean);
        if (!isNaN(parsed) && clean !== '') {
            return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(parsed) + (num.includes('%') ? '%' : '');
        }
        return num;
    }
    if (typeof num === 'number' && isNaN(num)) return '-';
    return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(num);
}

export function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
}
