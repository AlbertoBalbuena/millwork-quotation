import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export interface SearchResult {
  id: string;
  type: 'project' | 'quotation' | 'cabinet' | 'price_item';
  title: string;
  subtitle: string;
  url: string;
  badge?: string;
}

export interface SearchResults {
  projects: SearchResult[];
  quotations: SearchResult[];
  cabinets: SearchResult[];
  priceItems: SearchResult[];
}

const EMPTY_RESULTS: SearchResults = {
  projects: [],
  quotations: [],
  cabinets: [],
  priceItems: [],
};

export function useGlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<boolean>(false);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults(EMPTY_RESULTS);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    abortRef.current = false;

    debounceRef.current = setTimeout(async () => {
      const q = query.trim();
      const cancelled = () => abortRef.current;

      try {
        const [projectsRes, quotationsRes, cabinetsRes, priceItemsRes] = await Promise.all([
          supabase
            .from('projects')
            .select('id, name, customer, address, project_type, status')
            .or(`name.ilike.%${q}%,customer.ilike.%${q}%,address.ilike.%${q}%`)
            .limit(5),
          supabase
            .from('quotations')
            .select('id, name, status, project_id')
            .ilike('name', `%${q}%`)
            .limit(5),
          supabase
            .from('products_catalog')
            .select('id, sku, description, collection')
            .or(`sku.ilike.%${q}%,description.ilike.%${q}%`)
            .limit(5),
          supabase
            .from('price_list')
            .select('id, concept_description, type, sku, unit')
            .or(`concept_description.ilike.%${q}%,sku.ilike.%${q}%`)
            .limit(5),
        ]);

        if (cancelled()) return;

        const projects: SearchResult[] = (projectsRes.data ?? []).map((p) => ({
          id: p.id,
          type: 'project',
          title: p.name,
          subtitle: [p.customer, p.address].filter(Boolean).join(' · '),
          url: `/projects/${p.id}`,
          badge: p.project_type ?? undefined,
        }));

        const quotations: SearchResult[] = (quotationsRes.data ?? []).map((q) => ({
          id: q.id,
          type: 'quotation',
          title: q.name,
          subtitle: q.status ?? '',
          url: `/projects/${q.project_id}/quotations/${q.id}`,
          badge: q.status ?? undefined,
        }));

        const cabinets: SearchResult[] = (cabinetsRes.data ?? []).map((c) => ({
          id: c.id,
          type: 'cabinet',
          title: c.description ?? c.sku,
          subtitle: c.sku,
          url: `/products/${c.id}`,
          badge: c.collection ?? undefined,
        }));

        const priceItems: SearchResult[] = (priceItemsRes.data ?? []).map((pi) => ({
          id: pi.id,
          type: 'price_item',
          title: pi.concept_description,
          subtitle: [pi.type, pi.sku, pi.unit].filter(Boolean).join(' · '),
          url: `/prices/${pi.id}`,
          badge: pi.type ?? undefined,
        }));

        setResults({ projects, quotations, cabinets, priceItems });
      } catch {
        if (!cancelled()) setResults(EMPTY_RESULTS);
      } finally {
        if (!cancelled()) setIsLoading(false);
      }
    }, 300);

    return () => {
      abortRef.current = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function reset() {
    abortRef.current = true;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setQuery('');
    setResults(EMPTY_RESULTS);
    setIsLoading(false);
  }

  const allResults: SearchResult[] = [
    ...results.projects,
    ...results.quotations,
    ...results.cabinets,
    ...results.priceItems,
  ];

  const hasResults = allResults.length > 0;

  return { query, setQuery, results, allResults, isLoading, hasResults, reset };
}
