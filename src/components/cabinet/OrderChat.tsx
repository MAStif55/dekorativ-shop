'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatPrice } from '@/utils/currency';

interface Message {
    id: string;
    sender: 'admin' | 'client';
    text: string;
    fileUrl: string | null;
    createdAt: number;
}

interface OrderChatProps {
    orderId: string;
    userType: 'client' | 'admin';
}

export default function OrderChat({ orderId, userType }: OrderChatProps) {
    const { locale } = useLanguage();
    const [messages, setMessages] = useState<Message[]>([]);
    const [text, setText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [uploadingFile, setUploadingFile] = useState<{ name: string; progress: number } | null>(null);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const eventSourceRef = useRef<EventSource | null>(null);

    const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
        chatEndRef.current?.scrollIntoView({ behavior });
    };

    // 1. Fetch History & Set Up SSE Stream
    useEffect(() => {
        let active = true;

        // Fetch existing messages
        fetch(`/api/orders/${orderId}/chat`)
            .then(res => res.json())
            .then(data => {
                if (active && data.success) {
                    const formatted = (data.messages || []).map((m: any) => ({
                        ...m,
                        id: m._id?.toString() || m.id
                    }));
                    setMessages(formatted);
                    setTimeout(() => scrollToBottom('auto'), 50);
                }
            })
            .catch(err => console.error('Error fetching chat history:', err));

        // Open SSE connection
        const es = new EventSource(`/api/orders/${orderId}/chat`);
        eventSourceRef.current = es;

        es.onmessage = (event) => {
            if (!active) return;
            try {
                const newMsg = JSON.parse(event.data);
                // Prevent duplicate messages in state
                setMessages(prev => {
                    if (prev.some(m => m.id === newMsg.id || (m.createdAt === newMsg.createdAt && m.text === newMsg.text))) {
                        return prev;
                    }
                    return [...prev, newMsg];
                });
                setTimeout(() => scrollToBottom('smooth'), 50);
            } catch (err) {
                console.error('Error parsing SSE message:', err);
            }
        };

        es.onerror = (err) => {
            console.warn('SSE stream encountered an error (will auto-reconnect):', err);
        };

        return () => {
            active = false;
            if (es) {
                es.close();
            }
        };
    }, [orderId]);

    // 2. Send Message
    const handleSend = async (e?: React.FormEvent, attachedUrl?: string) => {
        if (e) e.preventDefault();
        if (!text.trim() && !attachedUrl) return;

        setIsSending(true);
        const textToSend = text;
        setText(''); // Clear input early for better UX

        try {
            const res = await fetch(`/api/orders/${orderId}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: textToSend,
                    fileUrl: attachedUrl || null,
                    sender: userType
                }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Failed to send');
            }

            // Msg will be added automatically by SSE event, but just in case:
            setMessages(prev => {
                if (prev.some(m => m.id === data.message.id)) return prev;
                return [...prev, data.message];
            });
            setTimeout(() => scrollToBottom('smooth'), 50);
        } catch (err) {
            console.error('Send error:', err);
            alert(locale === 'ru' ? 'Ошибка отправки сообщения' : 'Failed to send message');
            setText(textToSend); // Restore text on failure
        } finally {
            setIsSending(false);
        }
    };

    // 3. Handle File Attachment
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const maxSizeBytes = 30 * 1024 * 1024; // 30MB in chat
        if (file.size > maxSizeBytes) {
            alert(locale === 'ru' ? 'Файл слишком большой. Лимит: 30 МБ' : 'File is too large. Limit is 30MB');
            return;
        }

        setUploadingFile({ name: file.name, progress: 0 });

        try {
            // Get Presigned URL
            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileName: file.name,
                    fileType: file.type,
                    tempId: orderId, // upload to this order's folder
                }),
            });

            const uploadData = await uploadRes.json();
            if (!uploadRes.ok || !uploadData.success) {
                throw new Error(uploadData.error || 'Failed to get upload link');
            }

            const { uploadUrl, publicUrl } = uploadData;

            // Upload directly to S3
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', uploadUrl);
            xhr.setRequestHeader('Content-Type', file.type);

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percent = Math.round((event.loaded / event.total) * 100);
                    setUploadingFile({ name: file.name, progress: percent });
                }
            };

            xhr.onload = async () => {
                setUploadingFile(null);
                if (xhr.status === 200) {
                    // Send the message with file URL
                    await handleSend(undefined, publicUrl);
                } else {
                    alert(locale === 'ru' ? 'Загрузка файла не удалась' : 'File upload failed');
                }
            };

            xhr.onerror = () => {
                setUploadingFile(null);
                alert(locale === 'ru' ? 'Ошибка сети при загрузке' : 'Network error during upload');
            };

            xhr.send(file);
        } catch (err) {
            console.error('Chat file upload error:', err);
            setUploadingFile(null);
            alert(locale === 'ru' ? 'Не удалось загрузить файл' : 'Could not upload file');
        }
    };

    return (
        <div className="flex flex-col h-[500px] bg-white/80 backdrop-blur-sm border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
                    <h4 className="font-bold text-slate-dark font-ornamental">
                        {locale === 'ru' ? 'Обсуждение макета' : 'Layout Discussion'}
                    </h4>
                </div>
                <span className="text-xs text-slate/60">
                    {userType === 'client' 
                        ? (locale === 'ru' ? 'Мастер онлайн' : 'Master Online') 
                        : (locale === 'ru' ? 'Клиент' : 'Client')}
                </span>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 scrollbar-thin">
                {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center text-sm text-slate/40 px-4">
                        {locale === 'ru' 
                            ? 'Напишите сообщение или прикрепите макет, чтобы начать обсуждение.' 
                            : 'Send a message or attach a layout to start the discussion.'}
                    </div>
                ) : (
                    messages.map((msg, idx) => {
                        const isAdminMsg = msg.sender === 'admin';
                        const isOwnMsg = (userType === 'admin' && isAdminMsg) || (userType === 'client' && !isAdminMsg);
                        
                        return (
                            <div
                                key={msg.id || idx}
                                className={`flex ${isOwnMsg ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm flex flex-col ${
                                        isOwnMsg
                                            ? 'bg-[#C5A059] text-white rounded-tr-none'
                                            : 'bg-white text-slate-dark border border-slate-100 rounded-tl-none'
                                    }`}
                                >
                                    {/* Sender Label */}
                                    <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
                                        isOwnMsg ? 'text-white/80' : 'text-[#C5A059]'
                                    }`}>
                                        {isOwnMsg 
                                            ? (locale === 'ru' ? 'Вы' : 'You')
                                            : (isAdminMsg 
                                                ? (locale === 'ru' ? 'Мастер' : 'Master') 
                                                : (locale === 'ru' ? 'Клиент' : 'Client'))}
                                    </span>

                                    {/* Text */}
                                    {msg.text && <p className="text-sm whitespace-pre-wrap leading-relaxed break-words">{msg.text}</p>}

                                    {/* Attachment */}
                                    {msg.fileUrl && (
                                        <div className={`mt-2 p-3 rounded-lg flex items-center gap-3 border ${
                                            isOwnMsg 
                                                ? 'bg-white/10 border-white/20 text-white' 
                                                : 'bg-slate-50 border border-slate-100 text-slate-dark'
                                        }`}>
                                            <span className="text-2xl">📎</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold truncate">
                                                    {decodeURIComponent(msg.fileUrl.substring(msg.fileUrl.lastIndexOf('/') + 1)).replace(/^[a-f0-9-]{36}-/, '')}
                                                </p>
                                                <a
                                                    href={msg.fileUrl}
                                                    download
                                                    className={`text-[11px] font-bold underline transition-colors hover:opacity-80 block mt-0.5 ${
                                                        isOwnMsg ? 'text-white' : 'text-[#C5A059] hover:text-[#A08044]'
                                                    }`}
                                                >
                                                    {locale === 'ru' ? 'Скачать файл' : 'Download File'}
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {/* Date */}
                                    <span className={`text-[9px] mt-1.5 self-end ${
                                        isOwnMsg ? 'text-white/70' : 'text-slate/40'
                                    }`}>
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Upload Progress Overlay */}
            {uploadingFile && (
                <div className="bg-white border-t border-slate-100 px-6 py-2 flex items-center justify-between text-xs text-slate/80">
                    <span className="truncate max-w-[200px]">⚡ Загрузка: {uploadingFile.name}</span>
                    <span className="font-mono text-[#C5A059] font-bold">{uploadingFile.progress}%</span>
                </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSend} className="bg-white border-t border-slate-100 p-4 flex gap-3 items-center">
                {/* File Attachment Button */}
                <label className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate rounded-xl cursor-pointer transition-all shadow-sm flex items-center justify-center">
                    <input
                        type="file"
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".cdr,.dxf,.ai,.pdf,.eps,.png,.jpg,.jpeg"
                        disabled={isSending || !!uploadingFile}
                    />
                    <span className="text-xl">📎</span>
                </label>

                {/* Text Field */}
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    disabled={isSending || !!uploadingFile}
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate placeholder-slate/40 focus:ring-1 focus:ring-[#C5A059] focus:border-[#C5A059] transition-all text-sm outline-none"
                    placeholder={locale === 'ru' ? 'Введите сообщение...' : 'Type a message...'}
                />

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isSending || (!text.trim() && !uploadingFile) || !!uploadingFile}
                    className="px-5 py-3 bg-[#C5A059] text-white font-bold rounded-xl shadow-sm hover:bg-[#A08044] transition-all disabled:opacity-50 transform active:translate-y-0.5 text-sm"
                >
                    {locale === 'ru' ? 'Отправить' : 'Send'}
                </button>
            </form>
        </div>
    );
}
