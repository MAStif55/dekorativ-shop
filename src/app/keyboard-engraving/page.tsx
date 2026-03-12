'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DynamicPortfolio from '@/components/DynamicPortfolio';
import Link from 'next/link';
import { Keyboard, CheckCircle2, ArrowRight, ChevronDown } from 'lucide-react';

export default function KeyboardEngravingPage() {
    const { locale } = useLanguage();
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const features = [
        {
            title: locale === 'ru' ? 'Светящиеся клавиши ноутбуков' : 'Backlit laptop keys',
            desc: locale === 'ru'
                ? 'Лазер работает в режиме абляции — деликатно испаряет верхний слой непрозрачной краски (как правило, с АБС-пластика), обнажая прозрачную основу. В результате новые символы светятся так же ярко, как и заводские. Это самый предсказуемый и качественный вариант гравировки.'
                : 'The laser operates in ablation mode—gently vaporizing the top layer of opaque paint (usually ABS plastic), revealing a transparent base. As a result, the new characters glow as brightly as the factory ones. This is the most predictable and high-quality engraving option.'
        },
        {
            title: locale === 'ru' ? 'Темный пластик без подсветки' : 'Dark plastic without backlighting',
            desc: locale === 'ru'
                ? 'Здесь в дело вступает химия: лазер вспенивает поверхность пластика, и цвет символов напрямую зависит от его состава. В идеале получаются светло-серые или бежевые буквы. Однако, если пластик склонен к обугливанию, а не к вспениванию, контраст будет минимальным.'
                : 'This is where chemistry comes into play: the laser foams the surface of the plastic, and the color of the characters directly depends on its composition. Ideally, the resulting letters are light gray or beige. However, if the plastic is prone to charring rather than foaming, the contrast will be minimal.'
        },
        {
            title: locale === 'ru' ? 'Светлый пластик (Apple, кейкапы)' : 'Light plastic (Apple, keycaps)',
            desc: locale === 'ru'
                ? 'Происходит процесс карбонизации — лазер локально выжигает органику в материале, заставляя его естественным образом темнеть. Результат — контрастные темно-серые или черные символы. Сверхнадежный и долговечный вариант для Apple Magic Keyboard и любой светлой клавиатуры.'
                : 'A carbonization process occurs—the laser locally burns away the organic matter in the material, causing it to darken naturally. The result is high-contrast dark gray or black characters. A highly reliable and durable option for the Apple Magic Keyboard and any light-colored keyboard.'
        },
        {
            title: locale === 'ru' ? 'Double-shot кейкапы (двойное литье)' : 'Double-shot keycaps',
            desc: locale === 'ru'
                ? 'Эти клавиши не имеют тонкого слоя краски, они физически отлиты из цельного куска пластика. Из-за этого сделать гравировку, которая будет пропускать подсветку, технически невозможно. Лазер лишь меняет структуру поверхности, оставляя непрозрачный след.'
                : 'These keys don\'t have a thin layer of paint; they\'re physically molded from a single piece of plastic. Because of this, creating an engraving that will allow the backlight to pass through is technically impossible. The laser only changes the surface structure, leaving an opaque mark.'
        }
    ];

    const faqs = [
        {
            q: locale === 'ru' ? '1. Сколько стоит гравировка клавиатуры?' : '1. How much does keyboard engraving cost?',
            a: locale === 'ru'
                ? 'Стандартная раскладка — 1 500 рублей.'
                : 'Standard layout — 1,500 rubles.'
        },
        {
            q: locale === 'ru' ? '2. Сколько времени занимает гравировка?' : '2. How long does engraving take?',
            a: locale === 'ru'
                ? 'Стандартная процедура занимает 10–15 минут. В это время входит подготовка макета, точное позиционирование ноутбука на рабочем столе станка и сам процесс работы лазера. Устройство можно подождать прямо в мастерской.'
                : 'A standard procedure takes 10-15 minutes. This includes preparing the layout, precisely positioning the laptop on the machine\'s worktable, and the laser process itself. You can wait right in the workshop.'
        },
        {
            q: locale === 'ru' ? '3. Нужно ли разбирать ноутбук или снимать клавиши?' : '3. Do I need to disassemble the laptop or remove the keys?',
            a: locale === 'ru'
                ? 'Нет. Процесс абсолютно бесконтактный. Ноутбук в собранном виде (в открытом состоянии) просто лежит под линзой. Механического воздействия — давления, вибрации или статического электричества — нет.'
                : 'No. The process is completely contactless. The assembled (open) laptop simply rests under the lens. There is no mechanical impact such as pressure, vibration, or static electricity.'
        },
        {
            q: locale === 'ru' ? '4. Безопасен ли лазер для внутренних компонентов?' : '4. Is the laser safe for internal components?',
            a: locale === 'ru'
                ? 'Да. Глубина воздействия лазера исчисляется микронами (снимается слой толщиной около 0.05 мм). Луч работает сфокусированно и взаимодействует только с верхним покрытием клавиши. Пластик не успевает прогреться вглубь, поэтому мембрана, механизмы-ножницы и электроника остаются в полной безопасности.'
                : 'Yes. The laser\'s depth of action is measured in microns (a layer approximately 0.05 mm thick is removed). The beam is focused and interacts only with the top surface of the key. The plastic does not have time to heat up deeply, so the membrane, scissor mechanisms, and electronics remain completely safe.'
        },
        {
            q: locale === 'ru' ? '5. Сотрется ли новая гравировка со временем?' : '5. Will the new engraving wear off over time?',
            a: locale === 'ru'
                ? 'Это зависит от физики процесса на конкретном пластике. Если клавиши с подсветкой (лазер испарил краску) или светлые (лазер выжег органику) — символы останутся навсегда. Если это темный матовый пластик без подсветки (лазер вспенил поверхность), то получившаяся структура довольно мягкая и со временем может заполироваться пальцами, потеряв контраст.'
                : 'This depends on the physics of the process on the specific plastic. If the keys are backlit (the laser evaporated the paint) or light-colored (the laser burned away the organic matter), the symbols will remain forever. If the keys are dark, matte plastic without backlighting (the laser foamed the surface), the resulting texture is quite soft and can be polished by fingers over time, losing contrast.'
        },
        {
            q: locale === 'ru' ? '6. Будет ли русский шрифт на 100% совпадать с заводской латиницей?' : '6. Will the Russian font be 100% identical to the factory Latin alphabet?',
            a: locale === 'ru'
                ? 'Не всегда. Заводские символы часто наносятся методом тампопечати или шелкографии. Из-за разницы технологий гравированные буквы могут визуально отличаться по толщине линий или гарнитуре. Мы подбираем максимально близкий шрифт, но абсолютная идентичность (пиксель в пиксель) технически возможна не на всех моделях.'
                : 'Not always. Factory symbols are often applied using pad printing or silkscreen printing. Due to differences in technology, engraved letters may visually differ in line thickness or typeface. We select the closest font possible, but absolute identity (pixel for pixel) is not technically possible on all models.'
        },
        {
            q: locale === 'ru' ? '7. Какую раскладку делать на MacBook: «Apple» или «PC»?' : '7. Which layout should I use on my MacBook: Apple or PC?',
            a: locale === 'ru'
                ? 'Зависит от вашей мышечной памяти, так как расположение знаков препинания отличается:\n\nСтандарт Apple: Точка и запятая находятся в верхнем цифровом ряду (цифры 6 и 7).\n\nСтандарт PC (Windows): Точка и запятая в нижнем ряду, справа от буквы «Ю». Если делаем этот вариант, в настройках macOS нужно будет включить раскладку «Русская — ПК», иначе символы на клавишах не совпадут с тем, что печатается на экране.'
                : 'It depends on your muscle memory, as the punctuation placement is different:\n\nApple Standard: The period and comma are in the top row of numbers (numbers 6 and 7).\n\nPC Standard (Windows): The period and comma are in the bottom row, to the right of the letter "U." If you choose this option, you\'ll need to enable the "Russian - PC" layout in macOS settings; otherwise, the symbols on the keys won\'t match what\'s printed on the screen.'
        },
        {
            q: locale === 'ru' ? '8. Что происходит с официальной гарантией на устройство?' : '8. What happens to the official device warranty?',
            a: locale === 'ru'
                ? 'Гравировка — это необратимая модификация корпуса. Официально сервисные центры имеют право отказать в гарантийном обслуживании конкретно этого узла (клавиатуры и ее подсветки). На остальные внутренние компоненты ноутбука (процессор, плата, дисплей) гарантия сохраняется.'
                : 'Engraving is an irreversible modification to the case. Officially, service centers reserve the right to refuse warranty service for this specific component (keyboard and backlight). The warranty remains valid for the other internal components of the laptop (processor, motherboard, display).'
        }
    ];

    return (
        <main className="min-h-screen flex flex-col">
            <Header />

            {/* Hero Section */}
            <section className="pt-12 pb-8 px-4 sm:px-6 text-center relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-turquoise-light/20 rounded-[100%] blur-3xl pointer-events-none"></div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-ornamental text-slate-dark leading-tight relative z-10 max-w-4xl mx-auto">
                    {locale === 'ru'
                        ? 'Лазерная гравировка клавиатур в Омске'
                        : 'Laser Engraving of Keyboards in Omsk'}
                </h1>
            </section>

            {/* Features Grid with Parallax Background */}
            <section
                className="py-14 px-6 relative z-10 bg-fixed bg-cover bg-center overflow-hidden"
                style={{ backgroundImage: "url('/keyboard-bg.jpg')" }}
            >
                {/* Lightening Overlay */}
                <div className="absolute inset-0 bg-ivory/85 z-0"></div>

                {/* Top Wave Divider */}
                <div className="absolute top-0 left-0 w-full overflow-hidden leading-none z-10">
                    <svg className="relative block w-full h-[40px] md:h-[60px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                        <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="#FFFFF0"></path>
                    </svg>
                </div>

                <div className="max-w-5xl mx-auto relative z-20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                        {features.map((feature, i) => (
                            <div key={i} className="bg-white/90 rounded-3xl p-8 shadow-sm border border-slate-100 hover:border-turquoise hover:shadow-md transition-all flex items-start gap-4">
                                <div className="mt-1 flex-shrink-0">
                                    <CheckCircle2 className="w-6 h-6 text-turquoise" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-slate-dark mb-2">{feature.title}</h4>
                                    <p className="text-slate/80 leading-relaxed">{feature.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Wave Divider */}
                <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-10 rotate-180">
                    <svg className="relative block w-full h-[40px] md:h-[60px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                        <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="#FFFFF0"></path>
                    </svg>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-6 px-4 sm:px-6 relative z-10 w-full">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl md:text-5xl font-ornamental text-slate-dark text-center mb-6">
                        {locale === 'ru' ? 'Частые вопросы (FAQ)' : 'Frequently Asked Questions (FAQ)'}
                    </h2>

                    <div className="flex flex-col gap-4">
                        {faqs.map((faq, index) => {
                            const isOpen = openFaq === index;
                            return (
                                <div
                                    key={index}
                                    className={`border rounded-2xl overflow-hidden transition-all duration-300 ${isOpen ? 'border-turquoise bg-turquoise-light/10 shadow-md' : 'border-slate-100 bg-white hover:border-turquoise-light hover:shadow-sm'}`}
                                >
                                    <button
                                        className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                                        onClick={() => setOpenFaq(isOpen ? null : index)}
                                    >
                                        <span className="font-bold text-lg text-slate-dark pr-8">{faq.q}</span>
                                        <ChevronDown className={`w-5 h-5 text-turquoise flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                        <div className="px-6 pb-6 text-slate/80 leading-relaxed whitespace-pre-wrap">
                                            {faq.a}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Dynamic Gallery Section */}
            <div className="mb-6">
                <DynamicPortfolio pageId="keyboard-engraving" />
            </div>

            <div className="flex-1"></div>

            <Footer />
        </main>
    );
}
