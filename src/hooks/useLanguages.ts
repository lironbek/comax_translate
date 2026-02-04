import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Language {
  code: string;
  name: string;
  native_name?: string;
  direction?: 'ltr' | 'rtl';
  is_active?: boolean;
}

interface UseLanguagesResult {
  languages: Language[];
  isLoading: boolean;
  error: string | null;
}

// Default languages as fallback
const DEFAULT_LANGUAGES: Language[] = [
  { code: 'he-IL', name: 'עברית (he-IL)', native_name: 'עברית', direction: 'rtl' },
  { code: 'en-US', name: 'English (en-US)', native_name: 'English', direction: 'ltr' },
  { code: 'ro-RO', name: 'Română (ro-RO)', native_name: 'Română', direction: 'ltr' },
  { code: 'th-TH', name: 'ไทย (th-TH)', native_name: 'ไทย', direction: 'ltr' },
  { code: 'ar-SA', name: 'العربية (ar-SA)', native_name: 'العربية', direction: 'rtl' },
];

// Cache for languages
let cachedLanguages: Language[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60000; // 1 minute

export function useLanguages(): UseLanguagesResult {
  const [languages, setLanguages] = useState<Language[]>(cachedLanguages || []);
  const [isLoading, setIsLoading] = useState(!cachedLanguages);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLanguages = async () => {
      // Check cache
      if (cachedLanguages && Date.now() - cacheTimestamp < CACHE_DURATION) {
        setLanguages(cachedLanguages);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('languages')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (fetchError) {
          throw fetchError;
        }

        if (data && data.length > 0) {
          // Transform to the expected format with name including code
          const transformedLanguages: Language[] = data.map(lang => ({
            code: lang.code,
            name: `${lang.native_name} (${lang.code})`,
            native_name: lang.native_name,
            direction: lang.direction,
            is_active: lang.is_active,
          }));

          cachedLanguages = transformedLanguages;
          cacheTimestamp = Date.now();
          setLanguages(transformedLanguages);
        } else {
          // Fallback to default languages
          setLanguages(DEFAULT_LANGUAGES);
        }
      } catch (err) {
        console.error('Error fetching languages:', err);
        setError('Failed to load languages');
        // Use default languages on error
        setLanguages(DEFAULT_LANGUAGES);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLanguages();
  }, []);

  return { languages, isLoading, error };
}

// Helper function to get languages with "All Languages" option
export function useLanguagesWithAll(): UseLanguagesResult {
  const { languages, isLoading, error } = useLanguages();

  const languagesWithAll: Language[] = [
    { code: 'ALL', name: 'All Languages' },
    ...languages,
  ];

  return { languages: languagesWithAll, isLoading, error };
}

// Invalidate cache when languages are updated
export function invalidateLanguagesCache() {
  cachedLanguages = null;
  cacheTimestamp = 0;
}
