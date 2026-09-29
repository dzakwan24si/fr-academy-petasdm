import { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';

let cachedOptions = null;
let fetchPromise = null;

export function useFilters(isTrainingPage = false) {
    const { url } = usePage();
    const searchParams = new URLSearchParams(url.split('?')[1] || '');
    
    // Parse query params into object
    const [filters, setFilters] = useState({
        region: searchParams.getAll('region[]'),
        group: searchParams.getAll('group[]'),
        company_id: searchParams.getAll('company_id[]'),
        location_id: searchParams.getAll('location_id[]'),
        organization_name: searchParams.getAll('organization_name[]'),
        job_level_code: searchParams.getAll('job_level_code[]'),
        employment_type: searchParams.getAll('employment_type[]'),
        generation: searchParams.getAll('generation[]'),
        gender: searchParams.getAll('gender[]'),
        year: searchParams.get('year') || '',
        month: searchParams.get('month') || '',
    });

    const [options, setOptions] = useState(cachedOptions || null);
    const [loading, setLoading] = useState(!cachedOptions);

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
            if (Array.isArray(currentFilters[key]) && currentFilters[key].length > 0) {
                query[`${key}[]`] = currentFilters[key];
            } else if (!Array.isArray(currentFilters[key]) && currentFilters[key]) {
                query[key] = currentFilters[key];
            }
        }
        
        router.get(window.location.pathname, query, { preserveState: true, preserveScroll: true, replace: true });
    };

    const resetFilters = () => {
        const emptyFilters = {
            region: [], group: [], company_id: [], location_id: [],
            organization_name: [], job_level_code: [], employment_type: [],
            generation: [], gender: [], year: '', month: ''
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
