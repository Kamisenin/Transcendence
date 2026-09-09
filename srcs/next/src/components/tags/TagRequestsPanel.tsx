"use client";

import { useTransition, useState } from 'react';
import { useTranslations } from 'next-intl';
import { reviewTagPageRequest } from '@/actions/tags';
import { isDefaultTitle } from '@/app/lib/page/title';

type PendingRequest = {
    id: number;
    pageId: number;
    createdAt: Date;
    page: { pageId: number; title: string };
    requester: { user_id: string; username: string };
};

type Props = {
    tagId: number;
    requests: PendingRequest[];
};

export default function TagRequestsPanel({ requests }: Props) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [handledIds, setHandledIds] = useState<number[]>([]);
    const t = useTranslations('Tags.requests');

    function handleReview(requestId: number, accept: boolean) {
        setError(null);
        startTransition(async () => {
            try {
                await reviewTagPageRequest(requestId, accept);
                setHandledIds(prev => [...prev, requestId]);
            } catch (e: any) {
                setError(e.message);
            }
        });
    }

    const visible = requests.filter(r => !handledIds.includes(r.id));

    return (
        <div>
            {error && (
                <div className="mb-4 rounded-md border border-[#e6b8b0] bg-[#fff1ef] p-3 text-sm text-[#a33a2b]">
                    {error}
                </div>
            )}

            {visible.length === 0 ? (
                <p className="text-sm text-[#8a6b63]">{t('noPendingRequests')}</p>
            ) : (
                <div className="divide-y border rounded-lg overflow-hidden">
                    {visible.map(req => (
                        <div key={req.id} className="flex items-center justify-between p-3">
                            <div>
                                <p className="text-sm">
                                    <span className="font-medium">{req.requester.username}</span>
                                    {' '}{t('requestText', { username: req.requester.username, title: isDefaultTitle(req.page.title) ? t('untitled') : req.page.title })}
                                </p>
                                <p className="text-xs text-[#a89088]">
                                    {new Date(req.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleReview(req.id, true)}
                                    disabled={isPending}
                                    className="rounded-md bg-[#800000] px-3 py-1.5 text-xs font-semibold text-[#fffaf7] transition hover:bg-[#5f0000]"
                                >
                                    {t('accept')}
                                </button>
                                <button
                                    onClick={() => handleReview(req.id, false)}
                                    disabled={isPending}
                                    className="rounded-md border border-[#d9bfb7] bg-[#f7e9e2] px-3 py-1.5 text-xs font-semibold text-[#3f2924] transition hover:bg-[#ead7d0]"
                                >
                                    {t('reject')}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}