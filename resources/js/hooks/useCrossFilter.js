import { useFilters } from './useFilters';

export function useCrossFilter(isTrainingPage = false) {
    const { filters, updateFilter } = useFilters(isTrainingPage);

    // Adds a value to an array filter if it doesn't exist, removes if it does
    const toggleFilter = (key, value) => {
        const currentVals = filters[key] || [];
        if (Array.isArray(currentVals)) {
            if (currentVals.includes(String(value)) || currentVals.includes(value)) {
                // Remove
                updateFilter(key, currentVals.filter(v => String(v) !== String(value)));
            } else {
                // Add
                updateFilter(key, [...currentVals, String(value)]);
            }
        }
    };

    const hasFilter = (key, value) => {
        const currentVals = filters[key] || [];
        return Array.isArray(currentVals) && (currentVals.includes(String(value)) || currentVals.includes(value));
    };

    return { toggleFilter, hasFilter };
}
