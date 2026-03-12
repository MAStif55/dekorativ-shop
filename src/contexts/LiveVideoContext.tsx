'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';

interface LiveVideoContextType {
    activeHeroId: string | null;
    registerCard: (id: string, element: HTMLElement) => void;
    unregisterCard: (id: string) => void;
}

const LiveVideoContext = createContext<LiveVideoContextType>({
    activeHeroId: null,
    registerCard: () => { },
    unregisterCard: () => { }
});

export const useLiveVideoContext = () => useContext(LiveVideoContext);

export function LiveVideoProvider({ children }: { children: React.ReactNode }) {
    const [activeHeroId, setActiveHeroId] = useState<string | null>(null);
    const registeredElements = useRef<Map<string, HTMLElement>>(new Map());

    const evaluateHero = useCallback(() => {
        if (registeredElements.current.size === 0) return setActiveHeroId(null);

        let topmostId: string | null = null;
        let topmostY = Infinity;

        registeredElements.current.forEach((element, id) => {
            const rect = element.getBoundingClientRect();
            // Is it visible on screen?
            const isVisible = rect.bottom > 0 && rect.top < window.innerHeight;

            if (isVisible && rect.top < topmostY) {
                topmostY = rect.top;
                topmostId = id;
            }
        });

        setActiveHeroId(topmostId);
    }, []);

    const registerCard = useCallback((id: string, el: HTMLElement) => {
        registeredElements.current.set(id, el);
        evaluateHero();
    }, [evaluateHero]);

    const unregisterCard = useCallback((id: string) => {
        registeredElements.current.delete(id);
        evaluateHero();
    }, [evaluateHero]);

    useEffect(() => {
        window.addEventListener('scroll', evaluateHero, { passive: true });
        window.addEventListener('resize', evaluateHero, { passive: true });
        evaluateHero(); // Initial run

        return () => {
            window.removeEventListener('scroll', evaluateHero);
            window.removeEventListener('resize', evaluateHero);
        };
    }, [evaluateHero]);

    return (
        <LiveVideoContext.Provider value={{ activeHeroId, registerCard, unregisterCard }}>
            {children}
        </LiveVideoContext.Provider>
    );
}
