import { useEffect } from 'react';

/**
 * Shared scroll lock hook.
 * Prevents body scrolling when `isLocked` is true.
 * Safe to use from multiple components simultaneously.
 */
const lockCount = { current: 0 };

export function useScrollLock(isLocked: boolean) {
    useEffect(() => {
        if (isLocked) {
            lockCount.current++;
            document.body.style.overflow = 'hidden';
        }
        return () => {
            if (isLocked) {
                lockCount.current--;
                if (lockCount.current <= 0) {
                    lockCount.current = 0;
                    document.body.style.overflow = '';
                }
            }
        };
    }, [isLocked]);
}
