'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const PING_INTERVAL = 60 * 1000;

export default function UserPresence() {
    const router = useRouter();

    useEffect(() => {
        let isActive = true;

        const ping = async () => {
            try {
                const response = await fetch('/api/auth/ping', {
                    method: 'POST',
                    cache: 'no-store',
                });

                if (response.status === 401 && isActive) {
                    router.refresh();
                }
            } catch {
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                void ping();
            }
        };

        void ping();
        const interval = window.setInterval(() => void ping(), PING_INTERVAL);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            isActive = false;
            window.clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [router]);

    return null;
}