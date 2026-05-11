'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DynamicPortfolio from '@/components/DynamicPortfolio';
import Link from 'next/link';
import { CheckCircle2, Calculator, Paintbrush, Shield, Gift, Factory, Sparkles } from 'lucide-react';

/* ─── Calculator Types ─── */
type CornerType = 'straight' | 'rounded' | 'inward';

interface CalcState {
    material: string;
    length: number;
    width: number;
    cornerType: CornerType;
    lacquer: boolean;
}

/* ─── Material colors for SVG preview ─── */
const MATERIAL_COLORS: Record<string, string> = {
    '7': '#F5D76E',    // Латунь
    '3': '#C0C0C0',    // Сталь
    '2.5': '#333333',  // Алюминий чёрный
    '4.5': '#FFD700',  // Алюминий золотистый
};

const CORNER_RADIUS = 4; // мм

/* ─── SVG Preview Component ─── */
function ShildikPreview({ length, width, material, cornerType }: {
    length: number; width: number; material: string; cornerType: CornerType;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [maxSize, setMaxSize] = useState(280);

    useEffect(() => {
        const update = () => {
            if (containerRef.current) {
                setMaxSize(Math.min(280, containerRef.current.offsetWidth * 0.9));
            }
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    if (length <= 0 || width <= 0) return null;

    const scale = Math.min(maxSize / Math.max(length, width), maxSize / Math.max(length, width));
    const sL = Math.max(2, length * scale);
    const sW = Math.max(2, width * scale);
    const maxR = Math.min(sL, sW) / 2;
    const r = Math.min(CORNER_RADIUS * scale, maxR);
    const fill = MATERIAL_COLORS[material] || '#ecf0f1';

    let d = '';
    if (cornerType === 'straight' || r === 0) {
        d = `M0 0 L${sL} 0 L${sL} ${sW} L0 ${sW} Z`;
    } else if (cornerType === 'rounded') {
        d = `M${r} 0 L${sL - r} 0 A${r} ${r} 0 0 1 ${sL} ${r} L${sL} ${sW - r} A${r} ${r} 0 0 1 ${sL - r} ${sW} L${r} ${sW} A${r} ${r} 0 0 1 0 ${sW - r} L0 ${r} A${r} ${r} 0 0 1 ${r} 0 Z`;
    } else {
        d = `M${r} 0 L${sL - r} 0 A${r} ${r} 0 0 0 ${sL} ${r} L${sL} ${sW - r} A${r} ${r} 0 0 0 ${sL - r} ${sW} L${r} ${sW} A${r} ${r} 0 0 0 0 ${sW - r} L0 ${r} A${r} ${r} 0 0 0 ${r} 0 Z`;
    }

    const fontSize = Math.min(14, sW / 4, sL / 8);

    return (
        <div ref={containerRef} className="flex flex-col items-center gap-4">
            <div className="relative" style={{ width: sL, height: sW }}>
                {/* Dimension labels */}
                <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-sm font-medium text-slate-dark">
                    {length} мм
                </span>
                <span className="absolute -right-12 top-1/2 -translate-y-1/2 -rotate-90 text-sm font-medium text-slate-dark">
                    {width} мм
                </span>
                <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
                    <path d={d} fill={fill} stroke="#C5A059" strokeWidth="2" />
                </svg>
                <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none font-medium"
                    style={{
                        fontSize,
                        color: material === '2.5' ? '#fff' : '#2C3338',
                    }}
                >
                    {length}×{width}мм
                </div>
            </div>
        </div>
    );
}

/* ─── Corner Preview Mini ─── */
function CornerPreviewMini({ type, selected }: { type: CornerType; selected: boolean }) {
    const s = 44;
    const r = 6;
    let d = '';
    if (type === 'straight') {
        d = `M0 0 L${s} 0 L${s} ${s} L0 ${s} Z`;
    } else if (type === 'rounded') {
        d = `M${r} 0 L${s - r} 0 A${r} ${r} 0 0 1 ${s} ${r} L${s} ${s - r} A${r} ${r} 0 0 1 ${s - r} ${s} L${r} ${s} A${r} ${r} 0 0 1 0 ${s - r} L0 ${r} A${r} ${r} 0 0 1 ${r} 0 Z`;
    } else {
        d = `M${r} 0 L${s - r} 0 A${r} ${r} 0 0 0 ${s} ${r} L${s} ${s - r} A${r} ${r} 0 0 0 ${s - r} ${s} L${r} ${s} A${r} ${r} 0 0 0 0 ${s - r} L0 ${r} A${r} ${r} 0 0 0 ${r} 0 Z`;
    }
    return (
        <svg width={s} height={s} className="mx-auto mb-1">
            <path d={d} fill={selected ? '#E0F7FA' : '#f1f5f9'} stroke={selected ? '#C5A059' : '#94A3B8'} strokeWidth="2" />
        </svg>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════════════ */
export default function TablichkiPage() {
    const { locale } = useLanguage();

    /* ─── Calculator state ─── */
    const [calc, setCalc] = useState<CalcState>({
        material: '7',
        length: 100,
        width: 50,
        cornerType: 'straight',
        lacquer: false,
    });

    const area = (calc.length * calc.width) / 100; // cm²
    const materialValue = parseFloat(calc.material);

    // Area multiplier (progressive discount)
    const getAreaMultiplier = (a: number) => {
        if (a <= 25) return 1.0;
        if (a <= 50) return 0.85;
        if (a <= 100) return 0.70;
        return 0.60;
    };

    const multiplier = getAreaMultiplier(area);
    const discountPercent = Math.round((1 - multiplier) * 100);

    let basePrice = 500;
    if (area < 10) basePrice = 150;
    else if (area < 15) basePrice = 200;
    else if (area <= 50) basePrice = 300;
    else if (area <= 100) basePrice = 400;

    const materialCost = area * materialValue * multiplier;
    const lacquerCost = calc.lacquer ? (area * 1.5 * multiplier) : 0;
    const unrounded = basePrice + materialCost + lacquerCost;

    // Rounding logic from original calculator
    const remainder = unrounded % 50;
    let totalPrice: number;
    if (remainder >= 10 && remainder <= 20) {
        totalPrice = Math.floor(unrounded / 50) * 50;
    } else if (remainder >= 30 && remainder <= 40) {
        totalPrice = Math.ceil(unrounded / 50) * 50;
    } else {
        totalPrice = Math.round(unrounded / 50) * 50;
    }

    const validDimensions = calc.length > 0 && calc.width > 0 && calc.length <= 200 && calc.width <= 200;

    const materials = [
        { value: '7', label: locale === 'ru' ? 'Латунь (7 ₽/см²)' : 'Brass (7 ₽/cm²)' },
        { value: '3', label: locale === 'ru' ? 'Сталь глянцевая / матовая (3 ₽/см²)' : 'Steel glossy / matte (3 ₽/cm²)' },
        { value: '2.5', label: locale === 'ru' ? 'Алюминий с чёрным покрытием (2,5 ₽/см²)' : 'Black aluminium (2.5 ₽/cm²)' },
        { value: '4.5', label: locale === 'ru' ? 'Алюминий с золотистым покрытием (4,5 ₽/см²)' : 'Gold aluminium (4.5 ₽/cm²)' },
    ];

    const corners: { type: CornerType; label: string }[] = [
        { type: 'straight', label: locale === 'ru' ? 'Прямые' : 'Straight' },
        { type: 'rounded', label: locale === 'ru' ? 'Закруглённые' : 'Rounded' },
        { type: 'inward', label: locale === 'ru' ? 'Внутрь' : 'Inward' },
    ];

    const useCases = [
        {
            icon: Factory,
            title: locale === 'ru' ? 'На производстве' : 'Manufacturing',
            desc: locale === 'ru' ? 'Маркировка станков, инвентаря и оборудования — чтобы всё было на своих местах и с подписью' : 'Mark machines, inventory, and equipment — so everything is labeled and in its place',
        },
        {
            icon: Gift,
            title: locale === 'ru' ? 'На подарке' : 'On a gift',
            desc: locale === 'ru' ? 'Табличка с именем, датой или тёплым пожеланием превращает обычную вещь в памятный подарок' : 'A plate with a name, date, or warm wish turns an ordinary item into a memorable gift',
        },
        {
            icon: Shield,
            title: locale === 'ru' ? 'В офисе' : 'In the office',
            desc: locale === 'ru' ? 'На дверь кабинета, на технику, на мебель — аккуратно, солидно и на долгие годы' : 'On office doors, equipment, furniture — neat, solid, and for years to come',
        },
        {
            icon: Sparkles,
            title: locale === 'ru' ? 'На личных вещах' : 'Personal items',
            desc: locale === 'ru' ? 'На чемодан, ежедневник или кошелёк — чтобы ваши вещи были узнаваемы' : 'On a suitcase, notebook, or wallet — make your things recognizable',
        },
    ];

    return (
        <main className="min-h-screen flex flex-col">
            <Header />

            {/* ───── Hero ───── */}
            <section className="pt-12 pb-8 px-4 sm:px-6 text-center relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-turquoise-light/20 rounded-[100%] blur-3xl pointer-events-none" />

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-ornamental text-slate-dark leading-tight relative z-10 max-w-4xl mx-auto">
                    {locale === 'ru'
                        ? 'Таблички с гравировкой'
                        : 'Engraved Metal Plates'}
                </h1>
                <p className="mt-4 text-lg text-slate/70 max-w-2xl mx-auto relative z-10">
                    {locale === 'ru'
                        ? 'Изготовление шильдиков из латуни, стали и алюминия. Для маркировки, оформления подарков и придания вещам особого смысла.'
                        : 'Custom metal plates from brass, steel, and aluminum. For marking, gift decoration, and giving things a special meaning.'}
                </p>
            </section>

            {/* ───── What is a shildik + Use Cases ───── */}
            <section className="py-14 px-6 relative z-10">
                <div className="max-w-5xl mx-auto">
                    {/* Intro text */}
                    <div className="text-center mb-10">
                        <h2 className="text-3xl md:text-4xl font-ornamental text-slate-dark mb-4">
                            {locale === 'ru' ? 'Для чего нужен шильдик?' : 'What is a nameplate for?'}
                        </h2>
                        <p className="text-slate/70 max-w-2xl mx-auto leading-relaxed">
                            {locale === 'ru'
                                ? 'Шильдик — это маленькая металлическая табличка, которая крепится к предмету. На ней может быть имя, дата, логотип или любая надпись.'
                                : 'A nameplate is a small metal plate attached to an object. It can feature a name, date, logo, or any inscription.'}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {useCases.map((uc, i) => (
                            <div key={i} className="bg-white/90 rounded-3xl p-8 shadow-sm border border-slate-100 hover:border-primary hover:shadow-md transition-all flex items-start gap-4">
                                <div className="mt-1 flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <uc.icon className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-slate-dark mb-2">{uc.title}</h4>
                                    <p className="text-slate/80 leading-relaxed">{uc.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ───── Font selection link ───── */}
            <section className="pb-4 pt-6 px-6">
                <div className="max-w-5xl mx-auto">
                    <Link
                        href="/fonts"
                        className="flex items-center gap-4 px-8 py-5 rounded-2xl bg-turquoise/10 border-2 border-turquoise/30 hover:border-turquoise hover:bg-turquoise/15 transition-all group"
                    >
                        <div className="w-12 h-12 rounded-xl bg-turquoise/20 flex items-center justify-center flex-shrink-0 group-hover:bg-turquoise/30 transition-colors">
                            <Paintbrush className="w-6 h-6 text-turquoise-dark" />
                        </div>
                        <div>
                            <span className="block font-bold text-slate-dark text-lg">
                                {locale === 'ru' ? 'Подберите шрифт для гравировки' : 'Pick a font for your engraving'}
                            </span>
                            <span className="text-sm text-slate/60">
                                {locale === 'ru' ? 'Посмотрите варианты и выберите тот, который Вам понравится' : 'Browse options and choose the one you like'}
                            </span>
                        </div>
                    </Link>
                </div>
            </section>

            {/* ───── Calculator ───── */}
            <section className="py-12 px-4 sm:px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="bg-white/95 rounded-3xl shadow-lg border border-slate-100 p-8 sm:p-10">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <Calculator className="w-6 h-6 text-primary" />
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-ornamental text-slate-dark">
                                {locale === 'ru' ? 'Калькулятор стоимости' : 'Price Calculator'}
                            </h2>
                        </div>

                        {/* Material */}
                        <label className="block text-sm font-semibold text-slate-dark mb-2">
                            {locale === 'ru' ? 'Материал' : 'Material'}
                        </label>
                        <select
                            value={calc.material}
                            onChange={(e) => setCalc(p => ({ ...p, material: e.target.value }))}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-dark bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition mb-6"
                        >
                            {materials.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>

                        {/* Dimensions */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-dark mb-2">
                                    {locale === 'ru' ? 'Длина (мм)' : 'Length (mm)'}
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    max={200}
                                    value={calc.length || ''}
                                    onChange={(e) => setCalc(p => ({ ...p, length: Number(e.target.value) }))}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-dark bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                                    placeholder="0–200"
                                />
                                <p className="text-xs text-slate-light mt-1">{locale === 'ru' ? 'От 0 до 200 мм' : '0 to 200 mm'}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-dark mb-2">
                                    {locale === 'ru' ? 'Ширина (мм)' : 'Width (mm)'}
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    max={200}
                                    value={calc.width || ''}
                                    onChange={(e) => setCalc(p => ({ ...p, width: Number(e.target.value) }))}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-dark bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                                    placeholder="0–200"
                                />
                                <p className="text-xs text-slate-light mt-1">{locale === 'ru' ? 'От 0 до 200 мм' : '0 to 200 mm'}</p>
                            </div>
                        </div>

                        {/* Corner Type */}
                        <label className="block text-sm font-semibold text-slate-dark mb-3">
                            {locale === 'ru' ? 'Тип углов' : 'Corner type'}
                        </label>
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            {corners.map(c => (
                                <button
                                    key={c.type}
                                    type="button"
                                    onClick={() => setCalc(p => ({ ...p, cornerType: c.type }))}
                                    className={`rounded-xl p-3 border-2 transition-all text-center ${calc.cornerType === c.type
                                        ? 'border-primary bg-primary/5 shadow-sm'
                                        : 'border-slate-200 bg-white hover:border-slate-300'
                                        }`}
                                >
                                    <CornerPreviewMini type={c.type} selected={calc.cornerType === c.type} />
                                    <span className="text-xs font-medium text-slate-dark">{c.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Lacquer */}
                        <label className="flex items-center gap-3 cursor-pointer mb-8 p-4 rounded-xl border border-slate-200 hover:border-primary/30 transition bg-white">
                            <input
                                type="checkbox"
                                checked={calc.lacquer}
                                onChange={(e) => setCalc(p => ({ ...p, lacquer: e.target.checked }))}
                                className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary accent-primary"
                            />
                            <div>
                                <span className="font-medium text-slate-dark text-sm">
                                    {locale === 'ru' ? 'Обработка лаком' : 'Lacquer coating'}
                                </span>
                                <p className="text-xs text-slate-light">
                                    {locale === 'ru' ? 'Защита от окисления (+1,5 ₽/см²)' : 'Oxidation protection (+1.5 ₽/cm²)'}
                                </p>
                            </div>
                        </label>

                        {/* Result */}
                        {validDimensions ? (
                            <div className="space-y-5">
                                {/* Breakdown */}
                                <div className="bg-ivory/60 rounded-2xl p-5 space-y-2 text-sm">
                                    <div className="flex justify-between text-slate">
                                        <span>{locale === 'ru' ? 'Площадь' : 'Area'}</span>
                                        <span className="font-medium">{area.toFixed(2)} {locale === 'ru' ? 'см²' : 'cm²'}</span>
                                    </div>
                                    <div className="flex justify-between text-slate">
                                        <span>{locale === 'ru' ? 'Базовая стоимость гравировки' : 'Base engraving cost'}</span>
                                        <span className="font-medium">{basePrice} ₽</span>
                                    </div>
                                    <div className="flex justify-between text-slate">
                                        <span>{locale === 'ru' ? 'Стоимость материала' : 'Material cost'}</span>
                                        <span className="font-medium">{materialCost.toFixed(2)} ₽</span>
                                    </div>
                                    {calc.lacquer && (
                                        <div className="flex justify-between text-slate">
                                            <span>{locale === 'ru' ? 'Обработка лаком' : 'Lacquer'}</span>
                                            <span className="font-medium">{lacquerCost.toFixed(2)} ₽</span>
                                        </div>
                                    {discountPercent > 0 && (
                                        <div className="flex justify-between text-turquoise-dark font-bold">
                                            <span>{locale === 'ru' ? `Скидка за размер (${discountPercent}%)` : `Size discount (${discountPercent}%)`}</span>
                                            <span>-{Math.round((area * materialValue + (calc.lacquer ? area * 1.5 : 0)) * (1 - multiplier))} ₽</span>
                                        </div>
                                    )}
                                </div>

                                {/* Preview */}
                                <div className="flex justify-center py-6">
                                    <ShildikPreview
                                        length={calc.length}
                                        width={calc.width}
                                        material={calc.material}
                                        cornerType={calc.cornerType}
                                    />
                                </div>

                                {/* Total */}
                                <div className="bg-primary rounded-2xl p-5 text-center">
                                    <span className="text-white/70 text-sm block mb-1">
                                        {locale === 'ru' ? 'Итого' : 'Total'}
                                    </span>
                                    <span className="text-3xl font-bold text-white">
                                        {totalPrice} ₽
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-6 text-slate-light text-sm">
                                {locale === 'ru'
                                    ? 'Введите корректные размеры (от 1 до 200 мм)'
                                    : 'Enter valid dimensions (1 to 200 mm)'}
                            </div>
                        )}
                    </div>
                </div>
            </section>



            {/* ───── Gallery ───── */}
            <div className="mb-6">
                <DynamicPortfolio pageId="tablichki" />
            </div>

            <div className="flex-1" />
            <Footer />
        </main>
    );
}
