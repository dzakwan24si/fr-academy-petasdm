import { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';

let cachedOptions = null;
let fetchPromise = null;

function getParamArray(searchParams, key) {
    // 1. Bracket format: key[]
    const bracketVals = searchParams.getAll(`${key}[]`);
    if (bracketVals.length > 0) return bracketVals;

    // 2. Direct format: key
    const directVals = searchParams.getAll(key);
    if (directVals.length > 0) return directVals;

    // 3. Indexed or nested format: key[0], key[0][0], etc.
    const indexedVals = [];
    for (const [paramKey, paramVal] of searchParams.entries()) {
        if (paramKey.startsWith(`${key}[`)) {
            indexedVals.push(paramVal);
        }
    }
    return indexedVals;
}

function parseFiltersFromUrl(url) {
    const searchParams = new URLSearchParams(url?.split('?')[1] || '');
    return {
        region: getParamArray(searchParams, 'region'),
        group: getParamArray(searchParams, 'group'),
        company_id: getParamArray(searchParams, 'company_id'),
        location_id: getParamArray(searchParams, 'location_id'),
        organization_name: getParamArray(searchParams, 'organization_name'),
        job_level_code: getParamArray(searchParams, 'job_level_code'),
        employment_type: getParamArray(searchParams, 'employment_type'),
        generation: getParamArray(searchParams, 'generation'),
        gender: getParamArray(searchParams, 'gender'),
        marital_status: getParamArray(searchParams, 'marital_status'),
        year: searchParams.get('year') || '',
        month: searchParams.get('month') || '',
        nik_status: searchParams.get('nik_status') || '',
        job_category: getParamArray(searchParams, 'job_category'),
        is_regular: searchParams.get('is_regular') || '',
        is_internal: searchParams.get('is_internal') || '',
        level: getParamArray(searchParams, 'level'),
    };
}

export function useFilters(isTrainingPage = false) {
    const { url } = usePage();
    const [filters, setFilters] = useState(() => parseFiltersFromUrl(url));
    const [options, setOptions] = useState(cachedOptions || null);
    const [loading, setLoading] = useState(!cachedOptions);

    useEffect(() => {
        setFilters(parseFiltersFromUrl(url));
    }, [url]);

    useEffect(() => {
        if (cachedOptions) return;

        if (!fetchPromise) {
            fetchPromise = axios.get('/data/filter-options').then(res => res.data);
        }

        fetchPromise.then(data => {
            cachedOptions = data;
            setOptions(data);
            setLoading(false);
        });
    }, []);

    const updateFilter = (key, value) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        applyFilters(newFilters);
    };

    const applyFilters = (currentFilters) => {
        const query = {};
        for (const key in currentFilters) {
            const val = currentFilters[key];
            if (Array.isArray(val) && val.length > 0) {
                query[key] = val;
            } else if (!Array.isArray(val) && val !== '' && val !== null && val !== undefined) {
                query[key] = val;
            }
        }
        
        router.get(window.location.pathname, query, { preserveState: true, preserveScroll: true, replace: true });
    };

    const resetFilters = () => {
        const emptyFilters = {
            region: [], group: [], company_id: [], location_id: [],
            organization_name: [], job_level_code: [], employment_type: [],
            generation: [], gender: [], marital_status: [], year: '', month: '',
            nik_status: '', job_category: [], is_regular: '', is_internal: '', level: []
        };
        setFilters(emptyFilters);
        applyFilters(emptyFilters);
    };

    const getActiveCount = () => {
        let count = 0;
        for (const key in filters) {
            if (Array.isArray(filters[key])) {
                count += filters[key].length;
            } else if (filters[key]) {
                count += 1;
            }
        }
        return count;
    };

    return { filters, options, loading, updateFilter, applyFilters, resetFilters, getActiveCount, isTrainingPage };
}
