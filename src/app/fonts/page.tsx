'use client';

import { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Type, LayoutTemplate, Minus, Plus, Search, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useFonts, FontData } from '@/hooks/useFonts';
import FontPreviewCard from '@/components/fonts/FontPreviewCard';

const CATEGORY_TRANSLATIONS: Record<string, string> = {
    'all': 'Все',
    'bold_and_striking': 'Акцентные',
    'decorative_and_unusual': 'Декоративные',
    'handwritten_and_calligraphic': 'Рукописные',
    'simple_and_clear': 'Строгие',
    'thematic': 'Тематические'
};

const getTranslatedCategory = (cat: string, locale: string) => {
    if (locale !== 'ru') return cat.replace(/_/g, ' ');
    return CATEGORY_TRANSLATIONS[cat] || cat.replace(/_/g, ' ');
};

const ITEMS_PER_PAGE = 12;

interface ComparedFontData extends FontData {
    snapshotText: string;
}

export default function FontsPage() {
    const { locale } = useLanguage();

    const defaultText = locale === 'ru' ? 'С любовью, Dekorativ' : 'With love, Dekorativ';

    const [previewText, setPreviewText] = useState(defaultText);
    const [fontSize, setFontSize] = useState(48);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    // Comparison State
    const [comparedFonts, setComparedFonts] = useState<ComparedFontData[]>([]);

    const { fonts, categories, allTags, loading, error } = useFonts();

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCategory, searchQuery, selectedTags]);

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        const listTop = document.getElementById('font-list-top');
        if (listTop) {
            const y = listTop.getBoundingClientRect().top + window.scrollY - 100;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    const filteredFonts = useMemo(() => {
        return fonts.filter(font => {
            const translatedFontCategory = getTranslatedCategory(font.category || '', locale);
            const matchesCategory = selectedCategory === 'all' || translatedFontCategory === selectedCategory;
            const matchesSearch = font.name.toLowerCase().includes(searchQuery.toLowerCase());

            // If user selected tags, the font must have ALL selected tags
            const matchesTags = selectedTags.length === 0 ||
                selectedTags.every(t => font.tags?.includes(t));

            return matchesCategory && matchesSearch && matchesTags;
        });
    }, [fonts, selectedCategory, searchQuery, selectedTags, locale]);

    const totalPages = Math.ceil(filteredFonts.length / ITEMS_PER_PAGE);

    const paginatedFonts = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredFonts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredFonts, currentPage]);

    const handleToggleCompare = (font: FontData | ComparedFontData, customText?: string) => {
        setComparedFonts(prev => {
            const exists = prev.some(f => f.id === font.id);
            if (exists) {
                return prev.filter(f => f.id !== font.id);
            } else {
                return [...prev, { ...font, snapshotText: customText || previewText }];
            }
        });
    };

    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    return (
        <main className="min-h-screen flex flex-col bg-[#FAFAFA]">
            <Header />

            <section className="pt-8 pb-16 px-4 sm:px-6 relative flex-grow">
                {/* Decorative blob */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-turquoise-light/20 rounded-full blur-[80px] pointer-events-none"></div>

                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-6">

                        <h1 className="text-4xl sm:text-5xl font-ornamental text-slate-dark mb-3">
                            {locale === 'ru' ? 'Примерка Шрифтов' : 'Font Preview Tool'}
                        </h1>
                        <p className="text-base text-slate max-w-2xl mx-auto">
                            {locale === 'ru'
                                ? 'Впишите свой текст, настройте эффекты и сохраняйте понравившиеся шрифты для сравнения.'
                                : 'Enter your text, adjust effects, and save your favorite fonts for comparison.'}
                        </p>
                    </div>

                    <div className="flex flex-col gap-5 items-start relative">

                        {/* CONTROLS (Top Horizontal Toolbar) */}
                        <div className="w-full bg-white p-3 sm:p-4 rounded-3xl border border-slate-100 shadow-sm relative z-20 flex flex-wrap gap-4 items-end">
                            {/* Search */}
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-sm font-semibold text-slate-dark mb-2">
                                    {locale === 'ru' ? 'Поиск шрифта' : 'Search font'}
                                </label>
                                <div className="relative w-full">
                                    <input
                                        type="text"
                                        placeholder={locale === 'ru' ? 'Название...' : 'Name...'}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-turquoise focus:bg-white transition-all"
                                    />
                                    <Search className="w-4 h-4 text-slate absolute left-3.5 top-1/2 -translate-y-1/2" />
                                </div>
                            </div>

                            {/* Text Input */}
                            <div className="flex-[2] min-w-[300px]">
                                <label className="block text-sm font-semibold text-slate-dark mb-2">
                                    {locale === 'ru' ? 'Ваша надпись' : 'Your text'}
                                </label>
                                <input
                                    type="text"
                                    value={previewText}
                                    onChange={(e) => setPreviewText(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate focus:outline-none focus:ring-2 focus:ring-turquoise focus:bg-white transition-all"
                                    placeholder={locale === 'ru' ? 'Введите текст...' : 'Enter text...'}
                                />
                            </div>

                            {/* Size Slider */}
                            <div className="flex-1 min-w-[200px]">
                                <div className="flex justify-between text-sm font-semibold text-slate-dark mb-2">
                                    <span>{locale === 'ru' ? 'Размер' : 'Size'}</span>
                                    <span className="text-turquoise-dark">{fontSize}px</span>
                                </div>
                                <div className="flex items-center gap-3 h-[42px]">
                                    <button onClick={() => setFontSize(Math.max(16, fontSize - 4))} className="p-1.5 text-slate hover:bg-slate-100 rounded-lg transition-colors">
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <input
                                        type="range"
                                        min="16" max="120"
                                        value={fontSize}
                                        onChange={(e) => setFontSize(Number(e.target.value))}
                                        className="flex-1 accent-turquoise h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <button onClick={() => setFontSize(Math.min(120, fontSize + 4))} className="p-1.5 text-slate hover:bg-slate-100 rounded-lg transition-colors">
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* MAIN CONTENT AREA */}
                        <div className="w-full min-w-0" id="font-list-top">
                            {/* Filtering */}
                            <div className="mb-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm relative z-10 flex gap-2 overflow-x-auto scrollbar-hide">
                                <button
                                    onClick={() => setSelectedCategory('all')}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${selectedCategory === 'all'
                                        ? 'bg-[rgba(144,238,144,0.2)] border border-[#90EE90] text-green-800 shadow-sm'
                                        : 'bg-transparent text-slate-600 hover:bg-slate-50 border border-transparent'
                                        }`}
                                >
                                    {getTranslatedCategory('all', locale)}
                                </button>
                                {Array.from(new Set(categories.map(cat => getTranslatedCategory(cat, locale)))).map((translatedCat) => (
                                    <button
                                        key={translatedCat}
                                        onClick={() => setSelectedCategory(translatedCat)}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap capitalize ${selectedCategory === translatedCat
                                            ? 'bg-[rgba(144,238,144,0.2)] border border-[#90EE90] text-green-800 shadow-sm'
                                            : 'bg-transparent text-slate-600 hover:bg-slate-50 border border-transparent'
                                            }`}
                                    >
                                        {translatedCat}
                                    </button>
                                ))}
                            </div>

                            {/* Tag Filtering UI */}
                            {allTags && allTags.length > 0 && (
                                <div className="mb-4 bg-white p-3 sm:p-4 rounded-2xl border border-slate-100 shadow-sm relative z-10 flex flex-wrap gap-2 sm:gap-3 items-center">
                                    <span className="text-sm font-semibold text-slate-500 mr-1 flex items-center gap-1.5">
                                        <LayoutTemplate className="w-4 h-4" />
                                        {locale === 'ru' ? 'Теги:' : 'Tags:'}
                                    </span>
                                    {allTags.map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => toggleTag(tag)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${selectedTags.includes(tag)
                                                ? 'bg-[rgba(144,238,144,0.2)] border-[#90EE90] text-green-800'
                                                : 'bg-white border-slate-200 text-slate-600 hover:border-turquoise hover:text-turquoise-dark'
                                                }`}
                                        >
                                            #{tag}
                                        </button>
                                    ))}
                                    {selectedTags.length > 0 && (
                                        <button
                                            onClick={() => setSelectedTags([])}
                                            className="ml-auto text-xs font-medium text-red-500 hover:text-red-600 px-2 py-1"
                                        >
                                            {locale === 'ru' ? 'Очистить теги' : 'Clear tags'}
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Top Pagination Controls */}
                            {!loading && !error && totalPages > 1 && (
                                <div className="mb-6 flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}
                                        className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>

                                    <div className="flex items-center gap-1.5 px-4 h-10 rounded-xl bg-white border border-slate-200 text-sm font-medium">
                                        <span className="text-slate-900">{currentPage}</span>
                                        <span className="text-slate-400">/</span>
                                        <span className="text-slate-600">{totalPages}</span>
                                    </div>

                                    <button
                                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            )}

                            {/* Loading & Error States */}
                            {error && (
                                <div className="p-6 bg-red-50 text-red-600 rounded-2xl border border-red-100 text-center">
                                    <p>{locale === 'ru' ? 'Ошибка загрузки шрифтов:' : 'Error loading fonts:'} {error}</p>
                                </div>
                            )}

                            {loading && !error && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                                        <div key={n} className="bg-white rounded-2xl p-6 border border-slate-100 h-48 animate-pulse flex flex-col justify-between">
                                            <div className="flex justify-between items-center">
                                                <div className="h-5 bg-slate-200 rounded w-1/3"></div>
                                                <div className="h-6 bg-slate-200 rounded-full w-24"></div>
                                            </div>
                                            <div className="h-24 bg-slate-100 rounded-xl w-full mt-4"></div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Font Grid */}
                            {!loading && !error && (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {paginatedFonts.map((font) => (
                                            <FontPreviewCard
                                                key={font.id}
                                                font={font}
                                                previewText={previewText}
                                                fontSize={fontSize}
                                                textAlign="center"
                                                isEngraved={true}
                                                isCompared={comparedFonts.some(f => f.id === font.id)}
                                                onToggleCompare={handleToggleCompare}
                                                isCompareMode={false}
                                            />
                                        ))}
                                    </div>

                                    {/* Empty State */}
                                    {paginatedFonts.length === 0 && (
                                        <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm mt-6">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Type className="w-6 h-6 text-slate/50" />
                                            </div>
                                            <p className="text-slate-dark font-medium">
                                                {locale === 'ru' ? 'Шрифты не найдены' : 'No fonts found'}
                                            </p>
                                            <p className="text-sm text-slate mt-1">
                                                {locale === 'ru' ? 'Попробуйте изменить параметры поиска' : 'Try changing your search parameters'}
                                            </p>
                                        </div>
                                    )}

                                    {/* Pagination Controls */}
                                    {totalPages > 1 && (
                                        <div className="mt-10 flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                                disabled={currentPage === 1}
                                                className="p-2 rounded-xl border border-slate-200 bg-white text-slate hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <ChevronLeft className="w-5 h-5" />
                                            </button>

                                            <div className="flex items-center gap-1.5 px-4 h-10 rounded-xl bg-white border border-slate-200 text-sm font-medium">
                                                <span className="text-slate-dark">{currentPage}</span>
                                                <span className="text-slate-400">/</span>
                                                <span className="text-slate">{totalPages}</span>
                                            </div>

                                            <button
                                                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                                                disabled={currentPage === totalPages}
                                                className="p-2 rounded-xl border border-slate-200 bg-white text-slate hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* COMPARISON SECTION */}
                    {comparedFonts.length > 0 && (
                        <div id="comparison-section" className="mt-16 pt-12 border-t border-slate-200/60">
                            <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
                                <div className="text-center sm:text-left">
                                    <h2 className="text-2xl font-ornamental text-slate-dark mb-2">
                                        {locale === 'ru' ? 'Сравнение Шрифтов' : 'Font Comparison'}
                                    </h2>
                                    <p className="text-slate text-sm">
                                        {locale === 'ru'
                                            ? `Выбрано шрифтов: ${comparedFonts.length}`
                                            : `${comparedFonts.length} fonts selected`}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setComparedFonts([])}
                                    className="px-4 py-2 text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                >
                                    {locale === 'ru' ? 'Очистить все' : 'Clear all'}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {comparedFonts.map((font) => (
                                    <FontPreviewCard
                                        key={font.id}
                                        font={font}
                                        previewText={font.snapshotText}
                                        fontSize={fontSize}
                                        textAlign="center"
                                        isEngraved={true}
                                        isCompared={true}
                                        onToggleCompare={handleToggleCompare}
                                        isCompareMode={true}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Floating Comparison Confirmation Bar */}
            {comparedFonts.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
                    <div className="bg-white/90 backdrop-blur-md shadow-xl border border-slate-200/60 rounded-full px-6 py-3 flex items-center gap-4">
                        <div className="text-sm font-medium text-slate-dark">
                            <span className="hidden sm:inline">{locale === 'ru' ? 'Выбрано шрифтов' : 'Selected fonts'}: </span>
                            <span className="sm:hidden">{locale === 'ru' ? 'Выбрано' : 'Selected'}: </span>
                            <span className="bg-turquoise text-white px-2 py-0.5 rounded-full ml-1 text-xs">
                                {comparedFonts.length}
                            </span>
                        </div>
                        <div className="w-px h-6 bg-slate-200"></div>
                        <button
                            onClick={() => {
                                document.getElementById('comparison-section')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="bg-slate-dark text-white px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-slate-800 transition-colors whitespace-nowrap"
                        >
                            {locale === 'ru' ? 'Посмотреть' : 'View Compare'}
                        </button>
                    </div>
                </div>
            )}

            <Footer />
        </main>
    );
}
