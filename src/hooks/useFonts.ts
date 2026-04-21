import { useState, useEffect } from 'react';
import { getAllFonts } from '@/actions/catalog-actions';
import { FontModel } from '@/types/font';

export interface FontData {
    id: string;
    name: string;
    category: string;
    file: string;
    url: string;
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
                const fetchedFonts = await getAllFonts();

                const formattedFonts: FontData[] = fetchedFonts.map((f: FontModel) => {
                    let finalUrl = f.url;

                    // Automatically migrate legacy Firebase URLs to the new Yandex Cloud bucket format
                    // Without requiring a full database migration of existing records.
                    if (finalUrl && finalUrl.includes('firebasestorage.googleapis.com')) {
                        const safeFileName = f.file.replace(/\s+/g, '_');
                        finalUrl = `https://storage.yandexcloud.net/dekorativ-media/fonts/${f.category}/${encodeURI(safeFileName)}`;
                    }

                    return {
                        id: f.id as string,
                        name: f.name,
                        category: f.category,
                        file: f.file,
                        url: finalUrl,
                        tags: f.tags || []
                    };
                });

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
