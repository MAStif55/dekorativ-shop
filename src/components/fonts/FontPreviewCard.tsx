'use client';

import React, { useEffect, useRef, useState } from 'react';
import { FontData } from '@/hooks/useFonts';
import { Bold, Italic, Plus, Check, Trash2, ArrowDown, Copy, LayoutGrid } from 'lucide-react';

interface FontPreviewCardProps {
    font: FontData;
    previewText: string;
    fontSize: number;
    textAlign: 'left' | 'center' | 'right';
    isEngraved: boolean;
    isCompared?: boolean;
    onToggleCompare?: (font: FontData, customText?: string) => void;
    isCompareMode?: boolean; // True when rendered inside the bottom comparison section
}

export default function FontPreviewCard({ font, previewText, fontSize, textAlign, isEngraved, isCompared = false, onToggleCompare, isCompareMode = false }: FontPreviewCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [loadError, setLoadError] = useState(false);

    // Internal Styling State
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isUppercase, setIsUppercase] = useState(false);
    const [showCharMap, setShowCharMap] = useState(false);
    const [showCopied, setShowCopied] = useState(false);
    const [localText, setLocalText] = useState<string | null>(null);
    const textRef = useRef<HTMLDivElement>(null);

    const customFontFamily = `preview-font-${font.id.replace(/[^a-zA-Z0-9]/g, '-')}`;

    // Sync preview text changes from parent if user hasn't typed locally
    useEffect(() => {
        if (textRef.current) {
            if (localText === null) {
                textRef.current.innerText = previewText || font.name;
            }
        }
    }, [previewText, font.name, localText]);

    const handleCopy = () => {
        navigator.clipboard.writeText(font.name);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
    };

    useEffect(() => {
        if (!cardRef.current) return;

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !isLoaded) {
                const loadFont = async () => {
                    const styleId = `style-${customFontFamily}`;
                    if (!document.getElementById(styleId)) {
                        try {
                            const response = await fetch(font.url);
                            if (!response.ok) throw new Error('Fetch failed');
                            const buffer = await response.arrayBuffer();

                            try {
                                const fontFace = new FontFace(customFontFamily, buffer);
                                await fontFace.load();
                                document.fonts.add(fontFace);
                                setIsLoaded(true);
                            } catch (err) {
                                console.warn('FontFace load failed, falling back to blob injection:', err);
                                const blobUrl = URL.createObjectURL(new Blob([buffer]));
                                const style = document.createElement('style');
                                style.id = styleId;
                                style.innerHTML = `@font-face { font-family: '${customFontFamily}'; src: url('${blobUrl}'); font-display: swap; }`;
                                document.head.appendChild(style);
                                setIsLoaded(true);
                            }
                        } catch (error) {
                            console.error('Failed to load font:', error);
                            setLoadError(true);
                        } finally {
                            // Ensure the card displays text even if font load failed
                            setIsLoaded(true);
                        }
                    } else {
                        setIsLoaded(true);
                    }
                };

                loadFont();
                observer.disconnect(); // Stop observing once loaded
            }
        }, { rootMargin: '800px' }); // Load fonts much earlier before they enter the viewport

        observer.observe(cardRef.current);

        return () => observer.disconnect();
    }, [font, customFontFamily, isLoaded]);

    return (
        <div ref={cardRef} className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                {/* Title & Style Toggles Group */}
                <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
                    <div className="flex items-center gap-2 max-w-full">
                        <h3 className="text-base font-semibold text-slate-dark flex items-center gap-2 truncate">
                            <span className="truncate" title={font.name}>{font.name}</span>
                            {loadError && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-500 font-normal border border-red-100 shrink-0" title="Не удалось загрузить файл шрифта (Ошибка CORS)">
                                    Ошибка
                                </span>
                            )}
                        </h3>
                        <button onClick={handleCopy} className="text-slate-400 hover:text-turquoise transition-colors p-1 shrink-0" title="Копировать название" aria-label={`Скопировать название шрифта ${font.name}`}>
                            {showCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                    </div>

                    {/* Style Toggles */}
                    <div className="flex bg-slate-50 rounded-lg p-1 border border-slate-100 shrink-0">
                        <button onClick={() => setIsBold(!isBold)} className={`p-1.5 rounded-md transition-colors ${isBold ? 'bg-white shadow-sm text-slate-dark' : 'text-slate hover:text-slate-dark'}`} title="Bold" aria-label="Жирный текст">
                            <Bold className="w-4 h-4" />
                        </button>
                        <button onClick={() => setIsItalic(!isItalic)} className={`p-1.5 rounded-md transition-colors ${isItalic ? 'bg-white shadow-sm text-slate-dark' : 'text-slate hover:text-slate-dark'}`} title="Italic" aria-label="Курсивный текст">
                            <Italic className="w-4 h-4" />
                        </button>
                        <button onClick={() => setIsUppercase(!isUppercase)} className={`p-1.5 rounded-md transition-colors ${isUppercase ? 'bg-white shadow-sm text-slate-dark' : 'text-slate hover:text-slate-dark'}`} title="Uppercase" aria-label="Все заглавные">
                            <span className="text-xs font-bold leading-none px-0.5">Aa</span>
                        </button>
                        <div className="w-px h-4 bg-slate-200 mx-1 self-center"></div>
                        <button onClick={() => setShowCharMap(!showCharMap)} className={`p-1.5 rounded-md transition-colors ${showCharMap ? 'bg-white shadow-sm text-slate-dark' : 'text-slate hover:text-slate-dark'}`} title="Показать все символы" aria-label="Все символы">
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Compare & Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap shrink-0 min-w-max relative">
                    {showCopied && (
                        <div className="absolute -top-8 right-0 bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg animate-fade-in whitespace-nowrap z-10">
                            Скопировано!
                        </div>
                    )}

                    {onToggleCompare && (
                        isCompareMode ? (
                            <button
                                onClick={() => onToggleCompare(font, localText !== null ? localText : previewText)}
                                className="flex items-center justify-center p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors border border-red-100"
                                title="Удалить из сравнения"
                                aria-label="Удалить из сравнения"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        ) : (
                            isCompared ? (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            document.getElementById('comparison-section')?.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-turquoise-light/30 text-turquoise-dark font-medium text-xs border border-turquoise/30 hover:bg-turquoise-light/50 transition-colors shrink-0 whitespace-nowrap"
                                        aria-label="Перейти к сравнению"
                                    >
                                        <ArrowDown className="w-3.5 h-3.5 hidden sm:block" />
                                        <span className="hidden sm:inline">К сравнению</span>
                                        <span className="sm:hidden">В сравнении</span>
                                    </button>
                                    <button
                                        onClick={() => onToggleCompare(font, localText !== null ? localText : previewText)}
                                        className="flex items-center justify-center p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors border border-red-100 shrink-0"
                                        title="Удалить из сравнения"
                                        aria-label="Удалить из сравнения"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => onToggleCompare(font, localText !== null ? localText : previewText)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-dark font-medium text-xs border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-colors shrink-0 whitespace-nowrap"
                                    aria-label="Добавить в сравнение"
                                >
                                    <Plus className="w-3.5 h-3.5 hidden sm:block" />
                                    <span className="hidden sm:inline">В сравнение</span>
                                    <span className="sm:hidden">В сравн.</span>
                                </button>
                            )
                        )
                    )}
                </div>
            </div>

            <div className={`w-full relative flex-grow min-h-[90px] flex items-center justify-center p-3 rounded-xl transition-all duration-300 ${isEngraved ? 'bg-ivory border-t border-l border-white/60 shadow-inner overflow-hidden' : ''}`}>
                {isEngraved && (
                    <>
                        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-multiply pointer-events-none"></div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 blur-2xl rounded-full transform transition-transform duration-1000 ease-out pointer-events-none"></div>
                    </>
                )}

                {isLoaded ? (
                    <div
                        ref={textRef}
                        contentEditable
                        suppressContentEditableWarning
                        onInput={(e) => setLocalText(e.currentTarget.innerText)}
                        onBlur={(e) => {
                            if (!e.currentTarget.innerText.trim()) {
                                setLocalText(null);
                                e.currentTarget.innerText = previewText || font.name;
                            }
                        }}
                        className={`relative z-10 w-full transition-all duration-300 ease-out outline-none cursor-text ${isEngraved
                            ? 'text-[#586365] drop-shadow-[1px_1px_rgba(255,255,255,0.7)] mix-blend-multiply opacity-90'
                            : 'text-slate-dark'
                            }`}
                        style={{
                            fontFamily: `'${customFontFamily}', sans-serif`,
                            fontSize: `${fontSize}px`,
                            textAlign: textAlign,
                            fontWeight: isBold ? 'bold' : 'normal',
                            fontStyle: isItalic ? 'italic' : 'normal',
                            textTransform: isUppercase ? 'uppercase' : 'none',
                            lineHeight: 1.4,
                            wordBreak: 'break-word',
                            whiteSpace: 'pre-wrap'
                        }}
                    >
                        {previewText || font.name}
                    </div>
                ) : (
                    <div className="flex space-x-2 justify-center items-center opacity-50">
                        <div className="w-2 h-2 bg-turquoise rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-turquoise rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-turquoise rounded-full animate-bounce"></div>
                    </div>
                )}
            </div>

            {/* Character Map Section */}
            {showCharMap && isLoaded && (
                <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div
                        className="text-slate-dark break-words"
                        style={{
                            fontFamily: `'${customFontFamily}', sans-serif`,
                            fontSize: '24px',
                            lineHeight: 1.6,
                            textAlign: 'center'
                        }}
                    >
                        АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ<br />
                        абвгдеёжзийклмнопрстуфхцчшщъыьэюя<br />
                        ABCDEFGHIJKLMNOPQRSTUVWXYZ<br />
                        abcdefghijklmnopqrstuvwxyz<br />
                        0123456789 .,!?@#$%&*()
                    </div>
                </div>
            )}
        </div>
    );
}
