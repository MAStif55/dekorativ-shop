import { EventEmitter } from 'events';

const globalForChat = globalThis as unknown as {
    chatEmitter?: EventEmitter;
    activeClients?: Map<string, number>;
    emailDebounceTimers?: Map<string, any>;
    emailLastMessages?: Map<string, { email: string; orderId: string; text: string; orderLink: string }>;
};

if (!globalForChat.chatEmitter) {
    globalForChat.chatEmitter = new EventEmitter();
    globalForChat.chatEmitter.setMaxListeners(200);
}

if (!globalForChat.activeClients) {
    globalForChat.activeClients = new Map();
}

if (!globalForChat.emailDebounceTimers) {
    globalForChat.emailDebounceTimers = new Map();
}

if (!globalForChat.emailLastMessages) {
    globalForChat.emailLastMessages = new Map();
}

export const chatEmitter = globalForChat.chatEmitter;
export const activeClients = globalForChat.activeClients;
export const emailDebounceTimers = globalForChat.emailDebounceTimers;
export const emailLastMessages = globalForChat.emailLastMessages;

