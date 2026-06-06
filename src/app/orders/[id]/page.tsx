import { getCustomerSession } from '@/actions/customer-auth-actions';
import { OrderRepository } from '@/lib/data';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import OrderChat from '@/components/cabinet/OrderChat';
import { formatPrice } from '@/utils/currency';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
    const session = await getCustomerSession();
    if (!session) {
        redirect('/cabinet');
    }

    const orderId = params.id;
    const order = await OrderRepository.getById(orderId);

    if (!order) {
        redirect('/cabinet');
    }

    // Verify session owner
    if (order.email.toLowerCase() !== session.email.toLowerCase()) {
        redirect('/cabinet');
    }

    const displayId = order.id.slice(-8).toUpperCase();
    
    // Determine payment URL (support real YooKassa redirect or a local mock wrapper)
    const mockPaymentUrl = `/payment-mock?orderId=${order.id}&amount=${order.total}`;
    const paymentUrl = order.paymentUrl || mockPaymentUrl;

    const isAwaitingPayment = order.paymentStatus === 'awaiting_transfer' || (order.status === 'pending' && order.paymentUrl);
    const isPaid = order.paymentStatus === 'paid';

    return (
        <main className="min-h-screen bg-gradient-to-b from-[#0D0A0B] via-[#1A1517] to-[#0D0A0B] flex flex-col">
            <Header />

            <section className="flex-1 py-8 px-4 sm:px-6 max-w-6xl mx-auto w-full">
                {/* Back to Cabinet Link */}
                <div className="mb-6">
                    <Link
                        href="/cabinet"
                        className="text-[#C9A227] hover:text-[#E8D48B] text-sm font-semibold flex items-center gap-2 transition-colors"
                    >
                        ← Вернуться в Личный Кабинет
                    </Link>
                </div>

                {/* Grid Layout: Details on left, Chat on right */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left: Order Info (5 cols) */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* Order Header Card */}
                        <div className="bg-[#1A1517] border border-[#C9A227]/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                            <h2 className="text-2xl font-mono font-bold text-[#E8D48B] mb-2 tracking-wider">
                                Заказ #{displayId}
                            </h2>
                            <p className="text-xs text-[#F5ECD7]/50">
                                Создан: {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                            </p>

                            <div className="mt-4 pt-4 border-t border-[#C9A227]/20 flex justify-between items-center">
                                <span className="text-[#F5ECD7]/70 text-sm">Статус заказа:</span>
                                <span className={`px-2.5 py-1 rounded text-xs font-semibold ${
                                    isPaid 
                                        ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                                        : isAwaitingPayment
                                            ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 animate-pulse'
                                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                                }`}>
                                    {isPaid 
                                        ? 'Оплачен, в очереди на работу' 
                                        : isAwaitingPayment
                                            ? 'Ожидает оплаты'
                                            : 'На проверке мастером'}
                                </span>
                            </div>
                        </div>

                        {/* Payment Area (if approved) */}
                        {isAwaitingPayment && !isPaid && (
                            <div className="bg-gradient-to-br from-[#1A1517] to-[#120F10] border-2 border-yellow-500/40 rounded-2xl p-6 shadow-2xl space-y-4 animate-glow">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">💳</span>
                                    <div>
                                        <h3 className="text-lg font-bold text-[#E8D48B]">Макет согласован!</h3>
                                        <p className="text-xs text-[#F5ECD7]/60">Счет выставлен и готов к оплате.</p>
                                    </div>
                                </div>
                                <div className="bg-[#0D0A0B] p-4 rounded-xl flex justify-between items-center border border-[#C9A227]/10">
                                    <span className="text-sm text-[#F5ECD7]/70">Сумма к оплате:</span>
                                    <span className="text-xl font-bold text-yellow-400 font-mono">
                                        {formatPrice(order.total)}
                                    </span>
                                </div>
                                <Link
                                    href={paymentUrl}
                                    className="w-full block text-center bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-green-500/20 transition-all transform hover:-translate-y-0.5 text-base"
                                >
                                    Оплатить заказ картой / СБП
                                </Link>
                                <p className="text-[10px] text-center text-[#F5ECD7]/40">
                                    Оплата проходит через защищенный шлюз ЮKassa. Чек будет отправлен на почту.
                                </p>
                            </div>
                        )}

                        {/* Cart Items List */}
                        <div className="bg-[#1A1517] border border-[#C9A227]/20 rounded-2xl p-6 shadow-xl space-y-4">
                            <h3 className="text-lg font-bold text-[#E8D48B] font-ornamental">
                                Товары в заказе
                            </h3>
                            <div className="space-y-4 divide-y divide-[#C9A227]/10">
                                {order.items.map((item, idx) => (
                                    <div key={item.productId + idx} className="pt-4 first:pt-0 flex justify-between items-start">
                                        <div className="space-y-0.5">
                                            <p className="font-bold text-[#F5ECD7] text-sm">{item.productTitle}</p>
                                            <p className="text-xs text-[#F5ECD7]/50">Количество: x{item.quantity}</p>
                                            {item.configuration && Object.keys(item.configuration).length > 0 && (
                                                <div className="text-[11px] text-[#C9A227]/70 space-y-0.5">
                                                    {Object.entries(item.configuration).map(([key, val]) => (
                                                        <p key={key}>{key}: {val}</p>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-sm font-semibold text-[#C9A227] font-mono whitespace-nowrap">
                                            {formatPrice(item.price * item.quantity)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="pt-4 border-t border-[#C9A227]/20 space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-[#F5ECD7]/60">Сумма заказа:</span>
                                    <span className="text-[#F5ECD7]/80">{formatPrice(order.total)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Uploaded Layouts (Attachments) */}
                        {order.attachments && order.attachments.length > 0 && (
                            <div className="bg-[#1A1517] border border-[#C9A227]/20 rounded-2xl p-6 shadow-xl space-y-4">
                                <h3 className="text-lg font-bold text-[#E8D48B] font-ornamental">
                                    Прикрепленные макеты
                                </h3>
                                <div className="space-y-2">
                                    {order.attachments.map((url, idx) => {
                                        const originalName = decodeURIComponent(url.substring(url.lastIndexOf('/') + 1)).replace(/^[a-f0-9-]{36}-/, '');
                                        return (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-[#0D0A0B] border border-[#C9A227]/10 rounded-xl">
                                                <span className="text-xs text-[#F5ECD7] truncate max-w-[200px] sm:max-w-xs">
                                                    {originalName}
                                                </span>
                                                <a
                                                    href={url}
                                                    download
                                                    className="px-3 py-1.5 bg-[#C9A227]/10 border border-[#C9A227]/30 text-[#C9A227] hover:bg-[#C9A227]/20 rounded-lg text-xs font-bold transition-all"
                                                >
                                                    Скачать
                                                </a>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Chat Widget (7 cols) */}
                    <div className="lg:col-span-7">
                        <OrderChat orderId={order.id} userType="client" />
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
