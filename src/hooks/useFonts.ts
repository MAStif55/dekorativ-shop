import { useState, useEffect } from 'react';
import { FontRepository } from '@/lib/data';
import { FontModel } from '@/types/font';

export interface FontData {
    id: string;
    name: string;
    category: string;
    file: string;
    url: string;     // Firebase Storage URL
    tags?: string[];
}

interface UseFontsResult {
    fonts: FontData[];
    categories: string[];
    allTags: string[];
    loading: boolean;
    error: string | null;
}

export function useFonts(): UseFontsResult {
    const [fonts, setFonts] = useState<FontData[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [allTags, setAllTags] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchFonts() {
            try {
                setLoading(true);
                const fetchedFonts = await FontRepository.getAll();

                const formattedFonts: FontData[] = fetchedFonts.map((f: FontModel) => ({
                    id: f.id as string,
                    name: f.name,
                    category: f.category,
                    file: f.file,
                    url: f.url,
                    tags: f.tags || []
                }));

                setFonts(formattedFonts);

                // Extract unique categories (exclude 'all' as it is hardcoded in UI)
                const uniqueCategories = new Set<string>();
                formattedFonts.forEach(f => {
                    if (f.category && f.category !== 'all') uniqueCategories.add(f.category);
                });
                setCategories(Array.from(uniqueCategories));

                // Extract unique tags
                const uniqueTags = new Set<string>();
                formattedFonts.forEach(f => {
                    if (f.tags) {
                        f.tags.forEach(t => uniqueTags.add(t));
                    }
                });
                setAllTags(Array.from(uniqueTags).sort());

            } catch (err: any) {
                console.error('Failed to fetch fonts:', err);
                setError(err.message || 'Failed to fetch fonts');
            } finally {
                setLoading(false);
            }
        }

        fetchFonts();
    }, []);

    return { fonts, categories, allTags, loading, error };
}
